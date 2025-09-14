/**
 * Payment Planner Utility
 * Handles debt payment strategy allocation (Snowball, Avalanche, Custom)
 * Ensures no overpayment and proper balance capping
 */

import { fromCents, toCents } from '../lib/money';

export type PaymentStrategy = 'snowball' | 'avalanche' | 'custom';

export interface DebtForPlanning {
 id: string;
 name: string;
 amount_pennies: number;
 min_payment_pennies: number;
 apr: number;
 debt_type?: string;
}

export interface PaymentPlanLine {
 debt_id: string;
 debt_name: string;
 current_balance_gbp: number;
 current_balance_cents: number;
 min_payment_gbp: number;
 min_payment_pennies: number;
 extra_payment_gbp: number;
 extra_payment_cents: number;
 total_payment_gbp: number;
 total_payment_cents: number;
 remaining_balance_gbp: number;
 remaining_balance_cents: number;
 is_focus_debt: boolean;
 apr_percentage: number;
}

export interface PaymentPlan {
 lines: PaymentPlanLine[];
 strategy: PaymentStrategy;
 focus_debt_id?: string;
 total_minimum_gbp: number;
 total_minimum_cents: number;
 extra_budget_gbp: number;
 extra_budget_cents: number;
 extra_allocated_gbp: number;
 extra_allocated_cents: number;
 total_planned_gbp: number;
 total_planned_cents: number;
}

/**
 * Compute payment plan based on strategy and extra budget
 */
export function computePaymentPlan(
 debts: DebtForPlanning[],
 extraBudgetGbp: number,
 strategy: PaymentStrategy,
 customFocusDebtId?: string
): PaymentPlan {
 if (!debts || debts.length === 0) {
  return {
   lines: [],
   strategy,
   focus_debt_id: customFocusDebtId,
   total_minimum_gbp: 0,
   total_minimum_cents: 0,
   extra_budget_gbp: extraBudgetGbp,
   extra_budget_cents: toCents(extraBudgetGbp),
   extra_allocated_gbp: 0,
   extra_allocated_cents: 0,
   total_planned_gbp: 0,
   total_planned_cents: 0
  };
 }

 // Filter out debts with zero balance
 const activeDebts = debts.filter(debt => (debt.amount_pennies || 0) > 0);
 
 if (activeDebts.length === 0) {
  return {
   lines: [],
   strategy,
   focus_debt_id: customFocusDebtId,
   total_minimum_gbp: 0,
   total_minimum_cents: 0,
   extra_budget_gbp: extraBudgetGbp,
   extra_budget_cents: toCents(extraBudgetGbp),
   extra_allocated_gbp: 0,
   extra_allocated_cents: 0,
   total_planned_gbp: 0,
   total_planned_cents: 0
  };
 }

 // Determine focus debt based on strategy
 let focusDebt: DebtForPlanning | null = null;
 
 switch (strategy) {
  case 'snowball':
   // Focus on smallest balance
   focusDebt = activeDebts.reduce((smallest, debt) => 
    (debt.amount_pennies || 0) < (smallest.amount_pennies || 0) ? debt : smallest
   );
   break;
   
  case 'avalanche':
   // Focus on highest APR
   focusDebt = activeDebts.reduce((highest, debt) => 
    (debt.apr || 0) > (highest.apr || 0) ? debt : highest
   );
   break;
   
  case 'custom':
   // Use specified focus debt
   if (customFocusDebtId) {
    focusDebt = activeDebts.find(debt => debt.id === customFocusDebtId) || null;
   }
   break;
 }

 const extraBudgetCents = toCents(extraBudgetGbp);
 let remainingExtraCents = extraBudgetCents;
 
 // Calculate totals
 const totalMinimumCents = activeDebts.reduce((sum, debt) => sum + (debt.min_payment_pennies || 0), 0);
 
 // Create payment lines
 const lines: PaymentPlanLine[] = activeDebts.map(debt => {
  const isFocusDebt = focusDebt?.id === debt.id;
  const balanceCents = debt.amount_pennies || 0;
  const minPaymentCents = debt.min_payment_pennies || 0;
  
  // Allocate extra payment to focus debt
  let extraPaymentCents = 0;
  if (isFocusDebt && remainingExtraCents > 0) {
   // Don't overpay - cap at remaining balance after minimum
   const maxExtraCents = Math.max(0, balanceCents - minPaymentCents);
   extraPaymentCents = Math.min(remainingExtraCents, maxExtraCents);
   remainingExtraCents -= extraPaymentCents;
  }
  
  const totalPaymentCents = minPaymentCents + extraPaymentCents;
  const remainingBalanceCents = Math.max(0, balanceCents - totalPaymentCents);
  
  return {
   debt_id: debt.id,
   debt_name: debt.name,
   current_balance_gbp: fromCents(balanceCents),
   current_balance_cents: balanceCents,
   min_payment_gbp: fromCents(minPaymentCents),
   min_payment_pennies: minPaymentCents,
   extra_payment_gbp: fromCents(extraPaymentCents),
   extra_payment_cents: extraPaymentCents,
   total_payment_gbp: fromCents(totalPaymentCents),
   total_payment_cents: totalPaymentCents,
   remaining_balance_gbp: fromCents(remainingBalanceCents),
   remaining_balance_cents: remainingBalanceCents,
   is_focus_debt: isFocusDebt,
   apr_percentage: (debt.apr || 0) / 100
  };
 });

 const extraAllocatedCents = extraBudgetCents - remainingExtraCents;
 const totalPlannedCents = totalMinimumCents + extraAllocatedCents;

 return {
  lines,
  strategy,
  focus_debt_id: focusDebt?.id,
  total_minimum_gbp: fromCents(totalMinimumCents),
  total_minimum_cents: totalMinimumCents,
  extra_budget_gbp: extraBudgetGbp,
  extra_budget_cents: extraBudgetCents,
  extra_allocated_gbp: fromCents(extraAllocatedCents),
  extra_allocated_cents: extraAllocatedCents,
  total_planned_gbp: fromCents(totalPlannedCents),
  total_planned_cents: totalPlannedCents
 };
}

