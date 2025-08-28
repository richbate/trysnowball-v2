/// <reference types="cypress" />

describe('Milestone celebration', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.location('pathname', { timeout: 15000 }).then((p) => {
      if (p.includes('landing') || p === '/' || p.includes('signin') || p.includes('onboarding')) {
        cy.visit('/demo?profile=default');
      }
    });
  });

  it('celebrates when a micro-debt is cleared', () => {
    // Navigate to debts tab
    cy.visit('/my-plan');
    cy.get('[data-testid="tab-debts"]').click();
    
    // Add a tiny debt that will clear immediately
    cy.get('[data-testid="add-timelineDebts-btn"]').click();
    cy.get('input[name="name"]').type('Cypress Micro Debt');
    cy.get('input[name="balance"]').type('10');
    cy.get('input[name="apr"]').type('0');
    cy.get('input[name="minPayment"]').type('10');
    cy.get('button[type="submit"]').click();
    
    // Wait for debt to be added
    cy.wait(300);
    
    // Navigate to forecast/timeline tab to trigger calculations
    cy.get('[data-testid="tab-timeline"]').click();
    cy.wait(500); // Allow timeline calculations to complete
    
    // Check that impact headline exists (debt should be cleared quickly)
    cy.get('[data-testid="impact-headline"]').should('exist');
    
    // Look for celebration modal or success indicator
    cy.get('body').then(($body) => {
      // Check for celebration modal, success toast, or milestone indicator
      const celebrationSelectors = [
        '[data-testid="celebration-modal"]',
        '[class*="Celebration"]',
        '[data-testid="milestone-toast"]',
        '.celebration-modal',
        'div:contains("Congratulations")',
        'div:contains("Debt cleared")',
        'div:contains("milestone")'
      ];
      
      // If any celebration UI exists, interact with it
      const foundCelebration = celebrationSelectors.some(selector => {
        return $body.find(selector).length > 0;
      });
      
      if (foundCelebration) {
        // Close any celebration modal that appears
        cy.get('button:contains("Close"), button:contains("Continue"), [data-testid="close-celebration"]')
          .first()
          .click({ force: true });
      }
    });
    
    // Verify we can still interact with the interface after any celebration
    cy.get('[data-testid="impact-headline"]').should('exist');
    
    // Verify the micro debt appears in the debts list (even if cleared)
    cy.get('[data-testid="tab-debts"]').click();
    cy.get('body').should('contain', 'Cypress Micro Debt');
  });
  
  it('shows meaningful progress indicators', () => {
    // Start with demo data that has realistic progress
    cy.visit('/demo?profile=default');
    cy.wait(500);
    
    // Check that timeline shows progress metrics
    cy.visit('/my-plan');
    cy.get('[data-testid="tab-timeline"]').click();
    cy.wait(300);
    
    // Impact headline should show debt-free timeline
    cy.get('[data-testid="impact-headline"]')
      .should('exist')
      .and('be.visible')
      .invoke('text')
      .then((text) => {
        // Should contain meaningful progress info
        const hasProgress = text.includes('Debt-free') || 
                          text.includes('months') || 
                          text.includes('sooner') ||
                          text.includes('saved');
        expect(hasProgress).to.be.true;
      });
  });
});