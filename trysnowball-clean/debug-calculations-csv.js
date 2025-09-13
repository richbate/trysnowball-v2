// Generate detailed CSV of all calculations to debug the mismatch

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

const buckets = [
  { id: 'b1', name: 'Cash Advances', currentBalance: 500, apr: 27.9, paymentPriority: 1 },
  { id: 'b2', name: 'Purchases', currentBalance: 1000, apr: 22.9, paymentPriority: 2 },
  { id: 'b3', name: 'Balance Transfer', currentBalance: 1500, apr: 0.0, paymentPriority: 3 }
];

const minPayment = 100;
const extraPayment = 100;
const totalBalance = 3000;

console.log('bucket_id,bucket_name,start_balance,apr,priority,monthly_interest_rate,raw_interest,rounded_interest,proportion,raw_min_share,rounded_min_share,interest_covered,principal_from_min,balance_after_min,extra_applied,total_principal,total_payment,final_balance,expected_payment,expected_principal,expected_balance');

buckets.forEach(bucket => {
  // Step 1: Interest calculation
  const monthlyRate = bucket.apr / 100 / 12;
  const rawInterest = bucket.currentBalance * monthlyRate;
  const roundedInterest = round2dp(rawInterest);
  
  // Step 2: Proportional minimum allocation
  const proportion = bucket.currentBalance / totalBalance;
  const rawMinShare = minPayment * proportion;
  const roundedMinShare = round2dp(rawMinShare);
  
  // Step 3: Apply min share to interest/principal
  const interestCovered = Math.min(roundedMinShare, roundedInterest);
  const principalFromMin = Math.max(0, roundedMinShare - roundedInterest);
  const balanceAfterMin = round2dp(bucket.currentBalance + roundedInterest - roundedMinShare);
  
  // Step 4: Apply extra (only to b1)
  const extraApplied = (bucket.id === 'b1') ? extraPayment : 0;
  const totalPrincipal = principalFromMin + extraApplied;
  const totalPayment = roundedInterest + totalPrincipal;
  const finalBalance = round2dp(bucket.currentBalance + roundedInterest - totalPayment);
  
  // Expected values from fixture
  const expected = {
    'b1': { payment: 111.63, principal: 100.00, balance: 400.00 },
    'b2': { payment: 69.08, principal: 50.00, balance: 950.00 },
    'b3': { payment: 19.29, principal: 19.29, balance: 1480.71 }
  };
  
  const exp = expected[bucket.id];
  
  console.log([
    bucket.id,
    bucket.name,
    bucket.currentBalance,
    bucket.apr,
    bucket.paymentPriority,
    monthlyRate.toFixed(6),
    rawInterest.toFixed(6),
    roundedInterest,
    proportion.toFixed(6),
    rawMinShare.toFixed(6),
    roundedMinShare,
    interestCovered,
    principalFromMin,
    balanceAfterMin,
    extraApplied,
    totalPrincipal,
    totalPayment,
    finalBalance,
    exp.payment,
    exp.principal,
    exp.balance
  ].join(','));
});

console.log('\n=== Summary Comparison ===');
console.log('Metric,My_b1,My_b2,My_b3,Expected_b1,Expected_b2,Expected_b3,Total_Mine,Total_Expected');

// Calculate totals
let myTotalPayment = 0, myTotalPrincipal = 0, myTotalBalance = 0;
let expTotalPayment = 0, expTotalPrincipal = 0, expTotalBalance = 0;

const myResults = [];
const expResults = [];

buckets.forEach(bucket => {
  const monthlyRate = bucket.apr / 100 / 12;
  const roundedInterest = round2dp(bucket.currentBalance * monthlyRate);
  const proportion = bucket.currentBalance / totalBalance;
  const roundedMinShare = round2dp(minPayment * proportion);
  const principalFromMin = Math.max(0, roundedMinShare - roundedInterest);
  const extraApplied = (bucket.id === 'b1') ? extraPayment : 0;
  const totalPrincipal = principalFromMin + extraApplied;
  const totalPayment = roundedInterest + totalPrincipal;
  const finalBalance = round2dp(bucket.currentBalance + roundedInterest - totalPayment);
  
  myResults.push({ payment: totalPayment, principal: totalPrincipal, balance: finalBalance });
  myTotalPayment += totalPayment;
  myTotalPrincipal += totalPrincipal;
  myTotalBalance += finalBalance;
});

const expected = [
  { payment: 111.63, principal: 100.00, balance: 400.00 },
  { payment: 69.08, principal: 50.00, balance: 950.00 },
  { payment: 19.29, principal: 19.29, balance: 1480.71 }
];

expected.forEach(exp => {
  expTotalPayment += exp.payment;
  expTotalPrincipal += exp.principal; 
  expTotalBalance += exp.balance;
});

console.log(`Payment,${myResults[0].payment},${myResults[1].payment},${myResults[2].payment},${expected[0].payment},${expected[1].payment},${expected[2].payment},${myTotalPayment.toFixed(2)},${expTotalPayment.toFixed(2)}`);
console.log(`Principal,${myResults[0].principal},${myResults[1].principal},${myResults[2].principal},${expected[0].principal},${expected[1].principal},${expected[2].principal},${myTotalPrincipal.toFixed(2)},${expTotalPrincipal.toFixed(2)}`);
console.log(`Balance,${myResults[0].balance},${myResults[1].balance},${myResults[2].balance},${expected[0].balance},${expected[1].balance},${expected[2].balance},${myTotalBalance.toFixed(2)},${expTotalBalance.toFixed(2)}`);

console.log('\n=== Key Differences ===');
console.log('- My proportional shares: 16.67, 33.33, 50.00');
console.log('- But fixture shows very different payment distribution');
console.log('- b2 gets 69.08 payment (vs my 33.33) - that\'s +35.75');  
console.log('- b3 gets 19.29 payment (vs my 50.00) - that\'s -30.71');
console.log('- The difference (35.75 - 30.71 = 5.04) roughly matches b1\'s overage');
console.log('- This suggests the fixture uses a DIFFERENT algorithm than proportional allocation');