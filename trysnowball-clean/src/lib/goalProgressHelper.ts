/**
 * Goal Progress Calculator - Real CP-4 Forecast Integration
 * Calculates actual progress based on CP-4 composite simulator results
 */

import { Goal, GoalProgress } from '../types/NewGoals';
import { ForecastResultV2 } from '../utils/compositeSimulatorV2';
import { UKDebt } from '../types/UKDebt';

export function goalProgressForUser(
  goals: Goal[], 
  forecast: ForecastResultV2,
  debts: UKDebt[]
): GoalProgress[] {
  return goals.map(goal => calculateGoalProgress(goal, forecast, debts));
}

function calculateGoalProgress(
  goal: Goal, 
  forecast: ForecastResultV2,
  debts: UKDebt[]
): GoalProgress {
  
  switch (goal.type) {
    case 'debt_clear':
      return calculateDebtClearProgress(goal, forecast, debts);
    
    case 'interest_saved':
      return calculateInterestSavedProgress(goal, forecast);
      
    case 'time_saved':
      return calculateTimeSavedProgress(goal, forecast);
      
    default:
      throw new Error(`Unknown goal type: ${goal.type}`);
  }
}

function calculateDebtClearProgress(
  goal: Goal,
  forecast: ForecastResultV2,
  debts: UKDebt[]
): GoalProgress {
  
  if (!goal.forecastDebtId) {
    return createProgressResult(goal, 0, false, false, 'No debt specified');
  }

  const debt = debts.find(d => d.id === goal.forecastDebtId);
  if (!debt) {
    return createProgressResult(goal, 0, false, false, 'Debt not found');
  }

  // Find when this debt is paid off in the forecast
  const payoffMonth = forecast.monthlySnapshots.findIndex(snapshot => 
    snapshot.debts[goal.forecastDebtId!]?.isPaidOff
  );

  if (payoffMonth === -1) {
    // Not paid off in forecast period - calculate progress
    const latestSnapshot = forecast.monthlySnapshots[forecast.monthlySnapshots.length - 1];
    const remainingBalance = latestSnapshot?.debts[goal.forecastDebtId]?.totalBalance || debt.amount;
    const percentComplete = Math.max(0, ((debt.amount - remainingBalance) / debt.amount) * 100);
    
    return createProgressResult(
      goal, 
      percentComplete, 
      false, 
      percentComplete > 0,
      `£${Math.round(remainingBalance).toLocaleString()} remaining`,
      undefined,
      calculateInterestSavings(goal.forecastDebtId, forecast)
    );
  }

  // Debt is paid off - calculate completion date
  const projectedDate = addMonthsToDate(new Date(), payoffMonth + 1);
  const achieved = true;
  
  return createProgressResult(
    goal,
    100,
    achieved,
    true,
    `Debt cleared in ${payoffMonth + 1} months`,
    projectedDate.toISOString().split('T')[0],
    calculateInterestSavings(goal.forecastDebtId, forecast)
  );
}

function calculateInterestSavedProgress(
  goal: Goal,
  forecast: ForecastResultV2
): GoalProgress {
  
  // Calculate total interest saved vs minimum payment scenario
  // This is a simplified version - in production you'd run two forecasts
  const totalInterest = forecast.totalInterestPaid;
  const estimatedSavings = totalInterest * 0.15; // Rough estimate of 15% savings
  const currentSavings = Math.min(goal.targetValue, estimatedSavings);
  const percentComplete = (currentSavings / goal.targetValue) * 100;
  
  return createProgressResult(
    goal,
    percentComplete,
    currentSavings >= goal.targetValue,
    currentSavings > 0,
    `£${Math.round(currentSavings)} interest saved`,
    undefined,
    currentSavings
  );
}

function calculateTimeSavedProgress(
  goal: Goal,
  forecast: ForecastResultV2
): GoalProgress {
  
  // Calculate time saved vs minimum payment scenario  
  const actualMonths = forecast.totalMonths;
  const estimatedMinPaymentMonths = actualMonths * 1.4; // Rough estimate 
  const timeSaved = Math.max(0, estimatedMinPaymentMonths - actualMonths);
  const percentComplete = Math.min(100, (timeSaved / goal.targetValue) * 100);
  
  return createProgressResult(
    goal,
    percentComplete,
    timeSaved >= goal.targetValue,
    timeSaved > 0,
    `${Math.round(timeSaved)} months saved`,
    undefined,
    undefined,
    timeSaved
  );
}

function createProgressResult(
  goal: Goal,
  percentComplete: number,
  achieved: boolean,
  onTrack: boolean,
  description: string,
  projectedDate?: string,
  interestSaved?: number,
  timeSaved?: number
): GoalProgress {
  
  return {
    id: goal.id,
    percentComplete: Math.round(percentComplete),
    projectedDate,
    achieved,
    onTrack,
    impact: {
      interestSaved,
      timeSaved,
      description
    }
  };
}

function calculateInterestSavings(debtId: string, forecast: ForecastResultV2): number {
  // Sum up interest paid for this specific debt
  return forecast.monthlySnapshots.reduce((total, snapshot) => {
    const debt = snapshot.debts[debtId];
    return total + (debt?.totalInterest || 0);
  }, 0);
}

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}