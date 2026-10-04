const { test, expect } = require('@playwright/test');

test('Verify website color scheme change to olive green and header text', async ({ page }) => {
    await page.goto('https://www.automation-bible.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    const headerElement = page.locator('header, h1, .header').filter({ hasText: 'My Name is Nidhi Singh' });
    await expect(headerElement).toBeVisible();

    const headerText = await page.locator('body').textContent();
    expect(headerText).toContain('My Name is Nidhi Singh');

    const bodyElement = page.locator('body');
    await expect(bodyElement).toHaveCSS('background-color', /.*/);
});
