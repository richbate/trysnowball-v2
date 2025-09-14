const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    env: {
      // Environment-specific URLs
      staging_url: 'https://staging.trysnowball.co.uk',
      production_url: 'https://trysnowball.co.uk'
    },

    setupNodeEvents(on, config) {
      // Performance monitoring
      on('before:browser:launch', (browser, launchOptions) => {
        // Enable memory and performance monitoring
        if (browser.name === 'chrome') {
          launchOptions.args.push('--enable-memory-info')
          launchOptions.args.push('--enable-precise-memory-info')
        }
        return launchOptions
      })

      // Custom tasks for test data management
      on('task', {
        log(message) {
          console.log(message)
          return null
        },

        clearTestData() {
          // Clear any test data between runs
          console.log('🧹 Clearing test data...')
          return null
        },

        seedTestData() {
          // Seed consistent test data
          console.log('🌱 Seeding test data...')
          return {
            debts: [
              { name: 'Test Credit Card', balance: 2000, apr: 19.9, minPayment: 60 },
              { name: 'Test Personal Loan', balance: 5000, apr: 8.5, minPayment: 200 }
            ],
            extraPayment: 150
          }
        }
      })
    }
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
})