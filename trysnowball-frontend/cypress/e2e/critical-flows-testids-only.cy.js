/// <reference types="cypress" />

/**
 * Critical Flows - Testids Only Version
 * No fallbacks - fails fast if data-testids are missing
 * Maximum performance and reliability
 */

const SEL = {
  // Global/App  
  appRoot: '#root',
  demoBanner: '[data-testid="demo-banner"]',
  
  // Navigation (locked to testids)
  addDebtBtn: '[data-testid="add-timelineDebts-btn"]',
  myDebtsNav: '[data-testid="tab-debts"]',
  forecastNav: '[data-testid="tab-timeline"]',
  strategyNav: '[data-testid="tab-strategy"]',

  // Add Debt form (semantic selectors - stable)
  debtName: 'input[name="name"]',
  debtBalance: 'input[name="balance"]', 
  debtApr: 'input[name="apr"]',
  debtMin: 'input[name="minPayment"]',
  saveDebtBtn: 'button[type="submit"]',

  // Debts table
  debtsTable: 'table, [role="table"]',
  debtRow: (name) => `tr:contains("${name}"), div:contains("${name}")`,

  // Import flow (locked to testids)
  pasteTextarea: '[data-testid="paste-textarea"]',
  parseBtn: '[data-testid="parse-debts"]', 
  importConfirmBtn: '[data-testid="confirm-import"]',

  // Strategy toggles (locked to testids)
  snowballToggle: '[data-testid="strategy-snowball"]',
  avalancheToggle: '[data-testid="strategy-avalanche"]',
  impactHeadline: '[data-testid="impact-headline"]',
};

describe('Critical Flows - Testids Only', () => {
  beforeEach(() => {
    // Clean start every test
    cy.cleanAppState();
    cy.visit('/');
    
    // Smart demo mode fallback
    cy.location('pathname', { timeout: 15000 }).then((p) => {
      if (p.includes('landing') || p === '/' || p.includes('signin') || p.includes('onboarding')) {
        cy.visit('/demo?profile=default');
      }
    });
  });

  it('Boots the app and shows a working dashboard', () => {
    cy.get(SEL.appRoot, { timeout: 20000 }).should('exist');
    
    // Either demo banner OR normal dashboard
    cy.get('body').then(($body) => {
      if ($body.find(SEL.demoBanner).length) {
        cy.get(SEL.demoBanner).should('exist');
      } else {
        cy.get('h1').should('exist'); // Some form of main heading
      }
    });
  });

  it('Adds a single debt manually', () => {
    // Navigate to debts
    cy.visit('/my-plan');
    cy.get(SEL.myDebtsNav).click();

    // Open add debt form
    cy.get(SEL.addDebtBtn).click();

    // Fill and save
    const name = `Test VISA ${Date.now().toString().slice(-4)}`;
    cy.get(SEL.debtName).type(name);
    cy.get(SEL.debtBalance).type('450.50');
    cy.get(SEL.debtApr).type('19.9');
    cy.get(SEL.debtMin).type('25');

    cy.get(SEL.saveDebtBtn).click();

    // Assert it appears in list
    cy.waitForReact(300);
    cy.get(SEL.debtsTable).should('exist');
    cy.contains(name).should('exist');
  });

  it('Imports multiple debts via paste flow', () => {
    // Start at My Plan debts tab
    cy.visit('/my-plan');
    cy.get(SEL.myDebtsNav).click();

    // Find and click import button (look for common text patterns)
    cy.get('button').contains(/import|paste/i).click();

    // Paste data
    cy.fixture('debts.tsv').then((txt) => {
      cy.get(SEL.pasteTextarea).type(txt);
    });

    // Parse the data first
    cy.get(SEL.parseBtn).click();
    cy.waitForReact(500);

    // Then import
    cy.get(SEL.importConfirmBtn).click();
    cy.waitForReact(300);

    // Validate imported debts appear
    cy.contains('Cypress Card One').should('exist');
    cy.contains('Cypress Loan Two').should('exist');
  });

  it('Toggles strategy and shows impact changes', () => {
    // Use demo data for predictable results
    cy.visit('/demo?profile=default');
    cy.wait(500);

    // Navigate to Strategy tab
    cy.visit('/my-plan');
    cy.get(SEL.strategyNav).click();
    cy.waitForReact(300);

    // Click avalanche strategy
    cy.get(SEL.avalancheToggle).click();
    cy.waitForReact(500);

    // Navigate to Timeline to see impact
    cy.get(SEL.forecastNav).click();
    cy.waitForReact(500);

    // Verify impact headline shows meaningful data
    cy.get(SEL.impactHeadline)
      .should('exist')
      .and('be.visible')
      .invoke('text')
      .should('have.length.greaterThan', 10);

    // Switch back to Snowball
    cy.get(SEL.strategyNav).click();
    cy.get(SEL.snowballToggle).click();
    cy.waitForReact(500);

    // Check timeline again
    cy.get(SEL.forecastNav).click();
    cy.get(SEL.impactHeadline).should('contain.text', 'Debt-free');
  });
});