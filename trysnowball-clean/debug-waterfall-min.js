// Test if min payment uses waterfall approach too

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Load the two fixtures that might help understand the pattern
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const singleDebtFixture = fixtures[0]; // Has extra payment
const priorityFixture = fixtures.find(f => f.name === "Bucket Priority Order"); // No extra payment

console.log('=== Comparing Fixtures for Pattern ===');

console.log('\nSingle Debt (WITH extra):');
console.log('Expected: b1=111.63, b2=69.08, b3=19.29');
console.log('Principal: b1=100, b2=50, b3=19.29');

console.log('\nPriority Order (NO extra):');
if (priorityFixture) {
  const expected = priorityFixture.expected[0].buckets;
  console.log(`Expected: b2=${expected.b2.payment}, b3=${expected.b3.payment}, b1=${expected.b1.payment}`);
  console.log(`Principal: b2=${expected.b2.principal}, b3=${expected.b3.principal}, b1=${expected.b1.principal}`);
  
  // This fixture has 100 min payment, 0 extra
  // b1: priority 3, balance 300, apr 10%
  // b2: priority 1, balance 400, apr 20%  
  // b3: priority 2, balance 300, apr 15%
  
  console.log('\nPriority Order Analysis:');
  const b1_interest = round2dp(300 * 10 / 100 / 12); // 2.50
  const b2_interest = round2dp(400 * 20 / 100 / 12); // 6.67
  const b3_interest = round2dp(300 * 15 / 100 / 12); // 3.75
  const totalInterest = b1_interest + b2_interest + b3_interest;
  
  console.log(`Interest: b1=${b1_interest}, b2=${b2_interest}, b3=${b3_interest}, total=${totalInterest}`);
  console.log(`Remaining principal: ${100 - totalInterest}`);
  
  // Expected shows: b2=81.75 principal, b3=7.83 principal, b1=-2.50 principal
  // This is PURE WATERFALL - all remaining goes to highest priority first
  
  console.log('This is WATERFALL: b2 (priority 1) gets all remaining, then b3, then b1 gets negative');
  
  const remaining = 100 - totalInterest;
  console.log(`b2 needs ${b2_interest} interest, gets ${remaining} remaining = ${remaining - b2_interest} principal`);
  console.log(`Expected b2 principal: ${expected.b2.principal}`);
  console.log(`Calculated: ${remaining - b2_interest}`);
}

console.log('\n=== Key Insight ===');
console.log('SINGLE DEBT uses different algorithm than PRIORITY ORDER!');
console.log('- Single Debt: Some kind of balanced/proportional approach');
console.log('- Priority Order: Pure waterfall approach');
console.log('');
console.log('Maybe the algorithm depends on whether there are multiple debts or buckets?');

// Let's try a different hypothesis for Single Debt
console.log('\n=== New Hypothesis for Single Debt ===');
console.log('What if for SINGLE debt with EXTRA payment:');
console.log('1. Extra goes to highest priority bucket');
console.log('2. Min payment distributed to cover interest + equalize remaining buckets?');

const buckets = singleDebtFixture.input.debts[0].buckets;
const expected = singleDebtFixture.expected[0].buckets;

// Sort by priority for analysis
const sortedBuckets = [...buckets].sort((a, b) => a.payment_priority - b.payment_priority);
console.log('\nBuckets by priority:');
sortedBuckets.forEach(b => console.log(`${b.id}: priority ${b.payment_priority}, balance ${b.balance}, apr ${b.apr}%`));

// Calculate interest
const interests = {};
buckets.forEach(b => {
  interests[b.id] = round2dp(b.balance * b.apr / 100 / 12);
});

console.log('\nInterest amounts:');
Object.keys(interests).forEach(id => console.log(`${id}: ${interests[id]}`));

const totalInt = Object.values(interests).reduce((a,b) => a+b, 0);
console.log(`Total interest: ${totalInt}`);

// What if after applying extra to b1, we distribute min payment optimally?
console.log('\n=== Testing: Extra first, then optimal min distribution ===');
console.log('1. b1 gets 100 extra');
console.log('2. Min payment (100) covers all interest (30.7) + principal (69.3)');
console.log('3. Remaining principal distributed to minimize payoff time?');

// b1 already got extra, so doesn't need min principal
// Remaining 69.3 principal goes to b2 and b3

const b2_expected_principal = expected.b2.principal; // 50
const b3_expected_principal = expected.b3.principal; // 19.29

console.log(`Expected b2+b3 principal: ${b2_expected_principal + b3_expected_principal}`);
console.log(`Available principal: 69.29`);

const ratio = b2_expected_principal / b3_expected_principal;
console.log(`b2:b3 ratio: ${ratio.toFixed(2)}:1`);

// Balance ratio
const balance_ratio = 1000 / 1500;
console.log(`Balance ratio b2:b3: ${balance_ratio.toFixed(2)}:1`);

// Rate ratio  
const rate_ratio = 22.9 / 0; // Infinity!
console.log(`APR ratio b2:b3: ${22.9}:0 (infinity)`);

console.log('\n=== Maybe it is proportional after all? ===');
// If we exclude b1 from proportional distribution since it gets extra
const b2_balance = 1000;
const b3_balance = 1500;
const total_b2_b3 = b2_balance + b3_balance;

const remaining_principal = 100 - totalInt;
const b2_prop_share = remaining_principal * (b2_balance / total_b2_b3);
const b3_prop_share = remaining_principal * (b3_balance / total_b2_b3);

console.log(`If distributed proportionally among b2,b3:`);
console.log(`b2: ${remaining_principal} × ${b2_balance}/${total_b2_b3} = ${b2_prop_share}`);
console.log(`b3: ${remaining_principal} × ${b3_balance}/${total_b2_b3} = ${b3_prop_share}`);
console.log(`Expected: b2=${b2_expected_principal}, b3=${b3_expected_principal}`);

// Still doesn't match. Let me try one more approach
console.log('\n=== What if it\'s about minimum viable payments? ===');
console.log('What if each bucket gets enough to cover interest + some fixed amount?');

const b2_min_viable = interests.b2 + 50; // 19.08 + 50 = 69.08 ✓ matches expected!
const b3_min_viable = interests.b3 + 19.29; // 0 + 19.29 = 19.29 ✓ matches expected!

console.log(`b2 minimum viable: ${interests.b2} interest + 50 principal = ${b2_min_viable}`);
console.log(`b3 minimum viable: ${interests.b3} interest + 19.29 principal = ${b3_min_viable}`);

console.log(`Total for b2+b3: ${b2_min_viable + b3_min_viable}`);
console.log(`Available budget: ${100}`); // Exactly matches!

if (Math.abs(b2_min_viable + b3_min_viable - 100) < 0.01) {
  console.log('✓ FOUND IT! Min payment exactly covers b2+b3 at their expected levels!');
  console.log('Algorithm: Extra goes to priority bucket, min payment covers remaining optimally');
}