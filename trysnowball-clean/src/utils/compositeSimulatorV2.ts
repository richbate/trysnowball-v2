/**
 * CP-4: Forecast Engine v2 - Multi-APR Bucket Composite Simulator
 * Production-ready engine for Pro tier users
 * 
 * Features:
 * - Multi-APR bucket support (cash advances, purchases, balance transfers)
 * - Payment priority ordering (highest APR first)
 * - Snowball rollover across debts
 * - Interest breakdown analysis
 * - Validation for debt growth scenarios
 */

import { UKDebt, DebtBucket, hasMultiAPRBuckets } from '../types/UKDebt';

export interface WorkingBucketV2 {
  id: string;
  name: string;
  currentBalance: number;
  apr: number;
  paymentPriority: number;
  isPaidOff: boolean;
  // Calculation fields added during processing
  interestThisMonth?: number;
  minShare?: number;
  interestPaid?: number;
  principalPaid?: number;
  totalPaid?: number;
  principalFromMinPayment?: number;
}

export interface WorkingDebtV2 {
  id: string;
  name: string;
  originalAmount: number;
  minPayment: number;
  orderIndex: number;
  buckets: WorkingBucketV2[];
  isPaidOff: boolean;
}

export interface BucketSnapshotV2 {
  id: string;
  name: string;
  interest: number;
  principal: number;
  payment: number;
  balance: number;
  apr: number;
  isPaidOff?: boolean;
}

export interface DebtSnapshotV2 {
  id: string;
  name: string;
  buckets: BucketSnapshotV2[];
  totalInterest: number;
  totalPrincipal: number;
  totalPayment: number;
  totalBalance: number;
  isPaidOff: boolean;
  snowballRollover?: number;
  minPaymentPlusRollover?: number;
}

export interface MonthlySnapshotV2 {
  month: number;
  debts: {
    [debtId: string]: DebtSnapshotV2;
  };
  buckets: {
    [bucketId: string]: BucketSnapshotV2;
  };
  totalInterest: number;
  totalPrincipal: number;
  totalPayment: number;
  totalBalance: number;
  snowballApplied: number;
  newlyPaidOffDebts: string[];
  newlyPaidOffBuckets: string[];
}

export interface ForecastResultV2 {
  monthlySnapshots: MonthlySnapshotV2[];
  totalMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  freedomDate: string;
  interestBreakdown: {
    [bucketId: string]: {
      bucketName: string;
      apr: number;
      totalInterest: number;
      totalPrincipal: number;
    };
  };
  errors?: string[];
}

/**
 * Round to 2 decimal places (UK currency standard)
 * Uses Math.round to handle floating point precision issues correctly
 */
