/**
 * Billing System Smoke Test
 * Verifies core billing API contract and user flows
 */

describe('Billing System Smoke Test', () => {
  
  it('unauthenticated user gets 401 with proper headers', () => {
    cy.request({
      url: '/auth/api/me/plan',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.headers).to.have.property('cache-control', 'no-store');
      expect(response.headers).to.have.property('access-control-allow-origin');
      expect(response.body).to.deep.equal({ error: 'Unauthorized' });
    });
  });

  it('plan endpoint contract (authenticated user)', () => {
    // This test requires user to be logged in
    // Skip if no session exists
    cy.request({
      url: '/api/me',
      failOnStatusCode: false
    }).then((meResponse) => {
      if (meResponse.body.user) {
        // User is logged in, test plan endpoint
        cy.request('/auth/api/me/plan').then((response) => {
          expect(response.status).to.eq(200);
          expect(response.headers).to.have.property('cache-control', 'no-store');
          
          // Contract validation
          expect(response.body).to.have.property('is_paid');
          expect(response.body).to.have.property('source');
          expect(typeof response.body.is_paid).to.eq('boolean');
          expect(typeof response.body.source).to.eq('string');
          expect(['beta', 'stripe', 'none']).to.include(response.body.source);
          
          // No PII should be present
          expect(response.body).to.not.have.property('email');
          expect(response.body).to.not.have.property('id');
          expect(response.body).to.not.have.property('user_id');
          
          cy.log(`✅ Plan check: is_paid=${response.body.is_paid}, source=${response.body.source}`);
        });
      } else {
        cy.log('⚠️ User not logged in, skipping authenticated plan test');
      }
    });
  });

  it('billing status determines UI features', () => {
    cy.visit('/');
    
    // Check if user is authenticated first
    cy.request({
      url: '/api/me',
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.user) {
        // User is logged in, check plan-based UI
        cy.request('/auth/api/me/plan').then((planResponse) => {
          const { is_paid, source } = planResponse.body;
          
          if (is_paid) {
            cy.log(`✅ Testing paid user UI (source: ${source})`);
            // Paid users should not see upgrade prompts on main features
            cy.get('body').should('not.contain', 'Upgrade to Pro');
          } else {
            cy.log('✅ Testing free user UI');
            // Free users should see upgrade prompts
            cy.get('body').should('contain', 'Upgrade to Pro').or('not.exist');
          }
          
          if (source === 'beta') {
            cy.log('✅ Testing beta user UI');
            // Beta users might have special indicators
            // (This is optional based on UI design)
          }
        });
      } else {
        cy.log('⚠️ User not authenticated, testing public UI');
        cy.get('body').should('contain', 'Sign In').or('contain', 'Get Started');
      }
    });
  });

});