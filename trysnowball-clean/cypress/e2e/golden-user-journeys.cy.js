/**
 * Golden User Journeys - End-to-End Smoke Tests
 *
 * Critical user flows that must work 100% of the time:
 * 1. Landing → Debt Entry → Forecast Display
 * 2. Goal Setting → Progress Tracking
 * 3. Strategy Comparison (Snowball vs Avalanche)
 * 4. Multi-APR debt handling
 * 5. Motivational messaging display
 *
 * These tests run against both staging and production environments.
 */

describe('Golden User Journeys - Critical Flows', () => {
  beforeEach(() => {
    // Clear local storage to ensure clean state
    cy.clearLocalStorage();
    cy.visit('/');

    // Stub analytics to prevent external calls during testing
    cy.window().then((win) => {
      win.posthog = {
        capture: cy.stub().as('posthogCapture'),
        identify: cy.stub().as('posthogIdentify'),
        reset: cy.stub().as('posthogReset')
      };
    });
  });

  describe('Core Journey: Landing → Debt Entry → Forecast', () => {
    it('should complete full debt-to-forecast flow without errors', () => {
      // Landing page loads
      cy.get('[data-cy="landing-hero"]').should('be.visible');
      cy.get('[data-cy="cta-button"]').should('contain.text', 'Start Your Beta Access');

      // Click main CTA
      cy.get('[data-cy="cta-button"]').click();

      // Should navigate to debt entry
      cy.url().should('include', '/debts');
      cy.get('[data-cy="debt-entry-form"]').should('be.visible');

      // Enter first debt (Multi-APR credit card)
      cy.get('[data-cy="debt-name"]').type('Barclaycard Platinum');
      cy.get('[data-cy="debt-balance"]').type('3000');
      cy.get('[data-cy="debt-apr"]').type('22.9');
      cy.get('[data-cy="debt-min-payment"]').type('90');
      cy.get('[data-cy="add-debt-button"]').click();

      // Enter second debt
      cy.get('[data-cy="debt-name"]').type('MBNA Cash Card');
      cy.get('[data-cy="debt-balance"]').type('1500');
      cy.get('[data-cy="debt-apr"]').type('27.9');
      cy.get('[data-cy="debt-min-payment"]').type('45');
      cy.get('[data-cy="add-debt-button"]').click();

      // Set extra payment amount
      cy.get('[data-cy="extra-payment"]').type('200');

      // Generate forecast
      cy.get('[data-cy="generate-forecast"]').click();

      // Forecast should be displayed
      cy.get('[data-cy="forecast-summary"]').should('be.visible');
      cy.get('[data-cy="debt-free-date"]').should('exist');
      cy.get('[data-cy="total-interest"]').should('exist');
      cy.get('[data-cy="total-months"]').should('exist');

      // Multi-APR engine should show bucket breakdown
      cy.get('[data-cy="multi-apr-breakdown"]').should('be.visible');
      cy.get('[data-cy="bucket-cash-advances"]').should('exist');
      cy.get('[data-cy="bucket-purchases"]').should('exist');

      // Verify no calculation errors
      cy.get('[data-cy="error-message"]').should('not.exist');
      cy.get('[data-cy="nan-warning"]').should('not.exist');
    });

    it('should handle single large debt correctly', () => {
      cy.visit('/debts');

      // Enter single large debt
      cy.get('[data-cy="debt-name"]').type('Personal Loan');
      cy.get('[data-cy="debt-balance"]').type('15000');
      cy.get('[data-cy="debt-apr"]').type('8.5');
      cy.get('[data-cy="debt-min-payment"]').type('250');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('100');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should show realistic timeline
      cy.get('[data-cy="total-months"]').should('contain.text', '4'); // Approximately 4+ years
      cy.get('[data-cy="total-interest"]').should('be.visible');

      // Should not show impossible timelines
      cy.get('[data-cy="total-months"]').should('not.contain.text', '0');
      cy.get('[data-cy="total-months"]').should('not.contain.text', 'NaN');
    });

    it('should show motivational reframing for different timelines', () => {
      cy.visit('/debts');

      // Quick win scenario (6 months)
      cy.get('[data-cy="debt-name"]').type('Small Card');
      cy.get('[data-cy="debt-balance"]').type('800');
      cy.get('[data-cy="debt-apr"]').type('19.9');
      cy.get('[data-cy="debt-min-payment"]').type('25');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('150');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should show quick victory messaging
      cy.get('[data-cy="motivational-message"]').should('be.visible');
      cy.get('[data-cy="motivational-message"]').should('contain.text', 'summer');
      cy.get('[data-cy="urgency-indicator"]').should('contain.text', 'high');
      cy.get('[data-cy="visual-cue"]').should('contain.text', '☀️');
    });
  });

  describe('Goals & Milestone Detection', () => {
    beforeEach(() => {
      // Set up debt scenario first
      cy.visit('/debts');
      cy.get('[data-cy="debt-name"]').type('Test Debt');
      cy.get('[data-cy="debt-balance"]').type('2000');
      cy.get('[data-cy="debt-apr"]').type('19.9');
      cy.get('[data-cy="debt-min-payment"]').type('60');
      cy.get('[data-cy="add-debt-button"]').click();
      cy.get('[data-cy="extra-payment"]').type('100');
      cy.get('[data-cy="generate-forecast"]').click();
    });

    it('should create and track DEBT_CLEAR goal', () => {
      // Navigate to goals section
      cy.get('[data-cy="goals-tab"]').click();
      cy.get('[data-cy="create-goal-button"]').click();

      // Create debt clear goal
      cy.get('[data-cy="goal-type"]').select('DEBT_CLEAR');
      cy.get('[data-cy="goal-debt-select"]').select('Test Debt');
      cy.get('[data-cy="goal-target-date"]').type('2025-12-31');
      cy.get('[data-cy="save-goal"]').click();

      // Goal should be created and displayed
      cy.get('[data-cy="active-goals"]').should('contain', 'Clear Test Debt');
      cy.get('[data-cy="goal-progress-bar"]').should('be.visible');
      cy.get('[data-cy="goal-status"]').should('contain', 'ACTIVE');
    });

    it('should show goal achievement celebration', () => {
      // Mock goal achievement
      cy.window().then((win) => {
        // Simulate debt being paid off
        win.localStorage.setItem('debt_cleared_celebration', JSON.stringify({
          debtName: 'Test Debt',
          interestSaved: 250,
          monthsToCompletion: 8
        }));
      });

      cy.visit('/goals');

      // Should show celebration modal
      cy.get('[data-cy="celebration-modal"]').should('be.visible');
      cy.get('[data-cy="celebration-title"]').should('contain', '🎉');
      cy.get('[data-cy="celebration-impact"]').should('contain', '£250');
      cy.get('[data-cy="share-celebration"]').should('be.visible');
    });
  });

  describe('Strategy Comparison & Analysis', () => {
    beforeEach(() => {
      // Set up multiple debts for strategy comparison
      cy.visit('/debts');

      // High interest, low balance
      cy.get('[data-cy="debt-name"]').type('Store Card');
      cy.get('[data-cy="debt-balance"]').type('500');
      cy.get('[data-cy="debt-apr"]').type('29.9');
      cy.get('[data-cy="debt-min-payment"]').type('15');
      cy.get('[data-cy="add-debt-button"]').click();

      // Medium interest, high balance
      cy.get('[data-cy="debt-name"]').type('Credit Card');
      cy.get('[data-cy="debt-balance"]').type('3000');
      cy.get('[data-cy="debt-apr"]').type('22.9');
      cy.get('[data-cy="debt-min-payment"]').type('90');
      cy.get('[data-cy="add-debt-button"]').click();

      // Low interest, medium balance
      cy.get('[data-cy="debt-name"]').type('Personal Loan');
      cy.get('[data-cy="debt-balance"]').type('2000');
      cy.get('[data-cy="debt-apr"]').type('8.5');
      cy.get('[data-cy="debt-min-payment"]').type('85');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('200');
      cy.get('[data-cy="generate-forecast"]').click();
    });

    it('should compare snowball vs avalanche strategies', () => {
      cy.get('[data-cy="strategy-tab"]').click();

      // Default should be snowball
      cy.get('[data-cy="current-strategy"]').should('contain', 'Debt Snowball');
      cy.get('[data-cy="strategy-explanation"]').should('contain', 'smallest balance first');

      // Switch to avalanche
      cy.get('[data-cy="avalanche-strategy"]').click();

      // Should update to avalanche
      cy.get('[data-cy="current-strategy"]').should('contain', 'Debt Avalanche');
      cy.get('[data-cy="strategy-explanation"]').should('contain', 'highest interest rate first');

      // Payment order should change
      cy.get('[data-cy="payment-order"]').should('be.visible');
      cy.get('[data-cy="first-debt-to-pay"]').should('contain', 'Store Card'); // Highest APR

      // Should show interest savings comparison
      cy.get('[data-cy="avalanche-savings"]').should('be.visible');
      cy.get('[data-cy="avalanche-savings"]').should('contain', '£');
    });

    it('should show custom strategy options for pro users', () => {
      // Mock pro user status
      cy.window().then((win) => {
        win.localStorage.setItem('user_tier', 'pro');
      });

      cy.get('[data-cy="strategy-tab"]').click();

      // Should show custom strategy option
      cy.get('[data-cy="custom-strategy"]').should('be.visible');
      cy.get('[data-cy="manual-order-toggle"]').should('exist');

      // Enable manual ordering
      cy.get('[data-cy="manual-order-toggle"]').click();
      cy.get('[data-cy="drag-drop-interface"]').should('be.visible');
    });
  });

  describe('Multi-APR Debt Handling', () => {
    it('should handle complex credit card with multiple APR buckets', () => {
      cy.visit('/debts');

      // Add credit card with multiple APR buckets
      cy.get('[data-cy="debt-name"]').type('Barclaycard Platinum');
      cy.get('[data-cy="debt-balance"]').type('5000');
      cy.get('[data-cy="enable-multi-apr"]').click();

      // Cash advances bucket (highest APR)
      cy.get('[data-cy="bucket-name-0"]').type('Cash Advances');
      cy.get('[data-cy="bucket-balance-0"]').type('1000');
      cy.get('[data-cy="bucket-apr-0"]').type('27.9');

      // Purchases bucket (medium APR)
      cy.get('[data-cy="bucket-name-1"]').type('Purchases');
      cy.get('[data-cy="bucket-balance-1"]').type('3000');
      cy.get('[data-cy="bucket-apr-1"]').type('22.9');

      // Balance transfer bucket (promotional 0%)
      cy.get('[data-cy="bucket-name-2"]').type('Balance Transfer');
      cy.get('[data-cy="bucket-balance-2"]').type('1000');
      cy.get('[data-cy="bucket-apr-2"]').type('0.0');

      cy.get('[data-cy="debt-min-payment"]').type('150');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('200');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should show FCA-compliant payment allocation
      cy.get('[data-cy="payment-breakdown"]').should('be.visible');
      cy.get('[data-cy="cash-advances-payment"]').should('be.visible');
      cy.get('[data-cy="purchases-payment"]').should('be.visible');
      cy.get('[data-cy="balance-transfer-payment"]').should('be.visible');

      // Highest APR bucket should be paid first
      cy.get('[data-cy="bucket-priority-1"]').should('contain', 'Cash Advances');
      cy.get('[data-cy="bucket-clearance-months"]').should('be.visible');
    });

    it('should handle edge case of payment lower than interest', () => {
      cy.visit('/debts');

      // Create debt where minimum payment < monthly interest
      cy.get('[data-cy="debt-name"]').type('High Interest Debt');
      cy.get('[data-cy="debt-balance"]').type('10000');
      cy.get('[data-cy="debt-apr"]').type('35.0');
      cy.get('[data-cy="debt-min-payment"]').type('50'); // Less than monthly interest
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('0');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should show debt growing warning
      cy.get('[data-cy="debt-growth-warning"]').should('be.visible');
      cy.get('[data-cy="debt-growth-warning"]').should('contain', 'debt is increasing');

      // Should suggest minimum extra payment needed
      cy.get('[data-cy="minimum-extra-suggestion"]').should('be.visible');
      cy.get('[data-cy="minimum-extra-suggestion"]').should('contain', 'add at least');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid debt inputs gracefully', () => {
      cy.visit('/debts');

      // Try to add debt with negative balance
      cy.get('[data-cy="debt-name"]').type('Invalid Debt');
      cy.get('[data-cy="debt-balance"]').type('-1000');
      cy.get('[data-cy="debt-apr"]').type('19.9');
      cy.get('[data-cy="debt-min-payment"]').type('50');
      cy.get('[data-cy="add-debt-button"]').click();

      // Should show validation error
      cy.get('[data-cy="validation-error"]').should('be.visible');
      cy.get('[data-cy="validation-error"]').should('contain', 'must be positive');

      // Debt should not be added
      cy.get('[data-cy="debt-list"]').should('not.contain', 'Invalid Debt');
    });

    it('should prevent NaN values in calculations', () => {
      cy.visit('/debts');

      // Add valid debt
      cy.get('[data-cy="debt-name"]').type('Test Debt');
      cy.get('[data-cy="debt-balance"]').type('1000');
      cy.get('[data-cy="debt-apr"]').type('0'); // Edge case: 0% APR
      cy.get('[data-cy="debt-min-payment"]').type('100');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('0');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should handle 0% APR without NaN
      cy.get('[data-cy="forecast-summary"]').should('be.visible');
      cy.get('[data-cy="total-interest"]').should('contain', '£0');
      cy.get('[data-cy="total-months"]').should('not.contain', 'NaN');
      cy.get('[data-cy="debt-free-date"]').should('not.contain', 'Invalid');
    });

    it('should handle network failures gracefully', () => {
      // Mock API failure
      cy.intercept('POST', '/api/forecast', { forceNetworkError: true });

      cy.visit('/debts');
      cy.get('[data-cy="debt-name"]').type('Test Debt');
      cy.get('[data-cy="debt-balance"]').type('1000');
      cy.get('[data-cy="debt-apr"]').type('19.9');
      cy.get('[data-cy="debt-min-payment"]').type('50');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('100');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should show offline fallback
      cy.get('[data-cy="offline-banner"]').should('be.visible');
      cy.get('[data-cy="offline-banner"]').should('contain', 'using offline calculations');

      // Should still provide forecast using local engine
      cy.get('[data-cy="forecast-summary"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6');
      cy.visit('/');

      // Landing should be mobile-friendly
      cy.get('[data-cy="landing-hero"]').should('be.visible');
      cy.get('[data-cy="cta-button"]').should('be.visible');

      // Navigation should work
      cy.get('[data-cy="cta-button"]').click();
      cy.get('[data-cy="debt-entry-form"]').should('be.visible');

      // Form should be usable on mobile
      cy.get('[data-cy="debt-name"]').type('Mobile Test Debt');
      cy.get('[data-cy="debt-balance"]').type('2000');
      cy.get('[data-cy="debt-apr"]').type('19.9');
      cy.get('[data-cy="debt-min-payment"]').type('60');
      cy.get('[data-cy="add-debt-button"]').click();

      cy.get('[data-cy="extra-payment"]').type('150');
      cy.get('[data-cy="generate-forecast"]').click();

      // Results should display properly on mobile
      cy.get('[data-cy="forecast-summary"]').should('be.visible');
      cy.get('[data-cy="mobile-friendly-charts"]').should('be.visible');
    });
  });

  describe('Performance & Loading', () => {
    it('should load forecast within 3 seconds', () => {
      cy.visit('/debts');

      // Add multiple debts quickly
      for (let i = 1; i <= 5; i++) {
        cy.get('[data-cy="debt-name"]').clear().type(`Debt ${i}`);
        cy.get('[data-cy="debt-balance"]').clear().type((i * 1000).toString());
        cy.get('[data-cy="debt-apr"]').clear().type((15 + i).toString());
        cy.get('[data-cy="debt-min-payment"]').clear().type((i * 30).toString());
        cy.get('[data-cy="add-debt-button"]').click();
      }

      cy.get('[data-cy="extra-payment"]').type('200');

      const start = Date.now();
      cy.get('[data-cy="generate-forecast"]').click();

      cy.get('[data-cy="forecast-summary"]').should('be.visible').then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(3000); // 3 second performance threshold
      });
    });

    it('should handle large debt portfolios without crashing', () => {
      cy.visit('/debts');

      // Add 20 debts (stress test)
      for (let i = 1; i <= 20; i++) {
        cy.get('[data-cy="debt-name"]').clear().type(`Debt ${i}`);
        cy.get('[data-cy="debt-balance"]').clear().type((Math.random() * 5000).toFixed(0));
        cy.get('[data-cy="debt-apr"]').clear().type((10 + Math.random() * 20).toFixed(1));
        cy.get('[data-cy="debt-min-payment"]').clear().type((25 + Math.random() * 75).toFixed(0));
        cy.get('[data-cy="add-debt-button"]').click();
      }

      cy.get('[data-cy="extra-payment"]').type('500');
      cy.get('[data-cy="generate-forecast"]').click();

      // Should complete without errors
      cy.get('[data-cy="forecast-summary"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('not.exist');
    });
  });
});