/**
 * CP-5.1: Challenge Generator with 4 Rules
 * Intelligent challenge generation based on forecast analysis and user patterns
 * Feeds into CP-5 Goals Engine for challenge assignment
 */

import { UKDebt } from '../types/UKDebt';
import { Goal, GOAL_TYPES } from '../types/Goals';
import { ForecastResultV1 } from '../utils/snowballSimulatorV1';
import { ForecastResultV2 } from '../utils/compositeSimulatorV2';
import { UserTier, USER_TIERS } from '../types/Entitlements';

export interface ChallengeRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ChallengeSuggestion {
  id: string;
  rule_id: string;
  goal_type: keyof typeof GOAL_TYPES;
  target_value: number;
  target_date: string;
  confidence_score: number; // 0-100
  reason: string;
  context: {
    forecast_months: number;
    current_extra_payment: number;
    suggested_extra_payment?: number;
    debt_id?: string;
    bucket_id?: string;
    improvement_estimate?: string;
  };
  user_tier_required: UserTier;
  suppressed: boolean;
  suppression_reason?: string;
}

export interface ChallengeGenerationResult {
  suggestions: ChallengeSuggestion[];
  total_generated: number;
  total_suppressed: number;
  rules_applied: string[];
  forecast_version: string;
}

/**
 * CP-5.1 Challenge Generation Rules
 */
export const CHALLENGE_RULES: Record<string, ChallengeRule> = {
  RULE_1_AHEAD_OF_FORECAST: {
    id: 'rule_1_ahead_of_forecast',
    name: 'Ahead of Forecast Acceleration',
    description: 'User is paying off debt faster than forecast - suggest stretch goal',
    enabled: true
  },
  RULE_2_EXTRA_PAYMENT_BOOST: {
    id: 'rule_2_extra_payment_boost',
    name: 'Extra Payment Boost',
    description: 'User has capacity for higher extra payments - suggest amount goal',
    enabled: true
  },
  RULE_3_MILESTONE_MOTIVATION: {
    id: 'rule_3_milestone_motivation',
    name: 'Milestone Motivation',
    description: 'User approaching debt payoff - suggest clearance goal',
    enabled: true
  },
  RULE_4_INTEREST_OPTIMIZATION: {
    id: 'rule_4_interest_optimization',
    name: 'Interest Optimization',
    description: 'High-interest debt detected - suggest interest savings goal',
    enabled: true
  }
};

/**
 * Challenge Generator Engine
 */
export class ChallengeGenerator {
  private rules: Record<string, ChallengeRule>;

  constructor(customRules?: Record<string, ChallengeRule>) {
    this.rules = customRules || CHALLENGE_RULES;
  }

