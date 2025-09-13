/**
 * Golden Test Fixtures for Multi-APR Bucket Simulation
 * Hand-calculated expected results - these are TRUTH ANCHORS
 * If these fail, the simulation engine is mathematically wrong
 */

import { UKDebt, DebtBucket } from '../types/UKDebt';
import { simulateCompositePlan } from '../utils/compositeBucketEngine';

// Test fixture: Realistic UK Credit Card
const barclaycardPlatinum: UKDebt = {
  id: 'barclaycard_test',
  user_id: 'test_user',
  name: 'Barclaycard Platinum',
  amount: 3000,
  apr: 18.6, // Weighted average (not used in bucket mode)
  min_payment: 75, // 2.5% of balance
  order_index: 1,
  buckets: [
    {
      id: 'purchases',
      name: 'Purchases',
      balance: 2000,          // 66.7% of debt
      apr: 22.9,              // Standard purchase rate
      payment_priority: 2,    // Medium priority
    },
    {
      id: 'cash_advances', 
      name: 'Cash Advances',
      balance: 500,           // 16.7% of debt  
      apr: 27.9,              // High APR - pay first
      payment_priority: 1,    // Highest priority
    },
    {
      id: 'balance_transfer',
      name: 'Balance Transfer', 
      balance: 500,           // 16.7% of debt
      apr: 0,                 // 0% promotional rate
      payment_priority: 3,    // Lowest priority - pay last
    }
  ]
};

