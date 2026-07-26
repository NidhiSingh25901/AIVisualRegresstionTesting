class Home {
    constructor(page) {
        this.page = page;
        this.language = page.getByRole('button', { name: 'DE', exact: true });
        this.englishLanguageButton = page.getByRole('button', {
            name: 'EN',
            exact: true
        });
        this.authLink = page.getByRole('link', { name: 'Auth' });
    }

    async changeLanguageToGerman() {
        await this.language.click();
        await this.englishLanguageButton.waitFor({ state: 'visible' });
    }

    async changeLanguageToEnglish() {
        await this.englishLanguageButton.click();
        await this.language.waitFor({ state: 'visible' });
    }

    async clickOnAuth() {
        await this.authLink.click();
    }
}

module.exports = Home;
