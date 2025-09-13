/**
 * CP-4 Snowball Simulation Engine
 * Traditional snowball: Pay minimums + all extra to lowest balance
 * Respects user-defined order field, monthly compound interest
 */

import { UKDebt } from '../types/UKDebt';
import { PlanResult, DebtSnapshot, ForecastSummary, SimulationInput, MilestoneDate } from '../types/Forecast';

/**
 * Main simulation engine - returns month-by-month breakdown
 */
export function simulateSnowballPlan(input: SimulationInput): PlanResult[] {
  const { debts, extraPerMonth } = input;
  
  if (!debts.length) return [];
  
  // Sort debts by order field (user-defined snowball sequence)
  // Lower order_index = higher priority (paid off first)
  const sortedDebts = [...debts].sort((a, b) => a.order_index - b.order_index);
  
  // Initialize working debt balances
  let workingDebts = sortedDebts.map(debt => ({
    ...debt,
    currentBalance: debt.amount,
    isPaidOff: false
  }));
  
  const results: PlanResult[] = [];
  let month = 1;
  let snowballPool = 0; // Accumulates from paid-off debts
  
  // Continue simulation until all debts are paid off
  while (workingDebts.some(debt => !debt.isPaidOff)) {
    const monthResult = simulateMonth(workingDebts, extraPerMonth, snowballPool, month);
    
    results.push({
      month,
      debts: monthResult.snapshots,
      totalBalance: monthResult.totalEndingBalance,
      totalInterest: monthResult.totalInterest,
      totalPrincipal: monthResult.totalPrincipal,
      snowballAmount: monthResult.snowballApplied
    });
    
    // Check which debts were paid off this month (for snowball rollover)
    const newlyPaidDebts = monthResult.snapshots.filter(snapshot => {
      const wasUnpaidBefore = workingDebts.find(d => d.id === snapshot.id && !d.isPaidOff);
      return snapshot.isPaidOff && wasUnpaidBefore;
    });
    
    // Update working debts for next month
    workingDebts = monthResult.updatedDebts;
    
    // Add newly paid-off debts' minimum payments to snowball pool for NEXT month
    for (const paidDebt of newlyPaidDebts) {
      const originalDebt = sortedDebts.find(d => d.id === paidDebt.id);
      if (originalDebt) {
        snowballPool += originalDebt.min_payment;
      }
    }
    
    month++;
    
    // Safety valve: prevent infinite loops
    if (month > 600) { // 50 years maximum
      console.warn('Simulation exceeded 50 years - breaking loop');
      break;
    }
  }
  
  return results;
}

/**
 * Simulate a single month's payments
 */
