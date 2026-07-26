const { Before, After, Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');
const Auth = require('../../PageObject/Auth');
const Home = require('../../PageObject/Home');
const LoginApiHelper = require('../../utils/LoginApiHelper');
const { captureAndCompare } = require('../../utils/VisualComparison');

// Vision analysis runs only after a mismatch and may take longer than normal assertions.
setDefaultTimeout(180_000);

Before(async function () {
    const viewport = {
        width: Number(process.env.VIEWPORT_WIDTH) || 1280,
        height: Number(process.env.VIEWPORT_HEIGHT) || 720
    };

    this.browser = await chromium.launch({
        headless: false,
        args: [`--window-size=${viewport.width + 200},${viewport.height + 200}`]
    });
    this.context = await this.browser.newContext({
        viewport
    });
    this.page = await this.context.newPage();
});

After(async function ({ result, pickle }) {
    if (result?.status === 'FAILED' && this.page) {
        const screenshot = await this.page.screenshot({ fullPage: true });
        await this.attach(screenshot, 'image/png');
        await this.attach(`Failed scenario: ${pickle.name}`, 'text/plain');
    }

    await this.context?.close();
    await this.browser?.close();
});

Given('the user is on the home page', async function () {
    await this.page.goto('https://www.automation-bible.com/', {
        waitUntil: 'domcontentloaded'
    });

    this.homePage = new Home(this.page);
    this.authPage = new Auth(this.page);
});

Given('the user navigates to the authentication page', async function () {
    await this.homePage.clickOnAuth();
});

When(
    'the user logs in with email {string} and password {string}',
    async function (email, password) {
        this.loginResponsePromise = LoginApiHelper.waitForLoginResponse(this.page);
        await this.authPage.login(email, password);
        this.loginResponse = await this.loginResponsePromise;
        this.loginResponseBody = await LoginApiHelper.getResponseBody(this.loginResponse);
    }
);

Then('the login API response status should be {int}', function (expectedStatus) {
    LoginApiHelper.validateStatus(this.loginResponse, expectedStatus);
});

Then('the authenticated email should be {string}', function (expectedEmail) {
    expect(this.loginResponseBody.user.email).toBe(expectedEmail);
});

Then('the token displayed in the UI should match the login API token', async function () {
    const tokenFromUi = await this.page
        .getByTestId('user-token')
        .locator('code')
        .textContent();

    expect(tokenFromUi?.trim()).toBe(this.loginResponseBody.token);
});

Then('the page should match the visual baseline {string}', async function (fileName) {
    await captureAndCompare(this.page, fileName, {
        attach: async (body, contentType, name) => {
            await this.attach(body, {
                mediaType: contentType,
                fileName: name.replace(/[^a-z0-9.-]+/gi, '-')
            });
        }
    });
});
