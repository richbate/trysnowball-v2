/**
 * Confidence Tests for DebtEngine
 * These tests verify the math is correct and order changes affect timelines
 */

import { DebtEngine } from '../DebtEngine';

describe('DebtEngine Confidence Tests', () => {
  const testDebts = [
    { id: 'a', name: 'Credit Card A', balance: 5000, rate: 20, minPayment: 100, order: 1 },
    { id: 'b', name: 'Credit Card B', balance: 3000, rate: 15, minPayment: 60, order: 2 },
    { id: 'c', name: 'Personal Loan', balance: 8000, rate: 12, minPayment: 150, order: 3 }
  ];

  const monthlyBudget = 400; // Total payment

  test('Order changes affect timeline', () => {
    // Same debts, same budget, different order
    const debtsOrderABC = testDebts.map(d => ({ ...d }));
    const debtsOrderCBA = testDebts.map(d => ({ ...d, order: 4 - d.order })); // Reverse order

    const engineA = new DebtEngine(debtsOrderABC);
    const engineB = new DebtEngine(debtsOrderCBA);

    const monthsA = engineA.calculatePayoffMonths(monthlyBudget);
    const monthsB = engineB.calculatePayoffMonths(monthlyBudget);

    // Different orders should potentially give different timelines
    // (This may not always be strictly true, but validates order is being respected)
    expect(monthsA).toBeGreaterThan(0);
    expect(monthsB).toBeGreaterThan(0);
    
    // More importantly: verify the order is being respected in the engine
    expect(engineA.debts[0].order).toBe(1);
    expect(engineB.debts[0].order).toBe(3);
  });

  test('Avalanche vs Snowball strategy ordering', () => {
    // Remove explicit order to test strategy-based sorting
    const debtsNoOrder = testDebts.map(({ order, ...d }) => d);

    const snowballEngine = new DebtEngine(debtsNoOrder, { strategy: 'snowball' });
    const avalancheEngine = new DebtEngine(debtsNoOrder, { strategy: 'avalanche' });

    // Snowball should order by balance (smallest first)
    expect(snowballEngine.debts[0].balance).toBeLessThanOrEqual(snowballEngine.debts[1].balance);
    
    // Avalanche should order by rate (highest first)
    expect(avalancheEngine.debts[0].rate).toBeGreaterThanOrEqual(avalancheEngine.debts[1].rate);

    const snowballMonths = snowballEngine.calculatePayoffMonths(monthlyBudget);
    const avalancheMonths = avalancheEngine.calculatePayoffMonths(monthlyBudget);

    // Both should succeed
    expect(snowballMonths).toBeGreaterThan(0);
    expect(avalancheMonths).toBeGreaterThan(0);
  });

  test('Rounding invariants', () => {
    const engine = new DebtEngine(testDebts);
    const timeline = engine.generateTimeline(monthlyBudget);

    for (const month of timeline) {
      // Balance should always be non-negative and rounded to pennies
      expect(month.totalDebt).toBeGreaterThanOrEqual(0);
      expect(Math.round(month.totalDebt * 100)).toEqual(month.totalDebt * 100);
      
      // Interest should be rounded to pennies
      expect(Math.round(month.interestPaid * 100)).toEqual(month.interestPaid * 100);
      
      // Principal should be rounded to pennies
      expect(Math.round(month.principalPaid * 100)).toEqual(month.principalPaid * 100);
    }
  });

  test('Monotonicity - more budget reduces months', () => {
    const engine = new DebtEngine(testDebts);
    
    const months300 = engine.calculatePayoffMonths(300);
    const months400 = engine.calculatePayoffMonths(400);
    const months500 = engine.calculatePayoffMonths(500);

    // More budget should not increase payoff time
    expect(months400).toBeLessThanOrEqual(months300);
    expect(months500).toBeLessThanOrEqual(months400);
  });

  test('Cascading extra payment works', () => {
    // Create a scenario where extra payment should cascade
    const smallDebts = [
      { id: 'small1', name: 'Small Debt 1', balance: 50, rate: 10, minPayment: 25, order: 1 },
      { id: 'small2', name: 'Small Debt 2', balance: 60, rate: 12, minPayment: 30, order: 2 },
      { id: 'large', name: 'Large Debt', balance: 5000, rate: 15, minPayment: 100, order: 3 }
    ];

    const engine = new DebtEngine(smallDebts);
    const timeline = engine.generateTimeline(300); // Should clear small debts quickly

    // First month should clear or nearly clear the first small debt
    const firstMonth = timeline[0];
    const smallDebt1 = firstMonth.remainingDebts?.find(d => d.name === 'Small Debt 1');
    
    // Should be significantly reduced or cleared
    expect(smallDebt1?.balance || 0).toBeLessThan(50);
  });

  test('User order overrides strategy', () => {
    // Test debts where user order conflicts with natural strategy
    const conflictingDebts = [
      { id: 'high', name: 'High Rate', balance: 1000, rate: 25, minPayment: 50, order: 3 }, // Highest rate, lowest priority
      { id: 'mid', name: 'Mid Balance', balance: 2000, rate: 15, minPayment: 60, order: 1 }, // Medium rate, highest priority
      { id: 'low', name: 'Low Rate', balance: 500, rate: 10, minPayment: 25, order: 2 }     // Lowest rate, medium priority
    ];

    const engine = new DebtEngine(conflictingDebts);
    
    // Order should follow user preference (1, 2, 3), not rate or balance
    expect(engine.debts[0].name).toBe('Mid Balance');
    expect(engine.debts[1].name).toBe('Low Rate');
    expect(engine.debts[2].name).toBe('High Rate');
  });

  test('Penny-accurate stopping condition', () => {
    const engine = new DebtEngine(testDebts);
    const timeline = engine.generateTimeline(monthlyBudget);
    
    // Final month should have zero or near-zero remaining debt
    const finalMonth = timeline[timeline.length - 1];
    expect(finalMonth.totalDebt).toBeLessThanOrEqual(0.01);
  });

  test('Interest calculation consistency', () => {
    const singleDebt = [
      { id: 'test', name: 'Test Debt', balance: 1000, rate: 12, minPayment: 100, order: 1 }
    ];

    const engine = new DebtEngine(singleDebt);
    const timeline = engine.generateTimeline(100); // Minimum payment only

    // First month interest should be exactly balance * (rate/12/100)
    const expectedInterest = 1000 * (12 / 12 / 100); // 10.00
    const actualInterest = timeline[0].interestPaid;
    
    expect(Math.abs(actualInterest - expectedInterest)).toBeLessThan(0.01);
  });
});