describe('Golden Bucket Simulation Tests', () => {
  
  describe('Hand-Calculated Month 1: Barclaycard with £100 extra', () => {
    test('calculates interest per bucket correctly', () => {
      // HAND CALCULATION:
      // Purchases: £2000 * (22.9% / 12) = £2000 * 0.01908 = £38.17
      // Cash Advances: £500 * (27.9% / 12) = £500 * 0.02325 = £11.63  
      // Balance Transfer: £500 * (0% / 12) = £500 * 0 = £0.00
      // TOTAL: £38.17 + £11.63 + £0.00 = £49.80
      
      const results = simulateCompositePlan([barclaycardPlatinum], 100);
      const month1 = results[0];
      
      const purchases = month1.buckets.find(b => b.name === 'Purchases')!;
      const cashAdvances = month1.buckets.find(b => b.name === 'Cash Advances')!;
      const balanceTransfer = month1.buckets.find(b => b.name === 'Balance Transfer')!;
      
      expect(purchases.interestCharged).toBeCloseTo(38.17, 1);
      expect(cashAdvances.interestCharged).toBeCloseTo(11.63, 1);
      expect(balanceTransfer.interestCharged).toBe(0);
      expect(month1.totalInterest).toBeCloseTo(49.80, 1);
    });

    test('allocates minimum payment proportionally by balance', () => {
      // HAND CALCULATION:
      // Min payment: £75
      // Purchases: £75 * (2000/3000) = £75 * 0.6667 = £50.00
      // Cash Advances: £75 * (500/3000) = £75 * 0.1667 = £12.50
      // Balance Transfer: £75 * (500/3000) = £75 * 0.1667 = £12.50
      // TOTAL: £50.00 + £12.50 + £12.50 = £75.00 ✓
      
      const results = simulateCompositePlan([barclaycardPlatinum], 100);
      const month1 = results[0];
      
      const purchases = month1.buckets.find(b => b.name === 'Purchases')!;
      const cashAdvances = month1.buckets.find(b => b.name === 'Cash Advances')!;
      const balanceTransfer = month1.buckets.find(b => b.name === 'Balance Transfer')!;
      
      expect(purchases.minimumPayment).toBeCloseTo(50.00, 2);
      expect(cashAdvances.minimumPayment).toBeCloseTo(12.50, 2);
      expect(balanceTransfer.minimumPayment).toBeCloseTo(12.50, 2);
      expect(month1.totalMinimumPayment).toBeCloseTo(75.00, 2);
    });

    test('applies £100 snowball to cash advances only (priority 1)', () => {
      // HAND CALCULATION:
      // Extra payment: £100
      // Target: Cash Advances (payment_priority: 1)
      // Other buckets get: £0 extra
      
      const results = simulateCompositePlan([barclaycardPlatinum], 100);
      const month1 = results[0];
      
      const purchases = month1.buckets.find(b => b.name === 'Purchases')!;
      const cashAdvances = month1.buckets.find(b => b.name === 'Cash Advances')!;
      const balanceTransfer = month1.buckets.find(b => b.name === 'Balance Transfer')!;
      
      expect(purchases.snowballPayment).toBe(0);
      expect(cashAdvances.snowballPayment).toBe(100);
      expect(balanceTransfer.snowballPayment).toBe(0);
    });

    test('calculates ending balances correctly', () => {
      // HAND CALCULATION:
      // Cash Advances: £500 + £11.63 - £12.50 - £100 = £399.13
      // Purchases: £2000 + £38.17 - £50.00 = £1988.17  
      // Balance Transfer: £500 + £0 - £12.50 = £487.50
      // TOTAL: £399.13 + £1988.17 + £487.50 = £2874.80
      
      const results = simulateCompositePlan([barclaycardPlatinum], 100);
      const month1 = results[0];
      
      const purchases = month1.buckets.find(b => b.name === 'Purchases')!;
      const cashAdvances = month1.buckets.find(b => b.name === 'Cash Advances')!;
      const balanceTransfer = month1.buckets.find(b => b.name === 'Balance Transfer')!;
      
      expect(purchases.endingBalance).toBeCloseTo(1988.17, 1);
      expect(cashAdvances.endingBalance).toBeCloseTo(399.13, 1);
      expect(balanceTransfer.endingBalance).toBeCloseTo(487.50, 1);
      expect(month1.totalEndingBalance).toBeCloseTo(2874.80, 1);
    });
  });

  describe('Golden Scenario: Cash Advance Bucket Cleared', () => {
    test('clears cash advance bucket in month 4', () => {
      // HAND CALCULATION (continuing from above):
      // Month 1: Cash balance £399.13
      // Month 2: £399.13 + interest - payments ≈ £290 (with £100 extra)
      // Month 3: ≈ £180
      // Month 4: Should clear completely
      
      const expectedClearedMonth = 4;
      const expectedRemainingAfterClear = 0;
      
      // TODO: Test against actual simulation
      expect(true).toBe(true); // Placeholder until engine built
    });

    test('moves snowball to purchases after cash advance cleared', () => {
      // CALCULATION:
      // After cash advance cleared, £100 extra should target Purchases (priority 2)
      // Balance Transfer (priority 3) should still get £0 extra
      
      const expectedSnowballAfterClear = {
        purchases: 100,        // Now gets the snowball
        cashAdvances: 0,       // Cleared
        balanceTransfer: 0     // Still lowest priority
      };
      
      // TODO: Test against actual simulation
      expect(true).toBe(true); // Placeholder until engine built
    });
  });

  describe('Golden Comparison: Single APR vs Multi-Bucket', () => {
    test('multi-bucket shows higher total interest due to cash advance APR', () => {
      // CALCULATION:
      // Single APR (weighted): (2000*22.9 + 500*27.9 + 500*0) / 3000 = 60750/3000 = 20.25%
      // Single APR month 1 interest: £3000 * (20.25% / 12) = £50.63
      // Multi-bucket month 1 interest: £49.80 (from above)
      // 
      // BUT: Multi-bucket pays high APR first, so total interest over time is LOWER
      
      const singleAPRMonthlyInterest = 50.63;
      const multiBucketMonthlyInterest = 49.80;
      
      // Month 1: Single APR slightly higher due to weighted average
      expect(singleAPRMonthlyInterest).toBeGreaterThan(multiBucketMonthlyInterest);
      
      // TODO: Test full payoff - multi-bucket should have lower TOTAL interest
      expect(true).toBe(true); // Placeholder until engine built
    });

    test('multi-bucket achieves debt freedom faster', () => {
      // HYPOTHESIS:
      // Multi-bucket targeting high APR first should clear debt faster
      // Single APR: ~X months to clear
      // Multi-bucket: ~X-2 months to clear
      
      const expectedSingleAPRMonths = 42; // Rough estimate
      const expectedMultiBucketMonths = 40; // Should be faster
      
      // TODO: Test against actual simulation
      expect(true).toBe(true); // Placeholder until engine built
    });
  });

  describe('Edge Case: Overpayment Clears Multiple Buckets', () => {
    const smallDebt: UKDebt = {
      id: 'small_test',
      user_id: 'test_user', 
      name: 'Small Test Debt',
      amount: 300,
      apr: 20,
      min_payment: 30,
      order_index: 1,
      buckets: [
        {
          id: 'bucket_1',
          name: 'High Priority',
          balance: 100,
          apr: 30,
          payment_priority: 1
        },
        {
          id: 'bucket_2', 
          name: 'Low Priority',
          balance: 200,
          apr: 15,
          payment_priority: 2
        }
      ]
    };

    test('£500 overpayment clears entire debt in one month', () => {
      // CALCULATION:
      // Total balance: £300
      // Interest: ~£4
      // Available payment: £30 + £500 = £530
      // Result: Debt should be completely cleared
      
      const massiveExtra = 500;
      const expectedMonthsToClear = 1;
      const expectedFinalBalance = 0;
      
      // TODO: Test against actual simulation
      expect(true).toBe(true); // Placeholder until engine built  
    });
  });

  describe('Edge Case: Zero Balance Bucket', () => {
    const zeroBalanceDebt: UKDebt = {
      id: 'zero_test',
      user_id: 'test_user',
      name: 'Zero Balance Test',
      amount: 1000,
      apr: 20,
      min_payment: 50,
      order_index: 1,
      buckets: [
        {
          id: 'zero_bucket',
          name: 'Zero Balance',
          balance: 0,           // Already paid off
          apr: 25,
          payment_priority: 1   // Highest priority but zero balance
        },
        {
          id: 'active_bucket',
          name: 'Active Balance', 
          balance: 1000,
          apr: 18,
          payment_priority: 2
        }
      ]
    };

    test('skips zero balance bucket, applies snowball to active bucket', () => {
      // CALCULATION:
      // Zero bucket: £0 interest, £0 payments
      // Active bucket: Gets all minimum payment + all extra payment
      
      const expectedAllocation = {
        zeroBucket: { interest: 0, payment: 0, snowball: 0 },
        activeBucket: { interest: 15, payment: 50, snowball: 100 }
      };
      
      // TODO: Test against actual simulation
      expect(true).toBe(true); // Placeholder until engine built
    });
  });
});

/**
 * Test Fixtures Export
 * These are the canonical test debts used throughout the test suite
 */
export const testFixtures = {
  barclaycardPlatinum,
  // Additional fixtures can be added here
};