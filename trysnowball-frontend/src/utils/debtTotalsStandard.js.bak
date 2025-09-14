/**
 * Standardized Debt Totals Calculator
 * Single source of truth for all debt totals calculations across the app
 * 
 * This module ensures consistent calculation logic and field handling
 * between different components and prevents multi-calculation drift.
 */

import { computeDebtTotals } from '../selectors/debtTotals';
import { fromCents } from '../lib/money';

/**
 * Get standardized debt totals in pounds (GBP) for display
 * @param {Array} debts - Array of debt objects (normalized format)
 * @returns {Object} - Totals in pounds with consistent field names
 */
export function getDebtTotals(debts) {
 const totals = computeDebtTotals(debts || []);
 
 return {
  totalDebt: fromCents(totals.totalBalanceCents),
  totalMinPayments: fromCents(totals.totalMinPaymentCents),
  totalBalanceCents: totals.totalBalanceCents,
  totalMinPaymentCents: totals.totalMinPaymentCents,
  weightedAprBps: totals.weightedAprBps,
  weightedApr: totals.weightedAprBps / 100, // Convert bps to percentage
  debtCount: Array.isArray(debts) ? debts.length : 0
 };
}

/**
 * Get credit utilisation safely with overflow protection
 * Only considers credit cards, excluding loans and overdrafts
 * @param {Array} debts - Array of debt objects
 * @returns {number} - Credit utilisation percentage (0-999%)
 */
export function getCreditUtilization(debts) {
 if (!Array.isArray(debts) || debts.length === 0) return 0;
 
 // Filter to only include credit cards (identify by name patterns and type)
 const creditCards = debts.filter(debt => {
  const debtType = (debt.debt_type || debt.type || '').toLowerCase();
  const debtName = (debt.name || '').toLowerCase();
  
  // Check if explicitly marked as credit card
  if (debtType.includes('credit') || debtType === 'credit_card') {
   return true;
  }
  
  // Check if name suggests it's a credit card (UK terms)
  const creditCardNames = [
   'card', 'credit', 'visa', 'mastercard', 'amex', 'american express',
   'barclaycard', 'mbna', 'halifax', 'santander', 'natwest', 'lloyds',
   'tesco', 'sainsbury', 'argos', 'john lewis', 'marks', 'spencer',
   'paypal credit', 'klarna', 'clearpay'
  ];
  
  return creditCardNames.some(pattern => debtName.includes(pattern));
 });
 
 if (creditCards.length === 0) return 0;
 
 const totalUsed = creditCards.reduce((sum, debt) => sum + (debt.amount_pennies || 0), 0);
 const totalLimit = creditCards.reduce((sum, debt) => sum + (debt.limit_pennies || 0), 0);
 
 if (totalLimit <= 0) return 0;
 
 const utilization = (totalUsed / totalLimit) * 100;
 
 // Cap at 999% to prevent display overflow
 return Math.min(999, Math.max(0, utilization));
}

/**
 * Get comprehensive debt summary with all key metrics
 * @param {Array} debts - Array of debt objects
 * @returns {Object} - Complete debt summary
 */
export function getDebtSummary(debts) {
 const totals = getDebtTotals(debts);
 const creditUtilization = getCreditUtilization(debts);
 
 return {
  ...totals,
  creditUtilization,
  hasDebts: totals.debtCount > 0,
  averageDebtSize: totals.debtCount > 0 ? totals.totalDebt / totals.debtCount : 0
 };
}

/**
 * Legacy compatibility function - DO NOT USE in new code
 * @deprecated Use getDebtTotals() instead
 */
export function calculateDebtTotals(debts) {
 console.warn('calculateDebtTotals is deprecated. Use getDebtTotals() from debtTotalsStandard.js instead.');
 return getDebtTotals(debts);
}