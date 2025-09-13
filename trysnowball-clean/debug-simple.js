// Simple payment allocation debug

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Test the bucket payment allocation
const buckets = [
  { id: 'b1', name: 'Cash Advances', currentBalance: 500, apr: 27.9, paymentPriority: 1, isPaidOff: false },
  { id: 'b2', name: 'Purchases', currentBalance: 1000, apr: 22.9, paymentPriority: 2, isPaidOff: false },
  { id: 'b3', name: 'Balance Transfer', currentBalance: 1500, apr: 0.0, paymentPriority: 3, isPaidOff: false }
];

const availablePayment = 200; // min 100 + extra 100
let remainingPayment = availablePayment;

console.log('Available payment:', availablePayment);

// Sort by payment priority (1 = highest priority)
const sortedBuckets = [...buckets].sort((a, b) => a.paymentPriority - b.paymentPriority);

for (const bucket of sortedBuckets) {
  // Calculate monthly interest
  const interestCharge = round2dp(bucket.currentBalance * bucket.apr / 100 / 12);
  
  // Determine payment for this bucket
  let bucketPayment = Math.min(remainingPayment, bucket.currentBalance + interestCharge);
  bucketPayment = round2dp(bucketPayment);
  
  // Calculate principal payment
  const principalPayment = round2dp(Math.max(0, bucketPayment - interestCharge));
  
  console.log(`\nBucket ${bucket.id} (${bucket.name}):`);
  console.log('  Interest:', interestCharge);
  console.log('  Payment:', bucketPayment);
  console.log('  Principal:', principalPayment);
  console.log('  Balance before payment:', bucket.currentBalance);
  console.log('  Remaining payment after this bucket:', remainingPayment - bucketPayment);
  
  remainingPayment -= bucketPayment;
  if (remainingPayment <= 0) break;
}