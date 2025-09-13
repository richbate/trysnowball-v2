/**
 * CP-2: Forecast Engine v1 - Single APR Snowball Simulator
 * DEPRECATED: Use CP-4 composite engine for production
 * 
 * Purpose: Simple, reliable forecast for Free tier users
 * Algorithm: Single APR monthly interest calculation with snowball rollover
 * 
 * Status: Maintained for backwards compatibility only
 */

import { UKDebt } from '../types/UKDebt';

export interface WorkingDebtV1 {
  id: string;
  name: string;
  currentBalance: number;
  apr: number;
  minPayment: number;
  orderIndex: number;
  originalAmount: number;
  isPaidOff: boolean;
}

export interface MonthlySnapshotV1 {
  month: number;
  debts: {
    [debtId: string]: {
      interest: number;
      principal: number;
      balance: number;
      payment: number;
      isPaidOff?: boolean;
      minPaymentPlusRollover?: number;
      snowballRollover?: number;
    };
  };
  totalInterest: number;
  totalPrincipal: number;
  totalPayment: number;
  totalBalance: number;
  snowballPool: number;
}

export interface ForecastResultV1 {
  monthlySnapshots: MonthlySnapshotV1[];
  totalMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  freedomDate: string;
  errors?: string[];
}

/**
 * Validate debt inputs according to CP-2 spec
 */
function validateDebts(debts: UKDebt[]): string[] {
  const errors: string[] = [];
  
  debts.forEach((debt, index) => {
    // APR validation: 0-100
    if (debt.apr < 0 || debt.apr > 100) {
      errors.push(`Invalid APR: must be between 0 and 100`);
    }
    
    // Min payment validation: > 0
    if (debt.min_payment <= 0) {
      errors.push(`Invalid minimum payment: must be greater than 0`);
    }
    
    // Amount validation: >= 0
    if (debt.amount < 0) {
      errors.push(`Debt ${debt.name}: amount cannot be negative`);
    }
    
    // Min payment cannot exceed amount
    if (debt.min_payment > debt.amount) {
      errors.push(`Debt ${debt.name}: minimum payment cannot exceed amount`);
    }
  });
  
  return errors;
}

/**
 * Round to 2 decimal places (UK currency standard)
 */
