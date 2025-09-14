/* eslint-disable no-undef */
/**
 * Smoke Test - Just verify app loads without crashing
 */

describe('Smoke Test', () => {
  it('loads without JavaScript errors', () => {
    // Listen for uncaught exceptions
    cy.window().then((win) => {
      win.addEventListener('error', (e) => {
        throw new Error(`JavaScript error: ${e.message}`);
      });
      
      win.addEventListener('unhandledrejection', (e) => {
        throw new Error(`Unhandled promise rejection: ${e.reason}`);
      });
    });
    
    cy.visit('/', { timeout: 30000 });
    
    // Wait for React root to have content
    cy.get('#root', { timeout: 20000 }).should('not.be.empty');
    
    // Take a screenshot to see what rendered
    cy.screenshot('app-loaded');
    
    // Verify no error messages are visible
    cy.get('body').should('not.contain.text', 'JS Error');
    cy.get('body').should('not.contain.text', 'Something went wrong');
  });
  
  it('can visit basic routes', () => {
    const routes = ['/', '/plan', '/library'];
    
    routes.forEach(route => {
      cy.visit(route);
      cy.get('#root', { timeout: 15000 }).should('not.be.empty');
      cy.get('body').should('not.contain.text', 'JS Error');
    });
  });
});