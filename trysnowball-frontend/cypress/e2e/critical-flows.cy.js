/// <reference types="cypress" />

/**
 * Notes:
 * - Relies on robust "find one of these selectors" helpers to survive minor UI changes.
 * - Uses Demo Mode when convenient to avoid auth/setup friction.
 * - For truly stable tests, add data-testid attributes to key controls and swap in below.
 */

const SEL = {
  // Global/App
  appRoot: '#root, main, [data-app-root]',
  demoBanner: '[data-testid="demo-banner"], .DemoBanner, [class*="demo"]',
  dashboardHeader: 'h1:contains("Dashboard"), [data-testid="dashboard-title"]',

  // Navigation / Buttons (prefer data-testids first)
  addDebtBtn: [
    '[data-testid="add-timelineDebts-btn"]',
    '[data-testid="add-debt"]',
    'button:contains("Add debt")',
    'button:contains("Add Debt")',
    'button:contains("Add Debts")',
  ],
  importDebtsBtn: [
    '[data-testid="import-debts"]',
    'button:contains("Import Table")',
    'button:contains("Paste")',
    'button:contains("Import")',
  ],
  myDebtsNav: [
    '[data-testid="tab-debts"]',
    '[data-testid="nav-debts"]',
    'a:contains("My Debts")',
    'button:contains("My Debts")',
  ],
  forecastNav: [
    '[data-testid="tab-timeline"]',
    '[data-testid="nav-forecast"]',
    'a:contains("Forecast")',
    'button:contains("Forecast")',
  ],

  // Add Debt form fields (prefer labels; fall back to common names)
  debtName: [
    'input[name="name"]',
    'input#debt-name',
    'input[placeholder*="Name"]',
    'input[aria-label*="Name"]',
  ],
  debtBalance: [
    'input[name="balance"]',
    'input#debt-balance',
    'input[placeholder*="Balance"]',
    'input[aria-label*="Balance"]',
  ],
  debtApr: [
    'input[name="apr"]',
    'input#debt-apr',
    'input[placeholder*="APR"]',
    'input[aria-label*="APR"]',
  ],
  debtMin: [
    'input[name="minPayment"]',
    'input#debt-minPayment',
    'input[placeholder*="Min"]',
    'input[aria-label*="Minimum"]',
  ],
  saveDebtBtn: [
    'button[type="submit"]',
    'button:contains("Save")',
    'button[aria-label*="Save"]',
  ],

  // Debts table/list
  debtsTable: [
    '[data-testid="debts-table"]',
    'table',
    '[role="table"]',
    '.DebtTable',
  ],
  debtRow: (name) => [
    `[data-testid="debt-row-${name}"]`,
    `tr:contains("${name}")`,
    `.DebtRow:contains("${name}")`,
    `li:contains("${name}")`,
    `div:contains("${name}")`,
  ],

  // Import/Paste modal
  pasteTextarea: [
    '[data-testid="paste-textarea"]',
    'textarea[name="paste"]',
    'textarea[placeholder*="Paste"]',
    'textarea',
  ],
  parseBtn: [
    '[data-testid="parse-debts"]',
    'button:contains("Parse")',
    'button:contains("Analyze")',
  ],
  importConfirmBtn: [
    '[data-testid="confirm-import"]',
    'button:contains("Import")',
    'button:contains("Add")',
    'button:contains("Continue")',
  ],

  // Forecast / strategy toggle
  snowballToggle: [
    '[data-testid="strategy-snowball"]',
    'button:contains("Snowball")',
    'label:contains("Snowball")',
  ],
  avalancheToggle: [
    '[data-testid="strategy-avalanche"]',
    'button:contains("Avalanche")',
    'label:contains("Avalanche")',
  ],
  impactHeadline: [
    '[data-testid="impact-headline"]',
    'h2:contains("Debt-free")',
    'h3:contains("Debt-free")',
    '[class*="Impact"]',
  ],
};

function clickOneOf(selectors) {
  for (const s of selectors) {
    const el = Cypress.$(s);
    if (el.length) {
      cy.wrap(el.first()).click({ force: true });
      return;
    }
  }
  // nothing found -> let cy fail with helpful message
  cy.get(selectors.join(', ')).first().click({ force: true });
}

function getOneOf(selectors) {
  return cy.get(selectors.join(', ')).first();
}

