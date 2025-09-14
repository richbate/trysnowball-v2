// Import Cypress commands and support files
import './commands'

// Global before hook for all tests
beforeEach(() => {
  // Clear console errors and warnings before each test
  cy.window().then((win) => {
    cy.stub(win.console, 'error').as('consoleError')
    cy.stub(win.console, 'warn').as('consoleWarn')
  })

  // Set up PostHog analytics stubbing
  cy.window().then((win) => {
    win.posthog = {
      capture: cy.stub().as('posthogCapture'),
      identify: cy.stub().as('posthogIdentify'),
      reset: cy.stub().as('posthogReset'),
      register: cy.stub().as('posthogRegister'),
      unregister: cy.stub().as('posthogUnregister')
    }
  })
})

// Global after hook - check for console errors
afterEach(() => {
  // Fail test if there were any uncaught console errors
  cy.get('@consoleError').then((consoleError) => {
    expect(consoleError).to.not.have.been.called
  })

  // Log warnings but don't fail tests
  cy.get('@consoleWarn').then((consoleWarn) => {
    if (consoleWarn.called) {
      cy.log('⚠️ Console warnings detected during test')
    }
  })
})

// Custom assertion for checking NaN values
Cypress.Commands.add('shouldNotContainNaN', (selector) => {
  cy.get(selector).should(($el) => {
    const text = $el.text()
    expect(text).to.not.include('NaN')
    expect(text).to.not.include('Infinity')
    expect(text).to.not.include('undefined')
    expect(text).to.not.include('null')
  })
})

// Custom command for validating currency formatting
Cypress.Commands.add('shouldHaveValidCurrency', (selector) => {
  cy.get(selector).should(($el) => {
    const text = $el.text()
    const currencyRegex = /£[\d,]+\.?\d{0,2}/
    expect(text).to.match(currencyRegex)
  })
})

// Custom command for checking accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe()
  cy.checkA11y()
})

// Performance monitoring helper
Cypress.Commands.add('measurePerformance', (actionCallback) => {
  cy.window().then((win) => {
    const startTime = win.performance.now()

    actionCallback()

    cy.then(() => {
      const endTime = win.performance.now()
      const duration = endTime - startTime
      cy.log(`⚡ Performance: ${duration.toFixed(2)}ms`)

      // Fail if action takes longer than 3 seconds
      expect(duration).to.be.lessThan(3000)
    })
  })
})