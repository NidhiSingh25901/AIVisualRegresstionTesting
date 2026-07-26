# AI Visual Regression Testing

Playwright + Cucumber test automation project for UI, API, and visual regression testing against [automation-bible.com](https://www.automation-bible.com/).

## What this project includes

- Playwright functional tests (`/tests`)
- Cucumber BDD scenarios (`/features`)
- Page Object Model classes (`/PageObject`)
- API response validation for login flow (`/utils/LoginApiHelper.js`)
- Visual comparison utility with baseline screenshots (`/utils/VisualComparison.js`)
- Optional Gemini-powered visual mismatch explanation

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. (Optional) Add `GEMINI_API_KEY` in `.env` if you want AI visual analysis for failed visual comparisons.

## Environment variables

Key variables from `.env.example`:

- `GEMINI_API_KEY` – Gemini API key (optional unless AI analysis is enabled)
- `GEMINI_VISUAL_ANALYSIS` – `true/false` to enable AI explanation
- `GEMINI_VISION_MODEL` – model name (default in code: `gemini-3.6-flash`)
- `GEMINI_TIMEOUT_MS` – timeout for Gemini calls
- `UPDATE_SCREENSHOTS` – set `true` to regenerate baselines
- `HEADLESS` – browser mode toggle
- `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT` – deterministic viewport dimensions

## Run tests

### Playwright tests

```bash
npm test
```

Update visual baselines during Playwright run:

```bash
npm run test:update-screenshots
```

### Cucumber BDD tests

```bash
npm run test:bdd
```

Run smoke scenarios only:

```bash
npm run test:bdd:smoke
```

Update visual baselines during BDD run:

```bash
npm run test:bdd:update-screenshots
```

## Allure reporting

Generate report:

```bash
npm run allure:generate
```

Open generated report:

```bash
npm run allure:open
```

Serve report directly from results:

```bash
npm run allure:serve
```

## Visual regression flow

1. A current screenshot is captured.
2. It is compared with the baseline image in `/screenshots`.
3. If mismatch exceeds tolerance:
   - Diff image is saved in `test-results/visual-comparisons`
   - Optional Gemini analysis text is generated
   - Test fails with summary details
4. If `UPDATE_SCREENSHOTS=true`, current screenshots overwrite baselines intentionally.

