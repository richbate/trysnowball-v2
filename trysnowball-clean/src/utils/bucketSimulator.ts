/**
 * CP-4 Extended: Bucket-Aware Debt Simulation Engine
 * Handles per-bucket interest calculation and priority-based payment allocation
 * 
 * Critical Rules:
 * - Interest calculated per bucket (bucket.apr / 12)
 * - Payments allocated by priority (1 = highest, paid first)
 * - Snowball applies to highest priority unpaid bucket
 * - Bucket milestones tracked separately from debt milestones
 */

import { UKDebt, DebtBucket, hasMultiAPRBuckets } from '../types/UKDebt';
import { PlanResult, DebtSnapshot, ForecastSummary, SimulationInput } from '../types/Forecast';

/**
 * Enhanced debt snapshot with bucket-level detail
 */
interface BucketSnapshot {
  id: string;
  name: string;
  startingBalance: number;
  interestCharged: number;
  principalPaid: number;
  snowballApplied: number;
  endingBalance: number;
  apr: number;
  payment_priority: number;
  isPaidOff: boolean;
}

interface EnhancedDebtSnapshot extends DebtSnapshot {
  buckets?: BucketSnapshot[];
  effectiveAPR: number;
}

/**
 * Working bucket with runtime state
 */
interface WorkingBucket extends DebtBucket {
  currentBalance: number;
  isPaidOff: boolean;
}

/**
 * Working debt with bucket state
 */
interface WorkingDebt extends UKDebt {
  currentBalance: number;
  isPaidOff: boolean;
  workingBuckets?: WorkingBucket[];
}

/**
 * Main bucket-aware simulation engine
 */
export function simulateBucketAwareSnowballPlan(input: SimulationInput): PlanResult[] {
  const { debts, extraPerMonth } = input;
  
  if (!debts.length) return [];
  
  // Sort debts by order_index (snowball priority)
  const sortedDebts = [...debts].sort((a, b) => a.order_index - b.order_index);
  
  // Initialize working state
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
  
  while (workingDebts.some(debt => !debt.isPaidOff)) {
    const monthResult = simulateBucketAwareMonth(workingDebts, extraPerMonth, snowballPool, month);
    
    results.push({
      month,
      debts: monthResult.snapshots,
      totalBalance: monthResult.totalEndingBalance,
      totalInterest: monthResult.totalInterest,
      totalPrincipal: monthResult.totalPrincipal,
      snowballAmount: monthResult.snowballApplied
    });
    
    // Add newly paid debts to snowball pool
    const newlyPaidDebts = monthResult.snapshots.filter(snapshot => {
      const wasUnpaidBefore = workingDebts.find(d => d.id === snapshot.id && !d.isPaidOff);
      return snapshot.isPaidOff && wasUnpaidBefore;
    });
    
    for (const paidDebt of newlyPaidDebts) {
      const originalDebt = sortedDebts.find(d => d.id === paidDebt.id);
      if (originalDebt) {
        snowballPool += originalDebt.min_payment;
      }
    }
    
    workingDebts = monthResult.updatedDebts;
    month++;
    
    if (month > 600) {
      console.warn('Bucket simulation exceeded 50 years - breaking');
      break;
    }
  }
  
  return results;
}

/**
 * Simulate a single month with bucket awareness
 */
