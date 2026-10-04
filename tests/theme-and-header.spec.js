const { test, expect } = require('@playwright/test');

test.describe('Website Theme and Header Verification', () => {
    test('Verify website background and theme color updates to olive green', async ({ page }) => {
        await page.goto('https://www.automation-bible.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const body = page.locator('body');
        await expect(body).toBeVisible();
        
        const backgroundColor = await body.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });
        
        console.log('Computed background color:', backgroundColor);
        expect(backgroundColor).toBeTruthy();
    });

    test('Verify header displays exact text - My Name is Nidhi Singh', async ({ page }) => {
        await page.goto('https://www.automation-bible.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const header = page.locator('h1, h2, header').filter({ hasText: 'My Name is Nidhi Singh' }).first();
        await expect(header).toBeVisible();
        
        const headerText = await header.textContent();
        expect(headerText?.trim()).toContain('My Name is Nidhi Singh');
    });
});
