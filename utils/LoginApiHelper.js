class LoginApiHelper {
    static waitForLoginResponse(page) {
        return page.waitForResponse(
            response =>
                response.url().includes('/api/auth/login') &&
                response.request().method() === 'POST'
        );
    }

    static async getResponseBody(response) {
        return await response.json();
    }

    static validateStatus(response, expectedStatus = 200) {
        if (response.status() !== expectedStatus) {
            throw new Error(
                `Expected status ${expectedStatus}, but received ${response.status()}`
            );
        }
    }
}

module.exports = LoginApiHelper;