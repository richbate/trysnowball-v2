/**
 * Debt Mathematics Utilities
 * Core calculations for interest, payments, and debt analysis
 */

/**
 * Calculate monthly interest in pence from balance and APR
 * @param balance_cents - Current balance in pence
 * @param apr - Annual Percentage Rate as percentage (e.g., 19.99)
 * @returns Monthly interest amount in pence
 */
export function monthlyInterestCents(balance_cents: number, apr: number): number {
 const monthlyRate = (apr / 100) / 12; // percent -> fraction per month
 if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) return 0;
 return Math.floor(Math.max(0, balance_cents) * monthlyRate);
}

/**
 * Check if minimum payment covers monthly interest
 * @param balance_cents - Current balance in pence
 * @param min_payment_pennies - Minimum payment in pence
 * @param apr - Annual Percentage Rate as percentage
 * @returns true if minimum payment is insufficient to cover interest
 */
export function isNegativeAmortization(
 balance_cents: number,
 min_payment_pennies: number,
 apr: number
): boolean {
 if (balance_cents <= 0) return false;
 const interest = monthlyInterestCents(balance_cents, apr);
 return min_payment_pennies < interest;
}

/**
 * Calculate how much extra payment is needed to cover interest
 * @param balance_cents - Current balance in pence
 * @param min_payment_pennies - Minimum payment in pence
 * @param apr - Annual Percentage Rate as percentage
 * @returns Additional cents needed to at least cover interest
 */
export function shortfallCents(
 balance_cents: number,
 min_payment_pennies: number,
 apr: number
): number {
 const interest = monthlyInterestCents(balance_cents, apr);
 const shortfall = interest - min_payment_pennies;
 return Math.max(0, shortfall);
}