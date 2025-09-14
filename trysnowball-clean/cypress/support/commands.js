// Custom Cypress commands for TrySnowball Clean v2

// Authentication helpers
Cypress.Commands.add('loginAsDemoUser', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('demo_mode', 'true')
    win.localStorage.setItem('user_tier', 'free')
    win.localStorage.setItem('user_id', 'demo_user_123')
  })
})

Cypress.Commands.add('loginAsProUser', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('demo_mode', 'false')
    win.localStorage.setItem('user_tier', 'pro')
    win.localStorage.setItem('user_id', 'pro_user_456')
    win.localStorage.setItem('auth_token', 'mock_jwt_token')
  })
})

// Debt entry helpers
Cypress.Commands.add('addDebt', (debt) => {
  cy.get('[data-cy="debt-name"]').clear().type(debt.name)
  cy.get('[data-cy="debt-balance"]').clear().type(debt.balance.toString())
  cy.get('[data-cy="debt-apr"]').clear().type(debt.apr.toString())
  cy.get('[data-cy="debt-min-payment"]').clear().type(debt.minPayment.toString())

  if (debt.buckets) {
    cy.get('[data-cy="enable-multi-apr"]').click()

    debt.buckets.forEach((bucket, index) => {
      cy.get(`[data-cy="bucket-name-${index}"]`).type(bucket.name)
      cy.get(`[data-cy="bucket-balance-${index}"]`).type(bucket.balance.toString())
      cy.get(`[data-cy="bucket-apr-${index}"]`).type(bucket.apr.toString())
    })
  }

  cy.get('[data-cy="add-debt-button"]').click()
})

Cypress.Commands.add('addMultipleDebts', (debts) => {
  debts.forEach(debt => {
    cy.addDebt(debt)
  })
})

// Forecast generation
Cypress.Commands.add('generateForecast', (extraPayment = 0) => {
  if (extraPayment > 0) {
    cy.get('[data-cy="extra-payment"]').clear().type(extraPayment.toString())
  }
  cy.get('[data-cy="generate-forecast"]').click()
  cy.get('[data-cy="forecast-summary"]').should('be.visible')
})

// Goal management
Cypress.Commands.add('createGoal', (goalType, targetValue, targetDate, debtId = null) => {
  cy.get('[data-cy="create-goal-button"]').click()
  cy.get('[data-cy="goal-type"]').select(goalType)

  if (targetValue) {
    cy.get('[data-cy="goal-target-value"]').type(targetValue.toString())
  }

  if (targetDate) {
    cy.get('[data-cy="goal-target-date"]').type(targetDate)
  }

  if (debtId) {
    cy.get('[data-cy="goal-debt-select"]').select(debtId)
  }

  cy.get('[data-cy="save-goal"]').click()
})

// Strategy switching
Cypress.Commands.add('switchStrategy', (strategyType) => {
  cy.get('[data-cy="strategy-tab"]').click()

  if (strategyType === 'avalanche') {
    cy.get('[data-cy="avalanche-strategy"]').click()
  } else if (strategyType === 'snowball') {
    cy.get('[data-cy="snowball-strategy"]').click()
  } else if (strategyType === 'custom') {
    cy.get('[data-cy="custom-strategy"]').click()
  }
})

// Data validation helpers
Cypress.Commands.add('validateForecastData', () => {
  // Check that all required forecast fields are present and valid
  cy.get('[data-cy="debt-free-date"]').should('be.visible').shouldNotContainNaN()
  cy.get('[data-cy="total-months"]').should('be.visible').shouldNotContainNaN()
  cy.get('[data-cy="total-interest"]').should('be.visible').shouldHaveValidCurrency()
  cy.get('[data-cy="monthly-payment"]').should('be.visible').shouldHaveValidCurrency()

  // Validate that debt free date is in the future
  cy.get('[data-cy="debt-free-date"]').then(($el) => {
    const debtFreeDate = new Date($el.text())
    const today = new Date()
    expect(debtFreeDate).to.be.greaterThan(today)
  })
})

