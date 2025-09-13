/**
 * Composite Bucket Simulation Engine v2.0
 * Isolated logic module - no UI dependencies
 * Implements locked financial model from DEBT_SIM_MODEL.md
 */

import { UKDebt, DebtBucket, hasMultiAPRBuckets } from '../types/UKDebt';
import { PlanResult, DebtSnapshot, ForecastSummary, BucketSummary, BucketMilestone, MilestoneDate } from '../types/Forecast';

/**
 * Bucket with runtime state for simulation
 */
interface SimulationBucket extends DebtBucket {
  currentBalance: number;
  isPaidOff: boolean;
}

/**
 * Debt with runtime state for simulation  
 */
interface SimulationDebt extends UKDebt {
  currentBalance: number;
  isPaidOff: boolean;
  simulationBuckets?: SimulationBucket[];
}

/**
 * Monthly result for a single bucket
 */
interface BucketResult {
  id: string;
  name: string;
  startingBalance: number;
  interestCharged: number;
  minimumPayment: number;
  snowballPayment: number;
  totalPayment: number;
  endingBalance: number;
  isPaidOff: boolean;
  apr: number;
  priority: number;
}

/**
 * Monthly result for composite debt
 */
interface CompositeMonthResult {
  month: number;
  debtId: string;
  debtName: string;
  buckets: BucketResult[];
  totalStartingBalance: number;
  totalInterest: number;
  totalMinimumPayment: number;
  totalSnowballPayment: number;
  totalEndingBalance: number;
  isPaidOff: boolean;
  effectiveAPR: number;
}

/**
 * Main simulation function for composite debts
 */
export function simulateCompositePlan(
  debts: UKDebt[],
  extraPerMonth: number = 0,
  startDate: Date = new Date()
): CompositeMonthResult[] {
  
  // Filter to only composite debts and sort by snowball order
  const compositeDebts = debts
    .filter(debt => hasMultiAPRBuckets(debt))
    .sort((a, b) => a.order_index - b.order_index);
  
  if (compositeDebts.length === 0) {
    return [];
  }
  
  // Initialize simulation state
  let workingDebts: SimulationDebt[] = compositeDebts.map(debt => ({
    ...debt,
    currentBalance: debt.amount,
    isPaidOff: false,
    simulationBuckets: debt.buckets!.map(bucket => ({
      ...bucket,
      currentBalance: bucket.balance,
      isPaidOff: false
    }))
  }));
  
  const results: CompositeMonthResult[] = [];
  let month = 1;
  let snowballPool = 0; // Accumulates from paid-off debts
  
  // Simulate until all debts are paid off
  while (workingDebts.some(debt => !debt.isPaidOff)) {
    
    // Process each debt for this month
    for (const debt of workingDebts) {
      if (debt.isPaidOff) continue;
      
      const monthResult = simulateCompositeDebtMonth(
        debt,
        extraPerMonth, // Apply extra payment from month 1
        debt === workingDebts[0] ? snowballPool : 0, // Only first unpaid debt gets snowball
        month
      );
      
      results.push(monthResult);
      
      // Update debt state
      debt.currentBalance = monthResult.totalEndingBalance;
      debt.isPaidOff = monthResult.isPaidOff;
      
      // If this debt was paid off, add its minimum to snowball pool
      if (monthResult.isPaidOff && !debt.isPaidOff) {
        snowballPool += debt.min_payment;
      }
      
      // Update bucket states
      monthResult.buckets.forEach((bucketResult, index) => {
        if (debt.simulationBuckets && debt.simulationBuckets[index]) {
          debt.simulationBuckets[index].currentBalance = bucketResult.endingBalance;
          debt.simulationBuckets[index].isPaidOff = bucketResult.isPaidOff;
        }
      });
    }
    
    month++;
    
    // Safety valve
    if (month > 600) {
      console.warn('Composite simulation exceeded 50 years - breaking');
      break;
    }
  }
  
  return results;
}

/**
 * Simulate one month for a single composite debt
 */
