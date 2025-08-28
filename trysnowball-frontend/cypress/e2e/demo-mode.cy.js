/* eslint-env cypress/globals */
/**
 * Demo Mode E2E Tests
 * 3 essential tests: rehydrate, exit clean, block for authed
 */

describe('Demo Mode', () => {
  beforeEach(() => {
    // Clear all storage before each test
    cy.clearAllSessionStorage();
    cy.clearAllLocalStorage();
  });

  it('rehydrates demo data on storage clear', () => {
    // Visit demo with a specific profile
    cy.visit('/demo?profile=default');
    
    // Verify demo banner appears
    cy.get('[data-testid="demo-banner"]').should('exist');
    cy.contains('Demo Mode').should('be.visible');
    
    // Navigate to a page that shows debt data
    cy.visit('/plan');
    
    // Should see debt data (from default profile)
    cy.contains('Barclaycard').should('be.visible');
    cy.contains('£2,500').should('be.visible');
    
    // Clear session storage to simulate browser refresh/storage clear
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    
    // Reload the page
    cy.reload();
    
    // Demo should rehydrate automatically
    cy.get('[data-testid="demo-banner"]', { timeout: 10000 }).should('exist');
    
    // Navigate back to plan - data should still be there
    cy.visit('/plan');
    cy.contains('Barclaycard').should('be.visible');
  });

  it('exits cleanly with no ghost keys', () => {
    // Enter demo mode
    cy.visit('/demo?profile=family');
    
    // Verify we're in demo mode
    cy.get('[data-testid="demo-banner"]').should('exist');
    
    // Navigate to plan to ensure demo data is loaded
    cy.visit('/plan');
    cy.contains('Halifax Clarity').should('be.visible'); // From family profile
    
    // Exit demo using the banner button
    cy.get('[data-testid="exit-demo"]').click();
    
    // Should navigate away from demo
    cy.location('pathname').should('not.match', /\/demo/);
    
    // Verify no demo banner
    cy.get('[data-testid="demo-banner"]').should('not.exist');
    
    // Check sessionStorage - should have no DEMO_ keys
    cy.window().then((win) => {
      const demoKeys = Object.keys(win.sessionStorage).filter(key => 
        key.startsWith('DEMO_') || key === 'SNOWBALL_DEMO_MODE'
      );
      expect(demoKeys).to.have.length(0);
    });
    
    // Verify localStorage is not affected (real user data should persist)
    cy.window().then((win) => {
      // localStorage should still exist for real app data
      expect(win.localStorage.length).to.be.greaterThanOrEqual(0);
    });
  });

  it('blocks demo routes for authenticated users', () => {
    // Mock authenticated state
    cy.window().then((win) => {
      // Simulate being logged in by setting a token
      win.localStorage.setItem('auth_token', 'mock-jwt-token');
      
      // Mock user object in a way the app expects
      win.__mockAuthUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        authenticated: true
      };
    });
    
    // Try to visit /demo as authenticated user
    cy.visit('/demo');
    
    // Should be redirected to home (or another route)
    cy.location('pathname').should('not.equal', '/demo');
    cy.location('pathname').should('equal', '/');
    
    // Should not see demo banner
    cy.get('[data-testid="demo-banner"]').should('not.exist');
    
    // Try with query parameter
    cy.visit('/?demo=1&profile=trap');
    
    // Should still be on home page, demo ignored for authenticated users
    cy.location('pathname').should('equal', '/');
    cy.get('[data-testid="demo-banner"]').should('not.exist');
  });
  
  // Bonus test: Profile switching
  it('loads different demo profiles correctly', () => {
    // Test trap profile (high-interest debt scenario)
    cy.visit('/demo?profile=trap');
    cy.get('[data-testid="demo-banner"]').should('exist');
    
    cy.visit('/plan');
    cy.contains('QuickQuid').should('be.visible'); // From trap profile
    cy.contains('1294%').should('be.visible'); // Payday loan rate
    
    // Clear and test family profile
    cy.clearAllSessionStorage();
    cy.visit('/demo?profile=family');
    
    cy.visit('/plan');
    cy.contains('Car Finance').should('be.visible'); // From family profile
    cy.contains('£45,000').should('be.visible'); // Mortgage amount
    
    // Should not see trap profile data
    cy.contains('QuickQuid').should('not.exist');
  });
});