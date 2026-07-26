require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const projectRoot = path.resolve(__dirname, '..');
const baselineDirectory = path.join(projectRoot, 'screenshots');
const artifactDirectory = path.join(projectRoot, 'test-results', 'visual-comparisons');

function safeName(fileName) {
    const parsed = path.parse(path.basename(fileName));
    return `${parsed.name}.png`;
}

async function explainWithAi(expected, actual, metrics) {
    if (process.env.GEMINI_VISUAL_ANALYSIS !== 'true') {
        return 'Gemini analysis was not requested. Set GEMINI_VISUAL_ANALYSIS=true to enable it.';
    }

    if (!process.env.GEMINI_API_KEY) {
        return 'Gemini analysis was requested, but GEMINI_API_KEY is not set.';
    }

    const model = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';
    const prompt = [
        'You are reviewing a visual regression test.',
        'Image 1 is the approved baseline. Image 2 is the current webpage.',
        `Automated comparison metrics: ${JSON.stringify(metrics)}.`,
        'Describe only visible, meaningful changes.',
        'Group them as added, removed, moved, restyled, or text/content changed.',
        'Mention approximate page regions.',
        'Ignore antialiasing and tiny rendering noise.',
        'Conclude whether the change looks functional, cosmetic, or likely noise.'
    ].join(' ');

    let response;
    try {
        const endpoint =
            `https://generativelanguage.googleapis.com/v1beta/models/` +
            `${encodeURIComponent(model)}:generateContent`;

        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY
            },
            signal: AbortSignal.timeout(
                Number(process.env.GEMINI_TIMEOUT_MS) || 120_000
            ),
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: expected.toString('base64')
                            }
                        },
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: actual.toString('base64')
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2_000
                }
            })
        });
    } catch (error) {
        throw new Error(
            `Cannot connect to the Gemini API with model "${model}". ${error.message}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `Gemini visual analysis failed (${response.status}): ${await response.text()}`
        );
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('\n')
        .trim() || 'The Gemini response did not contain an explanation.';
}

function copyIntoCanvas(source, width, height) {
    const canvas = new PNG({ width, height, fill: true });
    PNG.bitblt(source, canvas, 0, 0, source.width, source.height, 0, 0);
    return canvas;
}

function formatVisualSummary({
    status,
    name,
    baselinePath,
    actualPath,
    diffPath,
    analysisPath,
    metrics,
    allowedRatio,
    analysis
}) {
    const lines = [
        `[VISUAL][${status}] ${name}`,
        `Baseline: ${baselinePath}`,
        `Actual: ${actualPath}`
    ];

    if (metrics) {
        lines.push(
            `Expected size: ${metrics.expectedSize}`,
            `Actual size: ${metrics.actualSize}`,
            `Changed pixels: ${metrics.differentPixels} of ${metrics.totalPixels} ` +
                `(${metrics.differencePercent}%)`,
            `Allowed difference: ${(allowedRatio * 100).toFixed(4)}%`
        );
    }

    if (diffPath) lines.push(`Diff: ${diffPath}`);
    if (analysisPath) lines.push(`Analysis: ${analysisPath}`);
    if (analysis) lines.push('', 'Change analysis:', analysis);

    if (status === 'PASS') {
        lines.push(
            '',
            'QA result: Approved baseline and current page match within the configured tolerance.'
        );
    } else if (status === 'FAIL') {
        lines.push(
            '',
            'QA result: Visual regression detected. Review expected, actual, diff, and analysis attachments.',
            'Action: Confirm whether the change is intended. Update the baseline only after product/QA approval.'
        );
    } else if (status === 'BASELINE_UPDATED') {
        lines.push(
            '',
            'QA result: Baseline was intentionally updated; this run did not validate visual equality.'
        );
    }

    return lines.join('\n');
}

async function captureAndCompare(page, fileName, options = {}) {
    const name = safeName(fileName);
    const baselinePath = path.join(baselineDirectory, name);
    const actualPath = path.join(
        artifactDirectory,
        name.replace('.png', '-actual.png')
    );
    const diffPath = path.join(
        artifactDirectory,
        name.replace('.png', '-diff.png')
    );
    const analysisPath = path.join(
        artifactDirectory,
        name.replace('.png', '-analysis.txt')
    );

    await fs.mkdir(baselineDirectory, { recursive: true });
    await fs.mkdir(artifactDirectory, { recursive: true });

    const mask = [];
    for (const selector of options.maskSelectors || []) {
        const locator = page.locator(selector);
        if (await locator.count()) mask.push(locator);
    }

    const actual = await page.screenshot({
        fullPage: options.fullPage !== false,
        animations: 'disabled',
        caret: 'hide',
        mask,
        path: actualPath
    });

    if (process.env.UPDATE_SCREENSHOTS === 'true') {
        await fs.writeFile(baselinePath, actual);
        const summary = formatVisualSummary({
            status: 'BASELINE_UPDATED',
            name,
            baselinePath,
            actualPath
        });

        console.log(summary);
        if (options.attach) {
            await options.attach(actual, 'image/png', `${name} updated baseline`);
            await options.attach(summary, 'text/plain', `${name} visual result`);
        }

        return { status: 'updated', baselinePath, actualPath };
    }

    let expected;
    try {
        expected = await fs.readFile(baselinePath);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        throw new Error(
            `Visual baseline is missing: ${baselinePath}\n` +
            'Create it intentionally with UPDATE_SCREENSHOTS=true npm test.'
        );
    }

    const expectedPng = PNG.sync.read(expected);
    const actualPng = PNG.sync.read(actual);
    const width = Math.max(expectedPng.width, actualPng.width);
    const height = Math.max(expectedPng.height, actualPng.height);
    const expectedCanvas = copyIntoCanvas(expectedPng, width, height);
    const actualCanvas = copyIntoCanvas(actualPng, width, height);
    const diff = new PNG({ width, height });

    const differentPixels = pixelmatch(
        expectedCanvas.data,
        actualCanvas.data,
        diff.data,
        width,
        height,
        {
            threshold: options.pixelThreshold ?? 0.2,
            includeAA: false
        }
    );

    const totalPixels = width * height;
    const differenceRatio = differentPixels / totalPixels;
    const metrics = {
        differentPixels,
        totalPixels,
        differencePercent: Number((differenceRatio * 100).toFixed(4)),
        expectedSize: `${expectedPng.width}x${expectedPng.height}`,
        actualSize: `${actualPng.width}x${actualPng.height}`
    };
    const allowedRatio = options.maxDifferenceRatio ?? 0.001;

    if (options.attach) {
        await options.attach(expected, 'image/png', `${name} expected`);
        await options.attach(actual, 'image/png', `${name} actual`);
    }

    if (differenceRatio <= allowedRatio) {
        const summary = formatVisualSummary({
            status: 'PASS',
            name,
            baselinePath,
            actualPath,
            metrics,
            allowedRatio
        });

        console.log(summary);
        if (options.attach) {
            await options.attach(summary, 'text/plain', `${name} visual result`);
        }

        return { status: 'matched', baselinePath, actualPath, metrics };
    }

    await fs.writeFile(diffPath, PNG.sync.write(diff));

    let analysis;
    try {
        analysis = await explainWithAi(expected, actual, metrics);
    } catch (error) {
        analysis = `AI analysis could not be completed: ${error.message}`;
    }

    await fs.writeFile(analysisPath, analysis, 'utf8');
    const summary = formatVisualSummary({
        status: 'FAIL',
        name,
        baselinePath,
        actualPath,
        diffPath,
        analysisPath,
        metrics,
        allowedRatio,
        analysis
    });

    console.error(summary);
    if (options.attach) {
        await options.attach(
            await fs.readFile(diffPath),
            'image/png',
            `${name} diff`
        );
        await options.attach(analysis, 'text/plain', `${name} analysis`);
        await options.attach(summary, 'text/plain', `${name} visual result`);
    }

    throw new Error(summary);
}

module.exports = { captureAndCompare };
