/**
 * Clean UK Debt Types - API Contract v2.1
 * Zero conversion, zero bullshit, bulletproof and boring
 * 
 * CP-4 Extended: Multi-APR Bucket Support (Experimental Pro Feature)
 */

/**
 * Multi-APR bucket for realistic UK credit card modeling
 * Experimental feature for pro users only
 */
export interface DebtBucket {
  id: string;              // Unique bucket identifier
  name: string;            // e.g., "Purchases", "Cash Advances", "Balance Transfer"
  balance: number;         // Current balance in pounds
  apr: number;             // APR for this bucket (0-100%)
  payment_priority: number; // 1 = highest priority for payments
  created_at?: string;     // ISO date string
}

export interface UKDebt {
  id: string;
  user_id: string;         // Required per v2.1
  name: string;
  amount: number;          // In pounds (not pence)
  apr: number;            // As percentage (not basis points) - fallback for single-APR mode
  min_payment: number;     // In pounds (not pence)
  order_index: number;    // Snowball priority (1 = highest)
  limit?: number;         // Optional credit limit
  original_amount?: number; // Optional for progress tracking
  debt_type?: string;     // Default: "credit_card"
  buckets?: DebtBucket[];  // Experimental: Multi-APR buckets for pro users
  created_at?: string;    // ISO date string
  updated_at?: string;    // ISO date string
}

export interface CreateUKDebt {
  name: string;
  amount: number;
  min_payment: number;
  apr: number;
  order_index?: number;
  limit?: number;
  original_amount?: number;
  debt_type?: string;
  buckets?: DebtBucket[];  // Experimental: Multi-APR buckets for pro users
}

export interface UpdateUKDebt {
  name?: string;
  amount?: number;
  min_payment?: number;
  apr?: number;
  order_index?: number;
  limit?: number;
  original_amount?: number;
  debt_type?: string;
  buckets?: DebtBucket[];  // Experimental: Multi-APR buckets for pro users
}

/**
 * Validation rules for UK debts
 * Fail-fast approach - no magic, no conversions
 */
export const DEBT_VALIDATION = {
  name: {
    min_length: 1,
    max_length: 100,
  },
  amount: {
    min: 0,
    max: 1000000,
  },
  min_payment: {
    min: 0,
    max: 1000000,
  },
  apr: {
    min: 0,
    max: 100,
  },
  order_index: {
    min: 1,
    max: 9999,
  },
  limit: {
    min: 0,
    max: 1000000,
  },
  bucket: {
    name: {
      min_length: 1,
      max_length: 50,
    },
    balance: {
      min: 0,
      max: 1000000,
    },
    apr: {
      min: 0,
      max: 100,
    },
    payment_priority: {
      min: 1,
      max: 99,
    },
    max_buckets_per_debt: 10,
  },
} as const;

/**
 * Type guard to check if object is a valid UKDebt
 */
export function isUKDebt(obj: any): obj is UKDebt {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.min_payment === 'number' &&
    typeof obj.apr === 'number' &&
    typeof obj.order_index === 'number'
  );
}

/**
 * Validate debt data before API calls
 * Returns validation errors or empty array if valid
 */
export function validateDebtData(data: CreateUKDebt | UpdateUKDebt): string[] {
  const errors: string[] = [];

  if ('name' in data) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Debt name is required');
    } else if (data.name.length > DEBT_VALIDATION.name.max_length) {
      errors.push(`Debt name must be ${DEBT_VALIDATION.name.max_length} characters or less`);
    }
  }

  if ('amount' in data && data.amount !== undefined) {
    if (data.amount < DEBT_VALIDATION.amount.min || data.amount > DEBT_VALIDATION.amount.max) {
      errors.push(`Amount must be between £${DEBT_VALIDATION.amount.min} and £${DEBT_VALIDATION.amount.max.toLocaleString()}`);
    }
  }

  if ('min_payment' in data && data.min_payment !== undefined) {
    if (data.min_payment < DEBT_VALIDATION.min_payment.min || data.min_payment > DEBT_VALIDATION.min_payment.max) {
      errors.push(`Minimum payment must be between £${DEBT_VALIDATION.min_payment.min} and £${DEBT_VALIDATION.min_payment.max.toLocaleString()}`);
    }
    // v2.1 constraint: min_payment must be <= amount
    if ('amount' in data && data.amount !== undefined && data.min_payment > data.amount) {
      errors.push('Minimum payment cannot exceed the debt amount');
    }
  }

  if ('apr' in data && data.apr !== undefined) {
    if (data.apr < DEBT_VALIDATION.apr.min || data.apr > DEBT_VALIDATION.apr.max) {
      errors.push(`APR must be between ${DEBT_VALIDATION.apr.min}% and ${DEBT_VALIDATION.apr.max}%`);
    }
  }

  return errors;
}