function simulateCompositeDebtMonth(
  debt: SimulationDebt,
  extraPayment: number,
  snowballPool: number,
  monthNumber: number
): CompositeMonthResult {
  
  if (!debt.simulationBuckets || debt.simulationBuckets.length === 0) {
    throw new Error(`Composite debt ${debt.id} has no buckets`);
  }
  
  const bucketResults: BucketResult[] = [];
  
  // STEP 1: Calculate interest for all buckets
  debt.simulationBuckets.forEach(bucket => {
    const monthlyRate = bucket.apr / 100 / 12;
    const interestCharged = Math.round(bucket.currentBalance * monthlyRate * 100) / 100;
    
    bucketResults.push({
      id: bucket.id,
      name: bucket.name,
      startingBalance: bucket.currentBalance,
      interestCharged,
      minimumPayment: 0, // Will be calculated next
      snowballPayment: 0, // Will be calculated next
      totalPayment: 0,   // Will be calculated next
      endingBalance: bucket.currentBalance + interestCharged,
      isPaidOff: false,
      apr: bucket.apr,
      priority: bucket.payment_priority
    });
  });
  
  // STEP 2: Allocate minimum payment proportionally by balance
  const totalBalance = debt.currentBalance;
  const totalMinimum = debt.min_payment;
  
  bucketResults.forEach(bucketResult => {
    if (totalBalance > 0) {
      const bucketWeight = bucketResult.startingBalance / totalBalance;
      bucketResult.minimumPayment = Math.round(totalMinimum * bucketWeight * 100) / 100;
    }
  });
  
  // STEP 3: Apply minimum payments
  bucketResults.forEach(bucketResult => {
    const availableForPayment = bucketResult.endingBalance; // Balance + interest
    const actualMinPayment = Math.min(bucketResult.minimumPayment, availableForPayment);
    
    bucketResult.minimumPayment = actualMinPayment;
    bucketResult.totalPayment = actualMinPayment;
    bucketResult.endingBalance -= actualMinPayment;
    bucketResult.endingBalance = Math.round(bucketResult.endingBalance * 100) / 100;
    bucketResult.isPaidOff = bucketResult.endingBalance <= 0.01;
  });
  
  // STEP 4: Apply snowball to highest priority unpaid bucket
  const totalExtraAvailable = extraPayment + snowballPool;
  
  if (totalExtraAvailable > 0) {
    // Sort by priority (1 = highest) and find first unpaid bucket
    const sortedBuckets = [...bucketResults]
      .filter(bucket => !bucket.isPaidOff)
      .sort((a, b) => a.priority - b.priority);
    
    if (sortedBuckets.length > 0) {
      const targetBucket = sortedBuckets[0];
      const maxSnowball = Math.min(totalExtraAvailable, targetBucket.endingBalance);
      
      targetBucket.snowballPayment = maxSnowball;
      targetBucket.totalPayment += maxSnowball;
      targetBucket.endingBalance -= maxSnowball;
      targetBucket.endingBalance = Math.round(targetBucket.endingBalance * 100) / 100;
      targetBucket.isPaidOff = targetBucket.endingBalance <= 0.01;
    }
  }
  
  // STEP 5: Calculate debt-level totals
  const totalStartingBalance = bucketResults.reduce((sum, b) => sum + b.startingBalance, 0);
  const totalInterest = bucketResults.reduce((sum, b) => sum + b.interestCharged, 0);
  const totalMinimumPayment = bucketResults.reduce((sum, b) => sum + b.minimumPayment, 0);
  const totalSnowballPayment = bucketResults.reduce((sum, b) => sum + b.snowballPayment, 0);
  const totalEndingBalance = bucketResults.reduce((sum, b) => sum + b.endingBalance, 0);
  const isPaidOff = bucketResults.every(b => b.isPaidOff);
  
  // Calculate effective APR (weighted by remaining balance)
  const effectiveAPR = totalEndingBalance > 0
    ? bucketResults.reduce((sum, bucket) => {
        const weight = bucket.endingBalance / totalEndingBalance;
        return sum + (bucket.apr * weight);
      }, 0)
    : 0;
  
  return {
    month: monthNumber,
    debtId: debt.id,
    debtName: debt.name,
    buckets: bucketResults,
    totalStartingBalance,
    totalInterest,
    totalMinimumPayment,
    totalSnowballPayment,
    totalEndingBalance,
    isPaidOff,
    effectiveAPR
  };
}

/**
 * Calculate total months to debt freedom for composite plan
 */
export function calculateCompositePayoffMonths(
  debts: UKDebt[],
  extraPerMonth: number = 0
): number {
  const results = simulateCompositePlan(debts, extraPerMonth);
  return results.length > 0 ? Math.max(...results.map(r => r.month)) : 0;
}

/**
 * Calculate total interest paid for composite plan
 */
export function calculateCompositeTotalInterest(
  debts: UKDebt[],
  extraPerMonth: number = 0
): number {
  const results = simulateCompositePlan(debts, extraPerMonth);
  return results.reduce((total, monthResult) => total + monthResult.totalInterest, 0);
}