  /**
   * Generate challenges based on forecast and user context
   */
  generateChallenges(
    debts: UKDebt[],
    forecast: ForecastResultV1 | ForecastResultV2,
    existingGoals: Goal[],
    userTier: UserTier,
    currentExtraPayment: number = 0,
    engine: 'CP-2' | 'CP-4' = 'CP-4'
  ): ChallengeGenerationResult {
    
    const suggestions: ChallengeSuggestion[] = [];
    const rulesApplied: string[] = [];

    // Rule 1: Ahead of Forecast Acceleration
    if (this.rules.RULE_1_AHEAD_OF_FORECAST.enabled) {
      const rule1Suggestion = this.applyRule1_AheadOfForecast(
        debts, forecast, currentExtraPayment, userTier, engine
      );
      if (rule1Suggestion) {
        suggestions.push(rule1Suggestion);
        rulesApplied.push('RULE_1_AHEAD_OF_FORECAST');
      }
    }

    // Rule 2: Extra Payment Boost
    if (this.rules.RULE_2_EXTRA_PAYMENT_BOOST.enabled) {
      const rule2Suggestion = this.applyRule2_ExtraPaymentBoost(
        debts, forecast, currentExtraPayment, userTier, engine
      );
      if (rule2Suggestion) {
        suggestions.push(rule2Suggestion);
        rulesApplied.push('RULE_2_EXTRA_PAYMENT_BOOST');
      }
    }

    // Rule 3: Milestone Motivation
    if (this.rules.RULE_3_MILESTONE_MOTIVATION.enabled) {
      const rule3Suggestions = this.applyRule3_MilestoneMotivation(
        debts, forecast, existingGoals, userTier, engine
      );
      suggestions.push(...rule3Suggestions);
      if (rule3Suggestions.length > 0) {
        rulesApplied.push('RULE_3_MILESTONE_MOTIVATION');
      }
    }

    // Rule 4: Interest Optimization
    if (this.rules.RULE_4_INTEREST_OPTIMIZATION.enabled) {
      const rule4Suggestion = this.applyRule4_InterestOptimization(
        debts, forecast, userTier, engine
      );
      if (rule4Suggestion) {
        suggestions.push(rule4Suggestion);
        rulesApplied.push('RULE_4_INTEREST_OPTIMIZATION');
      }
    }

    // Apply suppression logic
    const processedSuggestions = this.applySuppression(suggestions, existingGoals, userTier);

    return {
      suggestions: processedSuggestions,
      total_generated: suggestions.length,
      total_suppressed: processedSuggestions.filter(s => s.suppressed).length,
      rules_applied: rulesApplied,
      forecast_version: engine === 'CP-4' ? 'v2.0' : 'v1.0'
    };
  }

  /**
   * Rule 1: Ahead of Forecast Acceleration
   * If user has extra payment capacity, suggest increasing it
   */
  private applyRule1_AheadOfForecast(
    debts: UKDebt[],
    forecast: ForecastResultV1 | ForecastResultV2,
    currentExtraPayment: number,
    userTier: UserTier,
    engine: 'CP-2' | 'CP-4'
  ): ChallengeSuggestion | null {
    
    // Only apply if user is already making extra payments
    if (currentExtraPayment <= 0) return null;

    // Suggest 50% increase in extra payment for next 3 months
    const suggestedIncrease = Math.round(currentExtraPayment * 0.5);
    const newExtraPayment = currentExtraPayment + suggestedIncrease;

    // Calculate target date (3 months from now)
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);

    // Calculate confidence based on current payment consistency
    const confidence = Math.min(95, 70 + (currentExtraPayment / 50) * 10); // Higher extra payment = higher confidence