/**
 * Get strategy display name
 */
export function getStrategyDisplayName(strategy: PaymentStrategy): string {
 switch (strategy) {
  case 'snowball':
   return 'Debt Snowball (Smallest First)';
  case 'avalanche':
   return 'Debt Avalanche (Highest Interest First)';
  case 'custom':
   return 'Custom Focus';
  default:
   return 'Unknown Strategy';
 }
}

/**
 * Get strategy description
 */
export function getStrategyDescription(strategy: PaymentStrategy): string {
 switch (strategy) {
  case 'snowball':
   return 'Pay minimums on all debts, put extra money toward the smallest balance first. Builds momentum through quick wins.';
  case 'avalanche':
   return 'Pay minimums on all debts, put extra money toward the highest interest rate first. Mathematically optimal.';
  case 'custom':
   return 'Pay minimums on all debts, choose which debt gets the extra money. Full control over your strategy.';
  default:
   return '';
 }
}

/**
 * Get payment type for recordPayment based on line data
 */
export function getPaymentTypeForLine(line: PaymentPlanLine, isMinimum: boolean): string {
 if (isMinimum) {
  return 'system_minimum';
 }
 
 if (line.extra_payment_cents > 0) {
  if (line.is_focus_debt) {
   // Return strategy-specific type based on how this was calculated
   // This would need to be passed in or stored in the plan
   return 'extra'; // Generic for now, could be 'snowball_extra', 'avalanche_extra'
  }
 }
 
 return 'extra';
}

/**
 * Validate payment plan before execution
 */
export function validatePaymentPlan(plan: PaymentPlan): { isValid: boolean; errors: string[] } {
 const errors: string[] = [];
 
 if (!plan.lines || plan.lines.length === 0) {
  errors.push('No payment lines in plan');
 }
 
 // Check for negative payments
 for (const line of plan.lines) {
  if (line.total_payment_cents < 0) {
   errors.push(`Negative payment for ${line.debt_name}`);
  }
  
  if (line.total_payment_cents > line.current_balance_cents) {
   errors.push(`Payment exceeds balance for ${line.debt_name}`);
  }
 }
 
 // Check budget allocation
 if (plan.extra_allocated_cents > plan.extra_budget_cents) {
  errors.push('Allocated extra exceeds budget');
 }
 
 return {
  isValid: errors.length === 0,
  errors
 };
}