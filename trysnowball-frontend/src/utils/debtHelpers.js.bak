/**
 * Safe debt checking utilities - prevents hydration race conditions
 * 
 * DO NOT use debts.length === 0 directly in routing logic!
 * Always use these helpers or the hasDebts signal from useUserDebts.
 */

/**
 * Check if user has debts - only use after hydration complete
 * @param {Array} debts - debt array from useUserDebts
 * @param {string} hydrationStatus - hydration status from useUserDebts
 * @returns {boolean|null} - true/false after hydration, null during hydration
 */
export function safeHasDebts(debts, hydrationStatus) {
 if (hydrationStatus !== 'ready') {
  console.warn('[debtHelpers] Called safeHasDebts before hydration ready - returning null to prevent race condition');
  return null;
 }
 return Array.isArray(debts) && debts.length > 0;
}

/**
 * Get debt count - only use after hydration complete 
 * @param {Array} debts - debt array from useUserDebts
 * @param {string} hydrationStatus - hydration status from useUserDebts
 * @returns {number|null} - count after hydration, null during hydration
 */
export function safeDebtCount(debts, hydrationStatus) {
 if (hydrationStatus !== 'ready') {
  console.warn('[debtHelpers] Called safeDebtCount before hydration ready - returning null to prevent race condition');
  return null;
 }
 return Array.isArray(debts) ? debts.length : 0;
}

/**
 * DEPRECATED: Direct debts.length checks
 * Use hasDebts from useUserDebts() or safeHasDebts() instead
 */
export function deprecatedDebtLengthCheck() {
 throw new Error('Direct debts.length === 0 checks can cause hydration race conditions. Use hasDebts from useUserDebts() or safeHasDebts() helper.');
}