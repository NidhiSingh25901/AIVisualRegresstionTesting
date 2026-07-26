const { test, expect } = require('@playwright/test');

test('Form Test', async ({ page }) => {
    await page.goto('https://www.automation-bible.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    await page.getByRole('link', {
        name: 'Forms',
        exact: true
    }).click();

    const testInput = page.getByPlaceholder('Regular text');
    await expect(testInput).toBeVisible();
    await testInput.fill('Test Input');

    const testPassword = page.getByPlaceholder('Password');
    await testPassword.fill('Test Password');

    const email = page.getByTestId('text-email');
    await email.fill('test@automation.com');

    const number = page.locator('input[type="number"]');

    // This input accepts only numbers between 0 and 999.
    await number.fill('123');

    const textarea = page.getByTestId('textarea');
    await textarea.fill('Test Textarea');

    const radioValue = page.getByRole('radio', {
        name: 'Playwright'
    });
    await radioValue.check();

    const checkboxSecond = page.getByRole('checkbox', {
        name: 'Android'
    });
    await checkboxSecond.check();

    const dropdownSelectOption = page.getByTestId('select-single');
    await dropdownSelectOption.selectOption({
        label: 'Easy'
    });

    const multipleOption = page.locator('select[multiple]');
    await multipleOption.selectOption([
        { label: 'UI tests' },
        { label: 'API tests' }
    ]);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
});
