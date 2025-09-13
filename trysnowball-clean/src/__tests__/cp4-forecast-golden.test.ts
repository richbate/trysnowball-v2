/**
 * CP-4 Golden Test Suite - Composite Forecast Engine v2
 * Tests multi-APR bucket calculations against hand-calculated fixtures
 * Production engine for Pro tier users with advanced debt modeling
 */

import { simulateCompositeSnowballPlan } from '../utils/compositeSimulatorV2';
import { UKDebt } from '../types/UKDebt';
import fixtures from '../tests/fixtures/cp4-forecast.fixtures.json';

describe('CP-4 Composite Forecast Engine v2 - Golden Tests', () => {
  
  fixtures.forEach(fixture => {
    if (fixture.expectedError) {
      it(`should validate: ${fixture.name}`, () => {
        const debts: UKDebt[] = fixture.input.debts.map(d => ({
          ...d,
          user_id: 'test_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const result = simulateCompositeSnowballPlan(debts, fixture.input.extra_per_month);
        
        expect(result.errors).toBeDefined();
        expect(result.errors?.length).toBeGreaterThan(0);
        expect(result.errors?.[0]).toContain(fixture.expectedError);
      });
    } else {
      it(`should calculate correctly: ${fixture.name}`, () => {
        const debts: UKDebt[] = fixture.input.debts.map(d => ({
          ...d,
          user_id: 'test_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const result = simulateCompositeSnowballPlan(debts, fixture.input.extra_per_month);
        
        // Should have no errors
        expect(result.errors).toEqual([]);
        
        // Check each expected month
        fixture.expected.forEach(expectedMonth => {
          const actualMonth = result.monthlySnapshots.find(s => s.month === expectedMonth.month);
          
          expect(actualMonth).toBeDefined();
          if (!actualMonth) return;
          
          // Check bucket-specific values
          if (expectedMonth.buckets) {
            Object.entries(expectedMonth.buckets).forEach(([bucketId, expectedBucket]) => {
              const actualBucket = actualMonth.buckets[bucketId];
              expect(actualBucket).toBeDefined();
              
              if (expectedBucket.interest !== undefined) {
                expect(actualBucket.interest).toBeCloseTo(expectedBucket.interest, 2);
              }
              if (expectedBucket.principal !== undefined) {
                expect(actualBucket.principal).toBeCloseTo(expectedBucket.principal, 2);
              }
              if (expectedBucket.payment !== undefined) {
                expect(actualBucket.payment).toBeCloseTo(expectedBucket.payment, 2);
              }
              if (expectedBucket.balance !== undefined) {
                expect(actualBucket.balance).toBeCloseTo(expectedBucket.balance, 2);
              }
            });
          }
          
          // Check debt-specific values
          if (expectedMonth.debts) {
            Object.entries(expectedMonth.debts).forEach(([debtId, expectedDebt]) => {
              const actualDebt = actualMonth.debts[debtId];
              expect(actualDebt).toBeDefined();
              
              if (expectedDebt.interest !== undefined) {
                expect(actualDebt.totalInterest).toBeCloseTo(expectedDebt.interest, 2);
              }
              if (expectedDebt.principal !== undefined) {
                expect(actualDebt.totalPrincipal).toBeCloseTo(expectedDebt.principal, 2);
              }
              if (expectedDebt.payment !== undefined) {
                expect(actualDebt.totalPayment).toBeCloseTo(expectedDebt.payment, 2);
              }
              if (expectedDebt.balance !== undefined) {
                expect(actualDebt.totalBalance).toBeCloseTo(expectedDebt.balance, 2);
              }
              if (expectedDebt.isPaidOff !== undefined) {
                expect(actualDebt.isPaidOff).toBe(expectedDebt.isPaidOff);
              }
              if (expectedDebt.snowballRollover !== undefined) {
                expect(actualDebt.snowballRollover).toBeCloseTo(expectedDebt.snowballRollover, 2);
              }
              if (expectedDebt.minPaymentPlusRollover !== undefined) {
                expect(actualDebt.minPaymentPlusRollover).toBeCloseTo(expectedDebt.minPaymentPlusRollover, 2);
              }
            });
          }
          
          // Check totals
          if (expectedMonth.totalInterest !== undefined) {
            expect(actualMonth.totalInterest).toBeCloseTo(expectedMonth.totalInterest, 2);
          }
          if (expectedMonth.totalPrincipal !== undefined) {
            expect(actualMonth.totalPrincipal).toBeCloseTo(expectedMonth.totalPrincipal, 2);
          }
          if (expectedMonth.totalPayment !== undefined) {
            expect(actualMonth.totalPayment).toBeCloseTo(expectedMonth.totalPayment, 2);
          }
          if (expectedMonth.snowballApplied !== undefined) {
            expect(actualMonth.snowballApplied).toBeCloseTo(expectedMonth.snowballApplied, 2);
          }
        });
      });
    }
  });
  
  describe('Multi-APR Bucket Features', () => {
    it('should process payments in priority order (highest APR first)', () => {
      const debts: UKDebt[] = [{
        id: 'priority_test',
        user_id: 'test_user',
        name: 'Priority Test Card',
        amount: 1000,
        apr: 15, // Fallback APR
        min_payment: 100,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          { id: 'low_apr', name: 'Low APR', balance: 400, apr: 5, payment_priority: 3, created_at: new Date().toISOString() },
          { id: 'high_apr', name: 'High APR', balance: 300, apr: 25, payment_priority: 1, created_at: new Date().toISOString() },
          { id: 'med_apr', name: 'Medium APR', balance: 300, apr: 15, payment_priority: 2, created_at: new Date().toISOString() }
        ]
      }];
      
      const result = simulateCompositeSnowballPlan(debts, 0);
      const month1 = result.monthlySnapshots[0];
      
      // High APR bucket should get most payment (priority 1)
      const highAPRBucket = month1.buckets.high_apr;
      const medAPRBucket = month1.buckets.med_apr;
      const lowAPRBucket = month1.buckets.low_apr;
      
      expect(highAPRBucket.payment).toBeGreaterThan(medAPRBucket.payment);
      expect(medAPRBucket.payment).toBeGreaterThan(lowAPRBucket.payment);
    });
    
    it('should track interest breakdown by bucket', () => {
      const debts: UKDebt[] = [{
        id: 'breakdown_test',
        user_id: 'test_user',
        name: 'Breakdown Test',
        amount: 2000,
        apr: 20,
        min_payment: 100,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          { id: 'cash', name: 'Cash Advances', balance: 1000, apr: 28, payment_priority: 1, created_at: new Date().toISOString() },
          { id: 'purchases', name: 'Purchases', balance: 1000, apr: 18, payment_priority: 2, created_at: new Date().toISOString() }
        ]
      }];
      
      const result = simulateCompositeSnowballPlan(debts, 0);
      
      expect(result.interestBreakdown).toBeDefined();
      expect(result.interestBreakdown.cash).toBeDefined();
      expect(result.interestBreakdown.purchases).toBeDefined();
      
      // Cash advances should have higher interest rate
      expect(result.interestBreakdown.cash.apr).toBe(28);
      expect(result.interestBreakdown.purchases.apr).toBe(18);
    });
  });
  
  describe('Snowball Rollover', () => {
    it('should roll minimum payments to next debt when first is cleared', () => {
      const debts: UKDebt[] = [
        {
          id: 'small_debt',
          user_id: 'test_user',
          name: 'Small Debt',
          amount: 200,
          apr: 20,
          min_payment: 50,
          order_index: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'large_debt',
          user_id: 'test_user',
          name: 'Large Debt',
          amount: 2000,
          apr: 15,
          min_payment: 100,
          order_index: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const result = simulateCompositeSnowballPlan(debts, 0);
      
      // Find month when small debt is paid off
      const payoffMonth = result.monthlySnapshots.find(s => 
        s.newlyPaidOffDebts.includes('small_debt')
      );
      expect(payoffMonth).toBeDefined();
      
      // Next month should show snowball applied to large debt
      if (payoffMonth) {
        const nextMonth = result.monthlySnapshots[payoffMonth.month]; // month+1 is index month
        if (nextMonth) {
          expect(nextMonth.debts.large_debt.snowballRollover).toBe(50);
          expect(nextMonth.debts.large_debt.minPaymentPlusRollover).toBe(150);
        }
      }
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero balance buckets', () => {
      const debts: UKDebt[] = [{
        id: 'zero_bucket',
        user_id: 'test_user',
        name: 'Zero Bucket Test',
        amount: 1000,
        apr: 20,
        min_payment: 50,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          { id: 'zero', name: 'Zero Balance', balance: 0, apr: 25, payment_priority: 1, created_at: new Date().toISOString() },
          { id: 'normal', name: 'Normal Balance', balance: 1000, apr: 20, payment_priority: 2, created_at: new Date().toISOString() }
        ]
      }];
      
      const result = simulateCompositeSnowballPlan(debts, 0);
      
      expect(result.errors).toEqual([]);
      expect(result.monthlySnapshots.length).toBeGreaterThan(0);
      
      // Zero bucket should be marked as paid off
      const month1 = result.monthlySnapshots[0];
      expect(month1.buckets.zero.isPaidOff).toBe(true);
      expect(month1.buckets.zero.payment).toBe(0);
    });
    
    it('should limit simulation to 600 months', () => {
      const debts: UKDebt[] = [{
        id: 'huge_debt',
        user_id: 'test_user',
        name: 'Huge Debt',
        amount: 1000000,
        apr: 20,
        min_payment: 100, // Very low payment for huge balance
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      const result = simulateCompositeSnowballPlan(debts, 0);
      
      expect(result.totalMonths).toBeLessThanOrEqual(600);
      expect(result.monthlySnapshots.length).toBeLessThanOrEqual(600);
    });
  });
  
  describe('Rounding and Precision', () => {
    it('should round all monetary values to 2 decimal places', () => {
      const debts: UKDebt[] = [{
        id: 'rounding_test',
        user_id: 'test_user',
        name: 'Rounding Test',
        amount: 999.99,
        apr: 19.99,
        min_payment: 33.33,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        buckets: [
          { id: 'bucket1', name: 'Test Bucket', balance: 999.99, apr: 19.99, payment_priority: 1, created_at: new Date().toISOString() }
        ]
      }];
      
      const result = simulateCompositeSnowballPlan(debts, 11.11);
      
      result.monthlySnapshots.forEach(snapshot => {
        // Check all bucket values are rounded to 2dp
        Object.values(snapshot.buckets).forEach(bucket => {
          expect(bucket.interest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(bucket.principal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(bucket.payment.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(bucket.balance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        });
        
        // Check all debt totals are rounded
        Object.values(snapshot.debts).forEach(debt => {
          expect(debt.totalInterest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.totalPrincipal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.totalPayment.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.totalBalance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        });
        
        // Check snapshot totals
        expect(snapshot.totalInterest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalPrincipal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalPayment.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalBalance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
      });
    });
  });
});