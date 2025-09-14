/**
 * Debt Context Selectors
 * Functions for building structured context from debt data
 */

export function buildDebtContext(debts) {
 if (!debts || debts.length === 0) {
  return {
   totalDebt: 0,
   debtCount: 0,
   averageRate: 0,
   totalMinPayment: 0,
   context: 'No debts found'
  };
 }

 const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount_pennies || debt.balance || 0) / 100, 0);
 const totalMinPayment = debts.reduce((sum, debt) => sum + (debt.min_payment_pennies || debt.minPayment || 0) / 100, 0);
 const averageRate = debts.reduce((sum, debt) => sum + (debt.apr || debt.interestRate || 0), 0) / debts.length / 100;

 return {
  totalDebt,
  debtCount: debts.length,
  averageRate,
  totalMinPayment,
  context: `User has ${debts.length} debts totaling $${totalDebt.toFixed(2)}`
 };
}

export function buildFallbackContext() {
 return {
  totalDebt: 0,
  debtCount: 0,
  averageRate: 0,
  totalMinPayment: 0,
  context: 'Unable to load debt data'
 };
}

export function formatContextForPrompt(context) {
 return `Debt Summary: ${context.context}. Total debt: $${context.totalDebt.toFixed(2)}, ${context.debtCount} accounts, avg rate: ${context.averageRate.toFixed(1)}%, min payments: $${context.totalMinPayment.toFixed(2)}/month`;
}

export function validateDebtContext(context) {
 return context && 
  typeof context.totalDebt === 'number' &&
  typeof context.debtCount === 'number' &&
  typeof context.context === 'string';
}