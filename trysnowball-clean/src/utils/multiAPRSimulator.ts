/**
 * CP-4 Extended: Multi-APR Snowball Simulation Engine
 * Handles both single APR and bucketed debt scenarios
 * Experimental pro feature for realistic UK credit card modeling
 */

import { UKDebt, DebtBucket, hasMultiAPRBuckets } from '../types/UKDebt';
import { PlanResult, DebtSnapshot, ForecastSummary, SimulationInput, MilestoneDate } from '../types/Forecast';

/**
 * Enhanced debt snapshot for bucketed debts
 */
export interface BucketSnapshot {
  id: string;
  name: string;
  startingBalance: number;
  interestCharged: number;
  principalPaid: number;
  endingBalance: number;
  apr: number;
  payment_priority: number;
}

export interface EnhancedDebtSnapshot extends DebtSnapshot {
  buckets?: BucketSnapshot[];
  effectiveAPR?: number;
}

/**
 * Working debt with bucket tracking
 */
interface WorkingDebt extends UKDebt {
  currentBalance: number;
  isPaidOff: boolean;
  workingBuckets?: Array<DebtBucket & { currentBalance: number; isPaidOff: boolean }>;
}

/**
 * Enhanced simulation engine that handles both single APR and bucketed debts
 */
export function simulateEnhancedSnowballPlan(input: SimulationInput): PlanResult[] {
  const { debts, extraPerMonth } = input;
  
  if (!debts.length) return [];
  
  // Sort debts by order field (user-defined snowball sequence)
  const sortedDebts = [...debts].sort((a, b) => a.order_index - b.order_index);
  
  // Initialize working debt balances
  let workingDebts: WorkingDebt[] = sortedDebts.map(debt => ({
    ...debt,
    currentBalance: debt.amount,
    isPaidOff: false,
    workingBuckets: hasMultiAPRBuckets(debt) 
      ? debt.buckets!.map(bucket => ({
          ...bucket,
          currentBalance: bucket.balance,
          isPaidOff: false
        }))
      : undefined
  }));
  
  const results: PlanResult[] = [];
  let month = 1;
  let snowballPool = 0;
  
  // Continue simulation until all debts are paid off
  while (workingDebts.some(debt => !debt.isPaidOff)) {
    const monthResult = simulateEnhancedMonth(workingDebts, extraPerMonth, snowballPool, month);
    
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
    
    // Add newly paid-off debts' minimum payments to snowball pool
    for (const paidDebt of newlyPaidDebts) {
      const originalDebt = sortedDebts.find(d => d.id === paidDebt.id);
      if (originalDebt) {
        snowballPool += originalDebt.min_payment;
      }
    }
    
    month++;
    
    // Safety valve: prevent infinite loops
    if (month > 600) {
      console.warn('Enhanced simulation exceeded 50 years - breaking loop');
      break;
    }
  }
  
  return results;
}

/**
 * Simulate a single month with enhanced bucket support
 */
