// Analyze the fixture expectations to reverse engineer the algorithm

const expected = {
  b1: { interest: 11.63, payment: 111.63, principal: 100.00, balance: 400.00 },
  b2: { interest: 19.08, payment: 69.08, principal: 50.00, balance: 950.00 },
  b3: { interest: 0.00, payment: 19.29, principal: 19.29, balance: 1480.71 }
};

const totalExpectedPayment = 111.63 + 69.08 + 19.29;
const totalExpectedInterest = 11.63 + 19.08 + 0.00;  
const totalExpectedPrincipal = 100.00 + 50.00 + 19.29;

console.log('=== Fixture Analysis ===');
console.log('Total payment:', totalExpectedPayment);
console.log('Total interest:', totalExpectedInterest);
console.log('Total principal:', totalExpectedPrincipal);
console.log('Available payment: 200 (100 min + 100 extra)');
console.log('Available after interest:', 200 - totalExpectedInterest);

// Analysis: If we have 200 total payment and 30.71 interest
// That leaves 169.29 for principal
// But the fixture shows: 100 + 50 + 19.29 = 169.29 ✓

// Let's see the pattern:
console.log('\n=== Pattern Analysis ===');
console.log('b1 gets 100 principal (which happens to be the extra payment amount!)');
console.log('b2 gets 50 principal');  
console.log('b3 gets 19.29 principal');

// Maybe the logic is:
// 1. All extra (100) goes to b1 as principal
// 2. Remaining payment (100 - 30.71 interest) = 69.29 gets distributed?
// But 50 + 19.29 = 69.29 ✓

console.log('\n=== Hypothesis Test ===');
console.log('If 100 extra goes entirely to b1:');
console.log('  b1: gets 100 principal + 11.63 interest = 111.63 payment ✓');
console.log('  Remaining min payment: 100 - 30.71 interest = 69.29 principal left');
console.log('  This 69.29 needs to split as: b2=50, b3=19.29');

// Check if 50:19.29 is proportional to balances 1000:1500
const b2Share = 1000 / (1000 + 1500);
const b3Share = 1500 / (1000 + 1500);
console.log('  b2 proportion:', b2Share, '→', 69.29 * b2Share, '(expected 50)');
console.log('  b3 proportion:', b3Share, '→', 69.29 * b3Share, '(expected 19.29)');

// That doesn't match either! Let me check if it's minimum coverage
console.log('\n=== Maybe it\'s a different rule? ===');
console.log('Could it be: pay minimum required for each bucket, then extra to priority 1?');
console.log('But that would require knowing what "minimum required" means for each bucket...');

// Actually, let me check if the fixture has an error or if I misunderstood something
const startBalances = { b1: 500, b2: 1000, b3: 1500 };
console.log('\n=== End Balance Check ===');
Object.keys(expected).forEach(bid => {
  const start = startBalances[bid];
  const interest = expected[bid].interest;
  const principal = expected[bid].principal;
  const endBalance = start + interest - (interest + principal);
  console.log(`${bid}: ${start} + ${interest} - ${interest + principal} = ${endBalance} (expected: ${expected[bid].balance})`);
});