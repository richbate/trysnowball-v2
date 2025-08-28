/**
 * Unit tests for GPT context builder profile integration
 */

import { buildGPTCoachContext } from '../gptContextBuilders';
import * as userProfileModule from '../../lib/userProfile';

// Mock the userProfile module
jest.mock('../../lib/userProfile');

// Mock the journey states module
jest.mock('../debtJourneyStates', () => ({
  calculateDebtJourneyState: () => ({
    type: 'start',
    headline: 'Ready to begin',
    body: 'Let\'s get started',
    ctaAction: 'Add your first debt'
  })
}));

describe('buildGPTCoachContext with user profile', () => {
  const mockDebts = [
    {
      name: 'Credit Card',
      balance: 5000,
      minPayment: 150,
      interestRate: 18.5
    },
    {
      name: 'Personal Loan',
      balance: 10000,
      minPayment: 300,
      interestRate: 12.0
    }
  ];

  const mockUser = {
    email: 'user@example.com',
    id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('coaching persona hints', () => {
    it('generates starter persona hints correctly', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['payoff_faster'],
        journeyStage: 'starter'
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('Tone: encouraging, step-by-step, avoid jargon');
      expect(context.coachingPersonaHints).toContain('Prioritise building first snowball and minimums');
      expect(context.coachingPersonaHints).toContain('User priority: pay off faster');
    });

    it('generates progress persona hints correctly', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['stop_paycheck'],
        journeyStage: 'progress'
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('Tone: pragmatic coach, focus on acceleration levers');
      expect(context.coachingPersonaHints).toContain('Surface Avalanche vs Snowball trade-offs');
      expect(context.coachingPersonaHints).toContain('User priority: cashflow relief');
    });

    it('generates optimizer persona hints correctly', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['get_organized'],
        journeyStage: 'optimizer'
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('Tone: expert. Emphasise optimisation and scenario comparisons');
      expect(context.coachingPersonaHints).toContain('Offer Custom order and extra-payment strategies');
      expect(context.coachingPersonaHints).toContain('User priority: clarity');
    });

    it('handles multiple debt focus areas', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['payoff_faster', 'stop_paycheck', 'get_organized'],
        journeyStage: 'progress'
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('User priority: pay off faster');
      expect(context.coachingPersonaHints).toContain('User priority: cashflow relief');
      expect(context.coachingPersonaHints).toContain('User priority: clarity');
    });

    it('handles empty profile gracefully', () => {
      userProfileModule.loadUserProfile.mockReturnValue({});

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toBe('');
      expect(context.userProfile).toEqual({});
    });

    it('handles missing journey stage gracefully', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['payoff_faster']
        // journeyStage missing
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('User priority: pay off faster');
      // Should not crash on missing journeyStage
    });

    it('handles missing debt focus gracefully', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        journeyStage: 'starter'
        // debtFocus missing
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.coachingPersonaHints).toContain('Tone: encouraging, step-by-step');
      // Should not crash on missing debtFocus
    });
  });

  describe('profile context integration', () => {
    it('includes user profile in context', () => {
      const testProfile = {
        debtFocus: ['payoff_faster'],
        journeyStage: 'starter',
        updatedAt: '2025-01-15T12:00:00.000Z'
      };
      userProfileModule.loadUserProfile.mockReturnValue(testProfile);

      const context = buildGPTCoachContext(mockDebts, mockUser);

      expect(context.userProfile).toEqual(testProfile);
    });

    it('preserves existing context structure', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        debtFocus: ['get_organized'],
        journeyStage: 'optimizer'
      });

      const context = buildGPTCoachContext(mockDebts, mockUser);

      // Verify all expected context sections still exist
      expect(context.user).toBeDefined();
      expect(context.debtSummary).toBeDefined();
      expect(context.debts).toBeDefined();
      expect(context.recentProgress).toBeDefined();
      expect(context.strategy).toBeDefined();
      expect(context.journey).toBeDefined();
      
      // New profile sections
      expect(context.userProfile).toBeDefined();
      expect(context.coachingPersonaHints).toBeDefined();
    });

    it('works with existing options parameter', () => {
      userProfileModule.loadUserProfile.mockReturnValue({
        journeyStage: 'progress'
      });

      const options = {
        projections: { totalMonths: 24 },
        paymentHistory: [{ amount: 200, debtId: 'debt-1' }],
        settings: { extraPayment: 100 }
      };

      const context = buildGPTCoachContext(mockDebts, mockUser, options);

      expect(context.debtSummary.projectedPayoffMonths).toBe(24);
      expect(context.debtSummary.extraPaymentBudget).toBe(100);
      expect(context.userProfile.journeyStage).toBe('progress');
    });
  });

  describe('persona classification matrix', () => {
    const testCases = [
      { stage: 'starter', focus: 'payoff_faster', expectedPersona: 'Sprinter' },
      { stage: 'starter', focus: 'stop_paycheck', expectedPersona: 'Stabiliser' },
      { stage: 'starter', focus: 'get_organized', expectedPersona: 'Explorer' },
      { stage: 'progress', focus: 'payoff_faster', expectedPersona: 'Accelerator' },
      { stage: 'progress', focus: 'stop_paycheck', expectedPersona: 'Balancer' },
      { stage: 'progress', focus: 'get_organized', expectedPersona: 'Tracker' },
      { stage: 'optimizer', focus: 'payoff_faster', expectedPersona: 'Optimizer' },
      { stage: 'optimizer', focus: 'stop_paycheck', expectedPersona: 'Hedger' },
      { stage: 'optimizer', focus: 'get_organized', expectedPersona: 'Analyst' }
    ];

    testCases.forEach(({ stage, focus, expectedPersona }) => {
      it(`generates appropriate hints for ${expectedPersona} persona (${stage} + ${focus})`, () => {
        userProfileModule.loadUserProfile.mockReturnValue({
          debtFocus: [focus],
          journeyStage: stage
        });

        const context = buildGPTCoachContext(mockDebts, mockUser);

        // Verify persona-specific content exists
        expect(context.coachingPersonaHints).toBeTruthy();
        expect(context.coachingPersonaHints.length).toBeGreaterThan(0);
        
        // Verify stage-specific content exists
        expect(['starter', 'optimizer']).toContain(stage);
        expect(context.coachingPersonaHints).toMatch(
          stage === 'starter' ? /encouraging/i : /expert/i
        );
      });
    });
  });
});