function simulateEnhancedMonth(
  workingDebts: WorkingDebt[],
  extraPerMonth: number,
  snowballPool: number,
  monthNumber: number
) {
  const snapshots: EnhancedDebtSnapshot[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalEndingBalance = 0;
  let remainingExtra = monthNumber === 1 ? 0 : extraPerMonth;
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
    
    if (hasMultiAPRBuckets(debt) && debt.workingBuckets) {
      // Multi-APR bucket debt simulation
      const result = simulateMultiAPRDebt(debt, snapshots);
      totalInterest += result.debtInterest;
      totalPrincipal += result.debtPrincipal;
      totalEndingBalance += result.debtEndingBalance;
      return result.debt;
    } else {
      // Single APR debt simulation (existing logic)
      const result = simulateSingleAPRDebt(debt, snapshots);
      totalInterest += result.debtInterest;
      totalPrincipal += result.debtPrincipal;
      totalEndingBalance += result.debtEndingBalance;
      return result.debt;
    }
  });
  
  // Second pass: apply extra payments and snowball
  const totalExtraAvailable = remainingExtra + remainingSnowball;
  let snowballApplied = 0;
  
  if (totalExtraAvailable > 0) {
    const result = applySnowballPayments(updatedDebts, snapshots, totalExtraAvailable);
    snowballApplied = result.snowballApplied;
    totalPrincipal += result.additionalPrincipal;
    totalEndingBalance -= result.additionalPrincipal;
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
 * Simulate a single APR debt (existing logic)
 */
function simulateSingleAPRDebt(
  debt: WorkingDebt,
  snapshots: EnhancedDebtSnapshot[]
): { debt: WorkingDebt; debtInterest: number; debtPrincipal: number; debtEndingBalance: number } {
  const startingBalance = debt.currentBalance;
  
  // Calculate monthly interest
  const monthlyInterestRate = (debt.apr / 100) / 12;
  const interestCharged = Math.round(startingBalance * monthlyInterestRate * 100) / 100;
  
  // Pay minimum payment
  const availableForPayment = startingBalance + interestCharged;
  const minPayment = Math.min(debt.min_payment, availableForPayment);
  const principalFromMin = Math.max(0, minPayment - interestCharged);
  
  let endingBalance = startingBalance + interestCharged - minPayment;
  endingBalance = Math.round(endingBalance * 100) / 100;
  
  const isPaidOff = endingBalance <= 0;
  
  snapshots.push({
    id: debt.id,
    name: debt.name,
    startingBalance,
    interestCharged,
    principalPaid: principalFromMin,
    snowballApplied: 0,
    endingBalance: Math.max(0, endingBalance),
    isPaidOff,
    effectiveAPR: debt.apr
  });
  
  return {
    debt: {
      ...debt,
      currentBalance: Math.max(0, endingBalance),
      isPaidOff
    },
    debtInterest: interestCharged,
    debtPrincipal: principalFromMin,
    debtEndingBalance: Math.max(0, endingBalance)
  };
}

/**
 * Simulate a multi-APR bucketed debt
 */
function simulateMultiAPRDebt(
  debt: WorkingDebt,
  snapshots: EnhancedDebtSnapshot[]
): { debt: WorkingDebt; debtInterest: number; debtPrincipal: number; debtEndingBalance: number } {
  if (!debt.workingBuckets) {
    throw new Error('Multi-APR debt missing working buckets');
  }
  
  const bucketSnapshots: BucketSnapshot[] = [];
  let debtInterest = 0;
  let debtPrincipal = 0;
  let debtEndingBalance = 0;
  
  // Sort buckets by payment priority (1 = highest priority)
  const sortedBuckets = [...debt.workingBuckets].sort((a, b) => a.payment_priority - b.payment_priority);
  
  // Calculate remaining minimum payment after interest
  let remainingMinPayment = debt.min_payment;
  
  // Process each bucket
  const updatedBuckets = sortedBuckets.map(bucket => {
    if (bucket.isPaidOff) {
      bucketSnapshots.push({
        id: bucket.id,
        name: bucket.name,
        startingBalance: 0,
        interestCharged: 0,
        principalPaid: 0,
        endingBalance: 0,
        apr: bucket.apr,
        payment_priority: bucket.payment_priority
      });
      return bucket;
    }
    
    const startingBalance = bucket.currentBalance;
    
    // Calculate interest for this bucket
    const monthlyInterestRate = (bucket.apr / 100) / 12;
    const interestCharged = Math.round(startingBalance * monthlyInterestRate * 100) / 100;
    
    // Apply portion of minimum payment to this bucket
    const bucketWeight = startingBalance / debt.currentBalance;
    const bucketMinPayment = Math.min(remainingMinPayment * bucketWeight, startingBalance + interestCharged);
    const principalFromMin = Math.max(0, bucketMinPayment - interestCharged);
    
    let endingBalance = startingBalance + interestCharged - bucketMinPayment;
    endingBalance = Math.round(endingBalance * 100) / 100;
    
    const isPaidOff = endingBalance <= 0;
    
    bucketSnapshots.push({
      id: bucket.id,
      name: bucket.name,
      startingBalance,
      interestCharged,
      principalPaid: principalFromMin,
      endingBalance: Math.max(0, endingBalance),
      apr: bucket.apr,
      payment_priority: bucket.payment_priority
    });
    
    debtInterest += interestCharged;
    debtPrincipal += principalFromMin;
    debtEndingBalance += Math.max(0, endingBalance);
    remainingMinPayment -= bucketMinPayment;
    
    return {
      ...bucket,
      currentBalance: Math.max(0, endingBalance),
      isPaidOff
    };
  });
  
  // Calculate weighted average APR for the debt
  const effectiveAPR = debt.workingBuckets.reduce((sum, bucket) => {
    const weight = bucket.currentBalance / debt.currentBalance;
    return sum + (bucket.apr * weight);
  }, 0);
  
  const debtIsPaidOff = updatedBuckets.every(bucket => bucket.isPaidOff);
  
  snapshots.push({
    id: debt.id,
    name: debt.name,
    startingBalance: debt.currentBalance,
    interestCharged: debtInterest,
    principalPaid: debtPrincipal,
    snowballApplied: 0,
    endingBalance: debtEndingBalance,
    isPaidOff: debtIsPaidOff,
    buckets: bucketSnapshots,
    effectiveAPR
  });
  
  return {
    debt: {
      ...debt,
      currentBalance: debtEndingBalance,
      isPaidOff: debtIsPaidOff,
      workingBuckets: updatedBuckets
    },
    debtInterest,
    debtPrincipal,
    debtEndingBalance
  };
}

/**
 * Apply snowball payments to the highest priority debt
 */
function applySnowballPayments(
  updatedDebts: WorkingDebt[],
  snapshots: EnhancedDebtSnapshot[],
  totalExtraAvailable: number
) {
  // Find first unpaid debt (lowest order_index)
  const targetDebtIndex = updatedDebts.findIndex(debt => !debt.isPaidOff);
  
  if (targetDebtIndex === -1) {
    return { snowballApplied: 0, additionalPrincipal: 0 };
  }
  
  const targetDebt = updatedDebts[targetDebtIndex];
  const targetSnapshot = snapshots[targetDebtIndex];
  
  if (hasMultiAPRBuckets(targetDebt) && targetSnapshot.buckets) {
    // Apply snowball to highest priority bucket in target debt
    return applySnowballToBuckets(targetDebt, targetSnapshot, totalExtraAvailable);
  } else {
    // Apply snowball to single APR debt
    const extraToApply = Math.min(totalExtraAvailable, targetSnapshot.endingBalance);
    
    targetSnapshot.snowballApplied = extraToApply;
    targetSnapshot.principalPaid += extraToApply;
    targetSnapshot.endingBalance -= extraToApply;
    targetSnapshot.endingBalance = Math.round(targetSnapshot.endingBalance * 100) / 100;
    targetSnapshot.isPaidOff = targetSnapshot.endingBalance <= 0;
    
    targetDebt.currentBalance = Math.max(0, targetSnapshot.endingBalance);
    targetDebt.isPaidOff = targetSnapshot.isPaidOff;
    
    return { snowballApplied: extraToApply, additionalPrincipal: extraToApply };
  }
}

/**
 * Apply snowball payments to bucketed debt
 */
function applySnowballToBuckets(
  debt: WorkingDebt,
  snapshot: EnhancedDebtSnapshot,
  totalExtraAvailable: number
) {
  if (!snapshot.buckets || !debt.workingBuckets) {
    return { snowballApplied: 0, additionalPrincipal: 0 };
  }
  
  let remainingExtra = totalExtraAvailable;
  let totalApplied = 0;
  
  // Sort buckets by payment priority and apply extra payments
  const sortedBuckets = [...snapshot.buckets].sort((a, b) => a.payment_priority - b.payment_priority);
  
  for (const bucketSnapshot of sortedBuckets) {
    if (remainingExtra <= 0 || bucketSnapshot.endingBalance <= 0) continue;
    
    const extraForThisBucket = Math.min(remainingExtra, bucketSnapshot.endingBalance);
    
    bucketSnapshot.principalPaid += extraForThisBucket;
    bucketSnapshot.endingBalance -= extraForThisBucket;
    bucketSnapshot.endingBalance = Math.round(bucketSnapshot.endingBalance * 100) / 100;
    
    // Update working bucket
    const workingBucket = debt.workingBuckets.find(b => b.id === bucketSnapshot.id);
    if (workingBucket) {
      workingBucket.currentBalance = Math.max(0, bucketSnapshot.endingBalance);
      workingBucket.isPaidOff = bucketSnapshot.endingBalance <= 0;
    }
    
    remainingExtra -= extraForThisBucket;
    totalApplied += extraForThisBucket;
  }
  
  // Update debt-level snapshot
  snapshot.snowballApplied = totalApplied;
  snapshot.principalPaid += totalApplied;
  snapshot.endingBalance -= totalApplied;
  snapshot.endingBalance = Math.round(snapshot.endingBalance * 100) / 100;
  snapshot.isPaidOff = snapshot.endingBalance <= 0;
  
  // Update working debt
  debt.currentBalance = Math.max(0, snapshot.endingBalance);
  debt.isPaidOff = snapshot.isPaidOff;
  
  return { snowballApplied: totalApplied, additionalPrincipal: totalApplied };
}

/**
 * Enhanced forecast summary generation
 */
export function generateEnhancedForecastSummary(
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
  
  // Find milestone dates
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