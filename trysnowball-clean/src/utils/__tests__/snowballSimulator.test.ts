/**
 * CP-4 Snowball Simulator Tests
 * Validates mathematical accuracy of debt payoff simulation
 */

import { simulateSnowballPlan, generateForecastSummary } from '../snowballSimulator';
import { UKDebt } from '../../types/UKDebt';

describe('Snowball Simulator', () => {
  describe('Single Debt Scenarios', () => {
    test('single debt, no extra payment - minimum only', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user',
          name: 'Credit Card',
          amount: 1000.00,
          apr: 18.0,
          min_payment: 50.00,
          order_index: 1,
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 0 
      });

      expect(results.length).toBeGreaterThan(0);
      
      // First month: no extra payment applied (starts month 2)
      const month1 = results[0];
      expect(month1.snowballAmount).toBe(0);
      
      // Interest should be roughly 18% / 12 = 1.5% per month
      const expectedInterest = Math.round(1000 * (18/100/12) * 100) / 100;
      expect(month1.totalInterest).toBe(expectedInterest);
      
      // All debts should be paid off by end of simulation
      const finalMonth = results[results.length - 1];
      expect(finalMonth.totalBalance).toBe(0);
      expect(finalMonth.debts[0].isPaidOff).toBe(true);
    });

    test('single debt with extra payment', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user',
          name: 'Credit Card',
          amount: 1000.00,
          apr: 18.0,
          min_payment: 50.00,
          order_index: 1,
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 100 
      });

      // Should pay off faster than minimum-only
      const month1 = results[0];
      expect(month1.snowballAmount).toBe(0); // No extra in first month
      
      if (results.length > 1) {
        const month2 = results[1];
        expect(month2.snowballAmount).toBe(100); // Extra starts month 2
      }
      
      // Should be paid off before minimum-only scenario
      expect(results.length).toBeLessThan(25); // Should be well under 25 months
    });
  });

  describe('Multi-Debt Scenarios', () => {
    test('two debts - snowball to lowest balance first', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_high',
          user_id: 'test_user',
          name: 'Student Loan',
          amount: 5000.00,
          apr: 6.0,
          min_payment: 100.00,
          order_index: 2, // Higher balance, paid second
        },
        {
          id: 'debt_low',
          user_id: 'test_user',
          name: 'Credit Card',
          amount: 1000.00,
          apr: 24.0,
          min_payment: 25.00,
          order_index: 1, // Lower balance, paid first
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 200 
      });

      // Month 2 should apply extra to credit card (order_index 1)
      const month2 = results[1];
      const creditCardSnapshot = month2.debts.find(d => d.id === 'debt_low');
      const studentLoanSnapshot = month2.debts.find(d => d.id === 'debt_high');
      
      expect(creditCardSnapshot?.snowballApplied).toBe(200);
      expect(studentLoanSnapshot?.snowballApplied).toBe(0);

      // Find when credit card is paid off
      const creditCardPaidOffMonth = results.findIndex(result => 
        result.debts.find(d => d.id === 'debt_low')?.isPaidOff
      );
      
      expect(creditCardPaidOffMonth).toBeGreaterThan(-1);
      
      // After credit card is paid off, extra + its minimum should go to student loan
      if (creditCardPaidOffMonth < results.length - 1) {
        const nextMonth = results[creditCardPaidOffMonth + 1];
        const studentLoanAfter = nextMonth.debts.find(d => d.id === 'debt_high');
        
        // Should get extra (200) + credit card minimum (25) = 225 snowball
        expect(studentLoanAfter?.snowballApplied).toBe(225);
      }
    });

    test('three debts with custom order', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user', 
          name: 'High Priority',
          amount: 2000.00,
          apr: 15.0,
          min_payment: 50.00,
          order_index: 1, // Pay first (user priority)
        },
        {
          id: 'debt_2',
          user_id: 'test_user',
          name: 'Medium Priority', 
          amount: 500.00, // Lower balance but higher order
          apr: 20.0,
          min_payment: 25.00,
          order_index: 2, // Pay second
        },
        {
          id: 'debt_3',
          user_id: 'test_user',
          name: 'Low Priority',
          amount: 3000.00,
          apr: 8.0,
          min_payment: 75.00,
          order_index: 3, // Pay last
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 150 
      });

      // Extra should go to debt_1 first (order_index 1)
      const month2 = results[1];
      const highPriorityDebt = month2.debts.find(d => d.id === 'debt_1');
      expect(highPriorityDebt?.snowballApplied).toBe(150);
      
      // Other debts should get no extra initially
      const mediumPriorityDebt = month2.debts.find(d => d.id === 'debt_2');
      const lowPriorityDebt = month2.debts.find(d => d.id === 'debt_3');
      expect(mediumPriorityDebt?.snowballApplied).toBe(0);
      expect(lowPriorityDebt?.snowballApplied).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('debt paid off in single payment', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user',
          name: 'Small Debt',
          amount: 100.00,
          apr: 12.0,
          min_payment: 25.00,
          order_index: 1,
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 200 
      });

      // Should pay off in month 2 (first month with extra)
      expect(results.length).toBeLessThanOrEqual(2);
      
      const finalMonth = results[results.length - 1];
      expect(finalMonth.debts[0].isPaidOff).toBe(true);
      expect(finalMonth.totalBalance).toBe(0);
    });

    test('empty debt list', () => {
      const results = simulateSnowballPlan({ 
        debts: [], 
        extraPerMonth: 100 
      });

      expect(results).toEqual([]);
    });

    test('very high extra payment', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user',
          name: 'Credit Card',
          amount: 1000.00,
          apr: 18.0,
          min_payment: 50.00,
          order_index: 1,
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 10000 // Massive overpayment
      });

      // Should still work and pay off quickly
      expect(results.length).toBeLessThanOrEqual(2);
      expect(results[results.length - 1].totalBalance).toBe(0);
    });
  });

  describe('Forecast Summary', () => {
    test('generates correct summary', () => {
      const debts: UKDebt[] = [
        {
          id: 'debt_1',
          user_id: 'test_user',
          name: 'Credit Card',
          amount: 1000.00,
          apr: 18.0,
          min_payment: 50.00,
          order_index: 1,
        }
      ];

      const results = simulateSnowballPlan({ 
        debts, 
        extraPerMonth: 100 
      });
      
      const summary = generateForecastSummary(results);

      expect(summary.totalMonths).toBe(results.length);
      expect(summary.debtFreeDate).toMatch(/^\w+ \d{4}$/); // "Month YYYY" format
      expect(summary.totalInterestPaid).toBeGreaterThan(0);
      expect(summary.milestoneDates).toHaveLength(1);
      expect(summary.milestoneDates[0].debtName).toBe('Credit Card');
    });
  });
});