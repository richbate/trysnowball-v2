// Test the corrected rounding discipline

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const buckets = [
  { id: 'b1', name: 'Cash Advances', currentBalance: 500, apr: 27.9, paymentPriority: 1, isPaidOff: false },
  { id: 'b2', name: 'Purchases', currentBalance: 1000, apr: 22.9, paymentPriority: 2, isPaidOff: false },
  { id: 'b3', name: 'Balance Transfer', currentBalance: 1500, apr: 0.0, paymentPriority: 3, isPaidOff: false }
];

const minPayment = 100;
const extraPayment = 100;

console.log('=== CP-4 Corrected Rounding Discipline ===');

// Step 1: Calculate interest
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interestThisMonth: round2dp(bucket.currentBalance * bucket.apr / 100 / 12),
  paymentShare: 0,
  interestPaid: 0,
  principalPaid: 0,
  totalPaid: 0
}));

const totalBalance = buckets.reduce((sum, b) => sum + b.currentBalance, 0);

console.log('Total balance:', totalBalance);
bucketData.forEach(bucket => {
  console.log(`${bucket.name}: interest = ${bucket.interestThisMonth}`);
});

// Step 2: Proportional minimum payment allocation (must sum to exactly minPayment)
let allocatedShares = 0;
const activeBuckets = bucketData.filter(b => !b.isPaidOff);

activeBuckets.forEach((bucket, index) => {
  if (index === activeBuckets.length - 1) {
    // Last active bucket gets the remainder to ensure exact sum
    bucket.paymentShare = round2dp(minPayment - allocatedShares);
  } else {
    const proportion = totalBalance > 0 ? bucket.currentBalance / totalBalance : 0;
    bucket.paymentShare = round2dp(minPayment * proportion);
    allocatedShares += bucket.paymentShare;
  }
});

console.log('\n=== Proportional Allocation (corrected) ===');
let totalShares = 0;
bucketData.forEach(bucket => {
  console.log(`${bucket.name}: paymentShare = ${bucket.paymentShare}`);
  totalShares += bucket.paymentShare;
});
console.log('Total shares:', totalShares, '(should be exactly 100.00)');

// Step 3: Apply min payments (interest first, then principal)
const sortedBuckets = [...bucketData].sort((a, b) => a.paymentPriority - b.paymentPriority);

console.log('\n=== Apply Min Payments ===');
for (const bucket of sortedBuckets) {
  if (bucket.isPaidOff) continue;
  
  const interest = bucket.interestThisMonth;
  const pay = bucket.paymentShare;
  const appliedInterest = Math.min(pay, interest);
  const appliedPrincipal = Math.max(0, pay - interest);
  
  bucket.interestPaid = round2dp(appliedInterest);
  bucket.principalPaid = round2dp(appliedPrincipal);
  bucket.totalPaid = round2dp(appliedInterest + appliedPrincipal);
  bucket.currentBalance = round2dp(bucket.currentBalance + interest - bucket.totalPaid);
  
  console.log(`${bucket.name}:`);
  console.log(`  Interest paid: ${bucket.interestPaid}`);
  console.log(`  Principal paid (from min): ${bucket.principalPaid}`);
  console.log(`  Total paid: ${bucket.totalPaid}`);
  console.log(`  New balance: ${bucket.currentBalance}`);
}

// Step 4: Apply extra payment (100) to highest priority bucket
console.log('\n=== Apply Extra Payment ===');
const target = sortedBuckets.find(bucket => !bucket.isPaidOff && bucket.currentBalance > 0);

if (target) {
  console.log(`Target: ${target.name}`);
  console.log(`Balance before extra: ${target.currentBalance}`);
  
  const appliedExtra = Math.min(extraPayment, target.currentBalance);
  target.principalPaid += round2dp(appliedExtra);
  target.totalPaid += round2dp(appliedExtra);
  target.currentBalance = round2dp(target.currentBalance - appliedExtra);
  
  console.log(`Applied extra: ${appliedExtra}`);
  console.log(`Total principal now: ${target.principalPaid}`);
  console.log(`Total payment now: ${target.totalPaid}`);
  console.log(`Final balance: ${target.currentBalance}`);
}

console.log('\n=== Final Results ===');
bucketData.forEach(bucket => {
  console.log(`${bucket.name}:`);
  console.log(`  Interest: ${bucket.interestPaid}`);
  console.log(`  Principal: ${bucket.principalPaid}`);
  console.log(`  Payment: ${bucket.totalPaid}`);
  console.log(`  Balance: ${bucket.currentBalance}`);
});

console.log('\n=== Expected from Fixture ===');
console.log('b1: interest: 11.63, payment: 111.63, principal: 100.00, balance: 400.00');
console.log('b2: interest: 19.08, payment: 69.08, principal: 50.00, balance: 950.00');
console.log('b3: interest: 0.00, payment: 19.29, principal: 19.29, balance: 1480.71');