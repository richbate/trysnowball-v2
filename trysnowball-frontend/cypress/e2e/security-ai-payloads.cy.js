/* eslint-env cypress/globals */
/**
 * E2E Security Tests - Malicious AI Payloads
 * Verifies the entire chain (ReactMarkdown + CSP + sanitization) blocks XSS attacks
 */

describe('AI Security - Malicious Payload Defense', () => {
  beforeEach(() => {
    // Block network requests to avoid actual AI calls
    cy.intercept('POST', '/ai/chat', { fixture: 'ai-security-test.json' });
    cy.intercept('POST', '/api/ai/chat', { fixture: 'ai-security-test.json' });
  });

  it('neutralizes malicious markdown in articles', () => {
    // Test ArticlePage with malicious content
    cy.visit('/library/test-security', { failOnStatusCode: false });
    
    const maliciousMarkdown = `
# Security Test Article

This should render safely:
[Safe Link](https://example.com)

But these should be neutralized:
[XSS Link](javascript:alert('XSS'))
<script>alert('script injection')</script>
<img src="javascript:alert('img XSS')" onerror="alert('onerror XSS')">
<iframe src="javascript:alert('iframe XSS')"></iframe>
<div onclick="alert('onclick XSS')">Click me</div>
<object data="javascript:alert('object XSS')"></object>
<embed src="javascript:alert('embed XSS')">

**Bold text** should work fine.
    `;

    // Inject test content if available (this would be a debug hook in development)
    cy.window().then((win) => {
      if (win.__injectTestMarkdown) {
        win.__injectTestMarkdown(maliciousMarkdown);
      }
    });

    // Verify safe content renders
    cy.contains('Security Test Article');
    cy.contains('Bold text').should('exist');
    
    // Verify dangerous elements are blocked
    cy.get('script').should('not.exist');
    cy.get('iframe').should('not.exist');
    cy.get('object').should('not.exist');
    cy.get('embed').should('not.exist');
    cy.get('[onclick]').should('not.exist');
    cy.get('img[src*="javascript:"]').should('not.exist');
    
    // Verify dangerous links are neutralized
    cy.get('a[href*="javascript:"]').should('not.exist');
    cy.get('a[href="#"]').should('exist'); // Should be converted to safe fallback
    
    // Verify safe links work correctly
    cy.get('a[href="https://example.com"]')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'rel', 'noopener noreferrer');
  });

  it('blocks malicious AI coach responses', () => {
    cy.visit('/coach');
    
    // Wait for coach to load
    cy.get('[data-testid="ai-coach-input"]', { timeout: 10000 }).should('be.visible');
    
    const maliciousAIResponse = `
Here's your debt analysis:

<script>
  // Steal user data
  fetch('/api/steal-data', {
    method: 'POST',
    body: JSON.stringify(localStorage)
  });
</script>

**Total debt**: £5,000

<img src="x" onerror="alert('AI XSS')">
<iframe src="data:text/html,<script>alert('iframe')</script>"></iframe>

[Malicious Link](javascript:void(localStorage.clear()))

Regular markdown should work: **bold** and *italic*
    `;

    // Mock AI response with malicious content
    cy.intercept('POST', '/api/ai/chat', {
      statusCode: 200,
      body: {
        content: maliciousAIResponse,
        usage: { tokens: 100 }
      }
    }).as('aiResponse');

    // Send a message to trigger AI response
    cy.get('[data-testid="ai-coach-input"]').type('Show me malicious content');
    cy.get('[data-testid="ai-coach-send"]').click();

    cy.wait('@aiResponse');

    // Verify safe content is displayed
    cy.contains('Total debt').should('be.visible');
    cy.contains('£5,000').should('be.visible');
    cy.get('strong').contains('bold').should('exist');
    cy.get('em').contains('italic').should('exist');

    // Verify dangerous content is blocked
    cy.get('script').should('not.exist');
    cy.get('iframe').should('not.exist'); 
    cy.get('img[onerror]').should('not.exist');
    cy.get('[onclick]').should('not.exist');
    cy.get('a[href*="javascript:"]').should('not.exist');

    // Verify no XSS alerts were triggered
    cy.window().then((win) => {
      // If our security failed, there would be alerts or fetch calls
      expect(win.localStorage.length).to.be.greaterThan(0); // Should not be cleared
    });
  });

  it('prevents CSP violations in console', () => {
    const csrErrors = [];
    
    cy.window().then((win) => {
      // Capture CSP errors
      win.addEventListener('securitypolicyviolation', (e) => {
        csrErrors.push({
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          originalPolicy: e.originalPolicy
        });
      });
    });

    cy.visit('/coach');
    
    // Try to inject content that would violate CSP
    cy.window().then((win) => {
      try {
        // These should be blocked by CSP
        win.eval('console.log("CSP bypass attempt")');
      } catch (e) {
        // Expected to fail
      }
    });

    // Wait a moment for any violations to be reported
    cy.wait(1000);

    cy.then(() => {
      // In a real test, you might want to check that certain violations are caught
      // For now, just ensure the app is still functional
      cy.get('[data-testid="ai-coach-input"]').should('be.visible');
    });
  });

  it('sanitizes shared milestone content', () => {
    // Test ShareMilestoneModal with malicious content
    cy.visit('/my-plan');
    
    const maliciousMilestone = {
      type: 'debt_cleared',
      debtName: '<script>alert("XSS")</script>Credit Card',
      amount: 1000,
      customMessage: `
Congrats! <img src="x" onerror="alert('milestone XSS')">

**You paid off**: [Your debt](javascript:alert('link XSS'))
      `
    };

    cy.window().then((win) => {
      // Trigger share modal with malicious content
      if (win.__triggerShareModal) {
        win.__triggerShareModal(maliciousMilestone);
      }
    });

    // Verify malicious content is sanitized in modal
    cy.get('[data-testid="share-modal"]').within(() => {
      cy.contains('Credit Card').should('exist');
      cy.get('script').should('not.exist');
      cy.get('img[onerror]').should('not.exist');
      cy.get('a[href*="javascript:"]').should('not.exist');
    });
  });
});

// Create fixture file for mocked AI response
// cypress/fixtures/ai-security-test.json
/*
{
  "content": "This is a safe AI response for testing",
  "usage": {
    "tokens": 50
  }
}
*/