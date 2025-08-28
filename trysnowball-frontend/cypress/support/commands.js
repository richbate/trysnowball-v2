// cypress/support/commands.js

// Deterministic debt seeding for consistent test states
Cypress.Commands.add('seedDebts', (debts) => {
  cy.window().then((win) => {
    // Clear all relevant storage first
    win.localStorage.clear();
    win.sessionStorage.clear();
    
    // Disable demo mode flag
    win.localStorage.setItem('SNOWBALL_DEMO_FLAG', 'false');
    
    // Set deterministic debts (use the actual storage key from your app)
    const storageKey = 'snowball:debts'; // Adjust to match your actual key
    win.localStorage.setItem(storageKey, JSON.stringify(debts));
    
    // Set a user context so app doesn't redirect to onboarding
    win.localStorage.setItem('snowball:user', JSON.stringify({
      id: 'test-user',
      email: 'test@cypress.io',
      created_at: new Date().toISOString()
    }));
    
    // Ensure clean state
    win.localStorage.setItem('snowball:settings', JSON.stringify({
      theme: 'light',
      currency: 'GBP'
    }));
  });
});

// Clear all app state for clean test starts
Cypress.Commands.add('cleanAppState', () => {
  cy.window().then((win) => {
    // Clear localStorage with app-specific prefixes
    Object.keys(win.localStorage).forEach(key => {
      if (key.startsWith('snowball:') || 
          key.startsWith('trysnowball-') ||
          key.includes('debt') ||
          key === 'SNOWBALL_DEMO_FLAG') {
        win.localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    win.sessionStorage.clear();
    
    // Clear IndexedDB if your app uses it
    if (win.indexedDB) {
      // This is async but Cypress handles it
      const deleteReq = win.indexedDB.deleteDatabase('snowball-debt-store');
      deleteReq.onsuccess = () => console.log('[Cypress] IndexedDB cleared');
    }
  });
});

// Set demo mode with specific profile
Cypress.Commands.add('enterDemoMode', (profile = 'default') => {
  cy.window().then((win) => {
    win.sessionStorage.setItem('DEMO_MODE', 'true');
    win.sessionStorage.setItem('DEMO_PROFILE', profile);
  });
});

// Helper to click first available element from multiple selectors
Cypress.Commands.add('clickFirst', (selectors) => {
  const joined = Array.isArray(selectors) ? selectors.join(', ') : selectors;
  cy.get('body').then(($body) => {
    const $el = $body.find(joined);
    if ($el.length) {
      cy.wrap($el.first()).click({ force: true });
    } else {
      cy.get(joined).first().click({ force: true });
    }
  });
});

// Wait for React to settle (useful for state changes)
Cypress.Commands.add('waitForReact', (timeout = 1000) => {
  cy.wait(100); // Initial buffer
  cy.get('body').should('be.visible'); // Ensure DOM is ready
  cy.wait(timeout); // Allow React state to settle
});