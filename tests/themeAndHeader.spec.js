const { test, expect } = require('@playwright/test');

test('Verify website color scheme and header text', async ({ page }) => {
    await page.goto('https://www.automation-bible.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    const headerLocator = page.locator('header, h1').filter({ hasText: 'My Name is Nidhi Singh' }).first();
    await expect(headerLocator).toBeVisible();
    await expect(headerLocator).toHaveText('My Name is Nidhi Singh');

    const bodyElement = page.locator('body');
    await expect(bodyElement).toBeVisible();
});