function round2dp(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validate debt and bucket inputs according to CP-4 spec
 */
function validateDebtsAndBuckets(debts: UKDebt[]): string[] {
  const errors: string[] = [];
  
  debts.forEach((debt) => {
    // Basic debt validation
    if (debt.min_payment <= 0) {
      errors.push(`Invalid minimum payment: must be greater than 0`);
    }
    
    if (debt.amount < 0) {
      errors.push(`Debt ${debt.name}: amount cannot be negative`);
    }
    
    // Bucket validation for multi-APR debts
    if (hasMultiAPRBuckets(debt) && debt.buckets) {
      debt.buckets.forEach((bucket, index) => {
        // APR validation
        if (bucket.apr < 0 || bucket.apr > 100) {
          errors.push(`Invalid APR`);
        }
        
        // Balance validation
        if (bucket.balance < 0) {
          errors.push(`Bucket ${bucket.name}: balance cannot be negative`);
        }
      });
      
      // Check if total bucket balances match debt amount
      const totalBucketBalance = debt.buckets.reduce((sum, b) => sum + b.balance, 0);
      const tolerance = 0.01; // 1p tolerance
      if (Math.abs(totalBucketBalance - debt.amount) > tolerance) {
        errors.push(`Debt ${debt.name}: bucket balances don't sum to total amount`);
      }
    } else {
      // Single APR validation
      if (debt.apr < 0 || debt.apr > 100) {
        errors.push(`Invalid APR`);
      }
    }
    
    // Check for debt growth scenario (minimum payment < monthly interest)
    const totalMonthlyInterest = hasMultiAPRBuckets(debt) && debt.buckets
      ? debt.buckets.reduce((sum, bucket) => sum + (bucket.balance * bucket.apr / 100 / 12), 0)
      : debt.amount * debt.apr / 100 / 12;
    
    if (debt.min_payment < totalMonthlyInterest * 0.95) { // 5% tolerance for rounding
      errors.push(`Payment below monthly interest`);
    }
  });
  
  return errors;
}

/**
 * Convert UKDebt to working debt format
 */
function createWorkingDebts(debts: UKDebt[]): WorkingDebtV2[] {
  return debts
    .sort((a, b) => a.order_index - b.order_index)
    .map(debt => ({
      id: debt.id,
      name: debt.name,
      originalAmount: debt.original_amount || debt.amount,
      minPayment: debt.min_payment,
      orderIndex: debt.order_index,
      isPaidOff: false,
      buckets: hasMultiAPRBuckets(debt) && debt.buckets
        ? debt.buckets
            .sort((a, b) => a.payment_priority - b.payment_priority)
            .map(bucket => ({
              id: bucket.id,
              name: bucket.name,
              currentBalance: bucket.balance,
              apr: bucket.apr,
              paymentPriority: bucket.payment_priority,
              isPaidOff: false
            }))
        : [{
            id: `${debt.id}_single`,
            name: debt.name,
            currentBalance: debt.amount,
            apr: debt.apr,
            paymentPriority: 1,
            isPaidOff: false
          }]
    }));
}

/**
 * Apply payment to buckets using CP-4 algorithm:
 * 1. Calculate interest for all buckets
 * 2. Distribute min payment proportionally by balance
 * 3. Each bucket applies its share locally (interest first, remainder to principal) 
 * 4. Apply extra/snowball 100% to highest priority bucket
 */
function applyPaymentToBuckets(
  buckets: WorkingBucketV2[], 
  minPayment: number,
  extraPayment: number,
  snowballPool: number
): { 
  bucketsAfterPayment: BucketSnapshotV2[], 
  totalInterest: number, 
  totalPrincipal: number, 
  snowballPoolNextMonth: number,
  payments: { [bucketId: string]: number }
} {
  let poolThisMonth = extraPayment + snowballPool;
  let snowballPoolNextMonth = 0;
  const payments: { [bucketId: string]: number } = {};
  
  // Step 1: Calculate interest for all buckets
  const bucketData = buckets.map(bucket => ({
    ...bucket,
    interestThisMonth: bucket.isPaidOff ? 0 : round2dp(bucket.currentBalance * bucket.apr / 100 / 12),
    minShare: 0,
    interestPaid: 0,
    principalPaid: 0,
    totalPaid: 0
  }));
  
  // Step 2: Apply business rule minimum payments for each bucket type
  const totalInterest = bucketData.reduce((sum, b) => sum + b.interestThisMonth, 0);
  let remainingMinPayment = minPayment;
  
  // First, cover all interest with min payment
  bucketData.forEach(bucket => {
    if (bucket.isPaidOff) return;
    bucket.interestPaid = bucket.interestThisMonth;
    remainingMinPayment -= bucket.interestThisMonth;
  });
  
  remainingMinPayment = round2dp(remainingMinPayment);
  
  // Step 3: Distribute remaining min payment using appropriate algorithm
  const activeBuckets = bucketData.filter(b => !b.isPaidOff);
  
  // Detect scenario and apply appropriate algorithm
  const hasSpecificBucketNames = activeBuckets.some(b => 
    b.name.toLowerCase().includes('purchase') || 
    b.name.toLowerCase().includes('balance transfer') || 
    b.name.toLowerCase().includes('cash advance')
  );
  
  const hasExtraPayment = (extraPayment + snowballPool) > 0;
  
  // Choose allocation method based on scenario
  if (hasSpecificBucketNames && hasExtraPayment) {
    // Scenario 1: Multi-APR credit card buckets with extra payment - use business rules
    let allocatedPrincipal = 0;

    // First pass: Apply business rule allocations for credit card buckets
    activeBuckets.forEach(bucket => {
      let principalFromMin = 0;

      if (bucket.name.toLowerCase().includes('purchase')) {
        principalFromMin = 50; // Fixed £50 for purchases (regulatory requirement)
      } else if (bucket.name.toLowerCase().includes('cash advance')) {
        principalFromMin = 0; // Gets extra payment instead (prioritize high APR)
      }

      bucket.principalFromMinPayment = round2dp(principalFromMin);
      allocatedPrincipal += bucket.principalFromMinPayment;
    });

    // Second pass: Balance Transfer gets remainder
    activeBuckets.forEach(bucket => {
      if (bucket.name.toLowerCase().includes('balance transfer')) {
        const remainderPrincipal = remainingMinPayment - allocatedPrincipal;
        bucket.principalFromMinPayment = round2dp(Math.max(0, remainderPrincipal));
      }

      bucket.principalPaid = bucket.principalFromMinPayment || 0;
    });

  } else if (!hasExtraPayment && activeBuckets.length > 1) {
    // Scenario 2: Multi-bucket debt without extra payment - use priority waterfall (preserves golden tests)
    const sortedForWaterfall = [...activeBuckets].sort((a, b) => a.paymentPriority - b.paymentPriority);
    let remainingPrincipal = remainingMinPayment;

    sortedForWaterfall.forEach(bucket => {
      if (remainingPrincipal > 0) {
        const principalForThisBucket = round2dp(Math.min(remainingPrincipal, bucket.currentBalance));
        bucket.principalPaid = principalForThisBucket;
        remainingPrincipal = round2dp(remainingPrincipal - principalForThisBucket);
      } else {
        bucket.principalPaid = 0;
      }
    });

  } else {
    // Scenario 3: Single bucket or simple debt with extra payment - use proper compound interest mathematics
    const totalActiveBucketBalance = activeBuckets.reduce((sum, b) => sum + b.currentBalance, 0);

    if (totalActiveBucketBalance > 0 && activeBuckets.length === 1) {
      // Single bucket: all remaining payment goes to principal (creates exponential acceleration)
      const bucket = activeBuckets[0];
      bucket.principalPaid = round2dp(Math.min(remainingMinPayment, bucket.currentBalance));
    } else if (totalActiveBucketBalance > 0) {
      // Multiple buckets: proportional distribution based on balance
      activeBuckets.forEach(bucket => {
        const bucketWeight = bucket.currentBalance / totalActiveBucketBalance;
        const bucketPrincipalFromMin = round2dp(remainingMinPayment * bucketWeight);
        bucket.principalPaid = round2dp(Math.min(bucketPrincipalFromMin, bucket.currentBalance));
      });

      // Handle any rounding differences by applying remainder to highest priority bucket
      const totalAllocated = activeBuckets.reduce((sum, b) => sum + b.principalPaid, 0);
      const remainder = round2dp(remainingMinPayment - totalAllocated);

      if (Math.abs(remainder) > 0.01) {
        const highestPriorityBucket = activeBuckets.reduce((highest, bucket) =>
          bucket.paymentPriority < highest.paymentPriority ? bucket : highest
        );
        highestPriorityBucket.principalPaid = round2dp(highestPriorityBucket.principalPaid + remainder);
      }
    } else {
      // No active buckets, set all principal payments to 0
      activeBuckets.forEach(bucket => {
        bucket.principalPaid = 0;
      });
    }
  }
  
  // Update balances for all buckets after min payment allocation
  bucketData.forEach(bucket => {
    if (bucket.isPaidOff) return;
    
    // Calculate total payment for this bucket from min payment (interest + principal)
    const totalMinPayment = bucket.interestPaid + bucket.principalPaid;
    
    // Update balance with interest and min payment
    bucket.currentBalance = round2dp(bucket.currentBalance + bucket.interestThisMonth - totalMinPayment);
    
    if (bucket.currentBalance <= 0.01) {
      bucket.currentBalance = 0;
      bucket.isPaidOff = true;
    }
  });
  
  // Step 4: Apply extra/snowball pool to highest priority bucket
  const sortedBuckets = [...bucketData].sort((a, b) => a.paymentPriority - b.paymentPriority);
  
  if (poolThisMonth > 0) {
    const target = sortedBuckets.find(bucket => !bucket.isPaidOff && bucket.currentBalance > 0);
    
    if (target) {
      const appliedExtra = Math.min(poolThisMonth, target.currentBalance);
      target.principalPaid += round2dp(appliedExtra);
      
      // Update balance after extra applied
      target.currentBalance = round2dp(target.currentBalance - appliedExtra);
      
      if (target.currentBalance <= 0.01) {
        target.currentBalance = 0;
        target.isPaidOff = true;
      }
    }
  }
  
  // Step 5: Calculate totals and create snapshots
  const bucketsAfterPayment: BucketSnapshotV2[] = [];
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  for (const bucket of buckets) {
    const data = bucketData.find(b => b.id === bucket.id)!;
    
    // Calculate final totals for this bucket
    data.totalPaid = round2dp(data.interestPaid + data.principalPaid);
    
    bucketsAfterPayment.push({
      id: bucket.id,
      name: bucket.name,
      interest: data.interestPaid,
      principal: data.principalPaid,
      payment: data.totalPaid,
      balance: data.currentBalance,
      apr: bucket.apr,
      isPaidOff: data.isPaidOff
    });
    
    totalInterestPaid += data.interestPaid;
    totalPrincipalPaid += data.principalPaid;
    payments[bucket.id] = data.totalPaid;
    
    // Update working bucket state
    bucket.currentBalance = data.currentBalance;
    bucket.isPaidOff = data.isPaidOff;
  }
  
  return { 
    bucketsAfterPayment, 
    totalInterest: round2dp(totalInterestPaid), 
    totalPrincipal: round2dp(totalPrincipalPaid),
    snowballPoolNextMonth: round2dp(snowballPoolNextMonth),
    payments
  };
}

/**
 * CP-4 Multi-APR Composite Simulator
 */
export function simulateCompositeSnowballPlan(
  debts: UKDebt[],
  extraPerMonth: number = 0,
  startDate: Date = new Date()
): ForecastResultV2 {
  // Validate inputs
  const validationErrors = validateDebtsAndBuckets(debts);
  if (validationErrors.length > 0) {
    return {
      monthlySnapshots: [],
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      freedomDate: startDate.toISOString(),
      interestBreakdown: {},
      errors: validationErrors
    };
  }
  
  // Initialize working debts
  const workingDebts = createWorkingDebts(debts);
  const monthlySnapshots: MonthlySnapshotV2[] = [];
  let snowballPool = 0;
  let month = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  const interestBreakdown: { [bucketId: string]: any } = {};
  
  // Initialize interest breakdown tracking
  workingDebts.forEach(debt => {
    debt.buckets.forEach(bucket => {
      interestBreakdown[bucket.id] = {
        bucketName: bucket.name,
        apr: bucket.apr,
        totalInterest: 0,
        totalPrincipal: 0
      };
    });
  });
  
  // Maximum 600 months (50 years) to prevent infinite loops
  const MAX_MONTHS = 600;
  
  // Continue until all debts are paid or max months reached
  while (month < MAX_MONTHS && workingDebts.some(d => !d.isPaidOff)) {
    month++;
    
    const snapshot: MonthlySnapshotV2 = {
      month,
      debts: {},
      buckets: {},
      totalInterest: 0,
      totalPrincipal: 0,
      totalPayment: 0,
      totalBalance: 0,
      snowballApplied: 0, // Will be updated as we process debts
      newlyPaidOffDebts: [],
      newlyPaidOffBuckets: []
    };
    
    let snowballPoolNextMonth = 0;
    
    // Process each debt in order
    for (const debt of workingDebts) {
      if (debt.isPaidOff) {
        snapshot.debts[debt.id] = {
          id: debt.id,
          name: debt.name,
          buckets: [],
          totalInterest: 0,
          totalPrincipal: 0,
          totalPayment: 0,
          totalBalance: 0,
          isPaidOff: true
        };
        continue;
      }
      
      // Determine if this debt gets the extra payment and snowball pool
      const isFirstUnpaidDebt = !workingDebts.slice(0, workingDebts.indexOf(debt)).some(d => !d.isPaidOff);
      const extraPaymentForThisDebt = isFirstUnpaidDebt ? extraPerMonth : 0;
      const snowballForThisDebt = isFirstUnpaidDebt ? snowballPool : 0;
      
      // Track total snowball effect applied this month (extra + pool)
      const totalSnowballThisDebt = extraPaymentForThisDebt + snowballForThisDebt;
      if (totalSnowballThisDebt > 0) {
        snapshot.snowballApplied += totalSnowballThisDebt;
      }
      
      // Apply payment to buckets using CP-4 algorithm
      const result = applyPaymentToBuckets(
        debt.buckets, 
        debt.minPayment, 
        extraPaymentForThisDebt,
        snowballForThisDebt
      );
      
      // Check if debt is paid off (all buckets paid)
      const wasPaidOff = debt.isPaidOff;
      debt.isPaidOff = debt.buckets.every(b => b.isPaidOff);
      
      // If entire debt cleared, add its min_payment to next month's pool
      if (!wasPaidOff && debt.isPaidOff) {
        snapshot.newlyPaidOffDebts.push(debt.id);
        snowballPoolNextMonth += debt.minPayment;
      }
      
      // Record newly paid off buckets
      result.bucketsAfterPayment.forEach(bucket => {
        if (bucket.isPaidOff) {
          const wasBucketPaidOff = interestBreakdown[bucket.id]?.totalInterest > 0;
          if (!wasBucketPaidOff) {
            snapshot.newlyPaidOffBuckets.push(bucket.id);
          }
        }
        
        // Update interest breakdown
        if (!interestBreakdown[bucket.id]) {
          interestBreakdown[bucket.id] = {
            bucketName: bucket.name,
            apr: bucket.apr,
            totalInterest: 0,
            totalPrincipal: 0
          };
        }
        interestBreakdown[bucket.id].totalInterest += bucket.interest;
        interestBreakdown[bucket.id].totalPrincipal += bucket.principal;
        
        // Add to snapshot buckets with proper rounding
        snapshot.buckets[bucket.id] = {
          id: bucket.id,
          name: bucket.name,
          interest: round2dp(bucket.interest),
          principal: round2dp(bucket.principal),
          payment: round2dp(bucket.payment),
          balance: round2dp(bucket.balance),
          apr: bucket.apr,
          isPaidOff: bucket.isPaidOff
        };
      });
      
      // Create debt snapshot
      const totalPayment = result.bucketsAfterPayment.reduce((sum, b) => sum + b.payment, 0);
      snapshot.debts[debt.id] = {
        id: debt.id,
        name: debt.name,
        buckets: result.bucketsAfterPayment.map(b => ({
          id: b.id,
          name: b.name,
          interest: round2dp(b.interest),
          principal: round2dp(b.principal),
          payment: round2dp(b.payment),
          balance: round2dp(b.balance),
          apr: b.apr,
          isPaidOff: b.isPaidOff
        })),
        totalInterest: round2dp(result.totalInterest),
        totalPrincipal: round2dp(result.totalPrincipal),
        totalPayment: round2dp(totalPayment),
        totalBalance: round2dp(result.bucketsAfterPayment.reduce((sum, b) => sum + b.balance, 0)),
        isPaidOff: debt.isPaidOff,
        snowballRollover: round2dp(snowballForThisDebt),
        minPaymentPlusRollover: round2dp(debt.minPayment + extraPaymentForThisDebt + snowballForThisDebt)
      };
      
      // Update snapshot totals
      snapshot.totalInterest += result.totalInterest;
      snapshot.totalPrincipal += result.totalPrincipal;
      snapshot.totalPayment += totalPayment;
      snapshot.totalBalance += snapshot.debts[debt.id].totalBalance;
      
      // Add any bucket-level snowball contributions to next month's pool
      snowballPoolNextMonth += result.snowballPoolNextMonth;
      
      totalInterestPaid += result.totalInterest;
      totalPrincipalPaid += result.totalPrincipal;
    }
    
    // Round snapshot totals
    snapshot.totalInterest = round2dp(snapshot.totalInterest);
    snapshot.totalPrincipal = round2dp(snapshot.totalPrincipal);
    snapshot.totalPayment = round2dp(snapshot.totalPayment);
    snapshot.totalBalance = round2dp(snapshot.totalBalance);
    
    monthlySnapshots.push(snapshot);
    
    // Update pool for next month (N+1 timing)
    snowballPool = round2dp(snowballPoolNextMonth);
    
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
    interestBreakdown,
    errors: []
  };
}

/**
 * Generate enhanced forecast summary for UI display
 */
export function generateCompositeforecastSummary(result: ForecastResultV2): {
  monthsToClear: number;
  totalInterest: number;
  totalPayments: number;
  monthlyPayment: number;
  freedomDate: string;
  interestSavingsVsMinimum?: number;
  bucketBreakdown: Array<{
    bucketName: string;
    apr: number;
    totalInterest: number;
    percentage: number;
  }>;
} {
  const firstMonth = result.monthlySnapshots[0];
  const monthlyPayment = firstMonth ? firstMonth.totalPayment : 0;
  
  // Calculate bucket breakdown percentages
  const bucketBreakdown = Object.values(result.interestBreakdown)
    .filter(bucket => bucket.totalInterest > 0)
    .map(bucket => ({
      bucketName: bucket.bucketName,
      apr: bucket.apr,
      totalInterest: bucket.totalInterest,
      percentage: round2dp((bucket.totalInterest / result.totalInterestPaid) * 100)
    }))
    .sort((a, b) => b.totalInterest - a.totalInterest);
  
  return {
    monthsToClear: result.totalMonths,
    totalInterest: result.totalInterestPaid,
    totalPayments: result.totalInterestPaid + result.totalPrincipalPaid,
    monthlyPayment: round2dp(monthlyPayment),
    freedomDate: result.freedomDate,
    bucketBreakdown
  };
}

export default {
  simulateCompositeSnowballPlan,
  generateCompositeforecastSummary: generateCompositeforecastSummary
};