/**
 * Balance Transfer Scenario Calculator
 * Generates payoff timelines for balance transfer options
 */

/**
 * Calculate balance transfer scenario payoff timelines
 * @param {Object} params - Balance transfer parameters
 * @param {Array} params.debts - Current debts with high APR
 * @param {number} params.monthlyPaymentCapacity - User's monthly payment capacity
 * @param {Object} params.optionA - 0% promotional offer details
 * @param {Object} params.optionB - Low APR option details
 * @returns {Object} Scenario data for timeline chart
 */
export function calculateBalanceTransferScenarios({
 debts,
 monthlyPaymentCapacity,
 optionA = null, // { promoMonths: 18, transferFee: 0.03, postPromoAPR: 0.25 }
 optionB = null // { apr: 0.08, transferFee: 0 }
}) {
 const scenarios = {};
 
 if (!debts || debts.length === 0 || !monthlyPaymentCapacity) {
  return null;
 }

 const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount_pennies || debt.amount || 0), 0);
 
 // Option A: 0% promotional period with fee and cliff
 if (optionA) {
  const transferFee = totalDebt * optionA.transferFee;
  const totalWithFee = totalDebt + transferFee;
  
  scenarios.optionA = calculatePromoScenario({
   totalDebt: totalWithFee,
   monthlyPayment: monthlyPaymentCapacity,
   promoMonths: optionA.promoMonths,
   promoAPR: 0,
   postPromoAPR: optionA.postPromoAPR,
   upfrontFee: transferFee
  });
  
  scenarios.promoEndMonth = optionA.promoMonths;
  scenarios.upfrontFee = transferFee;
 }
 
 // Option B: Low APR throughout
 if (optionB) {
  scenarios.optionB = calculateLowAPRScenario({
   totalDebt: totalDebt + (totalDebt * (optionB.transferFee || 0)),
   monthlyPayment: monthlyPaymentCapacity,
   apr: optionB.apr
  });
 }

 return scenarios;
}

/**
 * Calculate promotional balance transfer scenario (0% then higher APR)
 */
function calculatePromoScenario({ totalDebt, monthlyPayment, promoMonths, promoAPR, postPromoAPR, upfrontFee }) {
 const timeline = [];
 let balance = totalDebt;
 const monthlyPromoRate = promoAPR / 12;
 const monthlyPostPromoRate = postPromoAPR / 12;
 
 // Helper to calculate minimum payment (max of £5 or 2% of balance)
 const minPayment = (balance) => Math.max(5, Math.ceil(balance * 0.02));
 
 // Helper to round to pennies
 const toPence = n => Math.round(n * 100);
 const fromPence = p => p / 100;
 
 for (let month = 1; month <= 60 && balance > 0.01; month++) {
  const isPromoPhase = month <= promoMonths;
  const monthlyRate = isPromoPhase ? monthlyPromoRate : monthlyPostPromoRate;
  
  // Calculate interest for the month
  let interestPayment = balance * monthlyRate;
  
  // Ensure minimum payment during promo period
  let actualPayment = monthlyPayment;
  if (isPromoPhase) {
   actualPayment = Math.max(actualPayment, minPayment(balance));
  }
  
  // Principal payment is monthly payment minus interest
  let principalPayment = Math.max(0, actualPayment - interestPayment);
  
  // Update balance and round to pennies
  balance = Math.max(0, balance - principalPayment);
  balance = fromPence(toPence(balance));
  interestPayment = fromPence(toPence(interestPayment));
  principalPayment = fromPence(toPence(principalPayment));
  
  timeline.push({
   month,
   balance,
   isPromoPhase,
   interestPayment,
   principalPayment,
   actualPayment
  });
  
  if (balance <= 0.01) break;
 }
 
 return timeline;
}

/**
 * Calculate low APR scenario (consistent rate throughout)
 */
function calculateLowAPRScenario({ totalDebt, monthlyPayment, apr }) {
 const timeline = [];
 let balance = totalDebt;
 const monthlyRate = apr / 12;
 
 // Helper to calculate minimum payment (max of £5 or 2% of balance)
 const minPayment = (balance) => Math.max(5, Math.ceil(balance * 0.02));
 
 // Helper to round to pennies
 const toPence = n => Math.round(n * 100);
 const fromPence = p => p / 100;
 
 for (let month = 1; month <= 60 && balance > 0.01; month++) {
  let interestPayment = balance * monthlyRate;
  
  // Ensure minimum payment
  const actualPayment = Math.max(monthlyPayment, minPayment(balance));
  let principalPayment = Math.max(0, actualPayment - interestPayment);
  
  // Update balance and round to pennies
  balance = Math.max(0, balance - principalPayment);
  balance = fromPence(toPence(balance));
  interestPayment = fromPence(toPence(interestPayment));
  principalPayment = fromPence(toPence(principalPayment));
  
  timeline.push({
   month,
   balance,
   interestPayment,
   principalPayment,
   actualPayment
  });
  
  if (balance <= 0.01) break;
 }
 
 return timeline;
}

/**
 * Merge balance transfer scenario data with existing timeline data
 * @param {Array} baselineData - Existing timeline data (minimumOnly, snowball)
 * @param {Object} scenarios - Balance transfer scenarios
 * @returns {Array} Enhanced timeline data with balance transfer scenarios
 */
export function mergeBalanceTransferData(baselineData, scenarios) {
 if (!scenarios || !baselineData) return baselineData;
 
 return baselineData.map(dataPoint => {
  const enhanced = { ...dataPoint };
  
  // Add Option A data (0% promo)
  if (scenarios.optionA) {
   const optionAPoint = scenarios.optionA.find(p => p.month === dataPoint.month);
   enhanced.balanceTransferOptionA = optionAPoint ? optionAPoint.balance : 0;
  }
  
  // Add Option B data (low APR)
  if (scenarios.optionB) {
   const optionBPoint = scenarios.optionB.find(p => p.month === dataPoint.month);
   enhanced.balanceTransferOptionB = optionBPoint ? optionBPoint.balance : 0;
  }
  
  return enhanced;
 });
}

/**
 * Generate balance transfer offer examples for demo/testing
 */
export function getBalanceTransferOfferExamples() {
 return {
  optionA: {
   name: "0% for 18 months",
   promoMonths: 18,
   transferFee: 0.03, // 3%
   postPromoAPR: 0.249, // 24.9%
   description: "3% fee upfront, then 24.9% APR"
  },
  optionB: {
   name: "8.9% APR",
   apr: 0.089, // 8.9%
   transferFee: 0, // No fee
   description: "Consistent low rate, no promotional period"
  }
 };
}