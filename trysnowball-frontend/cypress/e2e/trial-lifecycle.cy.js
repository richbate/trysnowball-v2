/**
 * End-to-end validation for trial start/stop banner lifecycle
 * Tests banner visibility, countdown logic, and analytics events
 * 
 * Key test scenarios:
 * 1. Trial started → banner appears with correct countdown
 * 2. Advance to near-expiry → warning states
 * 3. Advance to post-expiry → expired state
 * 4. Route changes preserve banner state
 * 5. Analytics events fire correctly (when consent enabled)
 */

describe('Trial Lifecycle Banner E2E', () => {
  let clock;

  beforeEach(() => {
    // Intercept PostHog requests to track analytics
    cy.intercept('POST', 'https://eu.posthog.com/**', {
      statusCode: 200,
      body: { status: 'ok' }
    }).as('posthogEvent');

    // Mock auth context with trial user
    cy.window().then((win) => {
      // Set up user data in localStorage or context
      win.localStorage.setItem('trysnowball_auth_token', 'mock-jwt-token');
      win.localStorage.setItem('ts_user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        hasUsedTrial: true,
        trialEndsAt: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString(), // 3 days from now
        isPro: true
      }));
    });

    // Setup clock at a fixed time for consistent testing
    const now = new Date('2024-01-15T12:00:00Z');
    clock = cy.clock(now, ['Date', 'setInterval', 'clearInterval']);
    
    cy.visit('/');
  });

  afterEach(() => {
    if (clock) {
      clock.restore();
    }
  });

  describe('Active Trial State (3 days left)', () => {
    it('shows trial banner with correct countdown and info styling', () => {
      // Banner should be visible with blue info styling
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      cy.get('[data-testid="trial-banner"]').should('have.class', 'bg-blue-50');
      
      // Should show days remaining
      cy.get('[data-testid="trial-banner"]').should('contain', 'Trial - 3 days left');
      cy.get('[data-testid="trial-banner"]').should('contain', '🎉');
      
      // Should have correct CTA
      cy.get('[data-testid="trial-upgrade-btn"]').should('contain', 'Keep Pro');
      cy.get('[data-testid="trial-dismiss-btn"]').should('be.visible');

      // Crown icon for active trial
      cy.get('[data-testid="trial-icon"]').should('contain.html', 'crown');
    });

    it('tracks trial_banner_viewed event on load', () => {
      // PostHog should capture banner view
      cy.wait('@posthogEvent').then((interception) => {
        const body = interception.request.body;
        expect(body).to.have.property('event', 'trial_banner_viewed');
        expect(body.properties).to.include({
          trial_status: 'active',
          days_left: 3
        });
      });
    });

    it('preserves banner state across route changes', () => {
      // Navigate to different pages via URL
      cy.visit('/my-plan/debts');
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      
      cy.visit('/library');  
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      
      cy.visit('/');
      cy.get('[data-testid="trial-banner"]').should('be.visible');
    });
  });

  describe('Warning State (2 days left)', () => {
    beforeEach(() => {
      // Advance clock by 1 day
      clock.tick(24 * 60 * 60 * 1000);
      cy.reload();
    });

    it('shows warning styling and countdown', () => {
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      cy.get('[data-testid="trial-banner"]').should('have.class', 'bg-yellow-50');
      
      // Should show warning messaging
      cy.get('[data-testid="trial-banner"]').should('contain', '⏰');
      cy.get('[data-testid="trial-banner"]').should('contain', 'Trial - 2 days left');
      
      // Clock icon for warning
      cy.get('[data-testid="trial-icon"]').should('contain.html', 'clock');
    });
  });

  describe('Urgent State (1 day left)', () => {
    beforeEach(() => {
      // Advance clock by 2 days
      clock.tick(2 * 24 * 60 * 60 * 1000);
      cy.reload();
    });

    it('shows urgent styling and countdown', () => {
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      cy.get('[data-testid="trial-banner"]').should('have.class', 'bg-orange-50');
      
      // Should show urgent messaging
      cy.get('[data-testid="trial-banner"]').should('contain', '⚡');
      cy.get('[data-testid="trial-banner"]').should('contain', 'ends tomorrow');
      
      // Alert triangle icon for urgent
      cy.get('[data-testid="trial-icon"]').should('contain.html', 'alert-triangle');
    });
  });

  describe('Hours Remaining State (same day)', () => {
    beforeEach(() => {
      // Advance to within hours of expiry
      clock.tick(2 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000); // 2 days + 20 hours
      cy.reload();
    });

    it('shows hours countdown when less than 24h left', () => {
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      cy.get('[data-testid="trial-banner"]').should('contain', 'in 4 hours');
    });
  });

  describe('Expired State', () => {
    beforeEach(() => {
      // Advance clock past expiry
      clock.tick(4 * 24 * 60 * 60 * 1000);
      cy.reload();
    });

    it('shows expired styling and messaging', () => {
      cy.get('[data-testid="trial-banner"]').should('be.visible');
      cy.get('[data-testid="trial-banner"]').should('have.class', 'bg-red-50');
      
      // Should show expired messaging
      cy.get('[data-testid="trial-banner"]').should('contain', 'Your Pro trial has ended');
      cy.get('[data-testid="trial-upgrade-btn"]').should('contain', 'Upgrade Now');
      
      // No dismiss button for expired state
      cy.get('[data-testid="trial-dismiss-btn"]').should('not.exist');
      
      // X icon for expired
      cy.get('[data-testid="trial-icon"]').should('contain.html', 'x');
    });
  });

  describe('User Interactions', () => {
    it('tracks upgrade click and navigates to upgrade page', () => {
      cy.get('[data-testid="trial-upgrade-btn"]').click();
      
      // Should track analytics event
      cy.wait('@posthogEvent').then((interception) => {
        const body = interception.request.body;
        expect(body).to.have.property('event', 'trial_banner_upgrade_clicked');
        expect(body.properties).to.include({
          trial_status: 'active',
          banner_type: 'info'
        });
      });
      
      // Should navigate to upgrade page
      cy.url().should('include', '/upgrade');
    });

    it('allows dismissing banner and tracks dismiss event', () => {
      cy.get('[data-testid="trial-dismiss-btn"]').click();
      
      // Should track dismiss event
      cy.wait('@posthogEvent').then((interception) => {
        const body = interception.request.body;
        expect(body).to.have.property('event', 'trial_banner_dismissed');
      });
      
      // Banner should disappear
      cy.get('[data-testid="trial-banner"]').should('not.exist');
    });

    it('respects analytics consent settings', () => {
      // Set analytics consent to false
      cy.window().then((win) => {
        win.localStorage.setItem('analytics_opt_in', 'false');
      });
      
      cy.reload();
      
      // Click upgrade button
      cy.get('[data-testid="trial-upgrade-btn"]').click();
      
      // Should NOT send PostHog events when consent is off
      cy.get('@posthogEvent.all').should('have.length', 0);
    });
  });

  describe('Edge Cases', () => {
    it('handles user login/logout during trial', () => {
      // Simulate logout by clearing localStorage
      cy.window().then((win) => {
        win.localStorage.removeItem('trysnowball_auth_token');
        win.localStorage.removeItem('ts_user');
      });
      cy.reload();
      
      // Banner should not show when logged out
      cy.get('[data-testid="trial-banner"]').should('not.exist');
    });

    it('handles missing trial data gracefully', () => {
      // Set user without trial data
      cy.window().then((win) => {
        win.localStorage.setItem('ts_user', JSON.stringify({
          id: 'test-user-123',
          email: 'test@example.com',
          hasUsedTrial: false,
          isPro: false
        }));
      });
      
      cy.reload();
      
      // Banner should not show
      cy.get('[data-testid="trial-banner"]').should('not.exist');
    });

    it('updates countdown on clock tick (every minute)', () => {
      // Get initial countdown text
      cy.get('[data-testid="trial-banner"]').should('contain', 'Trial - 3 days left');
      
      // Advance time by 2 hours
      clock.tick(2 * 60 * 60 * 1000);
      
      // Should still show 3 days (not sensitive to hours)
      cy.get('[data-testid="trial-banner"]').should('contain', 'Trial - 3 days left');
      
      // Advance by 23 more hours (total 25 hours = 1 day + 1 hour)
      clock.tick(23 * 60 * 60 * 1000);
      
      // Should now show 2 days left
      cy.get('[data-testid="trial-banner"]').should('contain', 'Trial - 2 days left');
    });
  });

  describe('Midnight UTC Edge Case', () => {
    it('calculates countdown correctly across midnight UTC', () => {
      // Set trial to end at midnight UTC tomorrow
      const tomorrowMidnight = new Date();
      tomorrowMidnight.setUTCDate(tomorrowMidnight.getUTCDate() + 1);
      tomorrowMidnight.setUTCHours(0, 0, 0, 0);
      
      cy.window().then((win) => {
        win.localStorage.setItem('ts_user', JSON.stringify({
          id: 'test-user-123',
          email: 'test@example.com',
          hasUsedTrial: true,
          trialEndsAt: tomorrowMidnight.toISOString(),
          isPro: true
        }));
      });
      
      // Set current time to 23:30 UTC today
      const now = new Date(tomorrowMidnight.getTime() - 30 * 60 * 1000); // 30 minutes before midnight
      clock.restore();
      clock = cy.clock(now, ['Date', 'setInterval', 'clearInterval']);
      
      cy.reload();
      
      // Should show hours remaining
      cy.get('[data-testid="trial-banner"]').should('contain', 'in 1h');
    });
  });
});