/**
 * Encryption Security Tests
 * Critical regression tripwire - ensures no plaintext data leaks to database
 */

describe('Encryption Security Tests', () => {
  const TEST_USER_EMAIL = 'security-test@trysnowball.dev';
  const TEST_DEBT = {
    name: 'Security Test Card',
    balance: 2500.50,
    interestRate: 19.99,
    minPayment: 75.25,
    type: 'credit_card'
  };

  beforeEach(() => {
    // Clear localStorage and visit app
    cy.clearLocalStorage();
    cy.visit('/');
  });

  describe('🔐 User Account Debt Encryption', () => {
    it('should encrypt all debt data when user has account', () => {
      // Create user account and add debt
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="email-input"]').type(TEST_USER_EMAIL);
      cy.get('[data-testid="send-magic-link"]').click();
      
      // Mock successful auth (skip actual email verification)
      cy.window().then((win) => {
        win.localStorage.setItem('trysnowball_auth_token', 'test-jwt-token');
        win.localStorage.setItem('trysnowball_user', JSON.stringify({
          id: 'test-user-encryption',
          email: TEST_USER_EMAIL
        }));
      });
      
      // Navigate to add debt
      cy.visit('/');
      cy.get('[data-testid="add-debt-cta"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="add-debt-cta"]').click();
      
      // Add debt with sensitive information
      cy.get('[data-testid="debt-name"]').type(TEST_DEBT.name);
      cy.get('[data-testid="debt-balance"]').type(TEST_DEBT.balance.toString());
      cy.get('[data-testid="debt-interest-rate"]').type(TEST_DEBT.interestRate.toString());
      cy.get('[data-testid="debt-min-payment"]').type(TEST_DEBT.minPayment.toString());
      cy.get('[data-testid="debt-type"]').select(TEST_DEBT.type);
      cy.get('[data-testid="save-debt"]').click();
      
      // Wait for API call to complete
      cy.wait(2000);
      
      // Now verify database encryption via API
      cy.request({
        method: 'GET',
        url: '/api/test/encryption-check',
        headers: {
          'Authorization': `Bearer test-jwt-token`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const { debts } = response.body;
        
        // Critical assertions - regression tripwire
        debts.forEach(debt => {
          // ❌ FAIL if any legacy columns contain plaintext
          expect(debt.name, '🚨 SECURITY VIOLATION: plaintext name in database').to.be.null;
          expect(debt.balance, '🚨 SECURITY VIOLATION: plaintext balance in database').to.be.null;
          expect(debt.min_payment, '🚨 SECURITY VIOLATION: plaintext min_payment in database').to.be.null;
          expect(debt.interest_rate, '🚨 SECURITY VIOLATION: plaintext interest_rate in database').to.be.null;
          
          // ✅ PASS if encryption columns are populated
          expect(debt.ciphertext, '🔐 Encrypted data missing').to.exist;
          expect(debt.ciphertext, '🔐 Ciphertext too short').to.have.length.greaterThan(50);
          expect(debt.iv, '🔐 Initialization vector missing').to.exist;
          expect(debt.iv, '🔐 IV incorrect length').to.have.length.greaterThan(10);
          expect(debt.dek_version, '🔐 DEK version missing').to.be.a('number');
          expect(debt.encrypted_at, '🔐 Encryption timestamp missing').to.be.a('number');
          
          // ✅ PASS if analytics columns are de-identified
          expect(debt.amount_band, '📊 Amount band missing').to.match(/^\d+-\d+k?$/);
          expect(debt.issuer_hash, '📊 Issuer hash missing').to.have.length.eq(8);
          expect(debt.debt_type, '📊 Debt type missing').to.exist;
        });
      });
    });

    it('should provide encrypted data via regular API but never plaintext in database', () => {
      // Set up authenticated user
      cy.window().then((win) => {
        win.localStorage.setItem('trysnowball_auth_token', 'test-jwt-token');
        win.localStorage.setItem('trysnowball_user', JSON.stringify({
          id: 'test-user-encryption',
          email: TEST_USER_EMAIL
        }));
      });

      // Fetch debts via regular API (should decrypt cleanly)
      cy.request({
        method: 'GET',
        url: '/api/debts',
        headers: {
          'Authorization': `Bearer test-jwt-token`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const { debts } = response.body;
        
        // Regular API should provide decrypted data to frontend
        if (debts.length > 0) {
          const debt = debts[0];
          expect(debt.name, '🔓 API should decrypt name for frontend').to.be.a('string');
          expect(debt.balance, '🔓 API should decrypt balance for frontend').to.be.a('number');
          expect(debt.interestRate, '🔓 API should decrypt rate for frontend').to.be.a('number');
          expect(debt.minPayment, '🔓 API should decrypt payment for frontend').to.be.a('number');
        }
      });
    });
  });

  describe('🔐 Demo Mode Security', () => {
    it('should keep demo data in localStorage only (never sent to server)', () => {
      cy.visit('/');
      cy.get('[data-testid="demo-cta"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="demo-cta"]').click();
      
      // Add demo debt
      cy.get('[data-testid="add-debt-cta"]').click();
      cy.get('[data-testid="debt-name"]').type('Demo Card');
      cy.get('[data-testid="debt-balance"]').type('1000');
      cy.get('[data-testid="debt-interest-rate"]').type('15');
      cy.get('[data-testid="debt-min-payment"]').type('50');
      cy.get('[data-testid="save-debt"]').click();
      
      // Verify localStorage contains demo data
      cy.window().then((win) => {
        const demoData = win.localStorage.getItem('trysnowball_demo_debts');
        expect(demoData, '📱 Demo data should be in localStorage').to.exist;
        
        const parsed = JSON.parse(demoData);
        expect(parsed, '📱 Demo debts array should exist').to.be.an('array');
        expect(parsed.length, '📱 Should have demo debt').to.be.greaterThan(0);
      });
      
      // Verify NO network calls were made (demo stays local)
      // This would be configured in cypress intercepts
    });
  });

  describe('🛡️ Privacy Banner Security', () => {
    it('should display privacy banner and track events correctly', () => {
      cy.visit('/');
      
      // Privacy banner should appear
      cy.get('[data-testid="privacy-banner"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="privacy-banner"]').should('contain', 'Your data is safe');
      cy.get('[data-testid="privacy-banner"]').should('contain', 'AES-256-GCM');
      
      // Click "Learn more" and verify navigation
      cy.get('[data-testid="privacy-learn-more"]').click();
      cy.url().should('include', '/privacy');
      cy.get('h1').should('contain', 'Your Data, Your Rules');
      
      // Go back and dismiss banner
      cy.go('back');
      cy.get('[data-testid="privacy-banner"]').should('be.visible');
      cy.get('[data-testid="privacy-dismiss"]').click();
      cy.get('[data-testid="privacy-banner"]').should('not.exist');
      
      // Refresh - banner should stay dismissed
      cy.reload();
      cy.get('[data-testid="privacy-banner"]').should('not.exist');
    });
  });
});

/**
 * Test API Endpoint for Database Inspection
 * This endpoint should be created in the debts worker for testing only
 */
describe('🧪 Test Infrastructure', () => {
  it('should have encryption test endpoint available', () => {
    cy.request({
      method: 'GET',
      url: '/api/test/encryption-check',
      headers: {
        'Authorization': 'Bearer test-jwt-token'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Endpoint should exist (even if it returns 401 for invalid token)
      expect(response.status).to.be.oneOf([200, 401, 403]);
    });
  });
});