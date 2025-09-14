/**
 * Burn-up chart utilities for debt progress tracking
 * Shows cumulative payments over time with step-line visualization
 */

import { fromCents, toCents } from '../lib/money';
import type { PaymentEntry } from '../types/debt';
import { computePaymentPlan } from './paymentPlanner';

export type BurnUpPoint = { 
 date: string; 
 paid: number; // in £
};

export type BurnUpModel = {
 points: BurnUpPoint[];    // step line data points
 goalPounds: number;      // £ original target amount
 projectedPoints?: BurnUpPoint[]; // future projection points
 projectedEndDate?: string;  // ISO date string
 totalPaidPounds: number;   // total paid so far in £
};

/**
 * Build burn-up model from a debt and its payment history
 * If original_amount_pennies is missing, infer from: current balance + sum(payments)
 */
export function buildDebtBurnUp(debt: {
 id: string;
 amount_pennies: number;
 original_amount_pennies?: number;
 min_payment_pennies: number;
 payment_history?: PaymentEntry[];
}): BurnUpModel {
 // Get payment history and sort chronologically
 const history = [...(debt.payment_history || [])]
  .filter(p => Number.isFinite(p.amount_pennies) && p.amount_pennies > 0)
  .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

 // Calculate original amount (inferred if not provided)
 const sumPaymentsCents = history.reduce((sum, p) => sum + (p.amount_pennies || 0), 0);
 const originalCents = debt.original_amount_pennies && debt.original_amount_pennies > 0
  ? debt.original_amount_pennies
  : (debt.amount_pennies || 0) + sumPaymentsCents;

 // Build step series: start at 0, then jump on each payment date
 const points: BurnUpPoint[] = [];
 
 if (history.length > 0) {
  // Start one day before first payment at 0
  const firstPaymentDate = new Date(history[0].payment_date);
  const startDate = new Date(firstPaymentDate.getTime() - 24 * 60 * 60 * 1000);
  points.push({ 
   date: startDate.toISOString().split('T')[0], 
   paid: 0 
  });
 } else {
  // No payments yet: start today at 0
  const today = new Date().toISOString().split('T')[0];
  points.push({ date: today, paid: 0 });
 }

 // Add cumulative payment points
 let accumulatedCents = 0;
 for (const payment of history) {
  accumulatedCents += (payment.amount_pennies || 0);
  points.push({ 
   date: payment.payment_date, 
   paid: fromCents(accumulatedCents) 
  });
 }

 return {
  points,
  goalPounds: fromCents(originalCents),
  totalPaidPounds: fromCents(accumulatedCents),
 };
}

/**
 * Project future burn-up based on monthly payments
 * Simple monthly projection: apply min + extra to this debt until goal reached
 */
export function projectDebtBurnUp(
 model: BurnUpModel,
 debt: { 
  amount_pennies: number; 
  min_payment_pennies: number; 
  id: string 
 },
 extraPoundsForThisDebt: number = 0 // extra monthly payment for this debt
): Pick<BurnUpModel, 'projectedPoints'|'projectedEndDate'> {
 const startPaidCents = toCents(model.totalPaidPounds);
 const goalCents = toCents(model.goalPounds);
 const remainingCents = Math.max(0, goalCents - startPaidCents);
 
 // If already paid off, return empty projection
 if (remainingCents === 0) {
  const lastPaymentDate = model.points.at(-1)?.date;
  return { 
   projectedPoints: [], 
   projectedEndDate: lastPaymentDate 
  };
 }

 // Calculate total monthly payment in pence
 const monthlyPaymentCents = Math.max(0, 
  (debt.min_payment_pennies || 0) + toCents(extraPoundsForThisDebt || 0)
 );
 
 if (monthlyPaymentCents === 0) {
  return { projectedPoints: [], projectedEndDate: undefined };
 }

 // Project monthly steps forward
 const projected: BurnUpPoint[] = [];
 let accumulatedCents = startPaidCents;
 const startDate = new Date();
 
 // Cap to 10 years to prevent infinite loops
 for (let monthOffset = 1; monthOffset <= 120 && accumulatedCents < goalCents; monthOffset++) {
  const nextPaymentCents = Math.min(goalCents, accumulatedCents + monthlyPaymentCents);
  
  // Create date for next month
  const projectedDate = new Date(
   startDate.getFullYear(), 
   startDate.getMonth() + monthOffset, 
   startDate.getDate()
  );
  
  projected.push({ 
   date: projectedDate.toISOString().split('T')[0], 
   paid: fromCents(nextPaymentCents) 
  });
  
  accumulatedCents = nextPaymentCents;
 }

 const endDate = projected.at(-1)?.date;
 return { 
  projectedPoints: projected, 
  projectedEndDate: endDate 
 };
}

