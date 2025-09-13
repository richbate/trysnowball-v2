// Test the business rules algorithm implementation

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Simulate the business rules algorithm
const fixture = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'))[0];
const buckets = fixture.input.debts[0].buckets;
const expected = fixture.expected[0].buckets;
const minPayment = 100;
const extraPayment = 100;

console.log('=== Business Rules Algorithm Test ===');

// Step 1: Calculate interest
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interestThisMonth: round2dp(bucket.balance * bucket.apr / 100 / 12),
  interestPaid: 0,
  principalPaid: 0
}));

console.log('Step 1: Interest calculation');
bucketData.forEach(bucket => {
  console.log(`${bucket.name}: ${bucket.interestThisMonth}`);
});

// Step 2: Cover all interest with min payment
const totalInterest = bucketData.reduce((sum, b) => sum + b.interestThisMonth, 0);
let remainingMinPayment = minPayment;

console.log(`\nStep 2: Cover interest`);
console.log(`Total interest: ${totalInterest}`);
bucketData.forEach(bucket => {
  bucket.interestPaid = bucket.interestThisMonth;
  remainingMinPayment -= bucket.interestThisMonth;
  console.log(`${bucket.name}: covers ${bucket.interestPaid} interest`);
});
remainingMinPayment = round2dp(remainingMinPayment);
console.log(`Remaining min payment: ${remainingMinPayment}`);

// Step 3: Apply business rules for remaining principal
console.log(`\nStep 3: Business rules for remaining principal`);

bucketData.forEach(bucket => {
  let principalFromMin = 0;
  
  // Business rules based on bucket name/type
  if (bucket.name.toLowerCase().includes('purchase')) {
    // Purchases: 5% of balance (min $50)
    principalFromMin = Math.max(50, bucket.balance * 0.05);
    console.log(`${bucket.name}: Purchase → max(50, 5% of ${bucket.balance}) = ${principalFromMin}`);
  } else if (bucket.name.toLowerCase().includes('balance transfer')) {
    // Balance Transfer: 1.286% of balance  
    principalFromMin = bucket.balance * 0.01286;
    console.log(`${bucket.name}: Balance Transfer → 1.286% of ${bucket.balance} = ${principalFromMin}`);
  } else if (bucket.name.toLowerCase().includes('cash advance')) {
    // Cash Advances: get remaining after other buckets (usually gets extra anyway)
    principalFromMin = 0; // Will get extra payment instead
    console.log(`${bucket.name}: Cash Advance → 0 (gets extra instead)`);
  } else {
    // Default: proportional share of remaining (fallback)
    console.log(`${bucket.name}: Unknown type, using default proportional`);
    principalFromMin = 0;
  }
  
  bucket.principalPaid = round2dp(principalFromMin);
});

// Step 4: Apply extra payment to highest priority bucket
console.log(`\nStep 4: Apply extra payment`);
const sortedBuckets = [...bucketData].sort((a, b) => a.payment_priority - b.payment_priority);
const target = sortedBuckets[0]; // Highest priority (lowest number)

console.log(`Extra ${extraPayment} goes to ${target.name} (priority ${target.payment_priority})`);
target.principalPaid += extraPayment;

// Final calculations
console.log(`\nFinal Results:`);
bucketData.forEach(bucket => {
  const totalPayment = bucket.interestPaid + bucket.principalPaid;
  console.log(`${bucket.name}:`);
  console.log(`  Interest: ${bucket.interestPaid}`);
  console.log(`  Principal: ${bucket.principalPaid}`);
  console.log(`  Payment: ${totalPayment}`);
  console.log(`  Expected payment: ${expected[bucket.id].payment}`);
  console.log(`  Match: ${Math.abs(totalPayment - expected[bucket.id].payment) < 0.01 ? '✓' : '✗'}`);
});

// Check totals
const totalPrincipal = bucketData.reduce((sum, b) => sum + b.principalPaid, 0);
const totalPaymentCalc = bucketData.reduce((sum, b) => sum + b.interestPaid + b.principalPaid, 0);
console.log(`\nTotals:`);
console.log(`Principal: ${totalPrincipal}`);
console.log(`Payment: ${totalPaymentCalc}`);
console.log(`Expected total: 200`);

// Let me manually check what the test is comparing
console.log(`\n=== Debugging the Test Failure ===`);
console.log('Test expected b3 principal: 22.57 (from error message)');
console.log('Test received b3 principal: 19.04 (from error message)');
console.log();
console.log('But fixture shows b3 should get 19.29 principal...');
console.log('This suggests the test is checking MONTH 2, not MONTH 1!');

// Let me check if month 2 is what's being tested
const month2Expected = fixture.expected[1];
if (month2Expected && month2Expected.buckets) {
  console.log('\nMonth 2 expected values:');
  Object.keys(month2Expected.buckets).forEach(id => {
    const bucket = month2Expected.buckets[id];
    console.log(`${id}: principal=${bucket.principal}, payment=${bucket.payment}`);
  });
}