/**
 * Debug test to analyze mathematical progression in debt simulation
 * This test will reveal if the simulation shows linear vs exponential acceleration
 */

import { simulateCompositeSnowballPlan } from '../utils/compositeSimulatorV2';
import { UKDebt } from '../types/UKDebt';

describe('Debug Math Progression Analysis', () => {
  it('should show exponential acceleration in debt payoff (not linear)', () => {
    // Create a simple test debt scenario
    const testDebts: UKDebt[] = [{
      id: 'test_debt',
      user_id: 'test_user',
      name: 'Test Credit Card',
      amount: 5000,
      apr: 22.9,
      min_payment: 150,
      order_index: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      buckets: [
        {
          id: 'test_bucket',
          name: 'Test Debt',
          balance: 5000,
          apr: 22.9,
          payment_priority: 1,
          created_at: new Date().toISOString()
        }
      ]
    }];

    // Run simulation with £200 extra payment (snowball method)
    const result = simulateCompositeSnowballPlan(testDebts, 200);

    console.log('\n=== SIMULATOR OUTPUT ANALYSIS ===');
    console.log('Checking if debt simulation shows proper exponential acceleration...');
    console.log('');

    // Show first 10 months
    console.log('Month | Balance  | Interest | Principal | Balance Reduction');
    console.log('------|----------|----------|-----------|------------------');

    const balanceReductions: number[] = [];
    const interestCharges: number[] = [];
    const principalPayments: number[] = [];

    for (let i = 0; i < Math.min(10, result.monthlySnapshots.length); i++) {
      const month = result.monthlySnapshots[i];
      const debt = month.debts.test_debt;
      const bucket = month.buckets.test_bucket;

      const balanceReduction = i === 0
        ? 5000 - debt.totalBalance
        : result.monthlySnapshots[i-1].debts.test_debt.totalBalance - debt.totalBalance;

      balanceReductions.push(balanceReduction);
      interestCharges.push(bucket.interest);
      principalPayments.push(bucket.principal);

      console.log(`${String(month.month).padStart(5)} | ${String(debt.totalBalance.toFixed(2)).padStart(8)} | ${String(bucket.interest.toFixed(2)).padStart(8)} | ${String(bucket.principal.toFixed(2)).padStart(9)} | ${String(balanceReduction.toFixed(2)).padStart(17)}`);
    }

    console.log('');
    console.log('=== PROGRESSION ANALYSIS ===');

    // Check interest charge progression (should decrease)
    console.log('Interest charge progression (should decrease each month):');
    for (let i = 1; i < Math.min(6, interestCharges.length); i++) {
      const change = interestCharges[i] - interestCharges[i-1];
      const expectedNegative = change < 0;
      console.log(`Month ${i+1}: £${interestCharges[i].toFixed(2)} (${change.toFixed(2)} change) ${expectedNegative ? '✓' : '✗ SHOULD BE NEGATIVE'}`);
    }

    console.log('');
    console.log('Principal payment progression (should increase each month):');
    for (let i = 1; i < Math.min(6, principalPayments.length); i++) {
      const change = principalPayments[i] - principalPayments[i-1];
      const expectedPositive = change > 0;
      console.log(`Month ${i+1}: £${principalPayments[i].toFixed(2)} (${change.toFixed(2)} change) ${expectedPositive ? '✓' : '✗ SHOULD BE POSITIVE'}`);
    }

    console.log('');
    console.log('Balance reduction acceleration (should increase each month):');
    for (let i = 1; i < Math.min(6, balanceReductions.length); i++) {
      const acceleration = balanceReductions[i] - balanceReductions[i-1];
      const expectedPositive = acceleration > 0;
      console.log(`Month ${i+1}: £${balanceReductions[i].toFixed(2)} reduction (${acceleration.toFixed(2)} acceleration) ${expectedPositive ? '✓' : '✗ SHOULD ACCELERATE'}`);
    }

    console.log('');
    console.log('=== EXPECTED VS MANUAL CALCULATION ===');
    console.log('Manual calculation for comparison:');

    // Manual calculation to compare
    let balance = 5000;
    const monthlyRate = 0.229 / 12;
    const totalPayment = 350; // 150 min + 200 extra

    for (let month = 1; month <= 5; month++) {
      const manualInterest = balance * monthlyRate;
      const manualPrincipal = totalPayment - manualInterest;
      balance -= manualPrincipal;

      const simulatedMonth = result.monthlySnapshots[month - 1];
      const simulatedBucket = simulatedMonth.buckets.test_bucket;

      console.log(`Month ${month}:`);
      console.log(`  Manual    - Interest: £${manualInterest.toFixed(2)}, Principal: £${manualPrincipal.toFixed(2)}`);
      console.log(`  Simulated - Interest: £${simulatedBucket.interest.toFixed(2)}, Principal: £${simulatedBucket.principal.toFixed(2)}`);
      console.log(`  Difference - Interest: £${(simulatedBucket.interest - manualInterest).toFixed(2)}, Principal: £${(simulatedBucket.principal - manualPrincipal).toFixed(2)}`);
      console.log('');
    }

    // Test assertions
    expect(result.monthlySnapshots.length).toBeGreaterThan(0);

    // Check that interest charges decrease over time
    const firstInterest = result.monthlySnapshots[0].buckets.test_bucket.interest;
    const fifthInterest = result.monthlySnapshots[4].buckets.test_bucket.interest;
    expect(fifthInterest).toBeLessThan(firstInterest);

    // Check that principal payments increase over time
    const firstPrincipal = result.monthlySnapshots[0].buckets.test_bucket.principal;
    const fifthPrincipal = result.monthlySnapshots[4].buckets.test_bucket.principal;
    expect(fifthPrincipal).toBeGreaterThan(firstPrincipal);
  });
});