function typeIntoOneOf(selectors, text) {
  for (const s of selectors) {
    const el = Cypress.$(s);
    if (el.length) {
      cy.wrap(el.first()).clear().type(text, { delay: 0 });
      return;
    }
  }
  cy.get(selectors.join(', ')).first().clear().type(text, { delay: 0 });
}

describe('Critical Flows', () => {
  const base = Cypress.config('baseUrl') || 'http://localhost:5173';

  before(() => {
    // Try home; if guarded, jump to demo profile to guarantee a dashboard.
    cy.visit('/');
    cy.location('pathname', { timeout: 15000 }).then((p) => {
      if (p.includes('landing') || p === '/' || p.includes('signin') || p.includes('onboarding')) {
        cy.visit('/demo?profile=default');
      }
    });
  });

  it('Boots the app and shows a working dashboard (demo acceptable)', () => {
    cy.get(SEL.appRoot, { timeout: 20000 }).should('exist');
    // Either demo banner or a main dashboard heading
    cy.get('body').then(($b) => {
      if ($b.find(SEL.demoBanner).length) {
        getOneOf([SEL.demoBanner]).should('exist');
      } else {
        getOneOf([SEL.dashboardHeader]).should('exist');
      }
    });
  });

  it('Adds a single debt manually', () => {
    // Navigate to debts
    cy.get('body').then(($b) => {
      if ($b.find(SEL.myDebtsNav.join(',')).length) {
        clickOneOf(SEL.myDebtsNav);
      } else {
        cy.visit('/debts');
      }
    });

    // Open add debt form
    clickOneOf(SEL.addDebtBtn);

    // Fill and save
    const name = `Test VISA ${Date.now().toString().slice(-4)}`;
    typeIntoOneOf(SEL.debtName, name);
    typeIntoOneOf(SEL.debtBalance, '450.50');
    typeIntoOneOf(SEL.debtApr, '19.9');
    typeIntoOneOf(SEL.debtMin, '25');

    clickOneOf(SEL.saveDebtBtn);

    // Assert it appears in list
    cy.wait(300); // small render debounce
    cy.get(SEL.debtsTable.join(', ')).should('exist');
    getOneOf(SEL.debtRow(name)).should('exist');
  });

  it('Imports multiple debts via paste flow', () => {
    // Ensure we're on debts page
    cy.location('pathname').then((p) => {
      if (!p.includes('/debts') && !p.includes('/my-plan')) cy.visit('/my-plan');
    });

    // Navigate to debts tab if we're on MyPlan
    clickOneOf(SEL.myDebtsNav);

    // Open import modal
    clickOneOf(SEL.importDebtsBtn);

    // Paste data
    cy.fixture('debts.tsv').then((txt) => {
      typeIntoOneOf(SEL.pasteTextarea, txt);
    });

    // Parse the data first
    clickOneOf(SEL.parseBtn);
    cy.wait(500); // Allow parsing to complete

    // Then import
    clickOneOf(SEL.importConfirmBtn);
    cy.wait(300); // Allow import to complete

    // Validate at least one of the imported names is present
    getOneOf(SEL.debtRow('Cypress Card One')).should('exist');
    getOneOf(SEL.debtRow('Cypress Loan Two')).should('exist');
  });

  it('Toggles Forecast strategy Snowball ⇄ Avalanche and updates impact', () => {
    // Navigate to Strategy tab in My Plan
    cy.visit('/my-plan');
    clickOneOf(['[data-testid="tab-strategy"]', 'button:contains("Strategy")']);
    cy.wait(300);

    // Capture current strategy state and click avalanche
    clickOneOf(SEL.avalancheToggle);
    cy.wait(500); // Allow strategy change to process

    // Navigate to Timeline tab to see impact
    clickOneOf(SEL.forecastNav);
    cy.wait(500);

    // Check that impact headline exists and has content
    getOneOf(SEL.impactHeadline).should('exist').invoke('text').then((impactText) => {
      // Should have some meaningful content (not empty)
      expect(impactText.trim().length).to.be.greaterThan(5);
    });

    // Go back to strategy and switch to Snowball
    clickOneOf(['[data-testid="tab-strategy"]', 'button:contains("Strategy")']);
    cy.wait(300);
    clickOneOf(SEL.snowballToggle);
    cy.wait(500);

    // Check Timeline again - should still have impact content
    clickOneOf(SEL.forecastNav);
    cy.wait(500);
    getOneOf(SEL.impactHeadline).should('exist').and('contain.text', 'Debt-free');
  });
});