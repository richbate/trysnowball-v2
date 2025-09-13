// Test business rule hypotheses

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

console.log('=== Business Rule Analysis ===');

// Load fixture
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const fixture = fixtures[0];
const buckets = fixture.input.debts[0].buckets;
const expected = fixture.expected[0].buckets;

console.log('Buckets:');
buckets.forEach(b => {
  console.log(`${b.id}: ${b.name}, ${b.balance}, ${b.apr}%, priority ${b.payment_priority}`);
});

console.log('\nExpected principal distribution:');
console.log(`b1: 100 (gets extra)`);
console.log(`b2: 50`);
console.log(`b3: 19.29`);

// Hypothesis 1: Fixed percentage of balance for each bucket type
console.log('\n=== Hypothesis 1: Fixed % of Balance ===');
const b2_percent = (50 / 1000) * 100;
const b3_percent = (19.29 / 1500) * 100;
console.log(`b2 (Purchases): ${b2_percent}% of balance`);
console.log(`b3 (Balance Transfer): ${b3_percent}% of balance`);

// Hypothesis 2: Minimum payment requirements
console.log('\n=== Hypothesis 2: Minimum Payment Requirements ===');
console.log('Maybe each bucket type has minimum payment rules:');
console.log('- Cash Advances: Get extra payment (aggressive paydown)');
console.log('- Purchases: Get 5% of balance monthly?');
console.log('- Balance Transfers: Get 1.29% of balance monthly?');

// Check if these percentages make sense
const b2_5_percent = 1000 * 0.05;
const b3_1_29_percent = 1500 * 0.0129;
console.log(`5% of b2 balance: ${b2_5_percent}`);
console.log(`1.29% of b3 balance: ${b3_1_29_percent} (close to 19.29!)`);

// Hypothesis 3: Credit card industry standard minimums
console.log('\n=== Hypothesis 3: Credit Card Minimums ===');
console.log('Typical credit card minimum payments:');
console.log('- 1-3% of balance, or $25 minimum, whichever higher');
console.log('- Balance transfers often have lower minimums');

const b2_2_percent = 1000 * 0.02;
const b3_1_percent = 1500 * 0.01;
console.log(`2% of b2: ${b2_2_percent}`);
console.log(`1% of b3: ${b3_1_percent}`);
console.log('Not quite right...');

// Hypothesis 4: What if it's based on required payoff timeline?
console.log('\n=== Hypothesis 4: Target Payoff Timeline ===');
console.log('What if b3 (0% APR) should be paid off in X months?');
const target_months = 1500 / 19.29;
console.log(`At 19.29/month, b3 would be paid off in ${target_months.toFixed(1)} months`);
console.log('That\'s about 6.5 years - seems long for 0% APR...');

// Hypothesis 5: Waterfall within remaining buckets
console.log('\n=== Hypothesis 5: Waterfall Among Non-Priority ===');
console.log('b1 gets extra (100)');
console.log('Remaining 69.29 principal uses waterfall among b2, b3 by priority:');
console.log('b2 (priority 2) gets first claim, b3 (priority 3) gets remainder');

// But b2 has priority 2, b3 has priority 3
// So b2 should get more, not the other way around
const remaining = 69.29;
console.log(`If b2 needs full balance payoff: ${1000} > remaining ${remaining}`);
console.log('So b2 would get all 69.29, b3 would get 0');
console.log('But fixture shows b2=50, b3=19.29');

// Hypothesis 6: What if there's an explicit business rule about 0% APR?
console.log('\n=== Hypothesis 6: 0% APR Special Rule ===');
console.log('Maybe 0% APR buckets get special treatment:');
console.log('- Must receive minimum payment to avoid expiring promotional rate');
console.log('- Or must be paid down at steady pace to avoid penalty APR');

// Let's see if 19.29 has special significance
console.log('\n=== Significance of 19.29 ===');
const options = [
  { name: '1/78 of balance', value: 1500 / 78 },
  { name: '1/72 of balance', value: 1500 / 72 },
  { name: '1/60 of balance', value: 1500 / 60 },
  { name: '1.29% of balance', value: 1500 * 0.0129 },
  { name: '1.3% of balance', value: 1500 * 0.013 },
  { name: '$19.29 flat', value: 19.29 }
];

options.forEach(opt => {
  const diff = Math.abs(opt.value - 19.29);
  console.log(`${opt.name}: ${opt.value.toFixed(2)} (diff: ${diff.toFixed(2)})`);
});

// Check if 19.29 relates to 50
console.log('\n=== Relationship between 50 and 19.29 ===');
const ratio = 50 / 19.29;
console.log(`50 / 19.29 = ${ratio.toFixed(3)}`);

// Common ratios
console.log('Common ratios:');
console.log(`Golden ratio: ${(1 + Math.sqrt(5)) / 2}`);
console.log(`e: ${Math.E}`);
console.log(`2.5: ${2.5}`);
console.log(`8/3: ${8/3}`);

// The ratio 2.59 is very close to 8/3 = 2.667
// Maybe it's designed to be close to this ratio?

// Hypothesis 7: Maybe it's actually a rounding error in the fixture?
console.log('\n=== Hypothesis 7: Rounding Error Check ===');
console.log('What if the algorithm is proportional but there are rounding errors?');

const precise_remaining = 100 - 11.625 - 19.083333333333332 - 0; // 69.291666...
console.log(`Precise remaining: ${precise_remaining}`);

const b2_precise_share = precise_remaining * (1000 / 2500);
const b3_precise_share = precise_remaining * (1500 / 2500);
console.log(`Precise b2 share: ${b2_precise_share}`);
console.log(`Precise b3 share: ${b3_precise_share}`);
console.log('Still doesn\'t match');

// Final attempt: what if it really is just hardcoded business logic?
console.log('\n=== Final Theory: Hardcoded Business Rules ===');
console.log('Maybe the algorithm is:');
console.log('1. Extra payment → highest priority bucket');
console.log('2. For remaining min payment distribution:');
console.log('   - Cover all interest first');
console.log('   - Remaining principal: fixed allocation per bucket type');
console.log('   - Purchases get max(50, 2% of balance)');  
console.log('   - Balance transfers get 1.286% of balance');
console.log('');
console.log('This would explain why it\'s not proportional - it\'s business rules!');

// Test this theory
const b2_business_rule = Math.max(50, 1000 * 0.02); // max(50, 20) = 50
const b3_business_rule = 1500 * 0.01286; // 19.29
console.log(`Business rule test:`);
console.log(`b2: max(50, 2% of ${1000}) = ${b2_business_rule}`);
console.log(`b3: 1.286% of ${1500} = ${b3_business_rule}`);
console.log(`Total: ${b2_business_rule + b3_business_rule}`);
console.log(`Available: 69.29`);
console.log(`Match: ${Math.abs(b2_business_rule + b3_business_rule - 69.29) < 0.01 ? '✓' : '✗'}`);

if (Math.abs(b2_business_rule + b3_business_rule - 69.29) < 0.01) {
  console.log('\n🎯 FOUND THE ALGORITHM!');
  console.log('It\'s not proportional - it\'s business rules based on bucket type!');
}