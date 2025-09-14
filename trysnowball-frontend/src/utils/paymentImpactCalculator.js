/**
 * Payment Impact Calculator
 *
 * Utilities for calculating immediate payment impact (TRY-9)
 * and forecast comparison (TRY-10)
 */

import { runSimulationWithPlan } from '../lib/simulator/runWithPlan';
import { fromCents, toCents } from '../lib/money';

/**
 * Calculate immediate payment impact (TRY-9)
 * Shows principal cleared, interest saved, and balance progress
 */
export function calculatePaymentImpact(debt, paymentAmount) {
  if (!debt || !paymentAmount || paymentAmount <= 0) {
    return null;
  }

  // Handle different debt data formats
  const originalBalance = debt.amount || fromCents(debt.amount_pennies || 0);
  const apr = debt.apr || debt.interest || 0;
  const monthlyInterestRate = apr / 12 / 100;

  // Calculate monthly interest on current balance
  const monthlyInterest = originalBalance * monthlyInterestRate;

  // Determine how much goes to principal vs interest
  let principalCleared = 0;
  let interestCovered = 0;

  if (paymentAmount <= monthlyInterest) {
    // Payment doesn't cover full monthly interest
    interestCovered = paymentAmount;
    principalCleared = 0;
  } else {
    // Payment covers interest and reduces principal
    interestCovered = monthlyInterest;
    principalCleared = paymentAmount - monthlyInterest;
  }

  const newBalance = Math.max(0, originalBalance - principalCleared);
  const balancePercentage = originalBalance > 0 ? Math.round(((newBalance / originalBalance) * 100)) : 0;

  // Interest saved this month = interest that would accrue on the principal we just paid
  const interestSavedThisMonth = principalCleared * monthlyInterestRate;

  return {
    debtName: debt.name || 'Debt',
    paymentAmount,
    originalBalance,
    newBalance,
    principalCleared,
    interestCovered,
    interestSavedThisMonth,
    balancePercentage: Math.max(0, balancePercentage),
    monthlyInterestRate: monthlyInterestRate * 100 // Convert to percentage
  };
}

/**
 * Calculate forecast comparison impact (TRY-10)
 * Compares timeline with and without the extra payment
 */
export function calculateForecastComparison(debts, extraPayment, debtId) {
  if (!debts || debts.length === 0 || !extraPayment || extraPayment <= 0) {
    return null;
  }

  try {
    // Create baseline scenario (minimum payments only)
    // Normalize debt data format for DebtEngine compatibility
    const baselineDebts = debts.map(debt => {
      const balance = debt.amount || fromCents(debt.amount_pennies || 0);
      const minPayment = debt.min_payment || fromCents(debt.min_payment_pennies || 0);

      return {
        id: debt.id || debt.name,
        name: debt.name || `Debt ${debt.id}`,
        balance: balance, // DebtEngine expects 'balance' property
        amount: balance, // Keep both for compatibility
        min_payment: minPayment,
        min_payment_pennies: toCents(minPayment),
        interest: debt.apr || debt.interest || 0,
        rate: debt.apr || debt.interest || 0, // DebtEngine expects 'rate'
        order: debt.order_index || 0
      };
    });

    const baselineTimeline = runSimulationWithPlan(baselineDebts, { type: 'fixed', amount: 0 });

    // Create scenario with extra payment applied once
    const updatedDebts = baselineDebts.map(debt => {
      if (debt.id === debtId || debt.name === debtId) {
        const newBalance = Math.max(0, debt.balance - extraPayment);
        return {
          ...debt,
          balance: newBalance,
          amount: newBalance
        };
      }
      return debt;
    });

    const updatedTimeline = runSimulationWithPlan(updatedDebts, { type: 'fixed', amount: 0 });

    // Find payoff months
    const baselinePayoffMonth = baselineTimeline.findIndex(month => month.totalDebt <= 0.01) + 1;
    const updatedPayoffMonth = updatedTimeline.findIndex(month => month.totalDebt <= 0.01) + 1;

    // Calculate total interest for each scenario
    const baselineInterest = baselineTimeline.reduce((sum, month) => sum + (month.interestPaid || 0), 0);
    const updatedInterest = updatedTimeline.reduce((sum, month) => sum + (month.interestPaid || 0), 0);

    const monthsSaved = Math.max(0, baselinePayoffMonth - updatedPayoffMonth);
    const totalInterestSaved = Math.max(0, baselineInterest - updatedInterest);

    // Calculate new payoff date (rough estimate)
    const currentDate = new Date();
    const payoffDate = new Date(currentDate);
    payoffDate.setMonth(payoffDate.getMonth() + updatedPayoffMonth);

    return {
      monthsSaved,
      totalInterestSaved,
      newPayoffDate: payoffDate.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric'
      }),
      baselinePayoffMonth,
      updatedPayoffMonth,
      baselineInterest,
      updatedInterest
    };

  } catch (error) {
    console.error('Error calculating forecast comparison:', error);
    return null;
  }
}

/**
 * Calculate compound impact of payment
 * Combines immediate impact (TRY-9) with forecast analysis (TRY-10)
 */
export function calculateCompoundPaymentImpact(debts, targetDebt, paymentAmount) {
  const immediateImpact = calculatePaymentImpact(targetDebt, paymentAmount);

  if (!immediateImpact) {
    return null;
  }

  const forecastComparison = calculateForecastComparison(debts, paymentAmount, targetDebt.id);

  return {
    immediate: immediateImpact,
    forecast: forecastComparison
  };
}

/**
 * Utility: Find target debt from debts array
 */
export function findTargetDebt(debts, debtId) {
  return debts.find(debt => debt.id === debtId || debt.name === debtId);
}

/**
 * Utility: Validate payment against debt constraints
 */
export function validatePaymentAmount(debt, paymentAmount) {
  if (!debt || !paymentAmount) {
    return { valid: false, error: 'Missing debt or payment amount' };
  }

  const balance = debt.amount || fromCents(debt.amount_pennies || 0);

  if (paymentAmount <= 0) {
    return { valid: false, error: 'Payment must be greater than £0' };
  }

  if (paymentAmount > balance) {
    return { valid: false, error: `Payment cannot exceed balance of £${balance.toFixed(2)}` };
  }

  return { valid: true };
}