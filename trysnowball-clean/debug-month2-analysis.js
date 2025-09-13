// Analyze month 2 to understand the business rule

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const fixture = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'))[0];

console.log('=== Month 2 Analysis ===');

// Month 1 final balances (from fixture)
const month1 = fixture.expected[0].buckets;
console.log('Month 1 final balances:');
Object.keys(month1).forEach(id => {
  console.log(`${id}: ${month1[id].balance}`);
});

// Month 2 expected values
const month2 = fixture.expected[1].buckets;
console.log('\nMonth 2 expected:');
Object.keys(month2).forEach(id => {
  const bucket = month2[id];
  if (bucket.principal !== undefined) {
    console.log(`${id}: principal=${bucket.principal}, payment=${bucket.payment}`);
  }
});

// Calculate what percentage 22.57 is of the b3 balance
const b3_month1_balance = month1.b3.balance; // 1480.71
const b3_month2_principal = month2.b3.principal; // 22.57

const percentage = (b3_month2_principal / b3_month1_balance) * 100;
console.log(`\nb3 analysis:`);
console.log(`Month 1 balance: ${b3_month1_balance}`);
console.log(`Month 2 principal: ${b3_month2_principal}`);
console.log(`Percentage: ${percentage.toFixed(4)}% of balance`);

// Check if this is a different rate than 1.286%
console.log(`Expected 1.286%: ${b3_month1_balance * 0.01286}`);
console.log(`Actual rate needed: ${percentage.toFixed(4)}%`);

// Maybe it's 1.5%?
const test_1_5_percent = b3_month1_balance * 0.015;
console.log(`1.5% would be: ${test_1_5_percent}`);

// Maybe it's based on original balance?
const original_b3_balance = 1500;
const original_rate = (b3_month2_principal / original_b3_balance) * 100;
console.log(`\nBased on original balance ${original_b3_balance}:`);
console.log(`Rate would be: ${original_rate.toFixed(4)}%`);
console.log(`1.5% of original: ${original_b3_balance * 0.015}`);

// Let me check if 22.57 has any special significance
console.log(`\n=== Special significance of 22.57 ===`);
const options = [
  { name: '1.5% of 1500', value: 1500 * 0.015 },
  { name: '1.53% of 1480.71', value: 1480.71 * 0.0153 },
  { name: '1/66 of 1500', value: 1500 / 66 },
  { name: '1/66 of 1480.71', value: 1480.71 / 66 }
];

options.forEach(opt => {
  const diff = Math.abs(opt.value - 22.57);
  console.log(`${opt.name}: ${opt.value.toFixed(2)} (diff: ${diff.toFixed(2)})`);
});

// Maybe the business rule is different for month 2?
console.log(`\n=== Maybe the rule changes over time? ===`);
console.log('Month 1: Balance transfer gets 1.286% of balance');
console.log('Month 2+: Balance transfer gets 1.5% of balance?');

const month2_test = b3_month1_balance * 0.015;
console.log(`Test 1.5% rule: ${month2_test} vs expected ${b3_month2_principal}`);

// Or maybe it's still proportional but with a different total?
console.log(`\n=== Maybe it's still proportional? ===`);
const b2_month2_principal = month2.b2.principal; // 50
const b3_month2_principal_exp = month2.b3.principal; // 22.57

console.log(`b2 gets: ${b2_month2_principal}`);
console.log(`b3 gets: ${b3_month2_principal_exp}`);
console.log(`Total b2+b3: ${b2_month2_principal + b3_month2_principal_exp}`);

// Check balances for month 2 (start of month 2)
const b2_balance_month2 = month1.b2.balance; // 950
const b3_balance_month2 = month1.b3.balance; // 1480.71
const total_b2_b3_balance = b2_balance_month2 + b3_balance_month2;

const b2_proportion = b2_balance_month2 / total_b2_b3_balance;
const b3_proportion = b3_balance_month2 / total_b2_b3_balance;

console.log(`b2 proportion: ${b2_proportion.toFixed(3)} × 72.57 = ${(b2_proportion * 72.57).toFixed(2)}`);
console.log(`b3 proportion: ${b3_proportion.toFixed(3)} × 72.57 = ${(b3_proportion * 72.57).toFixed(2)}`);

// That doesn't work either. Let me check the interest first
console.log(`\n=== Month 2 Interest Calculation ===`);
const buckets = fixture.input.debts[0].buckets;

// Calculate month 2 interest based on month 1 final balances
buckets.forEach(bucket => {
  const month1_balance = month1[bucket.id].balance;
  const interest = round2dp(month1_balance * bucket.apr / 100 / 12);
  console.log(`${bucket.id} (${bucket.name}): ${month1_balance} × ${bucket.apr}% = ${interest}`);
});

const b1_interest_m2 = round2dp(month1.b1.balance * 27.9 / 100 / 12); // 400 × 27.9%/12
const b2_interest_m2 = round2dp(month1.b2.balance * 22.9 / 100 / 12); // 950 × 22.9%/12  
const b3_interest_m2 = 0; // 0%

const total_interest_m2 = b1_interest_m2 + b2_interest_m2 + b3_interest_m2;
const remaining_m2 = 100 - total_interest_m2;

console.log(`Total interest month 2: ${total_interest_m2}`);
console.log(`Remaining for principal: ${remaining_m2}`);
console.log(`b2 + b3 expected principal: ${b2_month2_principal + b3_month2_principal_exp}`);

if (Math.abs(remaining_m2 - (b2_month2_principal + b3_month2_principal_exp)) < 0.01) {
  console.log('✓ The remaining principal exactly matches b2+b3 expected!');
  console.log('So the algorithm is consistent - just need to figure out the split');
}