Cypress.Commands.add('validateMultiAprBreakdown', () => {
  // Check Multi-APR specific elements
  cy.get('[data-cy="multi-apr-breakdown"]').should('be.visible')
  cy.get('[data-cy="payment-allocation"]').should('be.visible')

  // Validate bucket priorities
  cy.get('[data-cy^="bucket-priority-"]').each(($el) => {
    cy.wrap($el).should('be.visible')
    cy.wrap($el).should('not.be.empty')
  })
})

// Error handling
Cypress.Commands.add('expectNoErrors', () => {
  cy.get('[data-cy="error-message"]').should('not.exist')
  cy.get('[data-cy="error-banner"]').should('not.exist')
  cy.get('.error').should('not.exist')
})

Cypress.Commands.add('expectNoNaNValues', () => {
  cy.get('body').then(($body) => {
    expect($body.text()).to.not.include('NaN')
    expect($body.text()).to.not.include('Infinity')
    expect($body.text()).to.not.include('-Infinity')
  })
})

// Performance monitoring
Cypress.Commands.add('waitForForecastCalculation', () => {
  // Wait for loading spinner to appear and disappear
  cy.get('[data-cy="calculation-spinner"]', { timeout: 1000 }).should('be.visible')
  cy.get('[data-cy="calculation-spinner"]', { timeout: 10000 }).should('not.exist')
})

// Snapshot comparison helpers
Cypress.Commands.add('compareCalculationResults', (expectedResults) => {
  cy.get('[data-cy="total-months"]').then(($el) => {
    const actualMonths = parseInt($el.text())
    expect(actualMonths).to.be.closeTo(expectedResults.totalMonths, 1)
  })

  cy.get('[data-cy="total-interest"]').then(($el) => {
    const actualInterest = parseFloat($el.text().replace(/[£,]/g, ''))
    expect(actualInterest).to.be.closeTo(expectedResults.totalInterest, 10)
  })
})

// Accessibility helpers
Cypress.Commands.add('checkKeyboardNavigation', () => {
  // Test tab navigation through key elements
  cy.get('body').tab()
  cy.focused().should('have.attr', 'data-cy')

  // Continue tabbing through interactive elements
  for (let i = 0; i < 10; i++) {
    cy.focused().tab()
    cy.focused().should('be.visible')
  }
})

// Mobile testing helpers
Cypress.Commands.add('testMobileResponsiveness', () => {
  const viewports = ['iphone-6', 'ipad-2', 'samsung-s10']

  viewports.forEach(viewport => {
    cy.viewport(viewport)
    cy.get('[data-cy="mobile-menu"]').should('be.visible')
    cy.get('[data-cy="desktop-menu"]').should('not.be.visible')
  })
})

// Analytics validation
Cypress.Commands.add('validateAnalyticsEvent', (eventName, properties = {}) => {
  cy.get('@posthogCapture').should('have.been.calledWith', eventName)

  if (Object.keys(properties).length > 0) {
    cy.get('@posthogCapture').should('have.been.calledWithMatch', eventName, properties)
  }
})

// Test data management
Cypress.Commands.add('seedStandardTestData', () => {
  const testDebts = [
    { name: 'Credit Card A', balance: 2000, apr: 19.9, minPayment: 60 },
    { name: 'Credit Card B', balance: 1500, apr: 24.9, minPayment: 45 },
    { name: 'Personal Loan', balance: 5000, apr: 8.5, minPayment: 200 }
  ]

  cy.addMultipleDebts(testDebts)
  cy.generateForecast(200)
})

// Custom assertions
Cypress.Commands.add('shouldBeWithinRange', { prevSubject: true }, (subject, min, max) => {
  const value = parseFloat(subject.text().replace(/[£,]/g, ''))
  expect(value).to.be.within(min, max)
})

Cypress.Commands.add('shouldHaveReasonableTimeline', { prevSubject: true }, (subject) => {
  const months = parseInt(subject.text())
  expect(months).to.be.greaterThan(0)
  expect(months).to.be.lessThan(600) // Less than 50 years
})