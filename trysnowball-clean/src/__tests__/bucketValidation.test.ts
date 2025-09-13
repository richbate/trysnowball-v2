/**
 * CP-4 Extended: Multi-APR Bucket Validation Tests
 * Tests for bucket data validation and helper functions
 */

import { 
  DebtBucket, 
  validateBucketData, 
  hasMultiAPRBuckets, 
  getEffectiveAPR,
  UKDebt 
} from '../types/UKDebt';

const createTestBucket = (overrides: Partial<DebtBucket> = {}): DebtBucket => ({
  id: 'bucket_1',
  name: 'Purchases',
  balance: 1000,
  apr: 22.9,
  payment_priority: 1,
  ...overrides
});

const createTestDebt = (overrides: Partial<UKDebt> = {}): UKDebt => ({
  id: 'debt_1',
  user_id: 'user_1',
  name: 'Credit Card',
  amount: 2000,
  apr: 19.9,
  min_payment: 50,
  order_index: 1,
  ...overrides
});

describe('Bucket Validation', () => {

  describe('validateBucketData', () => {
    test('empty buckets array is valid', () => {
      const errors = validateBucketData([], 1000);
      expect(errors).toEqual([]);
    });

    test('valid bucket configuration passes validation', () => {
      const buckets = [
        createTestBucket({ name: 'Purchases', balance: 800, apr: 22.9, payment_priority: 1 }),
        createTestBucket({ name: 'Cash Advances', balance: 200, apr: 28.9, payment_priority: 2 })
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toEqual([]);
    });

    test('bucket balances must sum to total amount', () => {
      const buckets = [
        createTestBucket({ balance: 800 }),
        createTestBucket({ balance: 300 }) // Total: 1100, expected: 1000
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toContain('Bucket balances (£1100.00) must sum to total debt amount (£1000.00)');
    });

    test('allows small rounding tolerance', () => {
      const buckets = [
        createTestBucket({ name: 'Bucket1', balance: 499.99, payment_priority: 1 }),
        createTestBucket({ name: 'Bucket2', balance: 500.00, payment_priority: 2 }) // Total: 999.99, expected: 1000.00
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toEqual([]); // Within 1p tolerance
    });

    test('bucket names must be unique', () => {
      const buckets = [
        createTestBucket({ name: 'Purchases', balance: 500 }),
        createTestBucket({ name: 'purchases', balance: 500 }) // Case insensitive duplicate
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toContain('Duplicate bucket names: purchases');
    });

    test('payment priorities must be unique', () => {
      const buckets = [
        createTestBucket({ balance: 500, payment_priority: 1 }),
        createTestBucket({ balance: 500, payment_priority: 1 })
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toContain('Duplicate payment priorities: 1');
    });

    test('validates individual bucket fields', () => {
      const buckets = [
        createTestBucket({ 
          name: '', 
          balance: -100, 
          apr: 150, 
          payment_priority: 0 
        })
      ];
      
      const errors = validateBucketData(buckets, 1000);
      expect(errors).toContain('Bucket 1: Name is required');
      expect(errors).toContain('Bucket 1: Balance must be between £0 and £1,000,000');
      expect(errors).toContain('Bucket 1: APR must be between 0% and 100%');
      expect(errors).toContain('Bucket 1: Payment priority must be between 1 and 99');
    });

    test('enforces maximum bucket limit', () => {
      const buckets = Array.from({ length: 11 }, (_, i) => 
        createTestBucket({ id: `bucket_${i}`, name: `Bucket ${i}`, balance: 100 })
      );
      
      const errors = validateBucketData(buckets, 1100);
      expect(errors).toContain('Maximum 10 buckets allowed per debt');
    });
  });

  describe('hasMultiAPRBuckets', () => {
    test('returns false for debt without buckets', () => {
      const debt = createTestDebt();
      expect(hasMultiAPRBuckets(debt)).toBe(false);
    });

    test('returns false for debt with empty buckets array', () => {
      const debt = createTestDebt({ buckets: [] });
      expect(hasMultiAPRBuckets(debt)).toBe(false);
    });

    test('returns true for debt with buckets', () => {
      const debt = createTestDebt({ 
        buckets: [createTestBucket()] 
      });
      expect(hasMultiAPRBuckets(debt)).toBe(true);
    });
  });

  describe('getEffectiveAPR', () => {
    test('returns debt APR for single APR debt', () => {
      const debt = createTestDebt({ apr: 19.9 });
      expect(getEffectiveAPR(debt)).toBe(19.9);
    });

    test('calculates weighted average for multi-APR debt', () => {
      const debt = createTestDebt({
        amount: 1000,
        buckets: [
          createTestBucket({ balance: 800, apr: 20 }), // 80% weight
          createTestBucket({ balance: 200, apr: 30 })  // 20% weight
        ]
      });
      
      // Expected: (800/1000 * 20) + (200/1000 * 30) = 16 + 6 = 22
      expect(getEffectiveAPR(debt)).toBe(22);
    });

    test('handles zero balance buckets gracefully', () => {
      const debt = createTestDebt({
        amount: 1000,
        buckets: [
          createTestBucket({ balance: 0, apr: 20 }),
          createTestBucket({ balance: 0, apr: 30 })
        ]
      });
      
      // Should fall back to debt APR when total bucket balance is 0
      expect(getEffectiveAPR(debt)).toBe(debt.apr);
    });
  });
});

describe('Bucket Priority Logic', () => {
  test('payment priority determines payment order', () => {
    const buckets: DebtBucket[] = [
      createTestBucket({ 
        id: 'bucket_1', 
        name: 'Low Priority', 
        payment_priority: 3 
      }),
      createTestBucket({ 
        id: 'bucket_2', 
        name: 'High Priority', 
        payment_priority: 1 
      }),
      createTestBucket({ 
        id: 'bucket_3', 
        name: 'Medium Priority', 
        payment_priority: 2 
      })
    ];

    // Sort by payment priority (1 = highest)
    const sorted = [...buckets].sort((a, b) => a.payment_priority - b.payment_priority);
    
    expect(sorted[0].name).toBe('High Priority');
    expect(sorted[1].name).toBe('Medium Priority');
    expect(sorted[2].name).toBe('Low Priority');
  });

  test('validates UK credit card bucket types', () => {
    const ukCreditCardBuckets = [
      createTestBucket({ name: 'Purchases', balance: 500, apr: 22.9, payment_priority: 2 }),
      createTestBucket({ name: 'Cash Advances', balance: 300, apr: 28.9, payment_priority: 1 }), // Highest APR, highest priority
      createTestBucket({ name: 'Balance Transfer', balance: 200, apr: 0, payment_priority: 3 })   // Promotional rate, lowest priority
    ];

    const errors = validateBucketData(ukCreditCardBuckets, 1000);
    expect(errors).toEqual([]);

    // Verify typical UK credit card payment priority: Cash advances first
    const sorted = [...ukCreditCardBuckets].sort((a, b) => a.payment_priority - b.payment_priority);
    expect(sorted[0].name).toBe('Cash Advances'); // Should be paid first
  });
});