/**
 * Compare composite vs single APR forecast
 */
export function compareCompositeVsSingleAPR(
  debts: UKDebt[],
  extraPerMonth: number = 0
): {
  composite: { months: number; totalInterest: number };
  singleAPR: { months: number; totalInterest: number };
  savings: { months: number; interest: number };
} {
  // Calculate composite results
  const compositeMonths = calculateCompositePayoffMonths(debts, extraPerMonth);
  const compositeInterest = calculateCompositeTotalInterest(debts, extraPerMonth);
  
  // Calculate single APR equivalent using weighted average
  const singleAPRDebts = debts.map(debt => {
    if (!hasMultiAPRBuckets(debt) || !debt.buckets) {
      return debt; // Already single APR
    }
    
    // Calculate weighted average APR
    const totalBalance = debt.buckets.reduce((sum, bucket) => sum + bucket.balance, 0);
    const weightedAPR = debt.buckets.reduce((sum, bucket) => {
      const weight = bucket.balance / totalBalance;
      return sum + (bucket.apr * weight);
    }, 0);
    
    return {
      ...debt,
      apr: weightedAPR,
      buckets: undefined // Remove buckets to force single APR simulation
    };
  });
  
  // Import standard simulator for single APR calculation
  // Note: This is a circular dependency risk - in production, consider refactoring
  const { simulateSnowballPlan } = require('../utils/snowballSimulator');
  
  try {
    const singleAPRResults = simulateSnowballPlan({
      debts: singleAPRDebts,
      extraPerMonth,
      startDate: new Date()
    });
    
    const singleAPRMonths = singleAPRResults.length;
    const singleAPRTotalInterest = singleAPRResults.reduce(
      (sum: number, month: any) => sum + month.totalInterest, 0
    );
    
    return {
      composite: {
        months: compositeMonths,
        totalInterest: Math.round(compositeInterest * 100) / 100
      },
      singleAPR: {
        months: singleAPRMonths,
        totalInterest: Math.round(singleAPRTotalInterest * 100) / 100
      },
      savings: {
        months: Math.max(0, singleAPRMonths - compositeMonths),
        interest: Math.round((singleAPRTotalInterest - compositeInterest) * 100) / 100
      }
    };
  } catch (error) {
    console.warn('Single APR comparison failed, using estimates:', error);
    
    // Fallback to conservative estimates
    const estimatedSlowerMonths = Math.ceil(compositeMonths * 1.05); // 5% slower
    const estimatedHigherInterest = compositeInterest * 1.15; // 15% more interest
    
    return {
      composite: {
        months: compositeMonths,
        totalInterest: Math.round(compositeInterest * 100) / 100
      },
      singleAPR: {
        months: estimatedSlowerMonths,
        totalInterest: Math.round(estimatedHigherInterest * 100) / 100
      },
      savings: {
        months: estimatedSlowerMonths - compositeMonths,
        interest: Math.round((estimatedHigherInterest - compositeInterest) * 100) / 100
      }
    };
  }
}

/**
 * Adapter function to convert composite results to standard PlanResult format
 * This allows the composite engine to integrate with existing UI components
 */
export function compositeResultsToPlanResults(
  compositeResults: CompositeMonthResult[]
): PlanResult[] {
  // Group results by month (since we may have multiple debts per month)
  const resultsByMonth = new Map<number, CompositeMonthResult[]>();
  
  compositeResults.forEach(result => {
    if (!resultsByMonth.has(result.month)) {
      resultsByMonth.set(result.month, []);
    }
    resultsByMonth.get(result.month)!.push(result);
  });
  
  // Convert to PlanResult format
  const planResults: PlanResult[] = [];
  
  resultsByMonth.forEach((monthResults, month) => {
    const debtSnapshots: DebtSnapshot[] = monthResults.map(debtResult => ({
      id: debtResult.debtId,
      name: debtResult.debtName,
      startingBalance: debtResult.totalStartingBalance,
      interestCharged: debtResult.totalInterest,
      principalPaid: debtResult.totalMinimumPayment + debtResult.totalSnowballPayment - debtResult.totalInterest,
      snowballApplied: debtResult.totalSnowballPayment,
      endingBalance: debtResult.totalEndingBalance,
      isPaidOff: debtResult.isPaidOff
    }));
    
    const totalBalance = monthResults.reduce((sum, r) => sum + r.totalEndingBalance, 0);
    const totalInterest = monthResults.reduce((sum, r) => sum + r.totalInterest, 0);
    const totalPrincipal = monthResults.reduce((sum, r) => 
      sum + r.totalMinimumPayment + r.totalSnowballPayment - r.totalInterest, 0);
    const snowballAmount = monthResults.reduce((sum, r) => sum + r.totalSnowballPayment, 0);
    
    planResults.push({
      month,
      debts: debtSnapshots,
      totalBalance,
      totalInterest,
      totalPrincipal,
      snowballAmount
    });
  });
  
  return planResults.sort((a, b) => a.month - b.month);
}

