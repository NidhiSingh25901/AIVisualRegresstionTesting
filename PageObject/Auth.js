class Auth {
    constructor(page) {
        this.username = page.getByPlaceholder('test@automation.com');
        this.password = page.getByPlaceholder('password123');
        this.loginButton = page.getByRole('button', {
            name: 'Login (calls backend)'
        });
    }

    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();
    }
}

module.exports = Auth;
