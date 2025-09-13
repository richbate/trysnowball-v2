// Debug the new CP-4 implementation

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

// Simulate the new applyPaymentToBuckets logic
const buckets = [
  { id: 'b1', name: 'Cash Advances', currentBalance: 500, apr: 27.9, paymentPriority: 1, isPaidOff: false },
  { id: 'b2', name: 'Purchases', currentBalance: 1000, apr: 22.9, paymentPriority: 2, isPaidOff: false },
  { id: 'b3', name: 'Balance Transfer', currentBalance: 1500, apr: 0.0, paymentPriority: 3, isPaidOff: false }
];

const minPayment = 100;
const extraPayment = 100;
const snowballPool = 0;

console.log('=== CP-4 New Algorithm Debug ===');
console.log('Min payment:', minPayment);
console.log('Extra payment:', extraPayment);
console.log('Snowball pool:', snowballPool);

// Step 0: Setup
const totalBalance = buckets.reduce((sum, b) => sum + b.currentBalance, 0);
let poolThisMonth = extraPayment + snowballPool;
console.log('Total balance:', totalBalance);
console.log('Pool this month:', poolThisMonth);

// Step 1: Calculate interest for all buckets
const bucketData = buckets.map(bucket => ({
  ...bucket,
  interestThisMonth: bucket.isPaidOff ? 0 : round2dp(bucket.currentBalance * bucket.apr / 100 / 12),
  paymentShare: 0,
  interestPaid: 0,
  principalPaid: 0,
  totalPaid: 0
}));

console.log('\n=== Step 1: Interest Calculation ===');
bucketData.forEach(bucket => {
  console.log(`${bucket.name}: interest = ${bucket.interestThisMonth}`);
});

// Step 2: Proportional minimum payment allocation
bucketData.forEach(bucket => {
  if (bucket.isPaidOff) {
    bucket.paymentShare = 0;
  } else {
    const proportion = totalBalance > 0 ? bucket.currentBalance / totalBalance : 0;
    bucket.paymentShare = round2dp(minPayment * proportion);
  }
});

console.log('\n=== Step 2: Proportional Min Payment ===');
bucketData.forEach(bucket => {
  console.log(`${bucket.name}: paymentShare = ${bucket.paymentShare}`);
});

// Step 3: Apply min payments (interest first, then principal)
const sortedBuckets = [...bucketData].sort((a, b) => a.paymentPriority - b.paymentPriority);

console.log('\n=== Step 3: Apply Min Payments ===');
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
  console.log(`  Principal paid: ${bucket.principalPaid}`);
  console.log(`  Total paid: ${bucket.totalPaid}`);
  console.log(`  New balance: ${bucket.currentBalance}`);
}

// Step 4: Apply extra/snowball pool
console.log('\n=== Step 4: Apply Extra/Snowball Pool ===');
if (poolThisMonth > 0) {
  const target = sortedBuckets.find(bucket => !bucket.isPaidOff && bucket.currentBalance > 0);
  
  if (target) {
    console.log(`Target bucket: ${target.name}`);
    console.log(`Target balance before extra: ${target.currentBalance}`);
    
    const appliedExtra = Math.min(poolThisMonth, target.currentBalance);
    target.principalPaid += round2dp(appliedExtra);
    target.totalPaid += round2dp(appliedExtra);
    target.currentBalance = round2dp(target.currentBalance - appliedExtra);
    
    console.log(`Applied extra: ${appliedExtra}`);
    console.log(`Target total principal: ${target.principalPaid}`);
    console.log(`Target total payment: ${target.totalPaid}`);
    console.log(`Target new balance: ${target.currentBalance}`);
  }
}

console.log('\n=== Final Results ===');
bucketData.forEach(bucket => {
  console.log(`${bucket.name}:`);
  console.log(`  Interest: ${bucket.interestPaid}`);
  console.log(`  Principal: ${bucket.principalPaid}`);
  console.log(`  Payment: ${bucket.totalPaid}`);
  console.log(`  Balance: ${bucket.currentBalance}`);
});

console.log('\n=== Expected (from fixture) ===');
console.log('b1: interest: 11.63, payment: 111.63, principal: 100.00, balance: 400.00');
console.log('b2: interest: 19.08, payment: 69.08, principal: 50.00, balance: 950.00');  
console.log('b3: interest: 0.00, payment: 19.29, principal: 19.29, balance: 1480.71');