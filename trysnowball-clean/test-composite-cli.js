#!/usr/bin/env node

/**
 * CLI Test Script for Composite Bucket Engine
 * Run: node test-composite-cli.js
 * Tests the engine logic in isolation before UI integration
 */

// Mock the imports for Node.js environment
const hasMultiAPRBuckets = (debt) => !!(debt.buckets && debt.buckets.length > 0);

// Import simulation logic (simplified for CLI)
function simulateCompositePlan(debts, extraPerMonth = 0) {
  
  const compositeDebts = debts
    .filter(debt => hasMultiAPRBuckets(debt))
    .sort((a, b) => a.order_index - b.order_index);
  
  if (compositeDebts.length === 0) {
    return [];
  }
  
  let workingDebts = compositeDebts.map(debt => ({
    ...debt,
    currentBalance: debt.amount,
    isPaidOff: false,
    simulationBuckets: debt.buckets.map(bucket => ({
      ...bucket,
      currentBalance: bucket.balance,
      isPaidOff: false
    }))
  }));
  
  const results = [];
  let month = 1;
  let snowballPool = 0;
  
  while (workingDebts.some(debt => !debt.isPaidOff) && month <= 50) {
    
    for (const debt of workingDebts) {
      if (debt.isPaidOff) continue;
      
      const monthResult = simulateCompositeDebtMonth(
        debt,
        extraPerMonth, // Apply extra payment from month 1
        debt === workingDebts[0] ? snowballPool : 0,
        month
      );
      
      results.push(monthResult);
      
      debt.currentBalance = monthResult.totalEndingBalance;
      debt.isPaidOff = monthResult.isPaidOff;
      
      if (monthResult.isPaidOff) {
        snowballPool += debt.min_payment;
      }
      
      monthResult.buckets.forEach((bucketResult, index) => {
        if (debt.simulationBuckets && debt.simulationBuckets[index]) {
          debt.simulationBuckets[index].currentBalance = bucketResult.endingBalance;
          debt.simulationBuckets[index].isPaidOff = bucketResult.isPaidOff;
        }
      });
    }
    
    month++;
  }
  
  return results;
}

function simulateCompositeDebtMonth(debt, extraPayment, snowballPool, monthNumber) {
  
  if (!debt.simulationBuckets || debt.simulationBuckets.length === 0) {
    throw new Error(`Composite debt ${debt.id} has no buckets`);
  }
  
  const bucketResults = [];
  
  // STEP 1: Calculate interest
  debt.simulationBuckets.forEach(bucket => {
    const monthlyRate = bucket.apr / 100 / 12;
    const interestCharged = Math.round(bucket.currentBalance * monthlyRate * 100) / 100;
    
    bucketResults.push({
      id: bucket.id,
      name: bucket.name,
      startingBalance: bucket.currentBalance,
      interestCharged,
      minimumPayment: 0,
      snowballPayment: 0,
      totalPayment: 0,
      endingBalance: bucket.currentBalance + interestCharged,
      isPaidOff: false,
      apr: bucket.apr,
      priority: bucket.payment_priority
    });
  });
  
  // STEP 2: Allocate minimum payment
  const totalBalance = debt.currentBalance;
  const totalMinimum = debt.min_payment;
  
  bucketResults.forEach(bucketResult => {
    if (totalBalance > 0) {
      const bucketWeight = bucketResult.startingBalance / totalBalance;
      bucketResult.minimumPayment = Math.round(totalMinimum * bucketWeight * 100) / 100;
    }
  });
  
  // STEP 3: Apply minimum payments
  bucketResults.forEach(bucketResult => {
    const availableForPayment = bucketResult.endingBalance;
    const actualMinPayment = Math.min(bucketResult.minimumPayment, availableForPayment);
    
    bucketResult.minimumPayment = actualMinPayment;
    bucketResult.totalPayment = actualMinPayment;
    bucketResult.endingBalance -= actualMinPayment;
    bucketResult.endingBalance = Math.round(bucketResult.endingBalance * 100) / 100;
    bucketResult.isPaidOff = bucketResult.endingBalance <= 0.01;
  });
  
  // STEP 4: Apply snowball
  const totalExtraAvailable = extraPayment + snowballPool;
  
  if (totalExtraAvailable > 0) {
    const sortedBuckets = [...bucketResults]
      .filter(bucket => !bucket.isPaidOff)
      .sort((a, b) => a.priority - b.priority);
    
    if (sortedBuckets.length > 0) {
      const targetBucket = sortedBuckets[0];
      const maxSnowball = Math.min(totalExtraAvailable, targetBucket.endingBalance);
      
      targetBucket.snowballPayment = maxSnowball;
      targetBucket.totalPayment += maxSnowball;
      targetBucket.endingBalance -= maxSnowball;
      targetBucket.endingBalance = Math.round(targetBucket.endingBalance * 100) / 100;
      targetBucket.isPaidOff = targetBucket.endingBalance <= 0.01;
    }
  }
  
  // Calculate totals
  const totalStartingBalance = bucketResults.reduce((sum, b) => sum + b.startingBalance, 0);
  const totalInterest = bucketResults.reduce((sum, b) => sum + b.interestCharged, 0);
  const totalMinimumPayment = bucketResults.reduce((sum, b) => sum + b.minimumPayment, 0);
  const totalSnowballPayment = bucketResults.reduce((sum, b) => sum + b.snowballPayment, 0);
  const totalEndingBalance = bucketResults.reduce((sum, b) => sum + b.endingBalance, 0);
  const isPaidOff = bucketResults.every(b => b.isPaidOff);
  
  return {
    month: monthNumber,
    debtId: debt.id,
    debtName: debt.name,
    buckets: bucketResults,
    totalStartingBalance,
    totalInterest,
    totalMinimumPayment,
    totalSnowballPayment,
    totalEndingBalance,
    isPaidOff
  };
}