/**
 * Format date for chart display
 */
export function formatChartDate(dateStr: string): string {
 const date = new Date(dateStr);
 return date.toLocaleDateString('en-GB', { 
  month: 'short', 
  year: '2-digit' 
 });
}

/**
 * Format currency for chart tooltips
 */
export function formatChartCurrency(value: number): string {
 return new Intl.NumberFormat('en-GB', { 
  style: 'currency', 
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
 }).format(value);
}

/**
 * Get the current month name for chart context
 */
export function getCurrentMonthName(): string {
 return new Date().toLocaleDateString('en-GB', { 
  month: 'long',
  year: 'numeric'
 });
}

/**
 * Select target debt based on strategy (shared logic for Strategy and Review pages)
 */
export function selectTargetDebt(
 debts: Array<{
  id: string;
  name: string;
  amount_pennies: number;
  apr?: number;
  interest?: number;
  rate?: number;
 }>,
 strategy: 'snowball' | 'avalanche' | 'custom',
 customFocusId?: string
) {
 const activeDebts = debts.filter(debt => (debt.amount_pennies || 0) > 0);
 
 if (activeDebts.length === 0) return null;
 
 if (strategy === 'custom' && customFocusId) {
  const customTarget = activeDebts.find(debt => debt.id === customFocusId);
  if (customTarget) return customTarget;
  // Fall back to snowball if custom focus not found
 }
 
 if (strategy === 'avalanche') {
  // Highest interest rate first
  return [...activeDebts].sort((a, b) => {
   const rateA = a.apr || (a.interest || a.rate || 0);
   const rateB = b.apr || (b.interest || b.rate || 0);
   return rateB - rateA;
  })[0];
 }
 
 // Default: snowball (smallest balance first)
 return [...activeDebts].sort((a, b) => 
  (a.amount_pennies || 0) - (b.amount_pennies || 0)
 )[0];
}

/**
 * Build combined burn-up for all debts
 * Merges payment histories and shows total debt payoff progress
 */
export function buildCombinedDebtBurnUp(debts: Array<{
 id: string;
 name: string;
 amount_pennies: number;
 original_amount_pennies?: number;
 min_payment_pennies: number;
 payment_history?: PaymentEntry[];
}>): BurnUpModel {
 // Collect all payments from all debts
 const allPayments: Array<PaymentEntry & { debtName: string }> = [];
 let totalOriginalCents = 0;
 let totalCurrentCents = 0;

 for (const debt of debts) {
  const history = debt.payment_history || [];
  const sumPaymentsCents = history.reduce((sum, p) => sum + (p.amount_pennies || 0), 0);
  const originalCents = debt.original_amount_pennies && debt.original_amount_pennies > 0
   ? debt.original_amount_pennies
   : (debt.amount_pennies || 0) + sumPaymentsCents;

  totalOriginalCents += originalCents;
  totalCurrentCents += (debt.amount_pennies || 0);

  // Add debt name to payments for tooltip context
  for (const payment of history) {
   if (payment.amount_pennies > 0) {
    allPayments.push({
     ...payment,
     debtName: debt.name
    });
   }
  }
 }

 // Sort all payments chronologically
 allPayments.sort((a, b) => a.payment_date.localeCompare(b.payment_date));

 // Build cumulative step series
 const points: BurnUpPoint[] = [];
 
 if (allPayments.length > 0) {
  // Start one day before first payment at 0
  const firstPaymentDate = new Date(allPayments[0].payment_date);
  const startDate = new Date(firstPaymentDate.getTime() - 24 * 60 * 60 * 1000);
  points.push({ 
   date: startDate.toISOString().split('T')[0], 
   paid: 0 
  });
 } else {
  // No payments yet: start today at 0
  const today = new Date().toISOString().split('T')[0];
  points.push({ date: today, paid: 0 });
 }

 // Add cumulative payment points
 let accumulatedCents = 0;
 for (const payment of allPayments) {
  accumulatedCents += payment.amount_pennies;
  points.push({ 
   date: payment.payment_date, 
   paid: fromCents(accumulatedCents) 
  });
 }

 return {
  points,
  goalPounds: fromCents(totalOriginalCents),
  totalPaidPounds: fromCents(accumulatedCents),
 };
}

/**
 * Project combined debt burn-up using payment planner for accurate allocation
 * This properly handles debts being paid off mid-timeline and adjusts allocation
 */