/**
 * Validate bucket data for multi-APR debts
 * Returns validation errors or empty array if valid
 */
export function validateBucketData(buckets: DebtBucket[], totalAmount: number): string[] {
  const errors: string[] = [];

  if (!buckets || buckets.length === 0) {
    return errors; // Empty buckets array is valid (single-APR mode)
  }

  // Check bucket count limit
  if (buckets.length > DEBT_VALIDATION.bucket.max_buckets_per_debt) {
    errors.push(`Maximum ${DEBT_VALIDATION.bucket.max_buckets_per_debt} buckets allowed per debt`);
  }

  // Validate each bucket
  buckets.forEach((bucket, index) => {
    if (!bucket.name || bucket.name.trim().length === 0) {
      errors.push(`Bucket ${index + 1}: Name is required`);
    } else if (bucket.name.length > DEBT_VALIDATION.bucket.name.max_length) {
      errors.push(`Bucket ${index + 1}: Name must be ${DEBT_VALIDATION.bucket.name.max_length} characters or less`);
    }

    if (bucket.balance < DEBT_VALIDATION.bucket.balance.min || bucket.balance > DEBT_VALIDATION.bucket.balance.max) {
      errors.push(`Bucket ${index + 1}: Balance must be between £${DEBT_VALIDATION.bucket.balance.min} and £${DEBT_VALIDATION.bucket.balance.max.toLocaleString()}`);
    }

    if (bucket.apr < DEBT_VALIDATION.bucket.apr.min || bucket.apr > DEBT_VALIDATION.bucket.apr.max) {
      errors.push(`Bucket ${index + 1}: APR must be between ${DEBT_VALIDATION.bucket.apr.min}% and ${DEBT_VALIDATION.bucket.apr.max}%`);
    }

    if (bucket.payment_priority < DEBT_VALIDATION.bucket.payment_priority.min || bucket.payment_priority > DEBT_VALIDATION.bucket.payment_priority.max) {
      errors.push(`Bucket ${index + 1}: Payment priority must be between ${DEBT_VALIDATION.bucket.payment_priority.min} and ${DEBT_VALIDATION.bucket.payment_priority.max}`);
    }
  });

  // Check for duplicate bucket names
  const bucketNames = buckets.map(b => b.name.toLowerCase());
  const duplicateNames = bucketNames.filter((name, index) => bucketNames.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate bucket names: ${Array.from(new Set(duplicateNames)).join(', ')}`);
  }

  // Check for duplicate payment priorities
  const priorities = buckets.map(b => b.payment_priority);
  const duplicatePriorities = priorities.filter((priority, index) => priorities.indexOf(priority) !== index);
  if (duplicatePriorities.length > 0) {
    errors.push(`Duplicate payment priorities: ${Array.from(new Set(duplicatePriorities)).join(', ')}`);
  }

  // Critical constraint: bucket balances must sum to total debt amount
  const bucketSum = buckets.reduce((sum, bucket) => sum + bucket.balance, 0);
  const tolerance = 0.01; // 1p tolerance for rounding
  if (Math.abs(bucketSum - totalAmount) > tolerance) {
    errors.push(`Bucket balances (£${bucketSum.toFixed(2)}) must sum to total debt amount (£${totalAmount.toFixed(2)})`);
  }

  return errors;
}

/**
 * Check if a debt uses multi-APR buckets
 */
export function hasMultiAPRBuckets(debt: UKDebt): boolean {
  return !!(debt.buckets && debt.buckets.length > 0);
}

/**
 * Get effective APR for a debt (either single APR or weighted average of buckets)
 */
export function getEffectiveAPR(debt: UKDebt): number {
  if (!hasMultiAPRBuckets(debt)) {
    return debt.apr;
  }

  const totalBalance = debt.buckets!.reduce((sum, bucket) => sum + bucket.balance, 0);
  if (totalBalance === 0) return debt.apr; // Fallback

  const weightedAPR = debt.buckets!.reduce((sum, bucket) => {
    const weight = bucket.balance / totalBalance;
    return sum + (bucket.apr * weight);
  }, 0);

  return weightedAPR;
}