/**
 * Simple Challenge Generator for CP-5 Goals Dashboard
 * Generates basic challenges from forecast data
 */

import { Challenge, Goal } from '../types/NewGoals';
import { UKDebt } from '../types/UKDebt';
import { ForecastResultV2 } from '../utils/compositeSimulatorV2';

export function generateSmartChallenges(
  forecast: ForecastResultV2,
  debts: UKDebt[],
  existingGoals: Goal[]
): Challenge[] {
  const challenges: Challenge[] = [];

  // Challenge 1: Boost Highest Interest Debt
  const highestInterestDebt = debts
    .filter(d => d.amount > 0)
    .sort((a, b) => b.apr - a.apr)[0];

  if (highestInterestDebt) {
    const boostAmount = Math.min(100, Math.round(highestInterestDebt.amount * 0.05));
    challenges.push({
      id: `boost-${highestInterestDebt.id}`,
      title: `Boost payment on ${highestInterestDebt.name}`,
      description: `Pay £${boostAmount} extra to save £${Math.round(boostAmount * 0.15)} in interest`,
      goalType: 'interest_saved',
      targetValue: Math.round(boostAmount * 0.15),
      reasoning: `${highestInterestDebt.name} has the highest interest rate at ${highestInterestDebt.apr}%`,
      estimatedImpact: `Save approximately £${Math.round(boostAmount * 0.15)} in total interest`
    });
  }

  // Challenge 2: Clear Smallest Debt (Snowball motivation)
  const smallestDebt = debts
    .filter(d => d.amount > 0 && d.amount < 2000)
    .sort((a, b) => a.amount - b.amount)[0];

  if (smallestDebt) {
    challenges.push({
      id: `clear-${smallestDebt.id}`,
      title: `Clear ${smallestDebt.name} completely`,
      description: `Pay off remaining £${smallestDebt.amount.toLocaleString()} for a psychological win`,
      goalType: 'debt_clear',
      targetValue: 0,
      reasoning: 'Clearing smaller debts builds momentum and reduces mental load',
      estimatedImpact: `Free up £${smallestDebt.min_payment}/month and eliminate one payment`
    });
  }

  // Challenge 3: Time-based improvement
  if (forecast.totalMonths > 12) {
    const targetReduction = Math.min(6, Math.floor(forecast.totalMonths * 0.1));
    challenges.push({
      id: 'time-reduction',
      title: `Reduce payoff time by ${targetReduction} months`,
      description: `Increase total monthly payments to finish ${targetReduction} months sooner`,
      goalType: 'time_saved',
      targetValue: targetReduction,
      reasoning: `Current payoff time is ${forecast.totalMonths} months`,
      estimatedImpact: `Become debt-free ${targetReduction} months earlier`
    });
  }

  // Challenge 4: Interest savings goal
  const potentialSavings = Math.round(forecast.totalInterestPaid * 0.1);
  if (potentialSavings > 50) {
    challenges.push({
      id: 'interest-savings',
      title: `Save £${potentialSavings} in interest`,
      description: 'Optimize your payment strategy to reduce total interest paid',
      goalType: 'interest_saved',
      targetValue: potentialSavings,
      reasoning: `You're currently projected to pay £${Math.round(forecast.totalInterestPaid)} in total interest`,
      estimatedImpact: `Keep £${potentialSavings} in your pocket instead of paying it in interest`
    });
  }

  // Filter out challenges that conflict with existing goals
  const existingGoalTypes = existingGoals.map(g => g.type);
  const filteredChallenges = challenges.filter(challenge => {
    // Allow multiple challenges of the same type, but not identical ones
    return true; // For now, show all challenges
  });

  return filteredChallenges.slice(0, 6); // Limit to 6 challenges
}