export function projectCombinedDebtBurnUp(
 model: BurnUpModel,
 debts: Array<{
  id: string;
  amount_pennies: number;
  min_payment_pennies: number;
 }>,
 totalExtraPounds: number = 0,
 strategy: 'snowball' | 'avalanche' | 'custom' = 'snowball',
 customFocusId?: string
): Pick<BurnUpModel, 'projectedPoints'|'projectedEndDate'> {
 const startPaidCents = toCents(model.totalPaidPounds);
 const goalCents = toCents(model.goalPounds);
 const remainingCents = Math.max(0, goalCents - startPaidCents);
 
 if (remainingCents === 0) {
  const lastPaymentDate = model.points.at(-1)?.date;
  return { 
   projectedPoints: [], 
   projectedEndDate: lastPaymentDate 
  };
 }

 // Import payment planner for accurate allocation
 // Use payment planner if available, otherwise fall back to simple projection
 if (!computePaymentPlan) {
  console.warn('[burnup] Payment planner not available, using simple projection');
  return simpleProjection(model, debts, totalExtraPounds);
 }

 // Clone debts so we don't mutate the original data
 const workingDebts = debts.map(debt => ({ ...debt }));
 const projected: BurnUpPoint[] = [];
 let accumulatedCents = startPaidCents;
 const startDate = new Date();
 
 // Project month by month using the payment planner
 for (let monthOffset = 1; monthOffset <= 120; monthOffset++) {
  // Check if any debts remain
  const activeDebts = workingDebts.filter(d => (d.amount_pennies || 0) > 0);
  if (activeDebts.length === 0) break;
  
  // Compute payment plan for this month
  const plan = computePaymentPlan(
   activeDebts,
   totalExtraPounds,
   strategy,
   customFocusId
  );
  
  // Apply payments to working balances
  let monthlyPaymentCents = 0;
  for (const line of plan.lines) {
   const debt = workingDebts.find(d => d.id === line.debt_id);
   if (debt) {
    const totalPaymentCents = line.min_payment_pennies + line.extra_payment_cents;
    const actualPaymentCents = Math.min(debt.amount_pennies || 0, totalPaymentCents);
    
    debt.amount_pennies = Math.max(0, (debt.amount_pennies || 0) - actualPaymentCents);
    monthlyPaymentCents += actualPaymentCents;
   }
  }
  
  accumulatedCents += monthlyPaymentCents;
  
  const projectedDate = new Date(
   startDate.getFullYear(), 
   startDate.getMonth() + monthOffset, 
   startDate.getDate()
  );
  
  projected.push({ 
   date: projectedDate.toISOString().split('T')[0], 
   paid: fromCents(accumulatedCents) 
  });
  
  // Stop if we've reached the goal
  if (accumulatedCents >= goalCents) break;
 }

 const endDate = projected.at(-1)?.date;
 return { 
  projectedPoints: projected, 
  projectedEndDate: endDate 
 };
}

/**
 * Fallback simple projection when payment planner is not available
 */
function simpleProjection(
 model: BurnUpModel,
 debts: Array<{ amount_pennies: number; min_payment_pennies: number }>,
 totalExtraPounds: number
) {
 const startPaidCents = toCents(model.totalPaidPounds);
 const goalCents = toCents(model.goalPounds);
 
 const totalMinPaymentCents = debts.reduce((sum, debt) => 
  sum + (debt.min_payment_pennies || 0), 0
 );
 
 const monthlyPaymentCents = Math.max(0, 
  totalMinPaymentCents + toCents(totalExtraPounds || 0)
 );
 
 if (monthlyPaymentCents === 0) {
  return { projectedPoints: [], projectedEndDate: undefined };
 }

 const projected: BurnUpPoint[] = [];
 let accumulatedCents = startPaidCents;
 const startDate = new Date();
 
 for (let monthOffset = 1; monthOffset <= 120 && accumulatedCents < goalCents; monthOffset++) {
  const nextPaymentCents = Math.min(goalCents, accumulatedCents + monthlyPaymentCents);
  
  const projectedDate = new Date(
   startDate.getFullYear(), 
   startDate.getMonth() + monthOffset, 
   startDate.getDate()
  );
  
  projected.push({ 
   date: projectedDate.toISOString().split('T')[0], 
   paid: fromCents(nextPaymentCents) 
  });
  
  accumulatedCents = nextPaymentCents;
 }

 const endDate = projected.at(-1)?.date;
 return { 
  projectedPoints: projected, 
  projectedEndDate: endDate 
 };
}