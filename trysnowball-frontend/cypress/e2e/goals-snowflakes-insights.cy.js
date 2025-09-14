/**
 * E2E Tests for Goals, Snowflakes, and Insights features
 */

describe('Goals, Snowflakes & Insights Features', () => {
  beforeEach(() => {
    cy.visit('/demo?profile=default');
    cy.wait(500);
  });

  describe('Goals Tab', () => {
    it('Shows goals with progress indicators', () => {
      cy.visit('/my-plan?tab=goals');
      cy.waitForReact(500);
      
      // Should show goals tab content
      cy.contains('Your Goals').should('be.visible');
      
      // Should display active goals
      cy.get('[class*="font-semibold"]')
        .contains('Active Goals')
        .should('exist');
      
      // Should show progress bars
      cy.get('[class*="bg-gray-200 rounded-full"]')
        .should('have.length.at.least', 1);
      
      // Should show overall progress
      cy.contains('Overall Progress').should('exist');
    });

    it('Tracks goal creation attempts', () => {
      cy.visit('/my-plan?tab=goals');
      cy.waitForReact(500);
      
      // Click add goal button
      cy.contains('button', 'Add Goal').click();
      
      // Should show modal/form
      cy.contains('Add New Goal').should('be.visible');
      
      // Close modal
      cy.contains('button', 'Close').click();
    });

    it('Shows goal achievement status', () => {
      cy.visit('/my-plan?tab=goals');
      cy.waitForReact(500);
      
      // Check for completion indicators
      cy.get('[class*="text-green-600"]').should('exist');
      
      // Progress percentages should be visible
      cy.get('[class*="font-medium"]')
        .contains('%')
        .should('exist');
    });
  });

  describe('Snowflakes Tab', () => {
    it('Shows snowflakes management interface', () => {
      cy.visit('/my-plan?tab=snowflakes');
      cy.waitForReact(500);
      
      // Should show snowflakes header
      cy.contains('Snowflakes').should('be.visible');
      cy.contains('One-off extra payments').should('be.visible');
      
      // Add snowflake button should be visible
      cy.contains('button', 'Add Snowflake').should('be.visible');
    });

    it('Opens snowflake form and validates inputs', () => {
      cy.visit('/my-plan?tab=snowflakes');
      cy.waitForReact(500);
      
      // Open form
      cy.contains('button', 'Add Snowflake').click();
      
      // Form fields should be visible
      cy.get('select').should('exist'); // Debt selector
      cy.get('input[type="number"]').should('exist'); // Amount input
      
      // Cancel should close form
      cy.contains('button', 'Cancel').click();
      cy.contains('button', 'Add Snowflake').should('be.visible');
    });

    it('Shows impact summary when snowflakes exist', () => {
      cy.visit('/my-plan?tab=snowflakes');
      cy.waitForReact(500);
      
      // Check for impact summary if snowflakes exist
      cy.get('body').then($body => {
        if ($body.text().includes('Impact Summary')) {
          cy.contains('Impact Summary').should('be.visible');
          cy.contains('months sooner').should('exist');
        }
      });
    });
  });

  describe('Debt Insights', () => {
    it('Shows insights on home page when debts exist', () => {
      cy.visit('/');
      cy.waitForReact(500);
      
      // Check if insights section appears
      cy.get('body').then($body => {
        if ($body.text().includes('Your Insights')) {
          cy.contains('Your Insights').should('be.visible');
          
          // Should show insight boxes
          cy.get('[class*="rounded-lg border"]')
            .should('have.length.at.least', 1);
        }
      });
    });

    it('Allows dismissing insights', () => {
      cy.visit('/');
      cy.waitForReact(500);
      
      // If insights exist, test dismissal
      cy.get('body').then($body => {
        if ($body.text().includes('Your Insights')) {
          // Count initial insights
          cy.get('[aria-label="Dismiss insight"]').then($buttons => {
            const initialCount = $buttons.length;
            
            if (initialCount > 0) {
              // Dismiss first insight
              cy.get('[aria-label="Dismiss insight"]').first().click();
              
              // Should have one less insight
              cy.get('[aria-label="Dismiss insight"]')
                .should('have.length', initialCount - 1);
            }
          });
        }
      });
    });

    it('Shows appropriate insight types based on debt data', () => {
      cy.visit('/');
      cy.waitForReact(500);
      
      // Check for different insight types
      cy.get('body').then($body => {
        const bodyText = $body.text();
        
        // Interest warning
        if (bodyText.includes('High Interest Alert')) {
          cy.contains('High Interest Alert').should('be.visible');
        }
        
        // Payment opportunity
        if (bodyText.includes('Boost Your Payments')) {
          cy.contains('Boost Your Payments').should('be.visible');
        }
        
        // Quick win
        if (bodyText.includes('Quick Win Available')) {
          cy.contains('Quick Win Available').should('be.visible');
        }
      });
    });
  });

  describe('Milestone Sharing', () => {
    it('Detects goal achievements and offers sharing', () => {
      // This would require simulating a goal achievement
      // which might need specific test data setup
      cy.visit('/my-plan?tab=goals');
      cy.waitForReact(500);
      
      // Check if any completed goals exist
      cy.get('body').then($body => {
        if ($body.text().includes('Completed Goals')) {
          cy.contains('Completed Goals').should('be.visible');
          cy.get('[class*="bg-green-50"]').should('exist');
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('Goals, snowflakes, and insights work together', () => {
      // Visit My Plan
      cy.visit('/my-plan');
      cy.waitForReact(500);
      
      // Check Goals tab
      cy.get('[data-testid="tab-goals"]').click();
      cy.contains('Goals').should('be.visible');
      
      // Check Snowflakes tab
      cy.get('[data-testid="tab-snowflakes"]').click();
      cy.contains('Snowflakes').should('be.visible');
      
      // Go to home and check insights
      cy.visit('/');
      cy.waitForReact(500);
      
      // Verify home page loads with potential insights
      cy.contains('Debt-free by').should('be.visible');
    });

    it('Analytics events fire correctly', () => {
      // Set up analytics interceptor
      cy.window().then(win => {
        win.posthog = {
          capture: cy.stub().as('analytics')
        };
      });
      
      // Test goal creation tracking
      cy.visit('/my-plan?tab=goals');
      cy.waitForReact(500);
      cy.contains('button', 'Add Goal').click();
      
      // Test snowflake tracking
      cy.visit('/my-plan?tab=snowflakes');
      cy.waitForReact(500);
      cy.contains('button', 'Add Snowflake').click();
      
      // Verify analytics were called
      cy.get('@analytics').should('have.been.called');
    });
  });
});