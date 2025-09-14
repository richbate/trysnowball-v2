/**
 * Enhanced snowball debt calculation module
 * Fixes mathematical edge cases and improves accuracy
 */

/**
 * Simulate snowball repayment method with improved accuracy
 * @param {Array<{name: string, balance: number, rate: number, minPayment: number}>} debts
 * @param {number} totalPayment - Total monthly payment (minimums + extra)
 * @returns {number} Number of months to pay off debt (or -1 if > 120 months)
 */
const simulateSnowball = (debts, totalPayment) => {
 // Sort by user-defined order first, then by balance as fallback
 const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => {
  const orderA = a.order || 999;
  const orderB = b.order || 999;
  if (orderA !== orderB) return orderA - orderB;
  return a.balance - b.balance; // Fallback to balance if orders are equal
 });
 const totalDebt = snowballDebts.reduce((sum, debt) => sum + debt.amount_pennies, 0);

 // Edge case: total payment clears all debts in 1 month
 if (totalPayment >= totalDebt) return 1;

 for (let month = 1; month <= 120; month++) {
  let available = totalPayment;

  // Step 1: Apply interest and pay minimum payments
  for (let i = 0; i < snowballDebts.length; i++) {
   const debt = snowballDebts[i];
   if (debt.amount_pennies <= 0) continue;

   // Calculate and apply interest first
   const interest = Math.round(debt.amount_pennies * (debt.apr / 100 / 12 / 100) * 100) / 100;
   debt.amount_pennies += interest;

   // Apply full minimum payment to balance
   const actualPayment = Math.min(debt.amount_pennies, debt.min_payment_pennies);
   debt.amount_pennies = Math.max(0, debt.amount_pennies - actualPayment);
   
   // Deduct actual payment from available funds
   available -= debt.min_payment_pennies; // Always deduct full minimum from available
  }

  // Ensure available payment is never negative
  available = Math.max(0, available);

  // Step 2: Apply extra payment to smallest remaining debt
  if (available > 0) {
   for (let i = 0; i < snowballDebts.length; i++) {
    const debt = snowballDebts[i];
    if (debt.amount_pennies > 0) {
     const extraPayment = Math.min(available, debt.amount_pennies);
     debt.amount_pennies = Math.max(0, debt.amount_pennies - extraPayment);
     break; // Only apply extra to one debt
    }
   }
  }

  // Step 3: Check if all debts are cleared
  const totalRemaining = snowballDebts.reduce((sum, debt) => sum + debt.amount_pennies, 0);
  if (totalRemaining <= 1) return month; // Allow for small rounding errors
 }

 return -1; // Not paid off within 120 months
};

/**
 * Calculate required extra payment to clear debt in target months using binary search
 * @param {number} targetMonths - Desired payoff timeline
 * @param {Array} debts - Array of debt objects
 * @param {number} totalMinPayments - Sum of all minimum payments
 * @returns {number} Required extra payment amount
 */
const calculateExtraPaymentForTarget = (targetMonths, debts, totalMinPayments) => {
 if (targetMonths <= 0) return 0;
 
 // Use realistic upper bound based on total debt
 const totalDebt = debts.reduce((sum, debt) => sum + debt.amount_pennies, 0);
 
 let low = 0;
 let high = totalDebt; // More realistic than arbitrary 2000
 let bestExtra = 0;

 while (low <= high) {
  const midExtra = Math.floor((low + high) / 2);
  const months = simulateSnowball(debts, totalMinPayments + midExtra);

  if (months > 0 && months <= targetMonths) {
   bestExtra = midExtra;
   high = midExtra - 1; // Try to find smaller payment
  } else {
   low = midExtra + 1; // Need higher payment
  }
 }

 return bestExtra;
};

// Export for ES6 modules (modern React standard)
export { simulateSnowball, calculateExtraPaymentForTarget };