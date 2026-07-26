// This file contains only the optional Gemini API call.
async function getGeminiExplanation(expectedImage, actualImage, details) {
    if (process.env.GEMINI_VISUAL_ANALYSIS !== 'true') {
        return 'Gemini analysis is disabled.';
    }

    if (!process.env.GEMINI_API_KEY) {
        return 'Gemini analysis is enabled, but GEMINI_API_KEY is missing.';
    }

    const model = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';
    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${model}:generateContent`;

    const prompt =
        `Image 1 is expected and image 2 is actual. ${details} ` +
        'Explain what was added, removed, moved, restyled, or changed. ' +
        'Ignore tiny rendering noise and classify the change.';

    const body = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: expectedImage.toString('base64')
                    }
                },
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: actualImage.toString('base64')
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        signal: AbortSignal.timeout(Number(process.env.GEMINI_TIMEOUT_MS) || 120000),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Gemini returned HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const answerParts = result.candidates?.[0]?.content?.parts || [];
    return answerParts.map(part => part.text || '').join('\n').trim();
}

module.exports = { getGeminiExplanation };
