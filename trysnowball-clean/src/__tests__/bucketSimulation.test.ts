/**
 * CP-4 Extended: Bucket Simulation Engine Tests
 * Tests the core repayment logic for multi-APR debts
 * 
 * Critical test cases:
 * - Per-bucket interest calculation
 * - Priority-based payment allocation
 * - Snowball targeting highest priority bucket
 * - Bucket milestones and completion tracking
 * - Composite interest accuracy
 */

import { simulateBucketAwareSnowballPlan } from '../utils/bucketSimulator';
import { UKDebt, DebtBucket } from '../types/UKDebt';

const createBucket = (overrides: Partial<DebtBucket> = {}): DebtBucket => ({
  id: `bucket_${Date.now()}_${Math.random()}`,
  name: 'Test Bucket',
  balance: 1000,
  apr: 20,
  payment_priority: 1,
  ...overrides
});

const createDebt = (overrides: Partial<UKDebt> = {}): UKDebt => ({
  id: `debt_${Date.now()}_${Math.random()}`,
  user_id: 'test_user',
  name: 'Test Debt',
  amount: 1000,
  apr: 20,
  min_payment: 50,
  order_index: 1,
  ...overrides
});

describe('Bucket Simulation Engine', () => {
  describe('Single Bucket Debt', () => {
    test('calculates interest correctly for single bucket', () => {
      const debt = createDebt({
        amount: 1200,
        min_payment: 60,
        buckets: [
          createBucket({ 
            name: 'Purchases', 
            balance: 1200, 
            apr: 24,  // 2% monthly
            payment_priority: 1 
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      const firstMonth = results[0];
      const debtSnapshot = firstMonth.debts[0];
      
      // Interest: 1200 * (24/100/12) = 1200 * 0.02 = 24.00
      expect(debtSnapshot.interestCharged).toBe(24);
      
      // Principal: 60 - 24 = 36
      expect(debtSnapshot.principalPaid).toBe(36);
      
      // Balance: 1200 + 24 - 60 = 1164
      expect(debtSnapshot.endingBalance).toBe(1164);
    });

    test('pays off single bucket debt correctly', () => {
      const debt = createDebt({
        amount: 100,
        min_payment: 120, // More than balance + interest
        buckets: [
          createBucket({ 
            balance: 100, 
            apr: 12,
            payment_priority: 1 
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      expect(results).toHaveLength(1);
      
      const debtSnapshot = results[0].debts[0];
      expect(debtSnapshot.isPaidOff).toBe(true);
      expect(debtSnapshot.endingBalance).toBe(0);
    });
  });

  describe('Multi-Bucket Priority Payment', () => {
    test('pays highest priority bucket first', () => {
      const debt = createDebt({
        amount: 2000,
        min_payment: 100,
        buckets: [
          createBucket({ 
            name: 'Purchases', 
            balance: 1000, 
            apr: 22, 
            payment_priority: 2 // Lower priority
          }),
          createBucket({ 
            name: 'Cash Advances', 
            balance: 1000, 
            apr: 28, 
            payment_priority: 1 // Higher priority
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 50 // Apply snowball
      });

      const firstMonth = results[0];
      const debtSnapshot = firstMonth.debts[0];
      
      expect(debtSnapshot.buckets).toHaveLength(2);
      
      // Find cash advances bucket (priority 1)
      const cashAdvancesBucket = debtSnapshot.buckets!.find(b => b.name === 'Cash Advances');
      const purchasesBucket = debtSnapshot.buckets!.find(b => b.name === 'Purchases');
      
      // Cash advances should receive the snowball payment
      expect(cashAdvancesBucket!.snowballApplied).toBe(50);
      expect(purchasesBucket!.snowballApplied).toBe(0);
    });

    test('allocates minimum payment proportionally by balance', () => {
      const debt = createDebt({
        amount: 3000,
        min_payment: 150,
        buckets: [
          createBucket({ 
            name: 'Small Balance', 
            balance: 1000, 
            apr: 20, 
            payment_priority: 2
          }),
          createBucket({ 
            name: 'Large Balance', 
            balance: 2000, 
            apr: 25, 
            payment_priority: 1
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      const debtSnapshot = results[0].debts[0];
      const smallBucket = debtSnapshot.buckets!.find(b => b.name === 'Small Balance');
      const largeBucket = debtSnapshot.buckets!.find(b => b.name === 'Large Balance');

      // Small bucket: 1000/3000 * 150 = 50
      // Large bucket: 2000/3000 * 150 = 100
      // (Approximately, after accounting for interest)
      expect(smallBucket!.principalPaid).toBeCloseTo(33.33, 1); // 50 - interest
      expect(largeBucket!.principalPaid).toBeCloseTo(58.33, 1); // 100 - interest
    });
  });

  describe('Bucket Completion and Rollover', () => {
    test('clears bucket and moves to next priority', () => {
      const debt = createDebt({
        amount: 200,
        min_payment: 50,
        buckets: [
          createBucket({ 
            name: 'Small Bucket', 
            balance: 50, 
            apr: 30, 
            payment_priority: 1
          }),
          createBucket({ 
            name: 'Large Bucket', 
            balance: 150, 
            apr: 20, 
            payment_priority: 2
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 100 // Large snowball to clear first bucket
      });

      // First month should clear the small bucket
      const firstMonth = results[0];
      const firstDebtSnapshot = firstMonth.debts[0];
      const smallBucket = firstDebtSnapshot.buckets!.find(b => b.name === 'Small Bucket');
      
      expect(smallBucket!.isPaidOff).toBe(true);
      expect(smallBucket!.endingBalance).toBe(0);

      // Second month should focus all extra payment on large bucket
      const secondMonth = results[1];
      const secondDebtSnapshot = secondMonth.debts[0];
      const largeBucketSecondMonth = secondDebtSnapshot.buckets!.find(b => b.name === 'Large Bucket');
      
      // Large bucket should receive the full snowball in month 2
      expect(largeBucketSecondMonth!.snowballApplied).toBe(100);
    });

    test('debt completion triggers snowball rollover', () => {
      const debt1 = createDebt({
        name: 'First Debt',
        amount: 100,
        min_payment: 25,
        order_index: 1,
        buckets: [
          createBucket({ balance: 100, apr: 24, payment_priority: 1 })
        ]
      });

      const debt2 = createDebt({
        name: 'Second Debt',
        amount: 1000,
        min_payment: 50,
        order_index: 2,
        buckets: [
          createBucket({ balance: 1000, apr: 18, payment_priority: 1 })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt1, debt2],
        extraPerMonth: 100
      });

      // Find when first debt is paid off
      const firstDebtPaidOffMonth = results.find(month => 
        month.debts[0].isPaidOff
      );
      
      expect(firstDebtPaidOffMonth).toBeTruthy();
      
      // Next month should have increased snowball for second debt
      const monthAfterPaidOff = results[results.findIndex(month => 
        month.debts[0].isPaidOff
      ) + 1];
      
      if (monthAfterPaidOff) {
        // Snowball should include original extra + first debt's min payment
        expect(monthAfterPaidOff.snowballAmount).toBe(125); // 100 + 25
      }
    });
  });

  describe('UK Credit Card Realistic Scenarios', () => {
    test('balance transfer expiry simulation', () => {
      // This would be extended for APR expiry logic
      const debt = createDebt({
        name: 'UK Credit Card',
        amount: 3000,
        min_payment: 90,
        buckets: [
          createBucket({ 
            name: 'Balance Transfer', 
            balance: 2000, 
            apr: 0,  // Promotional rate
            payment_priority: 3 // Pay last
          }),
          createBucket({ 
            name: 'Purchases', 
            balance: 800, 
            apr: 22.9, 
            payment_priority: 2
          }),
          createBucket({ 
            name: 'Cash Advances', 
            balance: 200, 
            apr: 28.9, 
            payment_priority: 1 // Pay first
          })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 200
      });

      const firstMonth = results[0];
      const debtSnapshot = firstMonth.debts[0];
      
      // Cash advances should get the snowball first
      const cashAdvances = debtSnapshot.buckets!.find(b => b.name === 'Cash Advances');
      expect(cashAdvances!.snowballApplied).toBe(200);
      
      // Balance transfer should get no snowball (lowest priority)
      const balanceTransfer = debtSnapshot.buckets!.find(b => b.name === 'Balance Transfer');
      expect(balanceTransfer!.snowballApplied).toBe(0);
      
      // Purchases should get no snowball while cash advances exist
      const purchases = debtSnapshot.buckets!.find(b => b.name === 'Purchases');
      expect(purchases!.snowballApplied).toBe(0);
    });

    test('calculates composite debt interest correctly', () => {
      const debt = createDebt({
        amount: 3000,
        min_payment: 120,
        buckets: [
          createBucket({ balance: 1000, apr: 0, payment_priority: 3 }),      // £0 interest
          createBucket({ balance: 1000, apr: 22.9, payment_priority: 2 }),   // £19.08 interest
          createBucket({ balance: 1000, apr: 28.9, payment_priority: 1 })    // £24.08 interest
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      const firstMonth = results[0];
      const debtSnapshot = firstMonth.debts[0];
      
      // Total interest should be sum of bucket interests
      // 0 + (1000 * 22.9/100/12) + (1000 * 28.9/100/12) = 0 + 19.08 + 24.08 = 43.16
      expect(debtSnapshot.interestCharged).toBeCloseTo(43.17, 2);
    });
  });

  describe('Edge Cases', () => {
    test('handles overpayment that clears multiple buckets', () => {
      const debt = createDebt({
        amount: 300,
        min_payment: 30,
        buckets: [
          createBucket({ balance: 100, apr: 24, payment_priority: 1 }),
          createBucket({ balance: 100, apr: 20, payment_priority: 2 }),
          createBucket({ balance: 100, apr: 18, payment_priority: 3 })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 500 // Massive overpayment
      });

      // Should clear entire debt in one month
      expect(results).toHaveLength(1);
      
      const debtSnapshot = results[0].debts[0];
      expect(debtSnapshot.isPaidOff).toBe(true);
      expect(debtSnapshot.endingBalance).toBe(0);
      
      // All buckets should be paid off
      debtSnapshot.buckets!.forEach(bucket => {
        expect(bucket.isPaidOff).toBe(true);
        expect(bucket.endingBalance).toBe(0);
      });
    });

    test('handles zero balance buckets gracefully', () => {
      const debt = createDebt({
        amount: 1000,
        min_payment: 50,
        buckets: [
          createBucket({ balance: 0, apr: 24, payment_priority: 1 }),
          createBucket({ balance: 1000, apr: 20, payment_priority: 2 })
        ]
      });

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 100
      });

      const firstMonth = results[0];
      const debtSnapshot = firstMonth.debts[0];
      
      // Zero balance bucket should remain at zero
      const zeroBucket = debtSnapshot.buckets!.find(b => b.balance === 0);
      expect(zeroBucket!.endingBalance).toBe(0);
      expect(zeroBucket!.interestCharged).toBe(0);
      
      // All snowball should go to the active bucket
      const activeBucket = debtSnapshot.buckets!.find(b => b.balance > 0);
      expect(activeBucket!.snowballApplied).toBe(100);
    });
  });
});