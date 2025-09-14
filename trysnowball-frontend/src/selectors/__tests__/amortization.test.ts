/**
 * Unit tests for amortization selector - pure calculation functions
 */

import { 
 calculateSnowballTimeline, 
 calculateAvalancheTimeline,
 calculatePayoffSummary,
 buildDebtBalanceSeries
} from '../amortization';
import type { NormalizedDebt } from '../../adapters/debts';

describe('amortization selectors', () => {
 const mockDebts: NormalizedDebt[] = [
  {
   id: '1',
   name: 'Small Debt',
   issuer: 'Bank A',
   debt_type: 'Credit Card',
   amount_pennies: 100000, // £1,000
   apr: 2000, // 20%
   min_payment_pennies: 5000, // £50
   order_index: 1,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: false
  },
  {
   id: '2', 
   name: 'Large Debt',
   issuer: 'Bank B',
   debt_type: 'Credit Card',
   amount_pennies: 300000, // £3,000
   apr: 1500, // 15%
   min_payment_pennies: 10000, // £100
   order_index: 2,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: false
  }
 ];

 describe('calculateSnowballTimeline', () => {
  it('handles empty debt array', () => {
   const result = calculateSnowballTimeline([], 100);
   expect(result).toEqual([]);
  });

  it('creates timeline entries with normalized fields', () => {
   const result = calculateSnowballTimeline(mockDebts, 100, 3);
   
   expect(result).toHaveLength(3);
   expect(result[0]).toHaveProperty('monthIndex', 0);
   expect(result[0]).toHaveProperty('totalBalance');
   expect(result[0]).toHaveProperty('debts');
   expect(result[0].debts).toHaveLength(2);
   
   // Verify debt structure uses normalized fields
   expect(result[0].debts[0]).toHaveProperty('amount_pennies');
   expect(result[0].debts[0]).toHaveProperty('apr_bps');
   expect(result[0].debts[0]).toHaveProperty('min_payment_pennies');
   expect(result[0].debts[0]).not.toHaveProperty('balance');
   expect(result[0].debts[0]).not.toHaveProperty('interestRate');
  });

  it('sorts debts by balance for snowball method', () => {
   const result = calculateSnowballTimeline(mockDebts, 0, 1);
   
   // Small debt should be first (snowball = smallest first)
   expect(result[0].debts[0].name).toBe('Small Debt');
   expect(result[0].debts[0].amount_pennies).toBe(100000);
   expect(result[0].debts[1].name).toBe('Large Debt');
  });

  it('reduces balances over time with payments', () => {
   const result = calculateSnowballTimeline(mockDebts, 200, 6);
   
   // Initial balance should be £4,000 (1000 + 3000)
   expect(result[0].totalBalance).toBe(4000);
   
   // Balance should decrease over time
   expect(result[1].totalBalance).toBeLessThan(result[0].totalBalance);
   expect(result[2].totalBalance).toBeLessThan(result[1].totalBalance);
  });

  it('stops when all debts are paid off', () => {
   const smallDebts: NormalizedDebt[] = [
    {
     ...mockDebts[0],
     amount_pennies: 10000, // £100
     min_payment_pennies: 2000 // £20
    }
   ];
   
   const result = calculateSnowballTimeline(smallDebts, 100, 20);
   
   // Should stop early when debt is paid off
   expect(result.length).toBeLessThan(20);
   
   // Last entry should have very low balance
   const lastEntry = result[result.length - 1];
   expect(lastEntry.totalBalance).toBeLessThanOrEqual(1);
  });

  it('filters out deleted debts', () => {
   const debtsWithDeleted = [
    ...mockDebts,
    {
     ...mockDebts[0],
     id: '3',
     name: 'Deleted Debt',
     deleted: true
    }
   ];
   
   const result = calculateSnowballTimeline(debtsWithDeleted, 0, 1);
   
   expect(result[0].debts).toHaveLength(2); // Should not include deleted debt
   expect(result[0].debts.some(d => d.name === 'Deleted Debt')).toBe(false);
  });
 });

 describe('calculateAvalancheTimeline', () => {
  it('sorts debts by APR for avalanche method', () => {
   const result = calculateAvalancheTimeline(mockDebts, 0, 1);
   
   // Higher APR debt should be first (avalanche = highest APR first)
   expect(result[0].debts[0].name).toBe('Small Debt'); // 20% APR
   expect(result[0].debts[0].apr).toBe(2000);
   expect(result[0].debts[1].name).toBe('Large Debt'); // 15% APR
  });

  it('creates same structure as snowball timeline', () => {
   const snowball = calculateSnowballTimeline(mockDebts, 100, 2);
   const avalanche = calculateAvalancheTimeline(mockDebts, 100, 2);
   
   expect(avalanche).toHaveLength(snowball.length);
   expect(avalanche[0]).toHaveProperty('monthIndex');
   expect(avalanche[0]).toHaveProperty('totalBalance');
   expect(avalanche[0]).toHaveProperty('debts');
  });
 });

 describe('calculatePayoffSummary', () => {
  it('returns -1 months for empty timeline', () => {
   const result = calculatePayoffSummary([]);
   expect(result.months).toBe(-1);
   expect(result.totalInterestPaid).toBe(0);
  });

  it('finds payoff month when balance reaches zero', () => {
   const timeline = [
    { monthIndex: 0, totalBalance: 1000 } as any,
    { monthIndex: 1, totalBalance: 500 } as any,
    { monthIndex: 2, totalBalance: 0.5 } as any // Below £1 threshold
   ];
   
   const result = calculatePayoffSummary(timeline);
   expect(result.months).toBe(2);
  });
 });

 describe('buildDebtBalanceSeries', () => {
  const mockTimeline = [
   {
    monthIndex: 0,
    displayDate: 'Jan-25',
    debts: [
     { name: 'Test Debt', amount_pennies: 100000 }
    ]
   },
   {
    monthIndex: 1, 
    displayDate: 'Feb-25',
    debts: [
     { name: 'Test Debt', amount_pennies: 80000 }
    ]
   }
  ] as any;

  it('returns empty array for unfocused debt', () => {
   const result = buildDebtBalanceSeries(mockTimeline, null);
   expect(result).toEqual([]);
  });

  it('extracts balance series for focused debt', () => {
   const result = buildDebtBalanceSeries(mockTimeline, 'Test Debt');
   
   expect(result).toHaveLength(2);
   expect(result[0]).toEqual({
    month: 'Jan-25',
    balance: 1000 // £1,000 from 100000 cents
   });
   expect(result[1]).toEqual({
    month: 'Feb-25', 
    balance: 800 // £800 from 80000 cents
   });
  });

  it('handles missing debt in timeline', () => {
   const result = buildDebtBalanceSeries(mockTimeline, 'Nonexistent Debt');
   
   expect(result).toHaveLength(2);
   expect(result[0].balance).toBe(0);
   expect(result[1].balance).toBe(0);
  });
 });
});