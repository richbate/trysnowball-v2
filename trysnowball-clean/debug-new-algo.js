// Test the new proportional allocation algorithm

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const buckets = [
  { id: 'b1', name: 'Cash Advances', currentBalance: 500, apr: 27.9, paymentPriority: 1, isPaidOff: false },
  { id: 'b2', name: 'Purchases', currentBalance: 1000, apr: 22.9, paymentPriority: 2, isPaidOff: false },
  { id: 'b3', name: 'Balance Transfer', currentBalance: 1500, apr: 0.0, paymentPriority: 3, isPaidOff: false }
];

const minPayment = 100; // debt minimum payment
const extraPayment = 100; // extra payment

console.log('Min payment:', minPayment);
console.log('Extra payment:', extraPayment);

// Step 1: Calculate interest for all buckets and total balance
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interest: bucket.isPaidOff ? 0 : round2dp(bucket.currentBalance * bucket.apr / 100 / 12)
}));

const totalBalance = bucketData.reduce((sum, b) => sum + b.currentBalance, 0);
console.log('Total balance:', totalBalance);

// Step 2: Allocate minimum payment proportionally by balance
bucketData.forEach(bucket => {
  if (bucket.isPaidOff) {
    bucket.minPortionPayment = 0;
  } else {
    const proportion = totalBalance > 0 ? bucket.currentBalance / totalBalance : 0;
    bucket.minPortionPayment = round2dp(minPayment * proportion);
  }
  console.log(`\n${bucket.name}:`);
  console.log('  Balance:', bucket.currentBalance);
  console.log('  Interest:', bucket.interest);
  console.log('  Min portion:', bucket.minPortionPayment);
});

// Step 3: Apply extra payment to highest priority bucket
const sortedBuckets = [...bucketData].sort((a, b) => a.paymentPriority - b.paymentPriority);
let remainingExtraPayment = extraPayment;

console.log('\nPayment allocation:');

for (const bucket of sortedBuckets) {
  // Calculate payment for this bucket: interest + min portion + any remaining extra
  let bucketPayment = bucket.interest + bucket.minPortionPayment;
  
  // Apply extra payment to highest priority bucket that's not paid off
  if (remainingExtraPayment > 0) {
    const maxExtraForThisBucket = bucket.currentBalance - (bucketPayment - bucket.interest);
    const extraForThisBucket = Math.min(remainingExtraPayment, maxExtraForThisBucket);
    bucketPayment += extraForThisBucket;
    remainingExtraPayment -= extraForThisBucket;
  }
  
  bucketPayment = round2dp(bucketPayment);
  
  // Calculate principal payment
  const principalPayment = round2dp(Math.max(0, bucketPayment - bucket.interest));
  
  console.log(`\n${bucket.name} (priority ${bucket.paymentPriority}):`);
  console.log('  Payment:', bucketPayment);
  console.log('  Interest:', bucket.interest);
  console.log('  Principal:', principalPayment);
  console.log('  Remaining extra after:', remainingExtraPayment);
}

console.log('\nExpected:');
console.log('b1: interest: 11.63, payment: 111.63, principal: 100.00');
console.log('b2: interest: 19.08, payment: 69.08, principal: 50.00');
console.log('b3: interest: 0.00, payment: 19.29, principal: 19.29');