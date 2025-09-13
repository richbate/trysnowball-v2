// Debug payment waterfall approach

const fs = require('fs');

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Load the Priority Order fixture  
const fixtures = JSON.parse(fs.readFileSync('/Users/richbate/Documents/snowball/trysnowball-clean/src/tests/fixtures/cp4-forecast.fixtures.json', 'utf8'));
const priorityFixture = fixtures.find(f => f.name === "Bucket Priority Order");

const buckets = priorityFixture.input.debts[0].buckets;
const expected = priorityFixture.expected[0].buckets;
const minPayment = 100;

console.log('=== Payment Waterfall Test ===');

// Step 1: Calculate interest
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interestThisMonth: round2dp(bucket.balance * bucket.apr / 100 / 12),
  paymentReceived: 0
}));

// Step 2: Sort by priority and apply waterfall to PAYMENT (not just principal)
const sortedByPriority = [...bucketData].sort((a, b) => a.payment_priority - b.payment_priority);

let remainingPayment = minPayment;

console.log('Applying payment waterfall:');
sortedByPriority.forEach(bucket => {
  if (remainingPayment > 0) {
    // This bucket gets min(remaining payment, its current balance + interest)
    // But we need to figure out what constraint applies...
    
    // Let's try: bucket can get up to what's needed to pay it off completely
    const maxNeededForPayoff = bucket.balance + bucket.interestThisMonth;
    const paymentForThisBucket = Math.min(remainingPayment, maxNeededForPayoff);
    
    bucket.paymentReceived = round2dp(paymentForThisBucket);
    remainingPayment = round2dp(remainingPayment - paymentForThisBucket);
    
    console.log(`${bucket.id} (priority ${bucket.payment_priority}): gets ${bucket.paymentReceived}, remaining: ${remainingPayment}`);
  } else {
    bucket.paymentReceived = 0;
    console.log(`${bucket.id}: gets 0 (no remaining payment)`);
  }
});

// Step 3: Calculate interest and principal for each bucket
console.log('\nCalculating interest and principal:');
bucketData.forEach(bucket => {
  const interestPaid = Math.min(bucket.paymentReceived, bucket.interestThisMonth);
  const principalPaid = bucket.paymentReceived - interestPaid;
  
  bucket.interestPaid = round2dp(interestPaid);
  bucket.principalPaid = round2dp(principalPaid);
  
  console.log(`${bucket.id}:`);
  console.log(`  Payment: ${bucket.paymentReceived}`);
  console.log(`  Interest: ${bucket.interestPaid} (of ${bucket.interestThisMonth} needed)`);
  console.log(`  Principal: ${bucket.principalPaid}`);
  console.log(`  Expected payment: ${expected[bucket.id].payment}`);
  console.log(`  Expected principal: ${expected[bucket.id].principal}`);
  console.log(`  Payment match: ${Math.abs(bucket.paymentReceived - expected[bucket.id].payment) < 0.01 ? '✓' : '✗'}`);
  console.log(`  Principal match: ${Math.abs(bucket.principalPaid - expected[bucket.id].principal) < 0.01 ? '✓' : '✗'}`);
  console.log();
});

// Check if this approach works
const allMatch = bucketData.every(bucket => 
  Math.abs(bucket.paymentReceived - expected[bucket.id].payment) < 0.01 &&
  Math.abs(bucket.principalPaid - expected[bucket.id].principal) < 0.01
);

if (allMatch) {
  console.log('🎯 PAYMENT WATERFALL ALGORITHM CONFIRMED!');
  console.log('Algorithm: Apply total payment in priority order, then split payment into interest+principal locally');
} else {
  console.log('❌ Payment waterfall doesn\'t match');
  
  // Let me try a different constraint
  console.log('\n=== Alternative: Maybe constraint is different ===');
  
  // What if the constraint is that each bucket can get at most its balance in principal?
  // So payment = interest + min(balance, remaining_after_interest)
  
  let remainingPayment2 = minPayment;
  const bucketData2 = buckets.map(bucket => ({
    ...bucket,
    interestThisMonth: round2dp(bucket.balance * bucket.apr / 100 / 12)
  }));
  
  const sortedByPriority2 = [...bucketData2].sort((a, b) => a.payment_priority - b.payment_priority);
  
  console.log('\nTrying constrained principal waterfall:');
  sortedByPriority2.forEach(bucket => {
    if (remainingPayment2 > 0) {
      // First, bucket needs to cover its interest
      const interestNeeded = bucket.interestThisMonth;
      const interestPaid = Math.min(remainingPayment2, interestNeeded);
      const remainingAfterInterest = remainingPayment2 - interestPaid;
      
      // Then, remaining payment goes to principal (up to balance limit)
      const maxPrincipal = bucket.balance;
      const principalPaid = Math.min(remainingAfterInterest, maxPrincipal);
      
      const totalPayment = interestPaid + principalPaid;
      
      bucket.paymentReceived = round2dp(totalPayment);
      remainingPayment2 = round2dp(remainingPayment2 - totalPayment);
      
      console.log(`${bucket.id}: payment=${bucket.paymentReceived}, remaining=${remainingPayment2}`);
    }
  });
}