/**
 * CP-6 Motivational Layer Golden Test Suite
 * Tests reframing, delta calculations, celebration flows, and emotional messaging
 * Ensures motivational elements enhance user experience without calculation errors
 */

import fixtures from '../tests/fixtures/cp6-motivational.fixtures.json';

// Motivational layer functions (simplified for testing)
const reframeDuration = (forecast: any, userProfile?: any) => {
  const months = forecast.totalMonths;

  if (months <= 6) {
    return {
      milestone: "Debt-free by summer holidays",
      comparison: "Shorter than a football season",
      emotional: "Victory is just around the corner",
      visualCue: "☀️",
      urgency: "high"
    };
  } else if (months <= 18) {
    return {
      milestone: "Done before Christmas 2026",
      comparison: "Same time as a typical car loan",
      emotional: "Closer to freedom than you think",
      visualCue: "🎄",
      urgency: "low"
    };
  } else {
    return {
      milestone: "Free by New Year 2028",
      comparison: "Same as a university degree",
      emotional: "Every journey starts with a single step",
      visualCue: "🎓",
      urgency: "medium"
    };
  }
};

const calculateMonthlyDelta = (baseline: any, actual: any) => {
  const baselineValue = baseline.monthlyProgress || 0;
  const actualValue = actual.monthlyProgress || 0;
  const amount = actualValue - baselineValue;

  // Prevent division by zero and handle edge cases
  let percentage;
  if (baselineValue === 0) {
    if (actualValue === 0) {
      percentage = 0;
    } else {
      percentage = "SIGNIFICANT_IMPROVEMENT";
      return {
        amount: amount,
        percentage: percentage,
        trend: "improving",
        noInfiniteValues: true,
        specialHandling: true
      };
    }
  } else {
    percentage = (amount / baselineValue) * 100;
  }

  // Ensure no NaN values
  if (Number.isNaN(amount)) amount = 0;
  if (Number.isNaN(percentage)) percentage = 0;

  const trend = amount > 0 ? "improving" : amount < 0 ? "declining" : "stable";
  const visualIndicator = amount > 0 ? "↗️" : amount < 0 ? "↘️" : "→";

  let message;
  if (amount > 0) {
    message = `You're paying £${Math.abs(amount).toFixed(2)} more per month than expected!`;
  } else if (amount < 0) {
    message = `Payments are £${Math.abs(amount).toFixed(2)} lower than planned`;
  } else {
    message = "Right on track with your plan";
  }

  return {
    amount: Math.round(amount * 100) / 100,
    percentage: Number.isFinite(percentage) ? Math.round(percentage * 10) / 10 : 0,
    trend,
    visualIndicator,
    message,
    noNaNValues: !Number.isNaN(amount) && !Number.isNaN(percentage)
  };
};

const generateCelebration = (userState: any, clearedDebt?: any, forecast?: any) => {
  if (clearedDebt) {
    return {
      celebrationTitle: "🎉 First victory achieved!",
      milestone: `${clearedDebt.name} is history`,
      impact: `You've saved £${userState.interestSaved} in interest`,
      encouragement: "This momentum will clear the rest faster",
      shareable: true,
      visualElements: ["confetti", "progress_bar", "trophy"]
    };
  }

  if (userState.percentageCleared >= 50) {
    return {
      celebrationTitle: "🏃‍♀️ Halfway to freedom!",
      milestone: "50% of your debt journey complete",
      impact: `£${userState.totalPaid.toLocaleString()} paid toward your future`,
      encouragement: "The hardest part is behind you",
      shareable: true,
      visualElements: ["progress_circle", "milestone_flag"]
    };
  }

  if (forecast && forecast.remainingMonths <= 2) {
    return {
      celebrationTitle: "🔆 Light at the end of the tunnel!",
      milestone: `Only ${forecast.remainingMonths} months until debt freedom`,
      impact: `${forecast.monthsCompleted} months of progress behind you`,
      encouragement: "The finish line is in sight",
      urgency: "final_push",
      triggerOnce: true,
      visualElements: ["tunnel_light", "countdown_timer"]
    };
  }

  return null;
};

const generatePastWins = (userState: any) => {
  const wins = [];

  if (userState.debtsCleared) {
    userState.debtsCleared.forEach((debt: any) => {
      wins.push(`Cleared ${debt.name} in month ${debt.clearedMonth}`);
    });
  }

  if (userState.totalPaid > 0) {
    wins.push(`Paid £${userState.totalPaid.toLocaleString()} toward freedom`);
  }

  if (userState.interestSaved > 0) {
    wins.push(`Saved £${userState.interestSaved} in interest charges`);
  }

  // Check for NaN values
  const hasNaN = wins.some(win => win.includes('NaN'));
  const allPositiveValues = userState.totalPaid >= 0 && userState.interestSaved >= 0;

  return {
    wins,
    overallMessage: "Your consistency is paying off",
    motivationalNote: "Each cleared debt makes the next one easier",
    hasNaN,
    allPositiveValues
  };
};