function round2dp(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * CP-2 Single APR Snowball Simulator
 * 
 * @param debts - Array of UK debts to simulate
 * @param extraPerMonth - Additional payment per month (default 0)
 * @param startDate - Simulation start date (default today)
 * @returns Forecast results with monthly snapshots
 */
export function simulateSnowballPlanV1(
  debts: UKDebt[],
  extraPerMonth: number = 0,
  startDate: Date = new Date()
): ForecastResultV1 {
  // Validate inputs
  const validationErrors = validateDebts(debts);
  if (validationErrors.length > 0) {
    return {
      monthlySnapshots: [],
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      freedomDate: startDate.toISOString(),
      errors: validationErrors
    };
  }
  
  // Initialize working debts sorted by order_index
  const workingDebts: WorkingDebtV1[] = debts
    .sort((a, b) => a.order_index - b.order_index)
    .map(debt => ({
      id: debt.id,
      name: debt.name,
      currentBalance: debt.amount,
      apr: debt.apr,
      minPayment: debt.min_payment,
      orderIndex: debt.order_index,
      originalAmount: debt.original_amount || debt.amount,
      isPaidOff: false
    }));
  
  const monthlySnapshots: MonthlySnapshotV1[] = [];
  let snowballPool = 0;
  let month = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  // Maximum 600 months (50 years) to prevent infinite loops
  const MAX_MONTHS = 600;
  
  // Continue until all debts are paid or max months reached
  while (month < MAX_MONTHS && workingDebts.some(d => !d.isPaidOff)) {
    month++;
    
    const snapshot: MonthlySnapshotV1 = {
      month,
      debts: {},
      totalInterest: 0,
      totalPrincipal: 0,
      totalPayment: 0,
      totalBalance: 0,
      snowballPool
    };
    
    // Process each debt in order
    for (const debt of workingDebts) {
      if (debt.isPaidOff) {
        snapshot.debts[debt.id] = {
          interest: 0,
          principal: 0,
          balance: 0,
          payment: 0,
          isPaidOff: true
        };
        continue;
      }
      
      // Calculate monthly interest
      const monthlyInterestRate = debt.apr / 100 / 12;
      const interestCharge = round2dp(debt.currentBalance * monthlyInterestRate);
      
      // Determine payment amount
      let payment = debt.minPayment;
      
      // Add extra payment to first unpaid debt
      if (extraPerMonth > 0 && !workingDebts.slice(0, workingDebts.indexOf(debt)).some(d => !d.isPaidOff)) {
        payment += extraPerMonth;
      }
      
      // Add snowball rollover to first unpaid debt
      if (snowballPool > 0 && !workingDebts.slice(0, workingDebts.indexOf(debt)).some(d => !d.isPaidOff)) {
        payment += snowballPool;
        // We'll set these properties after creating the debt record
      }
      
      // Ensure payment doesn't exceed balance + interest
      const maxPayment = debt.currentBalance + interestCharge;
      payment = Math.min(payment, maxPayment);
      payment = round2dp(payment);
      
      // Calculate principal payment
      const principalPayment = round2dp(payment - interestCharge);
      
      // Update balance
      debt.currentBalance = round2dp(debt.currentBalance - principalPayment);
      
      // Check if debt is paid off
      if (debt.currentBalance <= 0) {
        debt.currentBalance = 0;
        debt.isPaidOff = true;
        
        // Add this debt's minimum payment to snowball pool
        snowballPool += debt.minPayment;
      }
      
      // Record snapshot data
      snapshot.debts[debt.id] = {
        interest: interestCharge,
        principal: principalPayment,
        balance: debt.currentBalance,
        payment: payment,
        isPaidOff: debt.isPaidOff
      };
      
      // Add snowball metadata if applicable
      if (snowballPool > 0 && !workingDebts.slice(0, workingDebts.indexOf(debt)).some(d => !d.isPaidOff)) {
        snapshot.debts[debt.id].minPaymentPlusRollover = payment;
        snapshot.debts[debt.id].snowballRollover = snowballPool;
      }
      
      // Update totals
      snapshot.totalInterest += interestCharge;
      snapshot.totalPrincipal += principalPayment;
      snapshot.totalPayment += payment;
      snapshot.totalBalance += debt.currentBalance;
      
      totalInterestPaid += interestCharge;
      totalPrincipalPaid += principalPayment;
    }
    
    // Round totals
    snapshot.totalInterest = round2dp(snapshot.totalInterest);
    snapshot.totalPrincipal = round2dp(snapshot.totalPrincipal);
    snapshot.totalPayment = round2dp(snapshot.totalPayment);
    snapshot.totalBalance = round2dp(snapshot.totalBalance);
    
    monthlySnapshots.push(snapshot);
    
    // Check if all debts are paid
    if (workingDebts.every(d => d.isPaidOff)) {
      break;
    }
  }
  
  // Calculate freedom date
  const freedomDate = new Date(startDate);
  freedomDate.setMonth(freedomDate.getMonth() + month);
  
  return {
    monthlySnapshots,
    totalMonths: month,
    totalInterestPaid: round2dp(totalInterestPaid),
    totalPrincipalPaid: round2dp(totalPrincipalPaid),
    freedomDate: freedomDate.toISOString(),
    errors: []
  };
}

/**
 * Generate a simple forecast summary for UI display
 */
export function generateForecastSummaryV1(result: ForecastResultV1): {
  monthsToClear: number;
  totalInterest: number;
  totalPayments: number;
  monthlyPayment: number;
  freedomDate: string;
} {
  const firstMonth = result.monthlySnapshots[0];
  const monthlyPayment = firstMonth ? firstMonth.totalPayment : 0;
  
  return {
    monthsToClear: result.totalMonths,
    totalInterest: result.totalInterestPaid,
    totalPayments: result.totalInterestPaid + result.totalPrincipalPaid,
    monthlyPayment: round2dp(monthlyPayment),
    freedomDate: result.freedomDate
  };
}

export default {
  simulateSnowballPlanV1,
  generateForecastSummaryV1
};