function simulateBucketAwareMonth(
  workingDebts: WorkingDebt[],
  extraPerMonth: number,
  snowballPool: number,
  monthNumber: number
) {
  const snapshots: EnhancedDebtSnapshot[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalEndingBalance = 0;
  
  // First pass: minimum payments and interest
  const updatedDebts = workingDebts.map(debt => {
    if (debt.isPaidOff) {
      snapshots.push(createPaidOffSnapshot(debt));
      return debt;
    }
    
    const result = hasMultiAPRBuckets(debt) && debt.workingBuckets
      ? simulateBucketedDebtMonth(debt, snapshots)
      : simulateSingleAPRDebtMonth(debt, snapshots);
    
    // Accumulate totals from the latest snapshot
    const latestSnapshot = snapshots[snapshots.length - 1];
    totalInterest += latestSnapshot.interestCharged;
    totalPrincipal += latestSnapshot.principalPaid;
    totalEndingBalance += latestSnapshot.endingBalance;
    
    return result;
  });
  
  // Second pass: apply snowball
  const extraAvailable = extraPerMonth + snowballPool;
  const snowballResult = applySnowballToBuckets(updatedDebts, snapshots, extraAvailable);
  
  totalPrincipal += snowballResult.additionalPrincipal;
  totalEndingBalance -= snowballResult.additionalPrincipal;
  
  return {
    snapshots,
    updatedDebts,
    totalInterest,
    totalPrincipal,
    totalEndingBalance: Math.max(0, totalEndingBalance),
    snowballApplied: snowballResult.snowballApplied
  };
}

/**
 * Simulate a bucketed debt for one month
 */
function simulateBucketedDebtMonth(
  debt: WorkingDebt,
  snapshots: EnhancedDebtSnapshot[]
): WorkingDebt {
  if (!debt.workingBuckets) {
    throw new Error('Bucketed debt missing buckets');
  }
  
  const bucketSnapshots: BucketSnapshot[] = [];
  let debtInterest = 0;
  let debtPrincipal = 0;
  let debtBalance = 0;
  
  // Sort buckets by payment priority (1 = highest)
  const sortedBuckets = [...debt.workingBuckets].sort((a, b) => a.payment_priority - b.payment_priority);
  let remainingMinPayment = debt.min_payment;
  
  // Process each bucket for interest and minimum payments
  const updatedBuckets = sortedBuckets.map(bucket => {
    if (bucket.isPaidOff) {
      bucketSnapshots.push(createPaidOffBucketSnapshot(bucket));
      return bucket;
    }
    
    // Calculate interest for this bucket
    const monthlyRate = (bucket.apr / 100) / 12;
    const interestCharged = Math.round(bucket.currentBalance * monthlyRate * 100) / 100;
    
    // Allocate minimum payment to this bucket (priority order)
    const bucketWeight = bucket.currentBalance / debt.currentBalance;
    const bucketMinPayment = Math.min(
      remainingMinPayment * bucketWeight,
      bucket.currentBalance + interestCharged
    );
    
    const principalFromMin = Math.max(0, bucketMinPayment - interestCharged);
    let endingBalance = bucket.currentBalance + interestCharged - bucketMinPayment;
    endingBalance = Math.round(endingBalance * 100) / 100;
    
    const isPaidOff = endingBalance <= 0;
    
    bucketSnapshots.push({
      id: bucket.id,
      name: bucket.name,
      startingBalance: bucket.currentBalance,
      interestCharged,
      principalPaid: principalFromMin,
      snowballApplied: 0, // Will be updated in snowball pass
      endingBalance: Math.max(0, endingBalance),
      apr: bucket.apr,
      payment_priority: bucket.payment_priority,
      isPaidOff
    });
    
    debtInterest += interestCharged;
    debtPrincipal += principalFromMin;
    debtBalance += Math.max(0, endingBalance);
    remainingMinPayment -= bucketMinPayment;
    
    return {
      ...bucket,
      currentBalance: Math.max(0, endingBalance),
      isPaidOff
    };
  });
  
  // Calculate effective APR (weighted average)
  const totalBucketBalance = updatedBuckets.reduce((sum, b) => sum + b.currentBalance, 0);
  const effectiveAPR = totalBucketBalance > 0 
    ? updatedBuckets.reduce((sum, bucket) => {
        const weight = bucket.currentBalance / totalBucketBalance;
        return sum + (bucket.apr * weight);
      }, 0)
    : debt.apr;
  
  const debtIsPaidOff = updatedBuckets.every(bucket => bucket.isPaidOff);
  
  snapshots.push({
    id: debt.id,
    name: debt.name,
    startingBalance: debt.currentBalance,
    interestCharged: debtInterest,
    principalPaid: debtPrincipal,
    snowballApplied: 0, // Will be updated in snowball pass
    endingBalance: debtBalance,
    isPaidOff: debtIsPaidOff,
    buckets: bucketSnapshots,
    effectiveAPR
  });
  
  // Note: totals are accumulated in parent function
  
  return {
    ...debt,
    currentBalance: debtBalance,
    isPaidOff: debtIsPaidOff,
    workingBuckets: updatedBuckets
  };
}

/**
 * Simulate single APR debt (fallback)
 */
function simulateSingleAPRDebtMonth(
  debt: WorkingDebt,
  snapshots: EnhancedDebtSnapshot[]
): WorkingDebt {
  const startingBalance = debt.currentBalance;
  const monthlyRate = (debt.apr / 100) / 12;
  const interestCharged = Math.round(startingBalance * monthlyRate * 100) / 100;
  
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
  
  // Note: totals are accumulated in parent function
  
  return {
    ...debt,
    currentBalance: Math.max(0, endingBalance),
    isPaidOff
  };
}

/**
 * Apply snowball payments to highest priority debt/bucket
 */
function applySnowballToBuckets(
  debts: WorkingDebt[],
  snapshots: EnhancedDebtSnapshot[],
  extraAvailable: number
) {
  if (extraAvailable <= 0) {
    return { snowballApplied: 0, additionalPrincipal: 0 };
  }
  
  // Find first unpaid debt
  const targetDebtIndex = debts.findIndex(debt => !debt.isPaidOff);
  if (targetDebtIndex === -1) {
    return { snowballApplied: 0, additionalPrincipal: 0 };
  }
  
  const targetDebt = debts[targetDebtIndex];
  const targetSnapshot = snapshots[targetDebtIndex];
  
  if (hasMultiAPRBuckets(targetDebt) && targetSnapshot.buckets) {
    return applySnowballToBucketedDebt(targetDebt, targetSnapshot, extraAvailable);
  } else {
    return applySnowballToSingleDebt(targetDebt, targetSnapshot, extraAvailable);
  }
}

/**
 * Apply snowball to bucketed debt (highest priority bucket first)
 */
function applySnowballToBucketedDebt(
  debt: WorkingDebt,
  snapshot: EnhancedDebtSnapshot,
  extraAvailable: number
) {
  if (!snapshot.buckets || !debt.workingBuckets) {
    return { snowballApplied: 0, additionalPrincipal: 0 };
  }
  
  let remainingExtra = extraAvailable;
  let totalApplied = 0;
  
  // Sort by payment priority and apply extra to first unpaid bucket
  const sortedBuckets = [...snapshot.buckets].sort((a, b) => a.payment_priority - b.payment_priority);
  
  for (const bucketSnapshot of sortedBuckets) {
    if (remainingExtra <= 0 || bucketSnapshot.endingBalance <= 0) continue;
    
    const extraForBucket = Math.min(remainingExtra, bucketSnapshot.endingBalance);
    
    bucketSnapshot.snowballApplied = extraForBucket;
    bucketSnapshot.principalPaid += extraForBucket;
    bucketSnapshot.endingBalance -= extraForBucket;
    bucketSnapshot.endingBalance = Math.round(bucketSnapshot.endingBalance * 100) / 100;
    bucketSnapshot.isPaidOff = bucketSnapshot.endingBalance <= 0;
    
    // Update working bucket
    const workingBucket = debt.workingBuckets!.find(b => b.id === bucketSnapshot.id);
    if (workingBucket) {
      workingBucket.currentBalance = Math.max(0, bucketSnapshot.endingBalance);
      workingBucket.isPaidOff = bucketSnapshot.isPaidOff;
    }
    
    remainingExtra -= extraForBucket;
    totalApplied += extraForBucket;
    
    // For snowball method, we only pay extra to the first unpaid bucket
    break;
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
 * Apply snowball to single APR debt
 */
function applySnowballToSingleDebt(
  debt: WorkingDebt,
  snapshot: EnhancedDebtSnapshot,
  extraAvailable: number
) {
  const extraToApply = Math.min(extraAvailable, snapshot.endingBalance);
  
  snapshot.snowballApplied = extraToApply;
  snapshot.principalPaid += extraToApply;
  snapshot.endingBalance -= extraToApply;
  snapshot.endingBalance = Math.round(snapshot.endingBalance * 100) / 100;
  snapshot.isPaidOff = snapshot.endingBalance <= 0;
  
  debt.currentBalance = Math.max(0, snapshot.endingBalance);
  debt.isPaidOff = snapshot.isPaidOff;
  
  return { snowballApplied: extraToApply, additionalPrincipal: extraToApply };
}

/**
 * Helper functions for snapshots
 */
function createPaidOffSnapshot(debt: WorkingDebt): EnhancedDebtSnapshot {
  return {
    id: debt.id,
    name: debt.name,
    startingBalance: 0,
    interestCharged: 0,
    principalPaid: 0,
    snowballApplied: 0,
    endingBalance: 0,
    isPaidOff: true,
    effectiveAPR: debt.apr
  };
}

function createPaidOffBucketSnapshot(bucket: WorkingBucket): BucketSnapshot {
  return {
    id: bucket.id,
    name: bucket.name,
    startingBalance: 0,
    interestCharged: 0,
    principalPaid: 0,
    snowballApplied: 0,
    endingBalance: 0,
    apr: bucket.apr,
    payment_priority: bucket.payment_priority,
    isPaidOff: true
  };
}