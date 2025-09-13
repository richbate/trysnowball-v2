// Try to exactly match the fixture by working backwards

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Load fixture
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const fixture = fixtures[0];
const expected = fixture.expected[0].buckets;

console.log('=== Working Backwards from Expected Results ===');

// Expected final balances
console.log('Expected final balances:');
Object.keys(expected).forEach(id => {
  const exp = expected[id];
  console.log(`${id}: balance=${exp.balance}, payment=${exp.payment}, interest=${exp.interest}, principal=${exp.principal}`);
});

// Working backwards: if balance goes from initial to final, what was the actual payment?
const initial_balances = { b1: 500, b2: 1000, b3: 1500 };

console.log('\nWorking backwards from balance changes:');
Object.keys(expected).forEach(id => {
  const exp = expected[id];
  const initial = initial_balances[id];
  const final = exp.balance;
  
  // Balance equation: new_balance = old_balance + interest - payment
  // So: payment = old_balance + interest - new_balance
  const implied_payment = initial + exp.interest - final;
  
  console.log(`${id}: ${initial} + ${exp.interest} - ${final} = payment of ${implied_payment}`);
  console.log(`     Expected payment: ${exp.payment}`);
  console.log(`     Match: ${Math.abs(implied_payment - exp.payment) < 0.01 ? '✓' : '✗'}`);
});

// Check if the interest values are calculated differently
console.log('\n=== Testing Different Interest Calculations ===');

const buckets = fixture.input.debts[0].buckets;
buckets.forEach(bucket => {
  const rate1 = bucket.balance * bucket.apr / 100 / 12; // Raw
  const rate2 = round2dp(bucket.balance * bucket.apr / 100 / 12); // My method
  const rate3 = parseFloat((bucket.balance * bucket.apr / 100 / 12).toFixed(2)); // toFixed method
  const rate4 = Math.round(bucket.balance * bucket.apr / 100 / 12 * 100) / 100; // Alternative round
  
  const expected_interest = expected[bucket.id].interest;
  
  console.log(`${bucket.id} (${bucket.balance} @ ${bucket.apr}%):`);
  console.log(`  Raw: ${rate1}`);
  console.log(`  My round: ${rate2}`);  
  console.log(`  toFixed: ${rate3}`);
  console.log(`  Alt round: ${rate4}`);
  console.log(`  Expected: ${expected_interest}`);
  console.log(`  Match: ${rate1 === expected_interest ? 'raw' : rate2 === expected_interest ? 'my' : rate3 === expected_interest ? 'fixed' : rate4 === expected_interest ? 'alt' : 'none'}`);
});

// Maybe the issue is not rounding but the exact calculation?
console.log('\n=== Manual Calculation Check ===');
const b1_exact = 500 * 27.9 / 100 / 12;
console.log(`b1 exact: 500 * 27.9 / 100 / 12 = ${b1_exact}`);

// Different rounding points
console.log(`Round at end: ${round2dp(b1_exact)}`);
console.log(`Round 27.9/100: ${round2dp(500 * round2dp(27.9/100) / 12)}`);
console.log(`Round 27.9/100/12: ${round2dp(500 * round2dp(27.9/100/12))}`);

// Maybe they calculated it as (balance * apr / 100) / 12?
const alt_calc = round2dp((500 * 27.9 / 100) / 12);
console.log(`Alternative: (500 * 27.9 / 100) / 12 = ${alt_calc}`);

// Maybe there's a tiny rounding difference in APR?
console.log('\n=== APR Precision Test ===');
const test_rates = [27.9, 27.90, 27.899999999999999, 27.900000000000002];
test_rates.forEach(rate => {
  const interest = round2dp(500 * rate / 100 / 12);
  console.log(`Rate ${rate}: interest = ${interest}`);
});

// Let's just accept the fixture values and see what algorithm produces them
console.log('\n=== Accepting Fixture Values as Truth ===');
console.log('Given:');
console.log('b1: 11.63 interest, 100 principal, 111.63 payment');
console.log('b2: 19.08 interest, 50 principal, 69.08 payment');  
console.log('b3: 0 interest, 19.29 principal, 19.29 payment');
console.log('Total: 30.71 interest, 169.29 principal, 200 payment');
console.log();
console.log('Min payment = 100, Extra payment = 100');
console.log('Extra clearly goes to b1 (100 principal)');
console.log('Min payment covers 30.71 interest + 69.29 principal');
console.log('b2 gets 50 principal, b3 gets 19.29 principal');
console.log('50 + 19.29 = 69.29 ✓');
console.log();
console.log('The question is: why does b2 get 50 and b3 get 19.29?');

// Test if it's related to balance transfer priorities
console.log('\n=== Balance Transfer Priority Theory ===');
console.log('b3 is Balance Transfer at 0% APR');
console.log('Maybe balance transfers get minimum required payment?');
console.log('And purchases get the rest?');
console.log();
console.log('If b3 needs minimum payment to avoid fees, maybe it gets fixed amount?');
console.log('And b2 gets remainder?');
console.log('b3 principal: 19.29');
console.log('b2 principal: 69.29 - 19.29 = 50 ✓');

// What determines 19.29?
const b3_balance = 1500;
const ratio_19_29_to_balance = 19.29 / b3_balance;
console.log(`19.29 / 1500 = ${ratio_19_29_to_balance} = ${(ratio_19_29_to_balance * 100).toFixed(2)}% of balance`);

const ratio_19_29_to_remaining = 19.29 / 69.29;
console.log(`19.29 / 69.29 = ${ratio_19_29_to_remaining} = ${(ratio_19_29_to_remaining * 100).toFixed(1)}% of remaining principal`);

// Check if 19.29 is significant
console.log(`Maybe 19.29 is 1.286% of 1500 balance? ${1500 * 0.01286}`);

// Let me try: what if 0% APR buckets get exactly what they need to hit target payoff?
console.log('\n=== 0% APR Special Case Theory ===');
console.log('What if 0% APR buckets get calculated payment to achieve certain payoff timeline?');

// Or maybe it's just 1/12 of some percentage?
const monthly_percent = 19.29 / 1500 * 12;
console.log(`Monthly payment as annual %: ${monthly_percent * 100}% = ${monthly_percent}`);
// That's about 15.4% annually, not a nice round number

console.log('\n=== Final attempt: exact proportional ===');
// What if it really is proportional but calculated slightly differently?
const total_b2_b3_balance = 1000 + 1500;
const b2_exact_prop = 69.29 * (1000 / total_b2_b3_balance);
const b3_exact_prop = 69.29 * (1500 / total_b2_b3_balance);

console.log(`Exact proportional b2: 69.29 * (1000/2500) = ${b2_exact_prop}`);
console.log(`Exact proportional b3: 69.29 * (1500/2500) = ${b3_exact_prop}`);
console.log('Still does not match expected 50 and 19.29');

console.log('\n=== Maybe different total? ===');
// What if they use a different total than 69.29?
const actual_b2_b3_sum = 50 + 19.29;
console.log(`Actual b2+b3 sum: ${actual_b2_b3_sum}`);
const ratio_test = 50 / 19.29;
console.log(`b2/b3 ratio: ${ratio_test} = ${ratio_test.toFixed(2)}`);

// Balance ratio 1000/1500 = 0.667
const balance_ratio = 1000 / 1500;
console.log(`Balance ratio: ${balance_ratio.toFixed(3)}`);

// Not a match either. This is a custom business rule!