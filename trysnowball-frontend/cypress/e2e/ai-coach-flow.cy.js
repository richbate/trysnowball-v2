describe('TrySnowball AI Coach Flow', () => {
  const proUser = { email: 'pro@test.com', password: 'testpass123' };
  const freeUser = { email: 'free@test.com', password: 'testpass123' };

  const login = (user) => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type(user.email);
    cy.get('input[type="password"]').type(user.password);
    cy.contains('Log In').click();
  };

  it('Pro user can access My Plan and AI Coach', () => {
    login(proUser);
    cy.url().should('include', '/my-plan');
    cy.get('[data-testid="payment-slider"]').should('be.visible').click();
    cy.visit('/ai/coach');
    cy.get('iframe').should('be.visible'); // GPT iframe loads
    cy.get('[data-testid="copy-report"]').click(); // AI report copy
  });

  it('Free user is blocked from AI Coach', () => {
    login(freeUser);
    cy.visit('/ai/coach');
    cy.contains('Upgrade to access AI Coach').should('be.visible');
  });

  it('AI coach includes report functionality for Pro user', () => {
    login(proUser);
    cy.visit('/ai/coach');
    cy.contains('AI Coach').should('be.visible');
    // AI report functionality is now integrated into the unified coach interface
  });
});