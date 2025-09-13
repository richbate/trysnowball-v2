// Reverse engineer the exact fixture logic

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Test Single Debt - Multi-APR Buckets fixture
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const singleDebtFixture = fixtures[0];

console.log('=== Reverse Engineering Fixture Logic ===');

const buckets = singleDebtFixture.input.debts[0].buckets;
const expected = singleDebtFixture.expected[0].buckets;
const minPayment = 100;
const extraPayment = 100;

console.log('\nExpected Results:');
Object.keys(expected).forEach(id => {
  const exp = expected[id];
  console.log(`${id}: interest=${exp.interest}, principal=${exp.principal}, payment=${exp.payment}, balance=${exp.balance}`);
});

// Calculate what each bucket's interest should be
console.log('\nCalculating Interest:');
const interestCalcs = {};
buckets.forEach(bucket => {
  const monthlyRate = bucket.apr / 100 / 12;
  const interest = round2dp(bucket.balance * monthlyRate);
  interestCalcs[bucket.id] = interest;
  console.log(`${bucket.id}: ${bucket.balance} × ${bucket.apr}%/12 = ${interest}`);
});

const totalInterest = Object.values(interestCalcs).reduce((a,b) => a+b, 0);
console.log(`Total interest: ${totalInterest}`);

// Analyze payment distribution
console.log('\nPayment Distribution Analysis:');
let totalExpectedPayment = 0;
let totalExpectedPrincipal = 0;
let totalExpectedInterest = 0;

Object.keys(expected).forEach(id => {
  const exp = expected[id];
  totalExpectedPayment += exp.payment;
  totalExpectedPrincipal += exp.principal;
  totalExpectedInterest += exp.interest;
  
  console.log(`${id}: payment=${exp.payment}, principal=${exp.principal}, interest=${exp.interest}`);
});

console.log(`\nTotals: payment=${totalExpectedPayment}, principal=${totalExpectedPrincipal}, interest=${totalExpectedInterest}`);
console.log(`Expected total payment: ${minPayment + extraPayment} = 200`);

// Try to understand the min payment distribution
console.log('\n=== Analyzing Min Payment Distribution ===');
console.log('Total payment = 200, total interest = 30.71, remaining principal = 169.29');

// Working backwards from expected principal values
const b1_principal = expected.b1.principal; // 100
const b2_principal = expected.b2.principal; // 50
const b3_principal = expected.b3.principal; // 19.29

console.log(`Principal distribution: b1=${b1_principal}, b2=${b2_principal}, b3=${b3_principal}`);
console.log(`Total principal: ${b1_principal + b2_principal + b3_principal}`);

// Hypothesis: Extra goes to priority 1 (b1), remaining min principal distributed differently
console.log('\n=== Hypothesis Testing ===');
console.log('If extra 100 goes entirely to b1, then b1 gets 100 principal from extra');
console.log('Min payment (100) must cover all interest (30.71) + some principal (69.29)');

const remainingMinPrincipal = 100 - totalInterest;
console.log(`Remaining min principal to distribute: ${round2dp(remainingMinPrincipal)}`);

const b2_b3_principal = b2_principal + b3_principal;
console.log(`b2 + b3 principal from fixture: ${b2_b3_principal}`);
console.log(`Expected remaining min principal: ${round2dp(remainingMinPrincipal)}`);

if (Math.abs(b2_b3_principal - remainingMinPrincipal) < 0.01) {
  console.log('✓ MATCHES! Extra goes 100% to b1, min principal goes to b2+b3');
  
  // Now figure out how b2 and b3 split the remaining
  console.log('\n=== How b2 and b3 split remaining principal ===');
  const b2_balance = 1000;
  const b3_balance = 1500;
  const total_b2_b3_balance = b2_balance + b3_balance;
  
  const b2_prop = b2_balance / total_b2_b3_balance;
  const b3_prop = b3_balance / total_b2_b3_balance;
  
  const b2_expected_prop = b2_principal / remainingMinPrincipal;
  const b3_expected_prop = b3_principal / remainingMinPrincipal;
  
  console.log(`Balance proportions: b2=${b2_prop.toFixed(3)}, b3=${b3_prop.toFixed(3)}`);
  console.log(`Principal proportions: b2=${b2_expected_prop.toFixed(3)}, b3=${b3_expected_prop.toFixed(3)}`);
  
  if (Math.abs(b2_prop - b2_expected_prop) < 0.01 && Math.abs(b3_prop - b3_expected_prop) < 0.01) {
    console.log('✓ PROPORTIONAL SPLIT CONFIRMED!');
    console.log('\nALGORITHM DISCOVERED:');
    console.log('1. Calculate all interest');
    console.log('2. Extra payment goes 100% to highest priority bucket');
    console.log('3. Min payment covers all interest + remaining principal');
    console.log('4. Remaining principal distributed proportionally among NON-priority buckets');
  } else {
    console.log('✗ Not proportional split');
  }
} else {
  console.log('✗ Hypothesis incorrect');
}

// Test this algorithm
console.log('\n=== Testing Discovered Algorithm ===');
console.log('Step 1: Calculate interest and cover with min payment');
buckets.forEach(bucket => {
  const interest = interestCalcs[bucket.id];
  console.log(`${bucket.id}: interest = ${interest}`);
});

console.log('\nStep 2: Apply extra to b1 (highest priority)');
console.log(`b1: gets ${extraPayment} extra principal`);

console.log('\nStep 3: Distribute remaining min principal to b2, b3 proportionally');
const b2Bucket = buckets.find(b => b.id === 'b2');
const b3Bucket = buckets.find(b => b.id === 'b3');
const totalNonPriorityBalance = b2Bucket.balance + b3Bucket.balance;

const b2Share = round2dp(remainingMinPrincipal * (b2Bucket.balance / totalNonPriorityBalance));
const b3Share = round2dp(remainingMinPrincipal * (b3Bucket.balance / totalNonPriorityBalance));

console.log(`b2 share: ${remainingMinPrincipal} × ${b2Bucket.balance}/${totalNonPriorityBalance} = ${b2Share}`);
console.log(`b3 share: ${remainingMinPrincipal} × ${b3Bucket.balance}/${totalNonPriorityBalance} = ${b3Share}`);

console.log('\n=== Final Test Results ===');
console.log(`b1: interest=${interestCalcs.b1}, principal=${extraPayment}, payment=${interestCalcs.b1 + extraPayment}`);
console.log(`b2: interest=${interestCalcs.b2}, principal=${b2Share}, payment=${interestCalcs.b2 + b2Share}`);
console.log(`b3: interest=${interestCalcs.b3}, principal=${b3Share}, payment=${interestCalcs.b3 + b3Share}`);

console.log('\nCompare to expected:');
console.log(`b1: expected payment=${expected.b1.payment}, calculated=${round2dp(interestCalcs.b1 + extraPayment)}`);
console.log(`b2: expected payment=${expected.b2.payment}, calculated=${round2dp(interestCalcs.b2 + b2Share)}`);
console.log(`b3: expected payment=${expected.b3.payment}, calculated=${round2dp(interestCalcs.b3 + b3Share)}`);