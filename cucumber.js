module.exports = {
    default: {
        paths: ['features/**/*.feature'],
        require: [
            'features/step-definitions/**/*.js',
            'features/support/**/*.js'
        ],
        format: [
            'progress',
            'html:playwright-report/cucumber-report.html',
            'allure-cucumberjs/reporter'
        ],
        formatOptions: {
            resultsDir: 'allure-results'
        }
    }
};
