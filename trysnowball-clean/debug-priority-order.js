// Debug the Priority Order fixture

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Load the Priority Order fixture
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const priorityFixture = fixtures.find(f => f.name === "Bucket Priority Order");

console.log('=== Priority Order Fixture Analysis ===');
console.log('Input:', JSON.stringify(priorityFixture.input, null, 2));

const buckets = priorityFixture.input.debts[0].buckets;
const expected = priorityFixture.expected[0].buckets;
const minPayment = 100;
const extraPayment = 0;

console.log('\nExpected results:');
Object.keys(expected).forEach(id => {
  const exp = expected[id];
  console.log(`${id} (${buckets.find(b => b.id === id).name}): interest=${exp.interest}, principal=${exp.principal}, payment=${exp.payment}`);
});

// Step 1: Calculate interest
console.log('\nStep 1: Interest calculation');
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interestThisMonth: round2dp(bucket.balance * bucket.apr / 100 / 12)
}));

bucketData.forEach(bucket => {
  console.log(`${bucket.id} (${bucket.name}): ${bucket.balance} × ${bucket.apr}%/12 = ${bucket.interestThisMonth}`);
});

const totalInterest = bucketData.reduce((sum, b) => sum + b.interestThisMonth, 0);
console.log(`Total interest: ${totalInterest}`);

// Step 2: Calculate remaining principal
const remainingMinPayment = round2dp(minPayment - totalInterest);
console.log(`Remaining for principal: ${remainingMinPayment}`);

// Step 3: Apply waterfall (priority order)
console.log('\nStep 3: Waterfall allocation by priority');
const sortedByPriority = [...bucketData].sort((a, b) => a.payment_priority - b.payment_priority);

console.log('Sorted by priority:');
sortedByPriority.forEach(bucket => {
  console.log(`${bucket.id} (${bucket.name}): priority ${bucket.payment_priority}, balance ${bucket.balance}`);
});

let remainingPrincipal = remainingMinPayment;
console.log(`\nAllocating ${remainingPrincipal} principal in priority order:`);

sortedByPriority.forEach(bucket => {
  if (remainingPrincipal > 0) {
    const principalForThisBucket = round2dp(Math.min(remainingPrincipal, bucket.balance));
    bucket.principalPaid = principalForThisBucket;
    remainingPrincipal = round2dp(remainingPrincipal - principalForThisBucket);
    console.log(`${bucket.id}: gets ${principalForThisBucket}, remaining: ${remainingPrincipal}`);
  } else {
    bucket.principalPaid = 0;
    console.log(`${bucket.id}: gets 0 (no remaining)`);
  }
});

// Check results
console.log('\nFinal comparison:');
bucketData.forEach(bucket => {
  const totalPayment = bucket.interestThisMonth + bucket.principalPaid;
  const expectedBucket = expected[bucket.id];
  
  console.log(`${bucket.id} (${bucket.name}):`);
  console.log(`  Interest: got ${bucket.interestThisMonth}, expected ${expectedBucket.interest} ${bucket.interestThisMonth === expectedBucket.interest ? '✓' : '✗'}`);
  console.log(`  Principal: got ${bucket.principalPaid}, expected ${expectedBucket.principal} ${Math.abs(bucket.principalPaid - expectedBucket.principal) < 0.01 ? '✓' : '✗'}`);
  console.log(`  Payment: got ${totalPayment}, expected ${expectedBucket.payment} ${Math.abs(totalPayment - expectedBucket.payment) < 0.01 ? '✓' : '✗'}`);
});

// The issue might be that I'm doing pure waterfall but the fixture expects something different
console.log('\n=== Alternative: Maybe it\'s not pure waterfall? ===');

// Let me check the exact expected distribution
const b2_expected = expected.b2.principal; // 81.75
const b3_expected = expected.b3.principal; // 7.83
const b1_expected = expected.b1.principal; // -2.50

console.log(`Expected distribution: b2=${b2_expected}, b3=${b3_expected}, b1=${b1_expected}`);
console.log(`Total expected principal: ${b2_expected + b3_expected + b1_expected}`);
console.log(`Should equal remaining: ${remainingMinPayment}`);

// What if b1 gets negative because it can't cover its interest?
console.log('\n=== Negative Principal Analysis ===');
const b1_bucket = bucketData.find(b => b.id === 'b1');
console.log(`b1 interest: ${b1_bucket.interestThisMonth}`);
console.log(`b1 expected principal: ${b1_expected} (negative!)`);

// This suggests that buckets can get negative principal if they can't cover interest
// Maybe the algorithm is: 
// 1. Each bucket gets its proportional share of min payment
// 2. Apply that share to interest first, then principal (can be negative)

console.log('\n=== Testing Proportional + Local Application ===');
const totalBalance = buckets.reduce((sum, b) => sum + b.balance, 0);
console.log(`Total balance: ${totalBalance}`);

buckets.forEach(bucket => {
  const proportion = bucket.balance / totalBalance;
  const minShare = round2dp(minPayment * proportion);
  const interestCovered = Math.min(minShare, bucket.apr / 100 / 12 * bucket.balance);
  const principalFromShare = round2dp(minShare - interestCovered);
  
  console.log(`${bucket.id}:`);
  console.log(`  Proportion: ${(proportion * 100).toFixed(1)}%`);
  console.log(`  Min share: ${minShare}`);
  console.log(`  Interest covered: ${round2dp(interestCovered)}`);
  console.log(`  Principal: ${principalFromShare}`);
  console.log(`  Expected principal: ${expected[bucket.id].principal}`);
  console.log(`  Match: ${Math.abs(principalFromShare - expected[bucket.id].principal) < 0.01 ? '✓' : '✗'}`);
});

console.log('\nThis looks like the right algorithm - proportional shares with local interest application!');