const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Optimal viewport for desktop testing
    viewportWidth: 1366,
    viewportHeight: 900,
    // Longer timeouts for CI stability
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    // Retries for CI flake prevention
    retries: { 
      runMode: 2, 
      openMode: 0 
    },
    // Video and screenshots
    video: true,
    screenshotOnRunFailure: true,
    // Allow cross-origin if needed
    chromeWebSecurity: false,
    // Test isolation
    testIsolation: true,
    // Faster execution
    watchForFileChanges: false,
  },
});