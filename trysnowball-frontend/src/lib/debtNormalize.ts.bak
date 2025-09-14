/**
 * Debt normalization utilities
 * Converts legacy debt objects to normalized format
 */

import { toCents, percentToBps } from './money';

export type LegacyDebt = {
 balance?: number;      // £ decimal
 interestRate?: number;    // percent, e.g. 19.9
 minPayment?: number;     // £ decimal
 amount?: number;       // alternative to balance
 apr_pct?: number;      // alternative to interestRate
 [key: string]: any;     // other fields pass through
};

export type NormalizedDebt = {
 amount_pennies: number;
 apr: number;
 min_payment_pennies: number;
 [key: string]: any;     // other fields pass through
};

export function normalizeLegacyDebt(debt: LegacyDebt): NormalizedDebt {
 const amount = debt.amount_pennies ?? debt.amount ?? 0;
 const rate = debt.apr ?? debt.apr_pct ?? 0;
 const minPayment = debt.min_payment_pennies ?? 0;
 
 // Copy all fields, then override with normalized ones
 const normalized = { ...debt };
 
 normalized.amount_pennies = toCents(amount);
 normalized.apr = percentToBps(rate); 
 normalized.min_payment_pennies = toCents(minPayment);
 
 // Remove legacy fields
 delete normalized.balance;
 delete normalized.interestRate;
 delete normalized.minPayment;
 delete normalized.amount;
 delete normalized.apr_pct;
 
 return normalized as NormalizedDebt;
}