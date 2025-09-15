/**
 * Debt Strategy Utilities for TRY-64
 * Handles debt sorting and strategy-specific messaging
 */

import { UKDebt } from '../types/UKDebt';

export type DebtStrategy = 'snowball' | 'avalanche';

export interface StrategyText {
  method: DebtStrategy;
  templates: {
    priorityExplanation: string;
    targetDebtReason: string;
    nextStepGuidance: string;
    motivationalMessage: string;
    progressCelebration: string;
  };
}

// Strategy-specific text templates
export const strategyTexts: Record<DebtStrategy, StrategyText> = {
  snowball: {
    method: 'snowball',
    templates: {
      priorityExplanation: '{debtName} has smallest balance - tackle first for quick win',
      targetDebtReason: 'Start with your smallest debt to build momentum',
      nextStepGuidance: 'Once you clear {currentTarget}, move to the next smallest debt',
      motivationalMessage: 'Every debt you eliminate builds confidence for the next one',
      progressCelebration: 'Great! One less debt to worry about - momentum is building!'
    }
  },
  avalanche: {
    method: 'avalanche',
    templates: {
      priorityExplanation: '{debtName} has highest rate ({apr}%) - tackle first for maximum savings',
      targetDebtReason: 'Focus on highest interest rate first to minimize total cost',
      nextStepGuidance: 'Once you clear {currentTarget}, move to the next highest rate',
      motivationalMessage: 'Every payment saves you money by reducing high interest charges',
      progressCelebration: 'Excellent! You\'ve eliminated your most expensive debt!'
    }
  }
};

/**
 * Sort debts according to the selected strategy
 */
export function sortDebtsByStrategy(debts: UKDebt[], strategy: DebtStrategy): UKDebt[] {
  return [...debts].sort((a, b) => {
    if (strategy === 'snowball') {
      // Sort by balance ascending (smallest first)
      return a.amount - b.amount;
    } else {
      // Sort by APR descending (highest first)
      return b.apr - a.apr;
    }
  });
}

/**
 * Get the target debt based on strategy
 */
export function getTargetDebt(debts: UKDebt[], strategy: DebtStrategy): UKDebt | null {
  if (debts.length === 0) return null;
  const sortedDebts = sortDebtsByStrategy(debts, strategy);
  return sortedDebts[0];
}

/**
 * Generate recommendation text for a debt based on strategy
 */
export function generateRecommendationText(
  debt: UKDebt,
  strategy: DebtStrategy,
  isTarget: boolean = false
): string {
  if (!isTarget) return '';

  const template = strategyTexts[strategy].templates.priorityExplanation;

  if (strategy === 'snowball') {
    return template.replace('{debtName}', debt.name);
  } else {
    return template
      .replace('{debtName}', debt.name)
      .replace('{apr}', debt.apr.toFixed(1));
  }
}

/**
 * Calculate progress and messaging based on strategy
 */
export function calculateStrategyProgress(debts: UKDebt[], strategy: DebtStrategy) {
  const sortedDebts = sortDebtsByStrategy(debts, strategy);
  const targetDebt = sortedDebts[0];

  if (!targetDebt) {
    return {
      targetDebt: null,
      strategy,
      progressMessage: 'No debts to focus on',
      nextTarget: null
    };
  }

  const progressMessage = strategy === 'snowball'
    ? `Focusing on smallest debt: ${targetDebt.name} (£${targetDebt.amount.toLocaleString()})`
    : `Attacking highest rate: ${targetDebt.name} (${targetDebt.apr}% APR)`;

  return {
    targetDebt,
    strategy,
    progressMessage,
    nextTarget: sortedDebts[1] || null
  };
}

/**
 * Get strategy display information
 */
export function getStrategyInfo(strategy: DebtStrategy) {
  return {
    name: strategy === 'snowball' ? 'Snowball Method' : 'Avalanche Method',
    icon: strategy === 'snowball' ? '🏔️' : '⚡',
    description: strategy === 'snowball'
      ? 'Pay smallest debt first for psychological wins'
      : 'Pay highest interest rate first for maximum savings',
    sortCriteria: strategy === 'snowball' ? 'balance (low to high)' : 'interest rate (high to low)'
  };
}

/**
 * Calculate strategy comparison (simplified for demo)
 */
export function compareStrategies(debts: UKDebt[], monthlyPayment: number = 200) {
  // This is a simplified calculation - in a real implementation,
  // you'd use the actual debt simulation engine

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const avgRate = debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length;

  // Simplified estimates - replace with actual simulation
  const snowballMonths = Math.ceil(totalDebt / monthlyPayment * 1.1); // slightly longer
  const avalancheMonths = Math.ceil(totalDebt / monthlyPayment * 1.05); // slightly shorter

  const snowballInterest = totalDebt * (avgRate / 100) * 0.3;
  const avalancheInterest = totalDebt * (avgRate / 100) * 0.25;

  return {
    snowball: {
      timeline: `${Math.floor(snowballMonths / 12)} years ${snowballMonths % 12} months`,
      totalInterest: Math.round(snowballInterest)
    },
    avalanche: {
      timeline: `${Math.floor(avalancheMonths / 12)} years ${avalancheMonths % 12} months`,
      totalInterest: Math.round(avalancheInterest),
      savings: Math.round(snowballInterest - avalancheInterest)
    }
  };
}

/**
 * PostHog analytics helper for strategy events
 */
export function trackStrategyEvent(
  eventName: string,
  strategy: DebtStrategy,
  additionalData: Record<string, any> = {}
) {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, {
      strategy,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }
}