// cypress/support/e2e.js
import './commands';

// Stub analytics to prevent network flakes and external dependencies
Cypress.on('window:before:load', (win) => {
  // Stub PostHog
  win.posthog = {
    capture: cy.stub().as('phCapture'),
    identify: cy.stub().as('phIdentify'),
    init: cy.stub().as('phInit'),
    people: { set: cy.stub() },
    register: cy.stub(),
    reset: cy.stub()
  };
  
  // Stub generic analytics
  win.analytics = {
    track: cy.stub().as('analyticsTrack'),
    identify: cy.stub().as('analyticsIdentify'),
    page: cy.stub().as('analyticsPage')
  };
  
  // Stub GA/gtag if present
  win.gtag = cy.stub().as('gtag');
  win.ga = cy.stub().as('ga');
  
  // Prevent external script loading
  win.dataLayer = [];
});

// Network request interceptor for API stability
beforeEach(() => {
  // Intercept and allow known endpoints, block unexpected ones
  cy.intercept({ url: '**/api/**', middleware: true }, (req) => {
    const allowedEndpoints = [
      /\/api\/health$/,
      /\/api\/me$/,
      /\/api\/account\/entitlement$/,
      /\/api\/auth\//,
      /\/api\/debts/,
      /\/api\/analytics/
    ];
    
    const isAllowed = allowedEndpoints.some(pattern => pattern.test(req.url));
    if (!isAllowed) {
      console.warn(`[Cypress] Blocking unexpected API call: ${req.url}`);
      req.destroy();
    }
  }).as('apiGuard');
  
  // Stub external analytics endpoints to prevent flakes
  cy.intercept('POST', '**/collect*', { statusCode: 200, body: { success: true } }).as('analyticsCollect');
  cy.intercept('POST', '**/batch*', { statusCode: 200, body: { success: true } }).as('analyticsBatch');
  cy.intercept('POST', '**/track*', { statusCode: 200, body: { success: true } }).as('analyticsTrack');
});