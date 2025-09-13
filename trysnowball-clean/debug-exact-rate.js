// Find the exact rate for balance transfers

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const fixture = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'))[0];

console.log('=== Finding Exact Balance Transfer Rate ===');

// Month 1 analysis
const month1 = fixture.expected[0].buckets;
const b3_month1_balance = 1500; // Original
const b3_month1_principal = month1.b3.principal; // 19.29

const rate_month1 = b3_month1_principal / b3_month1_balance;
console.log(`Month 1: ${b3_month1_principal} / ${b3_month1_balance} = ${rate_month1} = ${(rate_month1 * 100).toFixed(4)}%`);

// Month 2 analysis
const month2 = fixture.expected[1].buckets;
const b3_month2_balance = month1.b3.balance; // 1480.71 (start of month 2)
const b3_month2_principal = month2.b3.principal; // 22.57

const rate_month2 = b3_month2_principal / b3_month2_balance;
console.log(`Month 2: ${b3_month2_principal} / ${b3_month2_balance} = ${rate_month2} = ${(rate_month2 * 100).toFixed(4)}%`);

// Are they the same rate?
const rate_diff = Math.abs(rate_month1 - rate_month2);
console.log(`Rate difference: ${rate_diff} (${(rate_diff * 100).toFixed(4)}%)`);

if (rate_diff < 0.0001) {
  console.log('✓ Same rate both months!');
  console.log(`Consistent rate: ${(rate_month1 * 100).toFixed(4)}%`);
} else {
  console.log('✗ Different rates');
  
  // Maybe it's based on original balance both times?
  const original_rate_m2 = b3_month2_principal / 1500;
  console.log(`Month 2 vs original balance: ${b3_month2_principal} / 1500 = ${(original_rate_m2 * 100).toFixed(4)}%`);
  
  // Or maybe it's a fixed amount based on some rule?
  console.log('\n=== Alternative theories ===');
  
  // Theory: minimum payment percentage increases over time
  console.log(`Month 1 rate: ${(rate_month1 * 100).toFixed(4)}%`);
  console.log(`Month 2 rate: ${(rate_month2 * 100).toFixed(4)}%`);
  
  const rate_increase = rate_month2 - rate_month1;
  console.log(`Rate increases by: ${(rate_increase * 100).toFixed(4)}% per month`);
  
  // Theory: It's still 1.286% but applied differently
  const test_1286 = b3_month2_balance * 0.01286;
  const test_1286_original = 1500 * 0.01286;
  console.log(`1.286% of current balance: ${test_1286.toFixed(2)}`);
  console.log(`1.286% of original balance: ${test_1286_original.toFixed(2)}`);
  
  // Let me try reverse engineering from the remaining principal
  console.log('\n=== Reverse Engineering ===');
  const b2_principal = month2.b2.principal; // 50
  const total_remaining = 72.57; // calculated earlier
  const b3_should_get = total_remaining - b2_principal;
  console.log(`Total remaining principal: ${total_remaining}`);
  console.log(`b2 gets: ${b2_principal}`);
  console.log(`b3 should get: ${b3_should_get}`);
  console.log(`b3 actually gets: ${b3_month2_principal}`);
  
  if (Math.abs(b3_should_get - b3_month2_principal) < 0.01) {
    console.log('✓ Perfect match! b3 gets exactly the remainder after b2');
    console.log('Algorithm: b2 gets 50 fixed, b3 gets remainder');
  }
}

// Let me check if purchases always get exactly 50
console.log('\n=== Checking Purchases Fixed Amount ===');
const b2_month1_principal = month1.b2.principal; // 50
const b2_month2_principal = month2.b2.principal; // 50

console.log(`Month 1 b2 principal: ${b2_month1_principal}`);
console.log(`Month 2 b2 principal: ${b2_month2_principal}`);

if (b2_month1_principal === b2_month2_principal) {
  console.log('✓ Purchases get exactly 50 both months!');
  console.log('This suggests: Purchases = fixed 50, Balance Transfer = remainder');
} else {
  console.log('✗ Purchases amount varies');
}

// Final algorithm test
console.log('\n=== Final Algorithm Test ===');
console.log('Hypothesis: ');
console.log('1. Cover all interest');
console.log('2. Purchases get fixed $50 principal');
console.log('3. Balance Transfer gets remaining principal');
console.log('4. Extra goes to highest priority');

const test_algorithm = {
  month1: {
    interest: 30.71,
    remaining: 100 - 30.71,
    b2_gets: 50,
    b3_gets: (100 - 30.71) - 50
  },
  month2: {
    interest: 27.43,
    remaining: 100 - 27.43,
    b2_gets: 50,
    b3_gets: (100 - 27.43) - 50
  }
};

console.log('Month 1 test:');
console.log(`  b2: ${test_algorithm.month1.b2_gets} (expected: ${b2_month1_principal})`);
console.log(`  b3: ${test_algorithm.month1.b3_gets.toFixed(2)} (expected: ${month1.b3.principal})`);

console.log('Month 2 test:');
console.log(`  b2: ${test_algorithm.month2.b2_gets} (expected: ${b2_month2_principal})`);
console.log(`  b3: ${test_algorithm.month2.b3_gets.toFixed(2)} (expected: ${month2.b3.principal})`);

const month1_b3_match = Math.abs(test_algorithm.month1.b3_gets - month1.b3.principal) < 0.01;
const month2_b3_match = Math.abs(test_algorithm.month2.b3_gets - month2.b3.principal) < 0.01;

if (month1_b3_match && month2_b3_match) {
  console.log('\n🎯 ALGORITHM CONFIRMED!');
  console.log('Purchases: Fixed $50 principal');
  console.log('Balance Transfer: Remainder of principal after interest + purchases');
} else {
  console.log('\n✗ Algorithm not confirmed');
}