function simulateMonth(
  workingDebts: Array<UKDebt & { currentBalance: number; isPaidOff: boolean }>,
  extraPerMonth: number,
  snowballPool: number,
  monthNumber: number
) {
  const snapshots: DebtSnapshot[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalEndingBalance = 0;
  let remainingExtra = monthNumber === 1 ? 0 : extraPerMonth; // Extra starts month 2
  let remainingSnowball = snowballPool;
  
  // First pass: pay minimums and calculate interest
  const updatedDebts = workingDebts.map(debt => {
    if (debt.isPaidOff) {
      // Debt already paid off - no activity
      snapshots.push({
        id: debt.id,
        name: debt.name,
        startingBalance: 0,
        interestCharged: 0,
        principalPaid: 0,
        snowballApplied: 0,
        endingBalance: 0,
        isPaidOff: true
      });
      return debt;
    }
    
    const startingBalance = debt.currentBalance;
    
    // Calculate monthly interest: APR / 12, rounded to pence
    const monthlyInterestRate = (debt.apr / 100) / 12;
    const interestCharged = Math.round(startingBalance * monthlyInterestRate * 100) / 100;
    
    // Pay minimum payment (if balance allows)
    const availableForPayment = startingBalance + interestCharged;
    const minPayment = Math.min(debt.min_payment, availableForPayment);
    const principalFromMin = Math.max(0, minPayment - interestCharged);
    
    let endingBalance = startingBalance + interestCharged - minPayment;
    let principalPaid = principalFromMin;
    
    // Round ending balance to pence
    endingBalance = Math.round(endingBalance * 100) / 100;
    
    const isPaidOff = endingBalance <= 0;
    
    snapshots.push({
      id: debt.id,
      name: debt.name,
      startingBalance,
      interestCharged,
      principalPaid,
      snowballApplied: 0, // Will be updated in second pass
      endingBalance: Math.max(0, endingBalance),
      isPaidOff
    });
    
    totalInterest += interestCharged;
    totalPrincipal += principalPaid;
    totalEndingBalance += Math.max(0, endingBalance);
    
    return {
      ...debt,
      currentBalance: Math.max(0, endingBalance),
      isPaidOff
    };
  });
  
  // Second pass: apply extra payments and snowball to lowest balance debt
  const totalExtraAvailable = remainingExtra + remainingSnowball;
  let snowballApplied = 0;
  
  if (totalExtraAvailable > 0) {
    // Find first unpaid debt (lowest order_index)
    const targetDebtIndex = updatedDebts.findIndex(debt => !debt.isPaidOff);
    
    if (targetDebtIndex !== -1) {
      const targetDebt = updatedDebts[targetDebtIndex];
      const targetSnapshot = snapshots[targetDebtIndex];
      
      // Apply extra to this debt
      const extraToApply = Math.min(totalExtraAvailable, targetSnapshot.endingBalance);
      
      targetSnapshot.snowballApplied = extraToApply;
      targetSnapshot.principalPaid += extraToApply;
      targetSnapshot.endingBalance -= extraToApply;
      targetSnapshot.endingBalance = Math.round(targetSnapshot.endingBalance * 100) / 100;
      targetSnapshot.isPaidOff = targetSnapshot.endingBalance <= 0;
      
      // Update working debt
      targetDebt.currentBalance = Math.max(0, targetSnapshot.endingBalance);
      targetDebt.isPaidOff = targetSnapshot.isPaidOff;
      
      totalPrincipal += extraToApply;
      totalEndingBalance -= extraToApply;
      snowballApplied = extraToApply;
    }
  }
  
  return {
    snapshots,
    updatedDebts,
    totalInterest,
    totalPrincipal,
    totalEndingBalance: Math.max(0, totalEndingBalance),
    snowballApplied
  };
}

/**
 * Generate summary statistics from simulation results
 */
export function generateForecastSummary(
  results: PlanResult[],
  startDate: Date = new Date()
): ForecastSummary {
  if (!results.length) {
    return {
      totalMonths: 0,
      debtFreeDate: 'No debts',
      totalInterestPaid: 0,
      interestSavedVsMinimum: 0,
      firstDebtClearedMonth: 0,
      milestoneDates: []
    };
  }
  
  const totalMonths = results.length;
  const totalInterestPaid = results.reduce((sum, month) => sum + month.totalInterest, 0);
  
  // Calculate debt-free date
  const debtFreeDate = new Date(startDate);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + totalMonths);
  
  // Find milestone dates (when each debt gets paid off)
  const milestoneDates: MilestoneDate[] = [];
  const seenDebtIds = new Set<string>();
  
  for (const result of results) {
    for (const debt of result.debts) {
      if (debt.isPaidOff && !seenDebtIds.has(debt.id)) {
        seenDebtIds.add(debt.id);
        
        const milestoneDate = new Date(startDate);
        milestoneDate.setMonth(milestoneDate.getMonth() + result.month);
        
        milestoneDates.push({
          debtName: debt.name,
          monthCleared: result.month,
          dateCleared: milestoneDate.toLocaleDateString('en-GB', { 
            month: 'long', 
            year: 'numeric' 
          })
        });
      }
    }
  }
  
  return {
    totalMonths,
    debtFreeDate: debtFreeDate.toLocaleDateString('en-GB', { 
      month: 'long', 
      year: 'numeric' 
    }),
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    interestSavedVsMinimum: 0, // TODO: Calculate vs minimum-only scenario
    firstDebtClearedMonth: milestoneDates.length > 0 ? milestoneDates[0].monthCleared : 0,
    milestoneDates
  };
}