// Test Data: Barclaycard Platinum
const barclaycardTest = {
  id: 'barclaycard_test',
  user_id: 'test_user',
  name: 'Barclaycard Platinum',
  amount: 3000,
  apr: 18.6,
  min_payment: 75,
  order_index: 1,
  buckets: [
    {
      id: 'purchases',
      name: 'Purchases',
      balance: 2000,
      apr: 22.9,
      payment_priority: 2,
    },
    {
      id: 'cash_advances', 
      name: 'Cash Advances',
      balance: 500,
      apr: 27.9,
      payment_priority: 1,
    },
    {
      id: 'balance_transfer',
      name: 'Balance Transfer', 
      balance: 500,
      apr: 0,
      payment_priority: 3,
    }
  ]
};

// Run Test
console.log('🧪 Testing Composite Bucket Engine');
console.log('=====================================');

const results = simulateCompositePlan([barclaycardTest], 100);

if (results.length === 0) {
  console.log('❌ No results generated');
  process.exit(1);
}

// Test Month 1 Results
const month1 = results[0];
console.log('\n📊 MONTH 1 RESULTS:');
console.log('Total Interest:', month1.totalInterest);
console.log('Total Minimum Payment:', month1.totalMinimumPayment);
console.log('Total Snowball Payment:', month1.totalSnowballPayment);
console.log('Total Ending Balance:', month1.totalEndingBalance);

console.log('\n🗂️ BUCKET BREAKDOWN:');
month1.buckets.forEach(bucket => {
  console.log(`${bucket.name} (Priority ${bucket.priority}):`);
  console.log(`  Starting: £${bucket.startingBalance}`);
  console.log(`  Interest: £${bucket.interestCharged}`);
  console.log(`  Minimum: £${bucket.minimumPayment}`);
  console.log(`  Snowball: £${bucket.snowballPayment}`);
  console.log(`  Ending: £${bucket.endingBalance}`);
  console.log(`  Paid Off: ${bucket.isPaidOff}`);
  console.log('');
});

// Validate Golden Test Expectations
console.log('🎯 GOLDEN TEST VALIDATION:');

// Expected Month 1 Interest: £49.80
const expectedInterest = 49.80;
const actualInterest = month1.totalInterest;
const interestMatch = Math.abs(actualInterest - expectedInterest) < 0.50;
console.log(`Interest: Expected £${expectedInterest}, Got £${actualInterest} ${interestMatch ? '✅' : '❌'}`);

// Expected Cash Advance Snowball: £100
const cashAdvanceBucket = month1.buckets.find(b => b.name === 'Cash Advances');
const expectedCashSnowball = 100;
const actualCashSnowball = cashAdvanceBucket ? cashAdvanceBucket.snowballPayment : 0;
const snowballMatch = actualCashSnowball === expectedCashSnowball;
console.log(`Cash Advance Snowball: Expected £${expectedCashSnowball}, Got £${actualCashSnowball} ${snowballMatch ? '✅' : '❌'}`);

// Expected No Snowball to Balance Transfer
const balanceTransferBucket = month1.buckets.find(b => b.name === 'Balance Transfer');
const expectedBTSnowball = 0;
const actualBTSnowball = balanceTransferBucket ? balanceTransferBucket.snowballPayment : 0;
const btMatch = actualBTSnowball === expectedBTSnowball;
console.log(`Balance Transfer Snowball: Expected £${expectedBTSnowball}, Got £${actualBTSnowball} ${btMatch ? '✅' : '❌'}`);

// Overall Test Result
const allTestsPass = interestMatch && snowballMatch && btMatch;
console.log(`\n🏆 OVERALL RESULT: ${allTestsPass ? '✅ PASS' : '❌ FAIL'}`);

if (!allTestsPass) {
  console.log('\n💥 Engine has bugs - needs fixing before UI integration');
  process.exit(1);
} else {
  console.log('\n🎉 Engine logic looks correct - ready for UI integration');
  process.exit(0);
}