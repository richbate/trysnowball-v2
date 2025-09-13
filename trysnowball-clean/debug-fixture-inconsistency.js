// Debug the inconsistency between fixtures

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

console.log('=== Fixture Inconsistency Analysis ===');

// Test 1: Single Debt - Multi-APR Buckets
console.log('\n1. Single Debt - Multi-APR (original working case):');
console.log('   Input: 3 buckets, 100 min, 100 extra');
console.log('   b1: 500@27.9%, priority 1');
console.log('   b2: 1000@22.9%, priority 2');  
console.log('   b3: 1500@0%, priority 3');

const interests1 = [11.63, 19.08, 0];
const totalInterest1 = interests1.reduce((a,b) => a+b, 0);
const remainingMin1 = 100 - totalInterest1;

console.log(`   Total interest: ${totalInterest1}`);
console.log(`   Remaining min: ${remainingMin1}`);
console.log('   Expected distribution: b2=50, b3=19.29');
console.log('   Strict waterfall would be: b2=69.29, b3=0');

// Test 2: Bucket Priority Order
console.log('\n2. Bucket Priority Order:');
console.log('   Input: 3 buckets, 100 min, 0 extra');
console.log('   b1: 300@10%, priority 3');
console.log('   b2: 400@20%, priority 1');
console.log('   b3: 300@15%, priority 2');

const interests2 = [2.50, 6.67, 3.75]; // in priority order 3,1,2
const totalInterest2 = interests2.reduce((a,b) => a+b, 0);
const remainingMin2 = 100 - totalInterest2;

console.log(`   Total interest: ${totalInterest2}`);
console.log(`   Remaining min: ${remainingMin2}`);
console.log('   Expected distribution (by fixture priority 1,2,3): b2=81.75, b3=7.83, b1=-2.50');
console.log('   Note: b1 gets negative principal (balance grows)');

console.log('\n=== Analysis ===');
console.log('Test 1 uses a BALANCED approach (50/19.29 split)');
console.log('Test 2 uses a STRICT WATERFALL approach (81.75/7.83/-2.50)');
console.log('These are fundamentally different algorithms!');

console.log('\n=== Theory ===');
console.log('Maybe the algorithm depends on whether there is extra payment:');
console.log('- WITH extra: balanced approach for min payment');
console.log('- WITHOUT extra: strict waterfall for all payment');

console.log('\n=== Testing Theory ===');
console.log('Single Debt has 100 extra → uses balanced approach');
console.log('Bucket Priority has 0 extra → uses strict waterfall');
console.log('This could explain the inconsistency!');