    return {
      id: `challenge_${Date.now()}_rule1`,
      rule_id: 'rule_1_ahead_of_forecast',
      goal_type: 'AMOUNT_PAID',
      target_value: suggestedIncrease * 3, // 3 months of increased payments
      target_date: targetDate.toISOString().split('T')[0],
      confidence_score: Math.round(confidence),
      reason: 'ahead_of_forecast',
      context: {
        forecast_months: forecast.totalMonths,
        current_extra_payment: currentExtraPayment,
        suggested_extra_payment: newExtraPayment,
        improvement_estimate: `${Math.round((suggestedIncrease * 3) / 100) * 100} more in principal payments`
      },
      user_tier_required: USER_TIERS.PRO, // AMOUNT_PAID goals require Pro
      suppressed: false
    };
  }

  /**
   * Rule 2: Extra Payment Boost
   * Suggest starting extra payments if user has none
   */
  private applyRule2_ExtraPaymentBoost(
    debts: UKDebt[],
    forecast: ForecastResultV1 | ForecastResultV2,
    currentExtraPayment: number,
    userTier: UserTier,
    engine: 'CP-2' | 'CP-4'
  ): ChallengeSuggestion | null {
    
    // Only apply if user is not making extra payments
    if (currentExtraPayment > 0) return null;

    // Calculate modest extra payment suggestion (£25-100 based on debt size)
    const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const suggestedExtra = Math.min(100, Math.max(25, Math.round(totalDebt / 100)));

    // Calculate target: 6 months of extra payments
    const targetMonths = 6;
    const targetValue = suggestedExtra * targetMonths;

    // Calculate target date
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    // Confidence based on debt-to-payment ratio
    const monthlyMinPayments = debts.reduce((sum, debt) => sum + debt.min_payment, 0);
    const paymentRatio = suggestedExtra / monthlyMinPayments;
    const confidence = Math.min(90, Math.max(40, 70 - (paymentRatio * 100))); // Lower ratio = higher confidence

    return {
      id: `challenge_${Date.now()}_rule2`,
      rule_id: 'rule_2_extra_payment_boost',
      goal_type: 'AMOUNT_PAID',
      target_value: targetValue,
      target_date: targetDate.toISOString().split('T')[0],
      confidence_score: Math.round(confidence),
      reason: 'extra_payment_boost',
      context: {
        forecast_months: forecast.totalMonths,
        current_extra_payment: currentExtraPayment,
        suggested_extra_payment: suggestedExtra,
        improvement_estimate: `${Math.round(forecast.totalMonths * 0.15)} months faster payoff`
      },
      user_tier_required: USER_TIERS.PRO,
      suppressed: false
    };
  }

  /**
   * Rule 3: Milestone Motivation
   * Suggest debt clearance goals for debts close to payoff
   */
  private applyRule3_MilestoneMotivation(
    debts: UKDebt[],
    forecast: ForecastResultV1 | ForecastResultV2,
    existingGoals: Goal[],
    userTier: UserTier,
    engine: 'CP-2' | 'CP-4'
  ): ChallengeSuggestion[] {
    
    const suggestions: ChallengeSuggestion[] = [];

    // Find debts that will be paid off in next 6 months
    let monthsToCheck = 6;
    if (engine === 'CP-4') {
      const result = forecast as ForecastResultV2;
      for (const snapshot of result.monthlySnapshots.slice(0, monthsToCheck)) {
        const paidOffDebts = (snapshot as any).newlyPaidOffDebts || [];
        for (const debtId of paidOffDebts) {
          // Check if user already has a DEBT_CLEAR goal for this debt
          const existingGoal = existingGoals.find(g => 
            g.type === GOAL_TYPES.DEBT_CLEAR && g.debt_id === debtId
          );
          if (existingGoal) continue;

          const debt = debts.find(d => d.id === debtId);
          if (!debt) continue;

          // Calculate target date (1 month earlier than forecast)
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + Math.max(1, snapshot.month - 1));

          // High confidence for near-term payoffs
          const confidence = Math.max(80, 95 - (snapshot.month * 3));

          suggestions.push({
            id: `challenge_${Date.now()}_rule3_${debtId}`,
            rule_id: 'rule_3_milestone_motivation',
            goal_type: 'DEBT_CLEAR',
            target_value: 0,
            target_date: targetDate.toISOString().split('T')[0],
            confidence_score: Math.round(confidence),
            reason: 'milestone_motivation',
            context: {
              forecast_months: snapshot.month,
              current_extra_payment: 0,
              debt_id: debtId,
              improvement_estimate: `Clear ${debt.name} 1 month early`
            },
            user_tier_required: USER_TIERS.FREE, // DEBT_CLEAR available to free users
            suppressed: false
          });
        }
      }
    } else {
      const result = forecast as ForecastResultV1;
      for (const snapshot of result.monthlySnapshots.slice(0, monthsToCheck)) {
        const paidOffDebts = (snapshot as any).newlyPaidOffDebts || [];
        for (const debtId of paidOffDebts) {
          const existingGoal = existingGoals.find(g => 
            g.type === GOAL_TYPES.DEBT_CLEAR && g.debt_id === debtId
          );
          if (existingGoal) continue;

          const debt = debts.find(d => d.id === debtId);
          if (!debt) continue;

          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + Math.max(1, snapshot.month - 1));

          const confidence = Math.max(80, 95 - (snapshot.month * 3));

          suggestions.push({
            id: `challenge_${Date.now()}_rule3_${debtId}`,
            rule_id: 'rule_3_milestone_motivation',
            goal_type: 'DEBT_CLEAR',
            target_value: 0,
            target_date: targetDate.toISOString().split('T')[0],
            confidence_score: Math.round(confidence),
            reason: 'milestone_motivation',
            context: {
              forecast_months: snapshot.month,
              current_extra_payment: 0,
              debt_id: debtId,
              improvement_estimate: `Clear ${debt.name} 1 month early`
            },
            user_tier_required: USER_TIERS.FREE,
            suppressed: false
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Rule 4: Interest Optimization
   * Suggest interest savings goals for high-APR debts
   */
  private applyRule4_InterestOptimization(
    debts: UKDebt[],
    forecast: ForecastResultV1 | ForecastResultV2,
    userTier: UserTier,
    engine: 'CP-2' | 'CP-4'
  ): ChallengeSuggestion | null {
    
    // Find highest APR debt
    let highestAPRDebt: UKDebt | null = null;
    let highestAPR = 0;

    for (const debt of debts) {
      let debtAPR = debt.apr;
      
      // For multi-APR debts, use highest bucket APR
      if (debt.buckets && debt.buckets.length > 0) {
        debtAPR = Math.max(...debt.buckets.map(b => b.apr));
      }

      if (debtAPR > highestAPR) {
        highestAPR = debtAPR;
        highestAPRDebt = debt;
      }
    }

    // Only suggest if APR is above 20%
    if (!highestAPRDebt || highestAPR < 20) return null;

    // Calculate potential interest savings (rough estimate: 20% of total interest)
    const potentialSavings = Math.round(forecast.totalInterestPaid * 0.2);
    
    // Target date: 12 months
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 12);

    // Confidence based on APR level
    const confidence = Math.min(85, Math.max(60, 40 + (highestAPR - 20) * 2));

    return {
      id: `challenge_${Date.now()}_rule4`,
      rule_id: 'rule_4_interest_optimization',
      goal_type: 'INTEREST_SAVED',
      target_value: potentialSavings,
      target_date: targetDate.toISOString().split('T')[0],
      confidence_score: Math.round(confidence),
      reason: 'interest_optimization',
      context: {
        forecast_months: forecast.totalMonths,
        current_extra_payment: 0,
        debt_id: highestAPRDebt.id,
        improvement_estimate: `Save £${potentialSavings} in interest charges`
      },
      user_tier_required: USER_TIERS.PRO, // INTEREST_SAVED requires Pro
      suppressed: false
    };
  }

  /**
   * Apply suppression rules to filter out inappropriate suggestions
   */
  private applySuppression(
    suggestions: ChallengeSuggestion[],
    existingGoals: Goal[],
    userTier: UserTier
  ): ChallengeSuggestion[] {
    
    return suggestions.map(suggestion => {
      // Suppress if user tier doesn't support goal type
      if (suggestion.user_tier_required === USER_TIERS.PRO && userTier === USER_TIERS.FREE) {
        return {
          ...suggestion,
          suppressed: true,
          suppression_reason: 'user_tier_insufficient'
        };
      }

      // Suppress if user already has similar goal
      const similarGoal = existingGoals.find(goal => 
        goal.type === GOAL_TYPES[suggestion.goal_type] &&
        goal.debt_id === suggestion.context.debt_id &&
        goal.status === 'ACTIVE'
      );

      if (similarGoal) {
        return {
          ...suggestion,
          suppressed: true,
          suppression_reason: 'duplicate_goal_exists'
        };
      }

      // Suppress if confidence is too low
      if (suggestion.confidence_score < 50) {
        return {
          ...suggestion,
          suppressed: true,
          suppression_reason: 'low_confidence'
        };
      }

      return suggestion;
    });
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): ChallengeRule[] {
    return Object.values(this.rules).filter(rule => rule.enabled);
  }

  /**
   * Enable/disable specific rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    if (this.rules[ruleId]) {
      this.rules[ruleId].enabled = enabled;
    }
  }
}

// Export singleton instance
export const challengeGenerator = new ChallengeGenerator();
export default challengeGenerator;