/**
 * CP-2 Golden Test Suite - Forecast Engine v1
 * Tests single-APR snowball calculations against hand-calculated fixtures
 * Ensures Free tier users have a reliable fallback engine
 */

import { simulateSnowballPlanV1 } from '../utils/snowballSimulatorV1';
import { UKDebt } from '../types/UKDebt';
import fixtures from '../tests/fixtures/cp2-forecast.fixtures.json';

describe('CP-2 Forecast Engine v1 - Golden Tests', () => {
  
  fixtures.forEach(fixture => {
    if (fixture.expectedError) {
      it(`should validate: ${fixture.name}`, () => {
        const debts: UKDebt[] = fixture.input.debts.map(d => ({
          ...d,
          user_id: 'test_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const result = simulateSnowballPlanV1(debts, fixture.input.extra_per_month);
        
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
        
        const result = simulateSnowballPlanV1(debts, fixture.input.extra_per_month);
        
        // Should have no errors
        expect(result.errors).toEqual([]);
        
        // Check each expected month
        fixture.expected.forEach(expectedMonth => {
          const actualMonth = result.monthlySnapshots.find(s => s.month === expectedMonth.month);
          
          expect(actualMonth).toBeDefined();
          if (!actualMonth) return;
          
          // Check debt-specific values
          if (expectedMonth.debts) {
            Object.entries(expectedMonth.debts).forEach(([debtId, expectedDebt]) => {
              const actualDebt = actualMonth.debts[debtId];
              expect(actualDebt).toBeDefined();
              
              if (expectedDebt.interest !== undefined) {
                expect(actualDebt.interest).toBeCloseTo(expectedDebt.interest, 2);
              }
              if (expectedDebt.principal !== undefined) {
                expect(actualDebt.principal).toBeCloseTo(expectedDebt.principal, 2);
              }
              if (expectedDebt.balance !== undefined) {
                expect(actualDebt.balance).toBeCloseTo(expectedDebt.balance, 2);
              }
              if (expectedDebt.payment !== undefined) {
                expect(actualDebt.payment).toBeCloseTo(expectedDebt.payment, 2);
              }
              if (expectedDebt.isPaidOff !== undefined) {
                expect(actualDebt.isPaidOff).toBe(expectedDebt.isPaidOff);
              }
              if (expectedDebt.minPaymentPlusRollover !== undefined) {
                expect(actualDebt.minPaymentPlusRollover).toBeCloseTo(expectedDebt.minPaymentPlusRollover, 2);
              }
              if (expectedDebt.snowballRollover !== undefined) {
                expect(actualDebt.snowballRollover).toBeCloseTo(expectedDebt.snowballRollover, 2);
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
        });
      });
    }
  });
  
  describe('Edge Cases', () => {
    it('should handle zero balance debts', () => {
      const debts: UKDebt[] = [{
        id: 'zero_debt',
        user_id: 'test_user',
        name: 'Zero Debt',
        amount: 0,
        apr: 20,
        min_payment: 50,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      const result = simulateSnowballPlanV1(debts, 0);
      
      expect(result.totalMonths).toBe(0);
      expect(result.totalInterestPaid).toBe(0);
      expect(result.totalPrincipalPaid).toBe(0);
    });
    
    it('should limit to 600 months maximum', () => {
      const debts: UKDebt[] = [{
        id: 'huge_debt',
        user_id: 'test_user',
        name: 'Huge Debt',
        amount: 1000000, // £1M
        apr: 20,
        min_payment: 1, // £1 min payment - would take forever
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      const result = simulateSnowballPlanV1(debts, 0);
      
      expect(result.totalMonths).toBeLessThanOrEqual(600);
      expect(result.monthlySnapshots.length).toBeLessThanOrEqual(600);
    });
    
    it('should apply snowball correctly when first debt clears', () => {
      const debts: UKDebt[] = [
        {
          id: 'small',
          user_id: 'test_user',
          name: 'Small Debt',
          amount: 100,
          apr: 12,
          min_payment: 50,
          order_index: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'large',
          user_id: 'test_user',
          name: 'Large Debt',
          amount: 1000,
          apr: 15,
          min_payment: 100,
          order_index: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const result = simulateSnowballPlanV1(debts, 0);
      
      // Small debt should clear in month 3
      const month3 = result.monthlySnapshots[2];
      expect(month3.debts.small.isPaidOff).toBe(true);
      
      // Month 4 should show snowball applied to large debt
      const month4 = result.monthlySnapshots[3];
      expect(month4.debts.large.minPaymentPlusRollover).toBe(150); // 100 + 50 snowball
    });
  });
  
  describe('Rounding Precision', () => {
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
        updated_at: new Date().toISOString()
      }];
      
      const result = simulateSnowballPlanV1(debts, 11.11);
      
      result.monthlySnapshots.forEach(snapshot => {
        // Check all values are rounded to 2dp
        Object.values(snapshot.debts).forEach(debt => {
          expect(debt.interest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.principal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.balance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
          expect(debt.payment.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        });
        
        expect(snapshot.totalInterest.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalPrincipal.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalPayment.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
        expect(snapshot.totalBalance.toString()).toMatch(/^\d+(\.\d{0,2})?$/);
      });
    });
  });
});