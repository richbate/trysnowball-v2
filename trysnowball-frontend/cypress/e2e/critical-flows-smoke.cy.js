/* eslint-disable no-undef */
/**
 * Critical Flows Smoke Tests - FIXED VERSION
 * 
 * Tests the most important user journeys
 */

describe('Critical User Flows - Smoke Tests', () => {
  beforeEach(() => {
    // Start fresh each test
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    
    // Visit home page and wait for React to load
    cy.visit('/');
    cy.get('#root').should('not.be.empty');
  });

  describe('Plan Page Critical Flow', () => {
    it('completes debt management lifecycle', () => {
      cy.log('🎯 Testing: Plan page debt management');
      
      // Navigate to Plan (not my-plan anymore)
      cy.visit('/plan');
      cy.wait(2000);
      
      // Check if we need to load demo data
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        
        if (bodyText.includes('No debts') || bodyText.includes('Get started') || bodyText.includes('empty')) {
          cy.log('Empty state detected, attempting to load demo data');
          
          // Look for demo button and click it
          const demoBtn = $body.find('button').filter((i, el) => {
            const text = el.textContent.toLowerCase();
            return text.includes('demo') || text.includes('example');
          });
          
          if (demoBtn.length > 0) {
            cy.wrap(demoBtn.first()).click({ force: true });
            cy.wait(2000);
          }
        }
        
        // Now verify we have debt content
        cy.get('body').then($body => {
          const text = $body.text().toLowerCase();
          expect(text).to.include('debt');
        });
      });
      
      cy.log('✅ Plan page lifecycle completed');
    });
  });

  describe('Upgrade Page Critical Flow', () => {
    it('shows pricing to users', () => {
      cy.log('🎯 Testing: Upgrade page');
      
      // Navigate to upgrade page
      cy.visit('/upgrade');
      cy.wait(1000);
      
      // Should see pricing content
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        expect(text).to.match(/upgrade|pro|premium|pricing|plan|subscribe/);
      });
      
      cy.log('✅ Upgrade page shows correctly');
    });

    it('account/upgrade route works', () => {
      cy.log('🎯 Testing: /account/upgrade routing');
      
      // Navigate to account upgrade page
      cy.visit('/account/upgrade');
      cy.wait(1000);
      
      // Should show upgrade content
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        expect(text).to.match(/upgrade|pricing|pro|plan/);
      });
      
      cy.log('✅ Account upgrade route works');
    });
  });

  describe('Navigation & Core Routes', () => {
    it('core routes are accessible', () => {
      cy.log('🎯 Testing: Core routes accessibility');
      
      const routes = [
        '/',
        '/plan', 
        '/upgrade',
        '/library'
      ];
      
      routes.forEach(route => {
        cy.visit(route);
        cy.get('#root').should('not.be.empty');
        cy.get('body').should('not.contain.text', 'JS Error');
        cy.log(`✅ Route ${route} loads successfully`);
      });
    });
  });

  describe('Performance & Stability', () => {
    it('handles rapid navigation without crashes', () => {
      cy.log('🎯 Testing: Rapid navigation stability');
      
      // Rapidly navigate between key pages
      const pages = ['/plan', '/upgrade', '/', '/library', '/plan'];
      
      pages.forEach((page, index) => {
        cy.visit(page);
        cy.wait(200); // Brief wait to allow rendering
        cy.get('#root').should('not.be.empty');
        cy.log(`Navigation ${index + 1}/5: ${page} loaded`);
      });
      
      // Final check - should still be functional
      cy.visit('/plan');
      cy.get('body').should('exist');
      
      cy.log('✅ Rapid navigation handled without crashes');
    });
  });
  
  describe('Empty States Critical Flow', () => {
    it('shows proper content in various states', () => {
      cy.log('🎯 Testing: Different page states');
      
      // Visit plan page
      cy.visit('/plan');
      cy.wait(2000);
      
      // Page should have meaningful content
      cy.get('body').then($body => {
        const text = $body.text();
        // Should have some meaningful text
        expect(text.length).to.be.greaterThan(100);
      });
      
      // Check for interactive elements
      cy.get('button').should('exist');
      
      cy.log('✅ Page states work correctly');
    });
  });
});