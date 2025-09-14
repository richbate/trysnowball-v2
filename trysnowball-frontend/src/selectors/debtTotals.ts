/**
 * Debt totals selector
 * Computes total debt and minimum payments from debt array
 */

import { toView } from '../adapters/debts';
import type { AnyDebt } from '../adapters/debts';

export interface DebtTotals {
 totalDebt: number;
 totalMinPayments: number;
}

export function computeDebtTotals(debts: AnyDebt[] | null | undefined): DebtTotals {
 if (!debts || !Array.isArray(debts) || debts.length === 0) {
  return {
   totalDebt: 0,
   totalMinPayments: 0
  };
 }

 let totalDebt = 0;
 let totalMinPayments = 0;

 for (const debt of debts) {
  if (!debt || debt.deleted) continue;
  
  const viewDebt = toView(debt);
  totalDebt += viewDebt.balance_gbp || 0;
  totalMinPayments += viewDebt.min_payment_gbp || 0;
 }

 return {
  totalDebt,
  totalMinPayments
 };
}