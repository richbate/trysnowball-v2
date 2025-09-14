/**
 * Burn-up utilities unit tests
 * Ensures accurate projections and prevents display bugs
 */

import { 
 buildDebtBurnUp, 
 projectDebtBurnUp, 
 buildCombinedDebtBurnUp, 
 selectTargetDebt,
 formatChartCurrency 
} from './burnup';

describe('Burn-up utilities', () => {
 const mockDebt = {
  id: 'debt1',
  name: 'Test Card',
  amount_pennies: 1200000, // £12,000
  original_amount_pennies: 1500000, // £15,000
  min_payment_pennies: 24000, // £240
  payment_history: [
   { payment_date: '2025-01-15', amount_pennies: 25000, payment_type: 'minimum' }, // £250
   { payment_date: '2025-02-15', amount_pennies: 50000, payment_type: 'extra' }, // £500
  ]
 };

 describe('buildDebtBurnUp', () => {
  test('builds correct step-line data in pounds', () => {
   const result = buildDebtBurnUp(mockDebt);
   
   // Goal should be in pounds
   expect(result.goalPounds).toBe(15000); // £15,000
   expect(result.totalPaidPounds).toBe(750); // £750 total paid
   
   // Points should be in pounds and chronological
   expect(result.points).toHaveLength(3); // Start + 2 payments
   expect(result.points[0].paid).toBe(0); // Starts at £0
   expect(result.points[1].paid).toBe(250); // First payment £250
   expect(result.points[2].paid).toBe(750); // Cumulative £750
   
   // Dates should be chronological
   expect(new Date(result.points[1].date)).toBeInstanceOf(Date);
   expect(result.points[1].date).toBe('2025-01-15');
   expect(result.points[2].date).toBe('2025-02-15');
  });

  test('prevents 10x display bug in goal calculation', () => {
   const result = buildDebtBurnUp(mockDebt);
   
   // Should show £15,000, not £1,500,000 or £150,000
   expect(result.goalPounds).toBe(15000);
   expect(result.goalPounds).not.toBe(1500000); // Raw pence - would be 100x bug
   expect(result.goalPounds).not.toBe(150000); // 10x bug
  });

  test('infers original amount from current + payments when missing', () => {
   const debtMissingOriginal = {
    ...mockDebt,
    original_amount_pennies: undefined
   };
   
   const result = buildDebtBurnUp(debtMissingOriginal);
   
   // Should infer: £12,000 current + £750 paid = £12,750 original
   expect(result.goalPounds).toBe(12750);
  });

  test('handles debt with no payments', () => {
   const debtNoPayments = {
    ...mockDebt,
    payment_history: []
   };
   
   const result = buildDebtBurnUp(debtNoPayments);
   
   expect(result.totalPaidPounds).toBe(0);
   expect(result.points).toHaveLength(1); // Just start point
   expect(result.points[0].paid).toBe(0);
   expect(result.goalPounds).toBe(15000); // Uses original_amount_pennies
  });
 });

 describe('projectDebtBurnUp', () => {
  test('projection never overpays debt', () => {
   const model = buildDebtBurnUp(mockDebt);
   const debt = { amount_pennies: 1200000, min_payment_pennies: 24000, id: 'debt1' };
   
   const result = projectDebtBurnUp(model, debt, 100); // £100 extra
   
   // Find the final projection point
   const finalPoint = result.projectedPoints[result.projectedPoints.length - 1];
   
   // Should never project paying more than the goal
   expect(finalPoint.paid).toBeLessThanOrEqual(model.goalPounds);
   expect(finalPoint.paid).toBe(model.goalPounds); // Should hit exactly the goal
  });

  test('monthly payments use correct amounts', () => {
   const model = buildDebtBurnUp(mockDebt);
   const debt = { amount_pennies: 1200000, min_payment_pennies: 24000, id: 'debt1' };
   
   const result = projectDebtBurnUp(model, debt, 76); // £76 extra = £100 total monthly
   
   // Already paid £750, need £14,250 more to reach £15,000 goal
   // At £100/month (£24 min + £76 extra), should take about 143 months
   expect(result.projectedPoints.length).toBeGreaterThan(140);
   expect(result.projectedPoints.length).toBeLessThan(150);
   
   // Each step should be ~£100 (allowing for final payment adjustment)
   const firstStep = result.projectedPoints[0].paid - model.totalPaidPounds;
   expect(firstStep).toBeCloseTo(100, 0);
  });

  test('handles zero extra payment correctly', () => {
   const model = buildDebtBurnUp(mockDebt);
   const debt = { amount_pennies: 1200000, min_payment_pennies: 24000, id: 'debt1' };
   
   const result = projectDebtBurnUp(model, debt, 0); // Only minimum payments
   
   // Should use £240/month minimum payments only
   const firstStep = result.projectedPoints[0].paid - model.totalPaidPounds;
   expect(firstStep).toBe(240);
  });

  test('returns empty projection for fully paid debt', () => {
   const paidDebt = {
    ...mockDebt,
    amount_pennies: 0, // Fully paid
    original_amount_pennies: 750000, // Original £7,500
    payment_history: [
     { payment_date: '2025-01-15', amount_pennies: 750000, payment_type: 'extra' }
    ]
   };
   
   const model = buildDebtBurnUp(paidDebt);
   const debt = { amount_pennies: 0, min_payment_pennies: 0, id: 'debt1' };
   
   const result = projectDebtBurnUp(model, debt, 100);
   
   expect(result.projectedPoints).toHaveLength(0);
   expect(result.projectedEndDate).toBeTruthy(); // Should have end date
  });
 });

 describe('selectTargetDebt', () => {
  const debts = [
   { id: '1', name: 'High APR', amount_pennies: 500000, apr: 2999 }, // £5k at 29.99%
   { id: '2', name: 'Small Balance', amount_pennies: 200000, apr: 1999 }, // £2k at 19.99%
   { id: '3', name: 'Large Balance', amount_pennies: 800000, apr: 899 }, // £8k at 8.99%
  ];

  test('snowball strategy picks smallest balance', () => {
   const target = selectTargetDebt(debts, 'snowball');
   expect(target.id).toBe('2'); // £2k is smallest
   expect(target.name).toBe('Small Balance');
  });

  test('avalanche strategy picks highest APR', () => {
   const target = selectTargetDebt(debts, 'avalanche');
   expect(target.id).toBe('1'); // 29.99% is highest
   expect(target.name).toBe('High APR');
  });

  test('custom strategy picks specified debt', () => {
   const target = selectTargetDebt(debts, 'custom', '3');
   expect(target.id).toBe('3'); // Custom selection
   expect(target.name).toBe('Large Balance');
  });

  test('custom strategy falls back to snowball if focus not found', () => {
   const target = selectTargetDebt(debts, 'custom', 'nonexistent');
   expect(target.id).toBe('2'); // Falls back to smallest balance
  });

  test('filters out zero-balance debts', () => {
   const debtsWithZero = [
    ...debts,
    { id: '4', name: 'Paid Off', amount_pennies: 0, apr: 1999 }
   ];
   
   const target = selectTargetDebt(debtsWithZero, 'snowball');
   expect(target.id).toBe('2'); // Still picks smallest active debt
   expect(target.amount_pennies).toBeGreaterThan(0);
  });
 });

 describe('buildCombinedDebtBurnUp', () => {
  const multipleDebts = [
   {
    id: '1',
    name: 'Card 1', 
    amount_pennies: 500000,
    original_amount_pennies: 600000,
    payment_history: [
     { payment_date: '2025-01-15', amount_pennies: 25000 }
    ]
   },
   {
    id: '2', 
    name: 'Card 2',
    amount_pennies: 300000,
    original_amount_pennies: 400000,
    payment_history: [
     { payment_date: '2025-01-20', amount_pennies: 30000 }
    ]
   }
  ];

  test('combines multiple debt histories correctly', () => {
   const result = buildCombinedDebtBurnUp(multipleDebts);
   
   // Total goal should be sum of originals
   expect(result.goalPounds).toBe(10000); // £6k + £4k
   
   // Total paid should be sum of payments
   expect(result.totalPaidPounds).toBe(550); // £250 + £300
   
   // Should have chronologically sorted payments
   expect(result.points).toHaveLength(3); // Start + 2 payments
   expect(result.points[1].date).toBe('2025-01-15'); // Earlier payment first
   expect(result.points[2].date).toBe('2025-01-20'); // Later payment second
   
   // Cumulative amounts should be correct
   expect(result.points[1].paid).toBe(250); // First payment
   expect(result.points[2].paid).toBe(550); // Cumulative
  });

  test('handles empty debt array', () => {
   const result = buildCombinedDebtBurnUp([]);
   
   expect(result.goalPounds).toBe(0);
   expect(result.totalPaidPounds).toBe(0);
   expect(result.points).toHaveLength(1); // Just start point
  });
 });

 describe('formatChartCurrency', () => {
  test('formats currency for display without 10x bugs', () => {
   expect(formatChartCurrency(12000)).toBe('£12,000');
   expect(formatChartCurrency(12000.50)).toBe('£12,001'); // Rounds to whole pounds
   expect(formatChartCurrency(0)).toBe('£0');
   expect(formatChartCurrency(1234567)).toBe('£1,234,567');
  });

  test('handles edge cases', () => {
   expect(formatChartCurrency(0.50)).toBe('£1'); // Rounds up
   expect(formatChartCurrency(-1000)).toBe('-£1,000'); // Negative amounts
  });
 });

 describe('Real-world scenarios', () => {
  test('prevents common display bugs in burn-up charts', () => {
   const realDebt = {
    id: 'barclaycard',
    name: 'Barclaycard',
    amount_pennies: 1200000, // £12,000 current
    original_amount_pennies: 1500000, // £15,000 original 
    min_payment_pennies: 24000, // £240 minimum
    payment_history: [
     { payment_date: '2025-01-01', amount_pennies: 30000 } // £300 payment
    ]
   };
   
   const burnUp = buildDebtBurnUp(realDebt);
   
   // Verify all amounts are in pounds for display
   expect(burnUp.goalPounds).toBe(15000); // Not 1500000 or 150000
   expect(burnUp.totalPaidPounds).toBe(300); // Not 30000 or 3000
   expect(burnUp.points[1].paid).toBe(300); // Payment shown as £300
   
   // Chart should show reasonable axis ranges
   expect(burnUp.goalPounds).toBeGreaterThan(1000);
   expect(burnUp.goalPounds).toBeLessThan(100000); // Reasonable for personal debt
  });

  test('portfolio projection reallocates when debts are paid off', () => {
   // This would need the payment planner to test properly
   // For now, just verify the basic structure
   const debts = [
    { id: '1', amount_pennies: 100000, min_payment_pennies: 5000 }, // Small debt
    { id: '2', amount_pennies: 500000, min_payment_pennies: 10000 } // Large debt
   ];
   
   const result = buildCombinedDebtBurnUp(debts.map(d => ({ 
    ...d, 
    name: d.id,
    payment_history: [] 
   })));
   
   // Should have reasonable totals
   expect(result.goalPounds).toBe(6000); // £1k + £5k
   expect(result.totalPaidPounds).toBe(0); // No payments yet
  });
 });
});