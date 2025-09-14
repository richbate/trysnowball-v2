/**
 * Debt normalization utilities - single source of truth for form validation
 * Ensures no undefined/NaN values ever get saved or rendered
 */

const toCleanNumber = (v: any): number => {
 if (v === null || v === undefined) return 0;
 const s = String(v).replace(/[£,%\s,]/g, '');
 const n = Number(s);
 return Number.isFinite(n) ? n : 0;
};

export const asCents = (v: any): number => Math.max(0, Math.round(toCleanNumber(v) * 100));
export const asPercent = (v: any): number => Math.max(0, toCleanNumber(v)); // 19.9 -> 19.9

export function normalizeDebt(input: any) {
 return {
  id: input.id || crypto.randomUUID(),
  name: String(input.name || 'Untitled').slice(0, 120),
  amount_pennies: asCents(input.amount ?? input.balance ?? input.amount_pennies ?? 0),
  min_payment_pennies: asCents(input.minPayment ?? input.min_payment_pennies ?? 0),
  apr: asPercent(input.apr ?? input.interestRate ?? (input.apr_bps ? input.apr_bps / 100 : 0)),
  limit_pennies: input.limit ? asCents(input.limit) : undefined, // Convert credit limit to cents
  debt_type: input.debt_type || 'credit_card',
  order_index: Number.isFinite(+input.order_index) ? +input.order_index : undefined,
 };
}

// Safe formatters for rendering
export const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatDebtBalance(debt: any): string {
 const cents = Number.isFinite(debt.amount_pennies) ? debt.amount_pennies : 0;
 const gbp = cents / 100; // Convert cents back to pounds
 console.log('formatDebtBalance:', { cents, gbp, formatted: fmt.format(gbp) });
 return fmt.format(gbp);
}

export function formatMinPayment(debt: any): string {
 const minCents = Number.isFinite(debt.min_payment_pennies) ? debt.min_payment_pennies : 0;
 return fmt.format(minCents / 100);
}

export function formatAPR(debt: any): string {
 const apr = Number.isFinite(debt.apr) ? debt.apr : 0;
 return apr.toFixed(1) + '%';
}