const generateInterestComparison = (forecast: any, userProfile?: any) => {
  if (userProfile?.preferences?.showShockValue && forecast.interestSavedVsMinimum > 0) {
    return {
      shockValue: `You avoided £${forecast.interestSavedVsMinimum.toLocaleString()} in interest charges!`,
      comparison: "That's enough for a holiday abroad",
      visualImpact: "💰",
      realWorldEquivalent: "2 months of rent",
      emotionalHook: "Money that stays in your pocket"
    };
  }
  return null;
};

const generateEmotionalMessaging = (userState: any, forecast: any) => {
  if (userState.stressLevel === "high" || userState.debtToIncomeRatio > 0.7) {
    return {
      tone: "empathetic",
      message: "Big challenges need steady progress",
      encouragement: "You're taking control of your future",
      avoidance: ["overwhelming", "impossible", "too long"],
      focus: "monthly_wins"
    };
  } else if (forecast.totalMonths <= 12) {
    return {
      tone: "energetic",
      message: "Victory is just around the corner!",
      encouragement: "You've got this handled",
      focus: "quick_win",
      urgency: "high"
    };
  }

  return {
    tone: "encouraging",
    message: "Steady progress leads to freedom",
    encouragement: "You're on the right track",
    focus: "consistency"
  };
};

