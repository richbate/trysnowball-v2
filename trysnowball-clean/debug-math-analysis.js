/**
 * Debug script to analyze the mathematical progression in debt simulation
 * Test whether debt payoff shows linear vs exponential acceleration
 */

// Import from TypeScript modules
import { simulateCompositeSnowballPlan } from './src/utils/compositeSimulatorV2.ts';

// Create a test scenario with typical debt
const testDebt = [{
  id: 'card1',
  user_id: 'test',
  name: 'Credit Card',
  amount: 5000,
  apr: 22.9,
  min_payment: 150,
  order_index: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  buckets: [
    {
      id: 'purchases',
      name: 'Purchases',
      balance: 5000,
      apr: 22.9,
      payment_priority: 1,
      created_at: new Date().toISOString()
    }
  ]
}];

console.log('=== DEBT SIMULATION MATH ANALYSIS ===');
console.log('Testing debt payoff progression pattern');
console.log('');

// Test with minimum payments only
console.log('--- MINIMUM PAYMENTS ONLY ---');
const minimumResult = simulateCompositeSnowballPlan(testDebt, 0);
console.log(`Total months: ${minimumResult.totalMonths}`);
console.log(`Total interest: £${minimumResult.totalInterestPaid.toFixed(2)}`);
console.log('');

// Show first 10 months with minimum payments only
console.log('Month | Balance | Interest | Principal | Balance Reduction');
console.log('------|---------|----------|-----------|------------------');
for (let i = 0; i < Math.min(10, minimumResult.monthlySnapshots.length); i++) {
  const month = minimumResult.monthlySnapshots[i];
  const debt = month.debts.card1;
  const bucket = month.buckets.purchases;
  const balanceReduction = i === 0
    ? 5000 - debt.totalBalance
    : minimumResult.monthlySnapshots[i-1].debts.card1.totalBalance - debt.totalBalance;

  console.log(`${String(month.month).padStart(5)} | ${String(debt.totalBalance.toFixed(2)).padStart(7)} | ${String(bucket.interest.toFixed(2)).padStart(8)} | ${String(bucket.principal.toFixed(2)).padStart(9)} | ${String(balanceReduction.toFixed(2)).padStart(16)}`);
}

// Test with extra payments (snowball method)
console.log('');
console.log('--- WITH £200 EXTRA PAYMENTS (SNOWBALL) ---');
const snowballResult = simulateCompositeSnowballPlan(testDebt, 200);
console.log(`Total months: ${snowballResult.totalMonths}`);
console.log(`Total interest: £${snowballResult.totalInterestPaid.toFixed(2)}`);
console.log(`Time saved: ${minimumResult.totalMonths - snowballResult.totalMonths} months`);
console.log(`Interest saved: £${(minimumResult.totalInterestPaid - snowballResult.totalInterestPaid).toFixed(2)}`);
console.log('');

// Show first 10 months with snowball payments
console.log('Month | Balance | Interest | Principal | Balance Reduction | Snowball Effect');
console.log('------|---------|----------|-----------|-------------------|----------------');
for (let i = 0; i < Math.min(10, snowballResult.monthlySnapshots.length); i++) {
  const month = snowballResult.monthlySnapshots[i];
  const debt = month.debts.card1;
  const bucket = month.buckets.purchases;
  const balanceReduction = i === 0
    ? 5000 - debt.totalBalance
    : snowballResult.monthlySnapshots[i-1].debts.card1.totalBalance - debt.totalBalance;
  const snowball = month.snowballApplied;

  console.log(`${String(month.month).padStart(5)} | ${String(debt.totalBalance.toFixed(2)).padStart(7)} | ${String(bucket.interest.toFixed(2)).padStart(8)} | ${String(bucket.principal.toFixed(2)).padStart(9)} | ${String(balanceReduction.toFixed(2)).padStart(17)} | ${String(snowball.toFixed(2)).padStart(14)}`);
}

// Analyze progression pattern
console.log('');
console.log('=== PROGRESSION ANALYSIS ===');
console.log('Checking for exponential acceleration...');

// Calculate acceleration in balance reduction over time
const reductions = [];
for (let i = 1; i < Math.min(10, snowballResult.monthlySnapshots.length); i++) {
  const thisMonth = snowballResult.monthlySnapshots[i];
  const lastMonth = snowballResult.monthlySnapshots[i-1];
  const reduction = lastMonth.debts.card1.totalBalance - thisMonth.debts.card1.totalBalance;
  reductions.push(reduction);
}

console.log('Balance reduction by month (should accelerate):');
reductions.forEach((reduction, i) => {
  const acceleration = i > 0 ? reduction - reductions[i-1] : 0;
  console.log(`Month ${i+2}: £${reduction.toFixed(2)} reduction (${acceleration >= 0 ? '+' : ''}${acceleration.toFixed(2)} vs previous)`);
});

// Check interest payments (should decrease significantly over time)
console.log('');
console.log('Interest payments by month (should decrease rapidly):');
for (let i = 0; i < Math.min(10, snowballResult.monthlySnapshots.length); i++) {
  const month = snowballResult.monthlySnapshots[i];
  const bucket = month.buckets.purchases;
  const interestChange = i > 0
    ? bucket.interest - snowballResult.monthlySnapshots[i-1].buckets.purchases.interest
    : 0;
  console.log(`Month ${i+1}: £${bucket.interest.toFixed(2)} interest (${interestChange.toFixed(2)} change)`);
}