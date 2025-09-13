/**
 * Golden Test Fixtures for Analytics Events — CP-4.x
 * Hand-crafted debt scenarios for consistent event testing
 */

import { UKDebt } from '../../types/UKDebt';

/**
 * Basic composite debt - single card with multiple APR buckets
 * Used for testing standard composite mode events
 */
export const basicComposite: UKDebt[] = [
  {
    id: 'barclaycard-platinum',
    name: 'Barclaycard Platinum',
    amount: 3000,
    min_payment: 60,
    apr: 22.9, // Default APR for purchases
    order_index: 1,
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 2000,
        apr: 22.9,
        payment_priority: 2
      },
      {
        id: 'cash_advances',
        name: 'Cash Advances', 
        balance: 500,
        apr: 27.9,
        payment_priority: 1 // Highest priority - paid first
      },
      {
        id: 'balance_transfer',
        name: 'Balance Transfer',
        balance: 500,
        apr: 0,
        payment_priority: 3 // Lowest priority - paid last
      }
    ]
  }
];

/**
 * Cash advance short-term scenario
 * Small cash advance bucket that clears quickly for testing bucket_cleared events
 */
export const cashAdvanceShortTerm: UKDebt[] = [
  {
    id: 'halifax-clarity',
    name: 'Halifax Clarity',
    amount: 800,
    min_payment: 25,
    apr: 19.9,
    order_index: 1,
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 600,
        apr: 19.9,
        payment_priority: 2
      },
      {
        id: 'cash_advances',
        name: 'Cash Advances',
        balance: 200, // Small amount - will clear quickly with £500 extra payment
        apr: 29.9,
        payment_priority: 1
      }
    ]
  }
];

/**
 * Missing APR scenario for testing forecast_failed events
 * Deliberately malformed data to trigger validation errors
 */
export const missingAPR: UKDebt[] = [
  {
    id: 'malformed-card',
    name: 'Malformed Card',
    amount: 1000,
    min_payment: 30,
    apr: 20.0,
    order_index: 1,
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 700,
        apr: 20.0,
        payment_priority: 2
      },
      {
        id: 'cash_advances',
        name: 'Cash Advances',
        balance: 300,
        // @ts-ignore - Deliberately missing APR for testing
        // apr: missing 
        payment_priority: 1
      }
    ]
  }
];

/**
 * Invalid bucket sum scenario
 * Bucket balances don't add up to total debt amount
 */
export const invalidBucketSum: UKDebt[] = [
  {
    id: 'invalid-sum-card',
    name: 'Invalid Sum Card',
    amount: 2000, // Total amount
    min_payment: 50,
    apr: 21.9,
    order_index: 1,
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 800, // These only sum to 1200
        apr: 21.9,
        payment_priority: 2
      },
      {
        id: 'cash_advances',
        name: 'Cash Advances',
        balance: 400, // Should be 2000 total
        apr: 28.9,
        payment_priority: 1
      }
    ]
  }
];

/**
 * Multi-debt composite scenario
 * Multiple cards with different bucket structures
 * Used for complex comparison testing
 */
export const multiDebtComposite: UKDebt[] = [
  {
    id: 'barclaycard',
    name: 'Barclaycard',
    amount: 2500,
    min_payment: 50,
    apr: 23.9,
    order_index: 1, // Paid first due to lower balance
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 2000,
        apr: 23.9,
        payment_priority: 2
      },
      {
        id: 'cash_advances',
        name: 'Cash Advances',
        balance: 500,
        apr: 28.9,
        payment_priority: 1
      }
    ]
  },
  {
    id: 'halifax',
    name: 'Halifax Credit Card',
    amount: 4000,
    min_payment: 80,
    apr: 18.9,
    order_index: 2, // Paid second due to higher balance
    buckets: [
      {
        id: 'purchases',
        name: 'Purchases',
        balance: 3500,
        apr: 18.9,
        payment_priority: 2
      },
      {
        id: 'balance_transfer',
        name: 'Balance Transfer',
        balance: 500,
        apr: 0,
        payment_priority: 3 // Paid last - no interest
      }
    ]
  }
];

/**
 * Single flat debt for comparison testing
 * No buckets - uses standard snowball simulation
 */
export const flatDebt: UKDebt[] = [
  {
    id: 'simple-card',
    name: 'Simple Credit Card',
    amount: 3000,
    min_payment: 60,
    apr: 22.9,
    order_index: 1
    // No buckets array - this will use flat simulation
  }
];

/**
 * Zero interest scenario
 * All buckets have 0% APR for testing edge cases
 */
export const zeroInterest: UKDebt[] = [
  {
    id: 'zero-interest-card',
    name: 'Zero Interest Card',
    amount: 1500,
    min_payment: 50,
    apr: 0,
    order_index: 1,
    buckets: [
      {
        id: 'balance_transfer',
        name: 'Balance Transfer',
        balance: 1000,
        apr: 0,
        payment_priority: 1
      },
      {
        id: 'purchase_transfer',
        name: 'Purchase Transfer',
        balance: 500,
        apr: 0,
        payment_priority: 2
      }
    ]
  }
];

/**
 * Expected analytics payloads for golden test scenarios
 * These represent the exact events we expect to be fired
 */
export const expectedAnalyticsPayloads = {
  basicComposite_forecastRun: {
    mode: 'composite',
    debt_count: 1,
    bucket_count: 3,
    extra_per_month: 100,
    forecast_version: 'v2.0',
    user_id: expect.any(String),
    timestamp: expect.any(String)
  },
  
  basicComposite_bucketCleared_cashAdvances: {
    bucket_label: 'Cash Advances',
    debt_name: 'Barclaycard Platinum',
    apr: 27.9,
    cleared_month: expect.any(Number),
    total_interest_paid: expect.any(Number),
    forecast_version: 'v2.0',
    user_id: expect.any(String),
    timestamp: expect.any(String)
  },
  
  basicComposite_interestBreakdown_cashAdvances: {
    bucket_label: 'Cash Advances',
    debt_name: 'Barclaycard Platinum',
    apr: 27.9,
    interest_total: expect.any(Number),
    forecast_version: 'v2.0',
    user_id: expect.any(String),
    timestamp: expect.any(String)
  },
  
  missingAPR_forecastFailed: {
    error_code: 'MISSING_APR',
    error_message: expect.stringContaining('APR'),
    debt_count: 1,
    has_buckets: true,
    forecast_version: 'v2.0',
    user_id: expect.any(String),
    timestamp: expect.any(String)
  },
  
  comparison_forecastCompared: {
    months_saved: expect.any(Number),
    interest_difference: expect.any(Number),
    percentage_reduction: expect.any(Number),
    composite_months: expect.any(Number),
    flat_months: expect.any(Number),
    forecast_version: 'v2.0',
    user_id: expect.any(String),
    timestamp: expect.any(String)
  }
};