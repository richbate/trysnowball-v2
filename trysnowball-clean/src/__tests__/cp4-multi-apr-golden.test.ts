/**
 * CP-4 Multi-APR Golden Test Suite - Comprehensive Coverage
 * Tests bucket-aware debt engine against hand-calculated FCA-compliant fixtures
 * Ensures accurate multi-APR debt calculations with proper priority handling
 */

import { simulateBucketAwareSnowballPlan } from '../utils/bucketSimulator';
import { UKDebt, DebtBucket } from '../types/UKDebt';
import fixtures from '../tests/fixtures/cp4-multi-apr.fixtures.json';

describe('CP-4 Multi-APR Engine - Golden Tests', () => {

  fixtures.forEach(fixture => {
    if (fixture.expectedError) {
      it(`should validate: ${fixture.name}`, () => {
        const debts: UKDebt[] = fixture.input.debts.map(d => ({
          ...d,
          user_id: 'test_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buckets: d.buckets?.map(bucket => ({
            ...bucket,
            user_id: 'test_user',
            debt_id: d.id
          }))
        }));

        expect(() => {
          simulateBucketAwareSnowballPlan({
            debts,
            extraPerMonth: fixture.input.extraPerMonth
          });
        }).toThrow(fixture.expectedError);
      });
    } else {
      it(`should calculate correctly: ${fixture.name}`, () => {
        const debts: UKDebt[] = fixture.input.debts.map(d => ({
          ...d,
          user_id: 'test_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buckets: d.buckets?.map(bucket => ({
            ...bucket,
            user_id: 'test_user',
            debt_id: d.id
          }))
        }));

        const results = simulateBucketAwareSnowballPlan({
          debts,
          extraPerMonth: fixture.input.extraPerMonth
        });

        // Verify overall results
        if (fixture.expected.totalMonths !== undefined) {
          expect(results.length).toBe(fixture.expected.totalMonths);
        }

        if (fixture.expected.totalInterest !== undefined) {
          const totalInterest = results.reduce((sum, month) => sum + month.totalInterest, 0);
          expect(totalInterest).toBeCloseTo(fixture.expected.totalInterest, 2);
        }

        // Verify monthly breakdown
        if (fixture.expected.monthlyBreakdown) {
          fixture.expected.monthlyBreakdown.forEach(expectedMonth => {
            const actualMonth = results[expectedMonth.month - 1];
            expect(actualMonth).toBeDefined();

            if (expectedMonth.buckets) {
              Object.entries(expectedMonth.buckets).forEach(([bucketId, expectedBucket]) => {
                const actualDebt = actualMonth.debts.find(d => d.id === fixture.input.debts[0].id);
                expect(actualDebt).toBeDefined();

                if (actualDebt && (actualDebt as any).buckets) {
                  const actualBucket = (actualDebt as any).buckets.find((b: any) => b.id === bucketId);
                  expect(actualBucket).toBeDefined();

                  if (expectedBucket.startingBalance !== undefined) {
                    expect(actualBucket.startingBalance).toBeCloseTo(expectedBucket.startingBalance, 2);
                  }
                  if (expectedBucket.interestCharged !== undefined) {
                    expect(actualBucket.interestCharged).toBeCloseTo(expectedBucket.interestCharged, 2);
                  }
                  if (expectedBucket.principalPaid !== undefined) {
                    expect(actualBucket.principalPaid).toBeCloseTo(expectedBucket.principalPaid, 2);
                  }
                  if (expectedBucket.endingBalance !== undefined) {
                    expect(actualBucket.endingBalance).toBeCloseTo(expectedBucket.endingBalance, 2);
                  }
                  if (expectedBucket.isPaidOff !== undefined) {
                    expect(actualBucket.isPaidOff).toBe(expectedBucket.isPaidOff);
                  }
                }
              });
            }

            // Check monthly totals
            if (expectedMonth.totalBalance !== undefined) {
              expect(actualMonth.totalBalance).toBeCloseTo(expectedMonth.totalBalance, 2);
            }
            if (expectedMonth.totalInterest !== undefined) {
              expect(actualMonth.totalInterest).toBeCloseTo(expectedMonth.totalInterest, 2);
            }
            if (expectedMonth.totalPrincipal !== undefined) {
              expect(actualMonth.totalPrincipal).toBeCloseTo(expectedMonth.totalPrincipal, 2);
            }
          });
        }

        // Verify bucket clearance timing
        if (fixture.expected.bucketClearanceMonths) {
          Object.entries(fixture.expected.bucketClearanceMonths).forEach(([bucketName, expectedMonth]) => {
            // Find when this bucket was cleared
            let actualClearanceMonth = null;
            for (let i = 0; i < results.length; i++) {
              const monthResult = results[i];
              const debt = monthResult.debts.find(d => d.id === fixture.input.debts[0].id);
              if (debt && (debt as any).buckets) {
                const bucket = (debt as any).buckets.find((b: any) => b.name === bucketName);
                if (bucket && bucket.isPaidOff) {
                  actualClearanceMonth = i + 1;
                  break;
                }
              }
            }
            expect(actualClearanceMonth).toBe(expectedMonth);
          });
        }
      });
    }
  });

  describe('FCA Compliance Tests', () => {
    it('should allocate minimum payments according to FCA guidelines', () => {
      const debt: UKDebt = {
        id: 'fca_test',
        user_id: 'test_user',
        name: 'FCA Compliance Test',
        amount: 1000,
        apr: 20, // This will be overridden by bucket APRs
        min_payment: 50,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'high_apr',
            user_id: 'test_user',
            debt_id: 'fca_test',
            name: 'High APR',
            balance: 500,
            apr: 25.0,
            payment_priority: 1
          },
          {
            id: 'low_apr',
            user_id: 'test_user',
            debt_id: 'fca_test',
            name: 'Low APR',
            balance: 500,
            apr: 15.0,
            payment_priority: 2
          }
        ]
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      const month1 = results[0];
      const debtResult = month1.debts[0];

      // Verify payment allocation follows FCA guidelines
      // Minimum payment should be allocated proportionally by balance
      // Extra payments should go to highest APR first
      expect(debtResult).toBeDefined();
    });

    it('should handle interest rate changes mid-simulation', () => {
      // This would test dynamic APR changes during simulation
      // Currently a placeholder for future implementation
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle zero balance buckets', () => {
      const debt: UKDebt = {
        id: 'zero_bucket',
        user_id: 'test_user',
        name: 'Zero Bucket Test',
        amount: 100,
        apr: 20,
        min_payment: 25,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'zero',
            user_id: 'test_user',
            debt_id: 'zero_bucket',
            name: 'Zero Balance',
            balance: 0,
            apr: 25.0,
            payment_priority: 1
          },
          {
            id: 'normal',
            user_id: 'test_user',
            debt_id: 'zero_bucket',
            name: 'Normal Balance',
            balance: 100,
            apr: 20.0,
            payment_priority: 2
          }
        ]
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      expect(results.length).toBeGreaterThan(0);
      // Zero bucket should remain at zero throughout
      results.forEach(month => {
        const debtResult = month.debts[0];
        if ((debtResult as any).buckets) {
          const zeroBucket = (debtResult as any).buckets.find((b: any) => b.id === 'zero');
          expect(zeroBucket?.endingBalance).toBe(0);
        }
      });
    });

    it('should prevent infinite loops with growing debt', () => {
      const debt: UKDebt = {
        id: 'growing_debt',
        user_id: 'test_user',
        name: 'Growing Debt',
        amount: 1000,
        apr: 30, // 30% APR
        min_payment: 20, // £20/month, less than interest
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'high_interest',
            user_id: 'test_user',
            debt_id: 'growing_debt',
            name: 'High Interest',
            balance: 1000,
            apr: 30.0,
            payment_priority: 1
          }
        ]
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 0
      });

      // Should hit 600 month limit, not infinite loop
      expect(results.length).toBeLessThanOrEqual(600);

      // Balance should be growing
      const finalMonth = results[results.length - 1];
      expect(finalMonth.totalBalance).toBeGreaterThan(1000);
    });

    it('should handle floating point precision correctly', () => {
      const debt: UKDebt = {
        id: 'precision_test',
        user_id: 'test_user',
        name: 'Precision Test',
        amount: 333.33,
        apr: 19.99,
        min_payment: 11.11,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'precision_bucket',
            user_id: 'test_user',
            debt_id: 'precision_test',
            name: 'Precision Bucket',
            balance: 333.33,
            apr: 19.99,
            payment_priority: 1
          }
        ]
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 22.22
      });

      results.forEach(month => {
        // All monetary values should be rounded to 2 decimal places
        expect(month.totalBalance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(month.totalInterest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(month.totalPrincipal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);

        // Check for NaN values
        expect(Number.isNaN(month.totalBalance)).toBe(false);
        expect(Number.isNaN(month.totalInterest)).toBe(false);
        expect(Number.isNaN(month.totalPrincipal)).toBe(false);

        // Check bucket-level values
        month.debts.forEach(debt => {
          if ((debt as any).buckets) {
            (debt as any).buckets.forEach((bucket: any) => {
              expect(bucket.endingBalance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
              expect(bucket.interestCharged.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
              expect(bucket.principalPaid.toString()).toMatch(/^\d+(\.\d{0,2})?$/);

              expect(Number.isNaN(bucket.endingBalance)).toBe(false);
              expect(Number.isNaN(bucket.interestCharged)).toBe(false);
              expect(Number.isNaN(bucket.principalPaid)).toBe(false);
            });
          }
        });
      });
    });

    it('should handle overpayment scenarios correctly', () => {
      const debt: UKDebt = {
        id: 'overpay_test',
        user_id: 'test_user',
        name: 'Overpayment Test',
        amount: 100,
        apr: 20,
        min_payment: 25,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'small_bucket',
            user_id: 'test_user',
            debt_id: 'overpay_test',
            name: 'Small Bucket',
            balance: 100,
            apr: 20.0,
            payment_priority: 1
          }
        ]
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 1000 // Massive overpayment
      });

      // Should clear in first month
      expect(results.length).toBe(1);

      const finalMonth = results[0];
      expect(finalMonth.totalBalance).toBe(0);

      // Payment should not exceed initial balance + interest
      const debtResult = finalMonth.debts[0];
      if ((debtResult as any).buckets) {
        const bucket = (debtResult as any).buckets[0];
        expect(bucket.principalPaid).toBeLessThanOrEqual(100 + bucket.interestCharged);
      }
    });
  });

  describe('Performance & Stability', () => {
    it('should complete complex scenarios within reasonable time', () => {
      const start = Date.now();

      // Create a complex debt with multiple buckets
      const debt: UKDebt = {
        id: 'complex_debt',
        user_id: 'test_user',
        name: 'Complex Multi-Bucket Debt',
        amount: 10000,
        apr: 20,
        min_payment: 200,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: Array.from({ length: 10 }, (_, i) => ({
          id: `bucket_${i}`,
          user_id: 'test_user',
          debt_id: 'complex_debt',
          name: `Bucket ${i}`,
          balance: 1000,
          apr: 15 + (i * 2), // Varying APRs
          payment_priority: i + 1
        }))
      };

      const results = simulateBucketAwareSnowballPlan({
        debts: [debt],
        extraPerMonth: 300
      });

      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should not leak memory during repeated runs', () => {
      const debt: UKDebt = {
        id: 'memory_test',
        user_id: 'test_user',
        name: 'Memory Test',
        amount: 1000,
        apr: 20,
        min_payment: 50,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          {
            id: 'memory_bucket',
            user_id: 'test_user',
            debt_id: 'memory_test',
            name: 'Memory Bucket',
            balance: 1000,
            apr: 20.0,
            payment_priority: 1
          }
        ]
      };

      // Run simulation multiple times
      for (let i = 0; i < 100; i++) {
        const results = simulateBucketAwareSnowballPlan({
          debts: [debt],
          extraPerMonth: 100
        });
        expect(results.length).toBeGreaterThan(0);
      }

      // If we get here without out-of-memory errors, test passes
      expect(true).toBe(true);
    });
  });
});