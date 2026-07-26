const { test, expect } = require('@playwright/test');
const Auth = require('../PageObject/Auth');
const Home = require('../PageObject/Home');
const LoginApiHelper = require('../utils/loginApiHelper');
const { captureAndCompare } = require('../utils/VisualComparison');

test('Login Test with valid credentials', async ({ page }, testInfo) => {
    await page.goto('https://www.automation-bible.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    const home = new Home(page);
    const auth = new Auth(page);

    await home.changeLanguageToGerman();
    await page.screenshot({
        path: 'screenshots/home-page-german.png',
        fullPage: true,
        animations: 'disabled'
    });
    await home.changeLanguageToEnglish();

    await home.clickOnAuth();

    const loginResponsePromise =
        LoginApiHelper.waitForLoginResponse(page);

    await auth.login(
        'test@automation.com',
        'password123'
    );

    const loginResponse = await loginResponsePromise;

    LoginApiHelper.validateStatus(loginResponse, 200);

    const responseBody =
        await LoginApiHelper.getResponseBody(loginResponse);

    const tokenFromApi = responseBody.token;

    console.log('API response:', responseBody);
    console.log('Logged-in user:', responseBody.user.email);

    const tokenFromUi = await page
        .getByTestId('user-token')
        .locator('code')
        .textContent();

    expect(tokenFromUi?.trim()).toBe(tokenFromApi);

    await captureAndCompare(page, 'valid-login-full-page.png', {
        attach: async (body, contentType, name) => {
            await testInfo.attach(name, { body, contentType });
        }
    });
});


// test.skip("Login Test with invalid credentials", async ({ page }) => {

//     await page.goto("https://www.automation-bible.com/", { waitUntil: 'domcontentloaded', timeout: 60000 });
//     const auth = page.getByRole('link', { name: 'Auth' })
//     await auth.click();

//     const username = page.getByPlaceholder('test@automation.com');
//     const password = page.getByPlaceholder('password123');

//     await username.fill("test@automation");
//     await password.fill("password12")

//     const responsePromise = page.waitForResponse(
//         response =>
//             response.url().includes('/api/auth/login') &&
//             response.request().method() === 'POST'
//     );

//     const loginbutton = page.getByRole('button', { name: "Login (calls backend)" });

//     await loginbutton.click({ waitUntil: 'networkidle' });

//     const loginResponse = await responsePromise;

//     if (loginResponse.status() === 401) {
//         console.log("Login failed as expected with invalid credentials");
//     } else {
//         throw new Error(`Login did not fail as expected. Status code: ${loginResponse.status()}`);
//     }

//     const loginresponsebody = await loginResponse.json();

//     console.log("Login failed response status: ", loginresponsebody.status);
//     console.log("Login failed response message: ", loginresponsebody.message);

//     const uitext = await page.locator("text=Invalid credentials").textContent();

//     console.log(uitext);
//     expect(uitext).toBe("Invalid credentials");
//     console.log("UI shows Invalid credentials message as expected");

//     // toBe in playwright does not return true or false, it will throw an error if the condition is not met. So we don't need to check the result of expect. The following code is commented out because it's unnecessary.
//     // if(!expect(uitext).toBe("Invalid credentials")){
//     //     console.log("UI shows Invalid credentials message as expected");
//     // } else {
//     //     throw new Error("UI does not show Invalid credentials message as expected");
//     // }

// })

// test("Login Test After Refreshing the page", async ({ page }) => {
//     await page.goto("https://www.automation-bible.com/", { waitUntil: 'domcontentloaded', timeout: 60000 });
//     const auth = page.getByRole('link', { name: 'Auth' })
//     await auth.click();

//     const loginbutton = page.getByRole('button', { name: "Login (calls backend)" });

//     const responsePromise = page.waitForResponse(
//         response =>
//             response.url().includes('/api/auth/login') &&
//             response.request().method() === 'POST'
//     );

//     const username = page.getByPlaceholder("test@automation.com");
//     username.fill("test@automation.com")

//     const password = page.getByPlaceholder("password123");
//     password.fill("password123");

//     await loginbutton.click({ waitUntil: 'networkidle' });

//     const loginResponse = await responsePromise;
//     console.log("Login response status: ", loginResponse.status());
//     console.log("Login response body: ", loginResponse.json());

//     const tokenapi = (await loginResponse.json()).token;
//     console.log("Token from API: ", tokenapi);

//     await page.reload();
//     await page.waitForLoadState('networkidle');
//     await page.waitForLoadState('domcontentloaded');
//     const logout = page.locator("//button[text()='Logout']");

//     await expect(logout).toBeVisible();

// })

