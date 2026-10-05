const { test, expect } = require('@playwright/test');

test.describe('Olive Green Theme and Header Verification', () => {
    test('Verify website color scheme and header text', async ({ page }) => {
        await page.goto('https://www.automation-bible.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const header = page.getByRole('heading', { name: 'My Name is Nidhi Singh' });
        await expect(header).toBeVisible();
        await expect(header).toHaveText('My Name is Nidhi Singh');
    });
});
