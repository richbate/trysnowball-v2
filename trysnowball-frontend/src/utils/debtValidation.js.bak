/**
 * Debt validation utilities for TrySnowball
 * Ensures consistent limits and data integrity across the app
 */

// Sensible limits for debt data
export const DEBT_LIMITS = {
 MAX_BALANCE: 1000000, // £1M maximum debt balance
 MIN_BALANCE: 0,    // No negative debts
 MAX_ORDER: 25,    // Maximum 25 debts (sensible UI limit)
 MIN_ORDER: 1,     // Start from 1
 MAX_APR: 99.99,   // 99.99% maximum APR
 MIN_APR: 0,     // 0% minimum APR
 MAX_MIN_PAYMENT: 50000, // £50k max minimum payment
 MIN_MIN_PAYMENT: 0,  // £0 minimum payment
};

/**
 * Validate and clamp debt balance to sensible limits
 * @param {number} balance - The debt balance to validate
 * @returns {number} - Clamped balance within limits
 */
export function validateDebtBalance(balance) {
 const num = parseFloat(balance) || 0;
 return Math.max(DEBT_LIMITS.MIN_BALANCE, Math.min(DEBT_LIMITS.MAX_BALANCE, num));
}

/**
 * Validate and clamp debt order to sensible limits
 * @param {number} order - The debt order to validate
 * @returns {number} - Clamped order within limits
 */
export function validateDebtOrder(order) {
 const num = parseInt(order) || 1;
 return Math.max(DEBT_LIMITS.MIN_ORDER, Math.min(DEBT_LIMITS.MAX_ORDER, num));
}

/**
 * Validate and clamp APR to sensible limits
 * @param {number} apr - The APR to validate
 * @returns {number} - Clamped APR within limits
 */
export function validateAPR(apr) {
 const num = parseFloat(apr) || 0;
 return Math.max(DEBT_LIMITS.MIN_APR, Math.min(DEBT_LIMITS.MAX_APR, num));
}

/**
 * Validate and clamp minimum payment to sensible limits
 * @param {number} minPayment - The minimum payment to validate
 * @returns {number} - Clamped minimum payment within limits
 */
export function validateMinPayment(minPayment) {
 const num = parseFloat(minPayment) || 0;
 return Math.max(DEBT_LIMITS.MIN_MIN_PAYMENT, Math.min(DEBT_LIMITS.MAX_MIN_PAYMENT, num));
}

/**
 * Comprehensive debt validation and sanitization
 * @param {Object} debt - The debt object to validate
 * @returns {Object} - Sanitized debt object
 */
export function sanitizeDebt(debt) {
 return {
  ...debt,
  balance: validateDebtBalance(debt.amount_pennies),
  order: validateDebtOrder(debt.order),
  interestRate: validateAPR(debt.apr),
  minPayment: validateMinPayment(debt.min_payment_pennies),
  // Ensure name is not empty
  name: (debt.name || '').trim() || 'Unnamed Debt',
 };
}

/**
 * Format large numbers for display (handles overflow gracefully)
 * @param {number} amount - The amount to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted amount string
 */
export function formatDebtAmount(amount, options = {}) {
 const {
  currency = '£',
  maximumFractionDigits = 2,
  notation = 'standard' // 'compact' for large numbers
 } = options;

 const num = parseFloat(amount) || 0;
 
 // Handle extremely large numbers with compact notation
 if (num >= 1000000) {
  return currency + num.toLocaleString('en-GB', {
   maximumFractionDigits,
   notation: 'compact',
   compactDisplay: 'short'
  });
 }
 
 return currency + num.toLocaleString('en-GB', {
  maximumFractionDigits
 });
}

/**
 * Calculate credit utilization safely (prevents overflow)
 * @param {number} totalDebt - Total debt amount
 * @param {number} totalCredit - Total credit limit
 * @returns {number} - Utilization percentage (clamped to 999%)
 */
export function calculateCreditUtilization(totalDebt, totalCredit) {
 if (!totalCredit || totalCredit <= 0) return 0;
 
 const utilization = (totalDebt / totalCredit) * 100;
 
 // Cap at 999% to prevent display overflow
 return Math.min(999, Math.max(0, utilization));
}