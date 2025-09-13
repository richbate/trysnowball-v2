// Deep analysis of the Priority Order pattern

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const priorityFixture = fixtures.find(f => f.name === "Bucket Priority Order");

const buckets = priorityFixture.input.debts[0].buckets;
const expected = priorityFixture.expected[0].buckets;

console.log('=== Deep Pattern Analysis ===');

// Calculate all the numbers
const data = buckets.map(bucket => {
  const interest = round2dp(bucket.balance * bucket.apr / 100 / 12);
  const expectedData = expected[bucket.id];
  
  return {
    id: bucket.id,
    name: bucket.name,
    balance: bucket.balance,
    priority: bucket.payment_priority,
    interest,
    expectedPayment: expectedData.payment,
    expectedPrincipal: expectedData.principal,
    expectedInterest: expectedData.interest
  };
});

console.log('Complete data:');
data.forEach(d => {
  console.log(`${d.id} (${d.name}):`);
  console.log(`  Balance: ${d.balance}, Priority: ${d.priority}`);
  console.log(`  Calculated interest: ${d.interest}`);
  console.log(`  Expected payment: ${d.expectedPayment}`);
  console.log(`  Expected principal: ${d.expectedPrincipal}`);
  console.log(`  Expected interest: ${d.expectedInterest}`);
  console.log();
});

// Check total payments
const totalExpectedPayment = data.reduce((sum, d) => sum + d.expectedPayment, 0);
console.log(`Total expected payment: ${totalExpectedPayment}`);
console.log(`Should be 100: ${Math.abs(totalExpectedPayment - 100) < 0.01 ? '✓' : '✗'}`);

// Look for patterns in the distribution
console.log('\n=== Pattern Search ===');

// Pattern 1: Maybe it's based on "payment capacity"
console.log('Pattern 1: Payment capacity analysis');
data.forEach(d => {
  const capacity = d.balance + d.interest; // Max they could receive to pay off
  console.log(`${d.id}: capacity=${capacity.toFixed(2)}, got=${d.expectedPayment}, ratio=${(d.expectedPayment/capacity * 100).toFixed(1)}%`);
});

// Pattern 2: Maybe it's waterfall with different constraints
console.log('\nPattern 2: Constrained waterfall analysis');
// What if each bucket is constrained by some rule?

// Let's work backwards: what constraints would produce these payments?
const sortedData = [...data].sort((a, b) => a.priority - b.priority);
console.log('In priority order:');

let remainingBudget = 100;
sortedData.forEach(d => {
  console.log(`${d.id} (priority ${d.priority}): budget available=${remainingBudget.toFixed(2)}, actually got=${d.expectedPayment}`);
  remainingBudget -= d.expectedPayment;
  
  if (d.expectedPayment > 0) {
    const ratio = d.expectedPayment / (d.balance + d.interest);
    console.log(`  Got ${(ratio * 100).toFixed(1)}% of max capacity`);
  }
});

// Pattern 3: Maybe it's proportional but with a twist
console.log('\nPattern 3: Modified proportional');
const totalBalance = data.reduce((sum, d) => sum + d.balance, 0);
const totalInterest = data.reduce((sum, d) => sum + d.interest, 0);

console.log(`Total balance: ${totalBalance}, Total interest: ${totalInterest}`);

data.forEach(d => {
  const balanceProportion = d.balance / totalBalance;
  const interestProportion = d.interest / totalInterest;
  const expectedPaymentProp = d.expectedPayment / 100;
  
  console.log(`${d.id}:`);
  console.log(`  Balance prop: ${(balanceProportion * 100).toFixed(1)}%`);
  console.log(`  Interest prop: ${(interestProportion * 100).toFixed(1)}%`);
  console.log(`  Payment prop: ${(expectedPaymentProp * 100).toFixed(1)}%`);
});

// Pattern 4: Interest-first, then waterfall principal
console.log('\nPattern 4: Interest-first waterfall');
console.log('Step 1: All buckets cover their interest');
data.forEach(d => {
  console.log(`${d.id}: needs ${d.interest} for interest`);
});

const totalInterestNeeded = data.reduce((sum, d) => sum + d.interest, 0);
const remainingAfterInterest = 100 - totalInterestNeeded;
console.log(`Total interest needed: ${totalInterestNeeded}`);
console.log(`Remaining for principal: ${remainingAfterInterest}`);

console.log('\nStep 2: Distribute remaining principal by priority');
let remainingPrincipal = remainingAfterInterest;

sortedData.forEach(d => {
  if (remainingPrincipal > 0) {
    const maxPrincipalNeeded = d.balance;
    const principalToGive = Math.min(remainingPrincipal, maxPrincipalNeeded);
    const totalPaymentCalc = d.interest + principalToGive;
    
    console.log(`${d.id}: interest=${d.interest} + principal=${principalToGive} = payment=${totalPaymentCalc}`);
    console.log(`  Expected payment: ${d.expectedPayment}`);
    console.log(`  Match: ${Math.abs(totalPaymentCalc - d.expectedPayment) < 0.01 ? '✓' : '✗'}`);
    
    remainingPrincipal -= principalToGive;
  }
});

console.log('\nThis might be the algorithm: Interest first, then waterfall principal by priority!');

// Let me test this more precisely
console.log('\n=== Precise Algorithm Test ===');
let testRemaining = 100;

// First pass: everyone gets their interest
const testResults = data.map(d => {
  const interestPaid = d.interest;
  testRemaining -= interestPaid;
  return { ...d, interestPaid, principalPaid: 0, testPayment: interestPaid };
});

console.log(`After interest allocation, remaining: ${testRemaining}`);

// Second pass: distribute remaining as principal by priority
const testSorted = [...testResults].sort((a, b) => a.priority - b.priority);
let testRemainingPrincipal = testRemaining;

testSorted.forEach(d => {
  if (testRemainingPrincipal > 0) {
    const principalToAdd = Math.min(testRemainingPrincipal, d.balance);
    d.principalPaid = principalToAdd;
    d.testPayment = d.interestPaid + d.principalPaid;
    testRemainingPrincipal -= principalToAdd;
  }
});

console.log('\nFinal test results:');
testResults.forEach(d => {
  console.log(`${d.id}: payment=${d.testPayment}, expected=${d.expectedPayment}, match=${Math.abs(d.testPayment - d.expectedPayment) < 0.01 ? '✓' : '✗'}`);
  console.log(`  principal=${d.principalPaid}, expected=${d.expectedPrincipal}, match=${Math.abs(d.principalPaid - d.expectedPrincipal) < 0.01 ? '✓' : '✗'}`);
});

const allTestMatch = testResults.every(d => 
  Math.abs(d.testPayment - d.expectedPayment) < 0.01 &&
  Math.abs(d.principalPaid - d.expectedPrincipal) < 0.01
);

if (allTestMatch) {
  console.log('\n🎯 ALGORITHM CONFIRMED: Interest-first, then waterfall principal by priority!');
} else {
  console.log('\n❌ Algorithm still not right');
}