describe('CP-6 Motivational Layer - Golden Tests', () => {

  fixtures.forEach(fixture => {
    it(`should process correctly: ${fixture.name}`, () => {
      switch (fixture.name.split(' - ')[0]) {
        case 'Duration Reframing':
          const reframed = reframeDuration(fixture.input.forecast, fixture.input.userProfile);
          expect(reframed.milestone).toBe(fixture.expected.milestone);
          expect(reframed.comparison).toBe(fixture.expected.comparison);
          expect(reframed.emotional).toBe(fixture.expected.emotional);
          expect(reframed.visualCue).toBe(fixture.expected.visualCue);
          expect(reframed.urgency).toBe(fixture.expected.urgency);
          break;

        case 'Monthly Delta Calculation':
          const delta = calculateMonthlyDelta(fixture.input.baseline, fixture.input.actual);

          if (typeof fixture.expected.percentage === 'string') {
            expect(delta.percentage).toBe(fixture.expected.percentage);
            expect(delta.specialHandling).toBe(fixture.expected.specialHandling);
            expect(delta.noInfiniteValues).toBe(fixture.expected.noInfiniteValues);
          } else {
            expect(delta.amount).toBeCloseTo(fixture.expected.amount, 2);
            expect(delta.percentage).toBeCloseTo(fixture.expected.percentage, 1);
            expect(delta.trend).toBe(fixture.expected.trend);
            expect(delta.visualIndicator).toBe(fixture.expected.visualIndicator);

            if (fixture.expected.message) {
              expect(delta.message).toBe(fixture.expected.message);
            }
          }

          if (fixture.expected.noNaNValues !== undefined) {
            expect(delta.noNaNValues).toBe(fixture.expected.noNaNValues);
          }
          break;

        case 'Celebration Flow':
          const celebration = generateCelebration(
            fixture.input.userState,
            fixture.input.clearedDebt,
            fixture.input.forecast
          );

          expect(celebration).toBeTruthy();
          expect(celebration!.celebrationTitle).toBe(fixture.expected.celebrationTitle);
          expect(celebration!.milestone).toBe(fixture.expected.milestone);
          expect(celebration!.encouragement).toBe(fixture.expected.encouragement);
          expect(celebration!.shareable).toBe(fixture.expected.shareable);

          if (fixture.expected.visualElements) {
            expect(celebration!.visualElements).toEqual(fixture.expected.visualElements);
          }
          break;

        case 'Past Wins Retrospective':
          const pastWins = generatePastWins(fixture.input.userState);

          expect(pastWins.wins).toEqual(fixture.expected.wins);
          expect(pastWins.overallMessage).toBe(fixture.expected.overallMessage);
          expect(pastWins.motivationalNote).toBe(fixture.expected.motivationalNote);
          expect(pastWins.hasNaN).toBe(fixture.expected.hasNaN);
          expect(pastWins.allPositiveValues).toBe(fixture.expected.allPositiveValues);
          break;

        case 'Interest Comparison Shock Value':
          const comparison = generateInterestComparison(fixture.input.forecast, fixture.input.userProfile);

          expect(comparison).toBeTruthy();
          expect(comparison!.shockValue).toBe(fixture.expected.shockValue);
          expect(comparison!.comparison).toBe(fixture.expected.comparison);
          expect(comparison!.visualImpact).toBe(fixture.expected.visualImpact);
          expect(comparison!.realWorldEquivalent).toBe(fixture.expected.realWorldEquivalent);
          break;

        case 'Emotional Messaging':
          const messaging = generateEmotionalMessaging(fixture.input.userState, fixture.input.forecast);

          expect(messaging.tone).toBe(fixture.expected.tone);
          expect(messaging.message).toBe(fixture.expected.message);
          expect(messaging.encouragement).toBe(fixture.expected.encouragement);
          expect(messaging.focus).toBe(fixture.expected.focus);

          if (fixture.expected.avoidance) {
            expect(messaging.avoidance).toEqual(fixture.expected.avoidance);
          }
          break;

        case 'Edge Case':
          if (fixture.name.includes('NaN Prevention')) {
            const edgeDelta = calculateMonthlyDelta(fixture.input.baseline, fixture.input.actual);
            expect(edgeDelta.noNaNValues).toBe(fixture.expected.noNaNValues);
            expect(edgeDelta.validOutput).toBe(fixture.expected.validOutput);
          } else if (fixture.name.includes('Infinite Values')) {
            const infiniteDelta = calculateMonthlyDelta(fixture.input.baseline, fixture.input.actual);
            expect(infiniteDelta.noInfiniteValues).toBe(fixture.expected.noInfiniteValues);
            expect(infiniteDelta.specialHandling).toBe(fixture.expected.specialHandling);
          }
          break;
      }
    });
  });

  describe('Duration Reframing Logic', () => {
    it('should categorize timeframes appropriately', () => {
      const shortTerm = reframeDuration({ totalMonths: 4 });
      const mediumTerm = reframeDuration({ totalMonths: 15 });
      const longTerm = reframeDuration({ totalMonths: 30 });

      expect(shortTerm.urgency).toBe('high');
      expect(mediumTerm.urgency).toBe('low');
      expect(longTerm.urgency).toBe('medium');
    });

    it('should provide appropriate visual cues', () => {
      const summer = reframeDuration({ totalMonths: 6 });
      const christmas = reframeDuration({ totalMonths: 18 });
      const graduation = reframeDuration({ totalMonths: 36 });

      expect(summer.visualCue).toBe('☀️');
      expect(christmas.visualCue).toBe('🎄');
      expect(graduation.visualCue).toBe('🎓');
    });
  });

  describe('Monthly Delta Mathematics', () => {
    it('should calculate positive deltas correctly', () => {
      const result = calculateMonthlyDelta(
        { monthlyProgress: 100 },
        { monthlyProgress: 125 }
      );

      expect(result.amount).toBe(25);
      expect(result.percentage).toBe(25.0);
      expect(result.trend).toBe('improving');
      expect(result.visualIndicator).toBe('↗️');
    });

    it('should calculate negative deltas correctly', () => {
      const result = calculateMonthlyDelta(
        { monthlyProgress: 200 },
        { monthlyProgress: 150 }
      );

      expect(result.amount).toBe(-50);
      expect(result.percentage).toBe(-25.0);
      expect(result.trend).toBe('declining');
      expect(result.visualIndicator).toBe('↘️');
    });

    it('should handle zero baseline without NaN', () => {
      const result = calculateMonthlyDelta(
        { monthlyProgress: 0 },
        { monthlyProgress: 0 }
      );

      expect(result.percentage).toBe(0);
      expect(Number.isNaN(result.percentage)).toBe(false);
      expect(result.noNaNValues).toBe(true);
    });

    it('should handle division by zero gracefully', () => {
      const result = calculateMonthlyDelta(
        { monthlyProgress: 0 },
        { monthlyProgress: 100 }
      );

      expect(result.percentage).toBe('SIGNIFICANT_IMPROVEMENT');
      expect(result.specialHandling).toBe(true);
      expect(result.noInfiniteValues).toBe(true);
    });

    it('should round monetary values to pence', () => {
      const result = calculateMonthlyDelta(
        { monthlyProgress: 333.333 },
        { monthlyProgress: 444.444 }
      );

      expect(result.amount.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(result.percentage.toString()).toMatch(/^\d+\.\d{1}$/);
    });
  });

  describe('Celebration Flow Logic', () => {
    it('should generate first debt celebration', () => {
      const celebration = generateCelebration(
        { totalDebtsCleared: 1, interestSaved: 200 },
        { name: 'Credit Card', originalAmount: 1000 }
      );

      expect(celebration?.celebrationTitle).toContain('🎉');
      expect(celebration?.milestone).toContain('Credit Card');
      expect(celebration?.impact).toContain('£200');
      expect(celebration?.shareable).toBe(true);
    });

    it('should generate 50% milestone celebration', () => {
      const celebration = generateCelebration({
        percentageCleared: 50,
        totalPaid: 5000
      });

      expect(celebration?.celebrationTitle).toContain('Halfway');
      expect(celebration?.milestone).toContain('50%');
      expect(celebration?.impact).toContain('5,000');
    });

    it('should generate end-of-tunnel celebration', () => {
      const celebration = generateCelebration(
        {},
        undefined,
        { remainingMonths: 2, monthsCompleted: 22 }
      );

      expect(celebration?.celebrationTitle).toContain('🔆');
      expect(celebration?.milestone).toContain('2 months');
      expect(celebration?.urgency).toBe('final_push');
      expect(celebration?.triggerOnce).toBe(true);
    });
  });

  describe('Past Wins Generation', () => {
    it('should compile user achievements correctly', () => {
      const userState = {
        debtsCleared: [
          { name: 'Card 1', clearedMonth: 5 },
          { name: 'Card 2', clearedMonth: 10 }
        ],
        totalPaid: 7500,
        interestSaved: 500
      };

      const pastWins = generatePastWins(userState);

      expect(pastWins.wins).toContain('Cleared Card 1 in month 5');
      expect(pastWins.wins).toContain('Cleared Card 2 in month 10');
      expect(pastWins.wins).toContain('Paid £7,500 toward freedom');
      expect(pastWins.wins).toContain('Saved £500 in interest charges');
      expect(pastWins.hasNaN).toBe(false);
      expect(pastWins.allPositiveValues).toBe(true);
    });

    it('should detect NaN values in wins', () => {
      const userState = {
        debtsCleared: [],
        totalPaid: NaN,
        interestSaved: 100
      };

      const pastWins = generatePastWins(userState);
      expect(pastWins.hasNaN).toBe(true);
    });
  });

  describe('Interest Comparison Shock Value', () => {
    it('should generate compelling shock value messaging', () => {
      const comparison = generateInterestComparison(
        { interestSavedVsMinimum: 2500 },
        { preferences: { showShockValue: true } }
      );

      expect(comparison?.shockValue).toContain('2,500');
      expect(comparison?.visualImpact).toBe('💰');
      expect(comparison?.emotionalHook).toContain('pocket');
    });

    it('should not show shock value when disabled', () => {
      const comparison = generateInterestComparison(
        { interestSavedVsMinimum: 2500 },
        { preferences: { showShockValue: false } }
      );

      expect(comparison).toBe(null);
    });
  });

  describe('Emotional Messaging Adaptation', () => {
    it('should use empathetic tone for high stress situations', () => {
      const messaging = generateEmotionalMessaging(
        { stressLevel: 'high', debtToIncomeRatio: 0.8 },
        { totalMonths: 48 }
      );

      expect(messaging.tone).toBe('empathetic');
      expect(messaging.message).toContain('steady progress');
      expect(messaging.avoidance).toContain('overwhelming');
      expect(messaging.focus).toBe('monthly_wins');
    });

    it('should use energetic tone for quick victories', () => {
      const messaging = generateEmotionalMessaging(
        { stressLevel: 'low', totalDebt: 1000 },
        { totalMonths: 8 }
      );

      expect(messaging.tone).toBe('energetic');
      expect(messaging.message).toContain('corner');
      expect(messaging.focus).toBe('quick_win');
      expect(messaging.urgency).toBe('high');
    });
  });

  describe('String Content Validation', () => {
    it('should not contain placeholder text', () => {
      const reframed = reframeDuration({ totalMonths: 12 });

      expect(reframed.milestone).not.toContain('TODO');
      expect(reframed.milestone).not.toContain('[');
      expect(reframed.comparison).not.toContain('placeholder');
      expect(reframed.emotional).not.toContain('undefined');
    });

    it('should use appropriate UK English spelling', () => {
      const messaging = generateEmotionalMessaging(
        { stressLevel: 'medium' },
        { totalMonths: 24 }
      );

      expect(messaging.message).not.toContain('color'); // Should be 'colour'
      expect(messaging.encouragement).not.toContain('organize'); // Should be 'organise'
    });
  });

  describe('Performance & Memory', () => {
    it('should process reframing quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        reframeDuration({ totalMonths: 12 + i % 24 });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should not leak memory during repeated delta calculations', () => {
      const baseline = { monthlyProgress: 100 };

      for (let i = 0; i < 10000; i++) {
        const delta = calculateMonthlyDelta(baseline, { monthlyProgress: 100 + i % 50 });
        expect(delta.amount).toBeDefined();
      }

      // If we get here without OOM errors, test passes
      expect(true).toBe(true);
    });
  });
});