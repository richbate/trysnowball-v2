// Scenario-aware debt simulator using existing calculateDebtScenario

import { calculateDebtScenario } from '../../utils/debtEngineAdapter.js';
import { expandExtraPerMonth } from './extraPlan.js';

export function runSimulationWithPlan(debts, plan, months = 120) {
  if (!debts || debts.length === 0) {
    return {
      monthsToZero: 0,
      totalInterest: 0,
      timeline: []
    };
  }
  
  // Convert extra plan to per-month array
  const extraPerMonth = expandExtraPerMonth(plan, months);
  
  // Calculate average extra payment for now (simplified approach)
  const avgExtraPayment = extraPerMonth.reduce((sum, extra) => sum + extra, 0) / extraPerMonth.length;
  
  // Use existing debt scenario calculator
  const scenario = calculateDebtScenario(debts, avgExtraPayment);
  
  // Calculate key metrics
  const monthsToZero = scenario.monthlyBreakdowns.findIndex(
    m => m.totalRemainingBalance <= 0
  );
  const totalInterest = scenario.monthlyBreakdowns.reduce(
    (sum, m) => sum + (m.interestPayment || 0), 0
  );
  
  // Fix the logic: -1 means never paid off, so use max months; otherwise use the found index + 1
  const finalMonthsToZero = monthsToZero >= 0 ? monthsToZero + 1 : months;
  
  // Convert to SimResult format
  return {
    monthsToZero: finalMonthsToZero,
    totalInterest,
    timeline: scenario.monthlyBreakdowns.map((month) => ({
      totalRemaining: month.totalRemainingBalance || 0,
      interestPaid: month.interestPayment || 0,
      principalMin: month.principalPayment || 0,
      principalExtra: avgExtraPayment
    }))
  };
}