// Check if different rounding/precision is causing the issue

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

function parseFloatFixed2(value) {
  return parseFloat(value.toFixed(2));
}

console.log('=== Interest Precision Testing ===');

// Test different rounding methods for b1 interest
const b1_balance = 500;
const b1_apr = 27.9;
const monthlyRate = b1_apr / 100 / 12;

console.log(`Monthly rate: ${monthlyRate}`);
console.log(`Raw interest: ${b1_balance * monthlyRate}`);

const roundMath = round2dp(b1_balance * monthlyRate);
const roundFixed = parseFloatFixed2(b1_balance * monthlyRate);
const roundToFixed2 = parseFloat((b1_balance * monthlyRate).toFixed(2));

console.log(`Math.round method: ${roundMath}`);
console.log(`parseFloat.toFixed method: ${roundFixed}`);
console.log(`toFixed2 method: ${roundToFixed2}`);
console.log(`Expected: 11.63`);

// Try different calculation approaches
console.log('\n=== Different Calculation Approaches ===');

// Approach 1: toFixed(2) everywhere like original fixtures might use
const b1_interest_fixed = parseFloat((b1_balance * monthlyRate).toFixed(2));
const b2_interest_fixed = parseFloat((1000 * 22.9 / 100 / 12).toFixed(2));
const b3_interest_fixed = parseFloat((1500 * 0 / 100 / 12).toFixed(2));

console.log(`Using toFixed(2):`);
console.log(`b1: ${b1_interest_fixed}`);
console.log(`b2: ${b2_interest_fixed}`);
console.log(`b3: ${b3_interest_fixed}`);
console.log(`Total: ${b1_interest_fixed + b2_interest_fixed + b3_interest_fixed}`);

if (b1_interest_fixed === 11.63) {
  console.log('✓ Found the right rounding method!');
  
  // Now test the algorithm with correct rounding
  console.log('\n=== Testing Algorithm with toFixed(2) Rounding ===');
  
  const totalInterest = b1_interest_fixed + b2_interest_fixed + b3_interest_fixed;
  const minPayment = 100;
  const extraPayment = 100;
  
  console.log(`Total interest: ${totalInterest}`);
  
  // Test if remaining min principal is distributed differently
  const remainingPrincipal = minPayment - totalInterest;
  console.log(`Remaining min principal: ${remainingPrincipal}`);
  
  // What if the ENTIRE min payment (not just the remaining) is distributed proportionally?
  console.log('\n=== What if ENTIRE min payment distributed proportionally? ===');
  const totalBalance = 500 + 1000 + 1500;
  
  const b1_prop = 500 / totalBalance;
  const b2_prop = 1000 / totalBalance; 
  const b3_prop = 1500 / totalBalance;
  
  const b1_min_share = parseFloat((minPayment * b1_prop).toFixed(2));
  const b2_min_share = parseFloat((minPayment * b2_prop).toFixed(2));
  const b3_min_share = parseFloat((minPayment * b3_prop).toFixed(2));
  
  console.log(`Proportional min shares: b1=${b1_min_share}, b2=${b2_min_share}, b3=${b3_min_share}`);
  
  // Apply locally
  const b1_principal_from_min = b1_min_share - b1_interest_fixed;
  const b2_principal_from_min = b2_min_share - b2_interest_fixed;
  const b3_principal_from_min = b3_min_share - b3_interest_fixed;
  
  console.log(`Principal from min: b1=${b1_principal_from_min}, b2=${b2_principal_from_min}, b3=${b3_principal_from_min}`);
  
  // Add extra to b1
  const b1_total_principal = b1_principal_from_min + extraPayment;
  
  console.log(`With extra: b1=${b1_total_principal}, b2=${b2_principal_from_min}, b3=${b3_principal_from_min}`);
  console.log(`Expected:   b1=100, b2=50, b3=19.29`);
  
  // Check if this matches
  if (Math.abs(b1_total_principal - 100) < 0.01 && 
      Math.abs(b2_principal_from_min - 50) < 0.01 && 
      Math.abs(b3_principal_from_min - 19.29) < 0.01) {
    console.log('✓ ALGORITHM FOUND!');
  } else {
    console.log('✗ Still not matching');
  }
  
  // Check total payments
  const b1_payment = b1_interest_fixed + b1_total_principal;
  const b2_payment = b2_interest_fixed + b2_principal_from_min;
  const b3_payment = b3_interest_fixed + b3_principal_from_min;
  
  console.log(`Total payments: b1=${b1_payment}, b2=${b2_payment}, b3=${b3_payment}`);
  console.log(`Expected:       b1=111.63, b2=69.08, b3=19.29`);
}