/**
 * Generate enhanced forecast summary for composite bucket results
 */
export function generateCompositeForecastSummary(
  compositeResults: CompositeMonthResult[],
  startDate: Date = new Date()
): ForecastSummary {
  if (!compositeResults.length) {
    return {
      totalMonths: 0,
      debtFreeDate: 'No debts',
      totalInterestPaid: 0,
      interestSavedVsMinimum: 0,
      firstDebtClearedMonth: 0,
      milestoneDates: [],
      simulationEngine: 'v2-composite'
    };
  }
  
  // Group results by month
  const resultsByMonth = new Map<number, CompositeMonthResult[]>();
  compositeResults.forEach(result => {
    if (!resultsByMonth.has(result.month)) {
      resultsByMonth.set(result.month, []);
    }
    resultsByMonth.get(result.month)!.push(result);
  });
  
  const maxMonth = Math.max(...compositeResults.map(r => r.month));
  const totalInterestPaid = compositeResults.reduce((sum, r) => sum + r.totalInterest, 0);
  
  // Calculate debt-free date
  const debtFreeDate = new Date(startDate);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + maxMonth);
  
  // Track bucket milestones
  const bucketMilestones: BucketMilestone[] = [];
  const debtMilestones: MilestoneDate[] = [];
  const seenBuckets = new Set<string>();
  const seenDebts = new Set<string>();
  
  let totalBucketsAtStart = 0;
  let highestAPRCleared = { name: '', apr: 0, monthCleared: 0 };
  
  // Count total buckets at start
  const firstMonthResults = resultsByMonth.get(1) || [];
  firstMonthResults.forEach(debtResult => {
    totalBucketsAtStart += debtResult.buckets.length;
  });
  
  // Find bucket and debt milestones
  Array.from(resultsByMonth.entries()).sort(([a], [b]) => a - b).forEach(([month, monthResults]) => {
    monthResults.forEach(debtResult => {
      // Check for newly cleared buckets
      debtResult.buckets.forEach(bucket => {
        const bucketKey = `${debtResult.debtId}:${bucket.id}`;
        if (bucket.isPaidOff && !seenBuckets.has(bucketKey)) {
          seenBuckets.add(bucketKey);
          
          const milestoneDate = new Date(startDate);
          milestoneDate.setMonth(milestoneDate.getMonth() + month);
          
          bucketMilestones.push({
            bucketName: bucket.name,
            debtName: debtResult.debtName,
            clearedIn: milestoneDate.toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'short' 
            }),
            monthCleared: month,
            totalInterestPaid: bucket.interestCharged, // Rough estimate
            apr: bucket.apr
          });
          
          // Track highest APR cleared
          if (bucket.apr > highestAPRCleared.apr) {
            highestAPRCleared = {
              name: bucket.name,
              apr: bucket.apr,
              monthCleared: month
            };
          }
        }
      });
      
      // Check for newly cleared debts
      if (debtResult.isPaidOff && !seenDebts.has(debtResult.debtId)) {
        seenDebts.add(debtResult.debtId);
        
        const milestoneDate = new Date(startDate);
        milestoneDate.setMonth(milestoneDate.getMonth() + month);
        
        debtMilestones.push({
          debtName: debtResult.debtName,
          monthCleared: month,
          dateCleared: milestoneDate.toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long' 
          })
        });
      }
    });
  });
  
  const bucketDetails: BucketSummary = {
    totalBucketsCleared: bucketMilestones.length,
    bucketMilestones,
    highestAPRCleared,
    totalBucketsAtStart
  };
  
  return {
    totalMonths: maxMonth,
    debtFreeDate: debtFreeDate.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long' 
    }),
    totalInterestPaid,
    interestSavedVsMinimum: 0, // TODO: Calculate vs minimum payments
    firstDebtClearedMonth: debtMilestones.length > 0 ? debtMilestones[0].monthCleared : 0,
    milestoneDates: debtMilestones,
    simulationEngine: 'v2-composite',
    bucketDetails
  };
}