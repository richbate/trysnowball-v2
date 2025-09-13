// Debug current calculations in compositeSimulatorV2

const fs = require('fs');

// Read the fixture to understand expected values
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Test Single Debt - Multi-APR Buckets fixture
const singleDebtFixture = fixtures[0];
console.log('=== Single Debt - Multi-APR Buckets ===');
console.log('Input:', JSON.stringify(singleDebtFixture.input, null, 2));

// Simulate what our algorithm should be doing
const buckets = singleDebtFixture.input.debts[0].buckets;
const minPayment = 100;
const extraPayment = 100;
const totalBalance = buckets.reduce((sum, b) => sum + b.balance, 0);

console.log('\n=== Step by Step Calculation ===');

// Step 1: Calculate interest for each bucket
console.log('Step 1: Calculate Interest');
const bucketsWithInterest = buckets.map(bucket => {
  const monthlyRate = bucket.apr / 100 / 12;
  const interestThisMonth = round2dp(bucket.balance * monthlyRate);
  console.log(`  ${bucket.name}: ${bucket.balance} × ${bucket.apr}%/12 = ${interestThisMonth}`);
  return { ...bucket, interestThisMonth, currentBalance: bucket.balance };
});

const totalInterest = bucketsWithInterest.reduce((sum, b) => sum + b.interestThisMonth, 0);
console.log(`  Total interest: ${totalInterest}`);

// Step 2: Calculate proportional min payment shares
console.log('\nStep 2: Calculate Proportional Min Shares');
const bucketsWithShares = bucketsWithInterest.map(bucket => {
  const proportion = bucket.balance / totalBalance;
  const minShare = round2dp(minPayment * proportion);
  console.log(`  ${bucket.name}: ${bucket.balance}/${totalBalance} = ${proportion.toFixed(4)} → min share = ${minShare}`);
  return { ...bucket, proportion, minShare };
});

// Verify total
const totalShares = bucketsWithShares.reduce((sum, b) => sum + b.minShare, 0);
console.log(`  Total shares: ${totalShares} (should be ${minPayment})`);

// Step 3: Apply min payment to each bucket locally
console.log('\nStep 3: Apply Min Payment Locally');
const bucketsAfterMin = bucketsWithShares.map(bucket => {
  // Interest first
  const interestCovered = Math.min(bucket.minShare, bucket.interestThisMonth);
  const principalFromMin = bucket.minShare - interestCovered;
  
  const interestPaid = round2dp(interestCovered);
  const principalPaid = round2dp(principalFromMin); // Can be negative!
  const currentBalance = round2dp(bucket.currentBalance + bucket.interestThisMonth - bucket.minShare);
  
  console.log(`  ${bucket.name}:`);
  console.log(`    Min share: ${bucket.minShare}`);
  console.log(`    Interest covered: ${interestCovered}`);
  console.log(`    Principal from min: ${principalFromMin}`);
  console.log(`    Balance: ${bucket.currentBalance} + ${bucket.interestThisMonth} - ${bucket.minShare} = ${currentBalance}`);
  
  return { ...bucket, interestPaid, principalFromMin, principalPaid, currentBalance };
});

// Step 4: Apply extra payment to highest priority
console.log('\nStep 4: Apply Extra Payment');
const sortedByPriority = [...bucketsAfterMin].sort((a, b) => a.payment_priority - b.payment_priority);
const highestPriority = sortedByPriority[0];

console.log(`  Extra ${extraPayment} goes to ${highestPriority.name} (priority ${highestPriority.payment_priority})`);

const finalBuckets = bucketsAfterMin.map(bucket => {
  let totalPrincipal = bucket.principalFromMin;
  
  if (bucket.id === highestPriority.id) {
    totalPrincipal += extraPayment;
    bucket.currentBalance = round2dp(bucket.currentBalance - extraPayment);
  }
  
  const totalPayment = round2dp(bucket.interestPaid + totalPrincipal);
  
  console.log(`  ${bucket.name} FINAL:`);
  console.log(`    Interest: ${bucket.interestPaid}`);
  console.log(`    Principal: ${round2dp(totalPrincipal)}`);
  console.log(`    Payment: ${totalPayment}`);
  console.log(`    Balance: ${bucket.currentBalance}`);
  
  return {
    ...bucket,
    totalPrincipal: round2dp(totalPrincipal),
    totalPayment
  };
});

// Compare to expected
console.log('\n=== Expected vs Actual ===');
const expected = singleDebtFixture.expected[0].buckets;
finalBuckets.forEach(bucket => {
  const exp = expected[bucket.id];
  console.log(`${bucket.name}:`);
  console.log(`  Interest: got ${bucket.interestPaid}, expected ${exp.interest}`);
  console.log(`  Principal: got ${bucket.totalPrincipal}, expected ${exp.principal}`);
  console.log(`  Payment: got ${bucket.totalPayment}, expected ${exp.payment}`);
  console.log(`  Balance: got ${bucket.currentBalance}, expected ${exp.balance}`);
  console.log();
});