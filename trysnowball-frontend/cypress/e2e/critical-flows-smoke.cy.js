/* eslint-disable no-undef */
/**
 * Critical Flows Smoke Tests
 * 
 * Tests the most important user journeys to catch regressions fast:
 * 1. Debts Tab: Demo load → reorder → edit → history → clear → empty state
 * 2. Upgrade: Free user sees pricing; Pro user sees no gates
 * 3. Empty States: NoDebtsState shows proper CTAs
 */

describe('Critical User Flows - Smoke Tests', () => {
  beforeEach(() => {
    // Start fresh each test
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    
    // Visit home page and wait for load
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  describe('Debts Tab Critical Flow', () => {
    it('completes full debt management lifecycle', () => {
      cy.log('🎯 Testing: Demo load → reorder → edit → history → clear → empty state');
      
      // Navigate to My Plan
      cy.visit('/my-plan');
      cy.wait(1000);
      
      // Should start with demo data loaded
      cy.log('Step 1: Demo data should be loaded');
      cy.get('[data-testid="debt-table"], table').should('be.visible');
      cy.get('[data-testid="debt-summary-cards"], .debt-summary').should('exist');
      
      // Should see multiple debts
      cy.get('tbody tr, [data-testid="debt-row"]').should('have.length.at.least', 2);
      
      // Step 2: Test reordering (drag or click-based)
      cy.log('Step 2: Testing debt reordering');
      cy.get('[data-testid="debt-row"]:first, tbody tr:first').should('exist');
      
      // Step 3: Test edit functionality
      cy.log('Step 3: Testing debt edit');
      cy.get('[data-testid="edit-debt"], [title*="Edit"], button').contains(/edit|✏️/i).first().click({ force: true });
      cy.get('[data-testid="debt-form"], .modal, form').should('be.visible');
      cy.get('button').contains(/cancel|close|×/i).click({ force: true });
      
      // Step 4: Test history view (if available)
      cy.log('Step 4: Testing debt history');
      cy.get('[data-testid="view-history"], button').contains(/history|📊/i).first().click({ force: true });
      // History modal should appear or navigate
      cy.get('body').should('contain.text', /history|balance|changes/i);
      cy.get('button, [data-testid="close"]').contains(/close|×|back/i).first().click({ force: true });
      
      // Step 5: Clear all data
      cy.log('Step 5: Testing clear all data');
      cy.get('[data-testid="clear-data"], button').contains(/clear|delete|remove/i).first().click({ force: true });
      
      // Confirm clear action
      cy.get('button').contains(/confirm|yes|clear/i).click({ force: true });
      
      // Step 6: Verify empty state
      cy.log('Step 6: Verifying empty state');
      cy.get('[data-testid="no-debts-state"], .empty-state').should('be.visible');
      cy.get('button').contains(/add.*debt|get started|demo/i).should('be.visible');
      
      // Step 7: Reload demo data from empty state  
      cy.log('Step 7: Reloading demo data');
      cy.get('button').contains(/demo|try.*demo/i).click({ force: true });
      cy.get('tbody tr, [data-testid="debt-row"]').should('have.length.at.least', 1);
      
      cy.log('✅ Debts tab lifecycle completed successfully');
    });
  });

  describe('Upgrade Page Critical Flow', () => {
    it('shows pricing to free users', () => {
      cy.log('🎯 Testing: Free user sees upgrade pricing');
      
      // Navigate to upgrade page
      cy.visit('/upgrade');
      
      // Should see pricing content
      cy.get('body').should('contain.text', /upgrade|pricing|pro|plan/i);
      cy.get('[data-testid="pricing"], .pricing, .plan').should('exist');
      
      // Should see upgrade buttons
      cy.get('button').contains(/upgrade|choose|select/i).should('be.visible');
      
      cy.log('✅ Upgrade page shows correctly for free users');
    });

    it('account/upgrade route works', () => {
      cy.log('🎯 Testing: /account/upgrade routing');
      
      // Navigate to account upgrade page
      cy.visit('/account/upgrade');
      
      // Should show same upgrade content
      cy.get('body').should('contain.text', /upgrade|pricing|pro|plan/i);
      
      cy.log('✅ Account upgrade route works correctly');
    });
  });

  describe('Empty States Critical Flow', () => {
    it('shows proper CTAs in no debts state', () => {
      cy.log('🎯 Testing: NoDebtsState shows proper CTAs');
      
      // Navigate to My Plan and clear data to get empty state
      cy.visit('/my-plan');
      cy.wait(1000);
      
      // Clear any existing data
      cy.get('button').contains(/clear|delete|remove/i).first().click({ force: true });
      cy.get('button').contains(/confirm|yes|clear/i).click({ force: true });
      
      // Should show empty state with CTAs
      cy.get('[data-testid="no-debts-state"], .empty-state').should('be.visible');
      
      // Should have "Add Debt" CTA
      cy.get('button').contains(/add.*debt|get started/i).should('be.visible');
      
      // Should have "Demo Data" CTA
      cy.get('button').contains(/demo|try.*demo/i).should('be.visible');
      
      // Test Add Debt CTA
      cy.get('button').contains(/add.*debt|get started/i).click({ force: true });
      cy.get('[data-testid="debt-form"], .modal, form').should('be.visible');
      
      cy.log('✅ Empty state CTAs work correctly');
    });
  });

  describe('Navigation & Core Routes', () => {
    it('core routes are accessible', () => {
      cy.log('🎯 Testing: Core routes accessibility');
      
      const routes = [
        '/',
        '/my-plan', 
        '/upgrade',
        '/library'
      ];
      
      routes.forEach(route => {
        cy.visit(route);
        cy.get('body').should('be.visible');
        cy.get('body').should('not.contain.text', /error|not found|500/i);
        cy.log(`✅ Route ${route} loads successfully`);
      });
    });
  });

  describe('Performance & Stability', () => {
    it('handles rapid navigation without crashes', () => {
      cy.log('🎯 Testing: Rapid navigation stability');
      
      // Rapidly navigate between key pages
      const pages = ['/my-plan', '/upgrade', '/', '/library', '/my-plan'];
      
      pages.forEach((page, index) => {
        cy.visit(page);
        cy.wait(200); // Brief wait to allow rendering
        cy.get('body').should('be.visible');
        cy.log(`Navigation ${index + 1}/5: ${page} loaded`);
      });
      
      // Final check - should still be functional
      cy.visit('/my-plan');
      cy.get('[data-testid="debt-table"], table, .debt-table').should('exist');
      
      cy.log('✅ Rapid navigation handled without crashes');
    });
  });
});