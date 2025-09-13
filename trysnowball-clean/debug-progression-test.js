/**
 * Simple test to check debt reduction progression pattern
 * Run with: node debug-progression-test.js
 */

// Simple simulation to test mathematical progression without TypeScript imports
const testData = {
  balance: 5000,
  apr: 0.229,
  minPayment: 150,
  extraPayment: 200
};

console.log('=== MANUAL DEBT CALCULATION ANALYSIS ===');
console.log('Testing mathematical progression manually');
console.log('');

console.log('Scenario: £5,000 debt at 22.9% APR');
console.log('Min payment: £150, Extra payment: £200 (Total: £350/month)');
console.log('');

const monthlyInterestRate = testData.apr / 12;
let balance = testData.balance;
let totalPayment = testData.minPayment + testData.extraPayment;

console.log('Month | Balance  | Interest | Principal | Total Payment | Balance Reduction');
console.log('------|----------|----------|-----------|---------------|------------------');

for (let month = 1; month <= 15 && balance > 0; month++) {
  const interestCharge = balance * monthlyInterestRate;
  const principalPayment = Math.min(totalPayment - interestCharge, balance);
  const actualPayment = interestCharge + principalPayment;
  const balanceReduction = principalPayment;

  console.log(`${String(month).padStart(5)} | ${String(balance.toFixed(2)).padStart(8)} | ${String(interestCharge.toFixed(2)).padStart(8)} | ${String(principalPayment.toFixed(2)).padStart(9)} | ${String(actualPayment.toFixed(2)).padStart(13)} | ${String(balanceReduction.toFixed(2)).padStart(17)}`);

  balance = Math.max(0, balance - principalPayment);
}

console.log('');
console.log('=== WHAT SHOULD HAPPEN ===');
console.log('- Interest charges should DECREASE each month (as balance drops)');
console.log('- Principal payments should INCREASE each month (more goes to principal)');
console.log('- Balance reduction should ACCELERATE (exponential curve)');
console.log('- This creates the "snowball effect" - payments become more effective over time');
console.log('');
console.log('If the simulation shows constant/linear reductions instead of acceleration,');
console.log('then the compound interest calculations may be wrong.');