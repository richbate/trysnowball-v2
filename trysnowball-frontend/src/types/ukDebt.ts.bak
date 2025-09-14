/**
 * Clean UK debt types - no American cents/bps nonsense
 * Uses real British pounds and percentages
 */

export interface UKDebt {
 id: string;
 name: string;
 amount: number;      // current amount (£1234.56)
 original_amount?: number; // starting amount (£5000.00) - optional for progress tracking
 apr: number;       // percentage (19.9)
 min_payment: number;   // pounds (£45.00)
 limit?: number;      // pounds (£5000.00) - optional credit limit
 debt_type: 'credit_card' | 'loan' | 'other';
 order_index: number;
 created_at: string;
 updated_at: string;
}

export interface UKDebtFormData {
 name: string;
 amount: number;      // current amount (pounds)
 original_amount?: number; // starting amount (pounds) - optional
 apr: number;       // percentage
 min_payment: number;   // pounds
 limit?: number;      // pounds (optional)
 debt_type: 'credit_card' | 'loan' | 'other';
 order_index: number;
}

// Validation helpers
export function isValidUKDebt(debt: Partial<UKDebt>): debt is UKDebt {
 return !!(
  debt.id &&
  debt.name &&
  typeof debt.amount === 'number' && debt.amount >= 0 &&
  typeof debt.apr === 'number' && debt.apr >= 0 &&
  typeof debt.min_payment === 'number' && debt.min_payment >= 0 &&
  debt.debt_type &&
  typeof debt.order_index === 'number' &&
  debt.created_at &&
  debt.updated_at
 );
}

// Display helpers
export function formatPounds(amount: number): string {
 return new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
 }).format(amount);
}

export function formatPercentage(rate: number): string {
 return `${rate.toFixed(1)}%`;
}

// Progress tracking helpers
export interface DebtProgress {
 amountPaidOff: number;   // £3,766.44
 percentagePaidOff: number; // 33.3%
 remainingAmount: number;  // £7,233.56
 hasProgress: boolean;    // true if original_amount exists and > current amount
}

export function calculateProgress(debt: UKDebt): DebtProgress {
 if (!debt.original_amount || debt.original_amount <= debt.amount) {
  return {
   amountPaidOff: 0,
   percentagePaidOff: 0,
   remainingAmount: debt.amount,
   hasProgress: false
  };
 }

 const amountPaidOff = debt.original_amount - debt.amount;
 const percentagePaidOff = (amountPaidOff / debt.original_amount) * 100; // eslint-disable-line no-restricted-syntax

 return {
  amountPaidOff,
  percentagePaidOff,
  remainingAmount: debt.amount,
  hasProgress: true
 };
}

export function formatProgress(progress: DebtProgress): string {
 if (!progress.hasProgress) {
  return 'No progress data available';
 }

 return `${formatPounds(progress.amountPaidOff)} paid off (${progress.percentagePaidOff.toFixed(1)}% complete)`;
}

export function getProgressMessage(debt: UKDebt): string {
 const progress = calculateProgress(debt);
 
 if (!progress.hasProgress) {
  return `Current balance: ${formatPounds(debt.amount)}`;
 }

 if (progress.percentagePaidOff >= 75) {
  return `🔥 Nearly there! You've smashed ${formatPounds(progress.amountPaidOff)} off this debt!`;
 } else if (progress.percentagePaidOff >= 50) {
  return `💪 Halfway champion! ${formatPounds(progress.amountPaidOff)} down, ${formatPounds(progress.remainingAmount)} to go!`;
 } else if (progress.percentagePaidOff >= 25) {
  return `🚀 Great momentum! You've already cleared ${formatPounds(progress.amountPaidOff)}!`;
 } else {
  return `✨ Every pound counts! ${formatPounds(progress.amountPaidOff)} paid off so far.`;
 }
}