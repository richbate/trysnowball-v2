/**
 * Debt Insights V1 - Local computation of debt insights
 * No backend or API dependencies - works completely offline
 */

import { useMemo } from 'react';

export interface DebtInsight {
 id: string;
 type: 'interest_warning' | 'payment_progress' | 'spending_alert' | 'opportunity' | 'achievement';
 title: string;
 body: string;
 priority: number;
 icon?: string;
 cta?: {
  label: string;
  action: string;
 };
 data?: Record<string, any>;
}

interface Debt {
 id: string;
 name: string;
 amount?: number;
 balance?: number;
 minimumPayment?: number;
 rate?: number;
 interest?: number;
 type?: string;
 lastPayment?: number;
 history?: Array<{ date: string; balance: number; payment?: number }>;
}

export const useInsights = (debts: Debt[] = [], extraPayment: number = 0) => {
 return useMemo(() => {
  const insights: DebtInsight[] = [];
  
  if (!debts || debts.length === 0) {
   return insights;
  }
  
  // Calculate total monthly interest
  const totalMonthlyInterest = debts.reduce((sum, debt) => {
   const balance = debt.amount || debt.amount_pennies || 0;
   const rate = debt.rate || debt.interest || 0;
   return sum + (balance * (rate / 100) / 12);
  }, 0);
  
  // Insight 1: High interest warning
  if (totalMonthlyInterest > 50) {
   insights.push({
    id: 'high_interest',
    type: 'interest_warning',
    title: 'High Interest Alert',
    body: `You're paying £${Math.round(totalMonthlyInterest)} per month in interest. Increasing your payments could save you hundreds.`,
    priority: 1,
    icon: '⚠️',
    cta: {
     label: 'See Strategy',
     action: 'navigate:/my-plan?tab=strategy'
    },
    data: { monthlyInterest: totalMonthlyInterest }
   });
  }
  
  // Insight 2: Payment progress tracking
  const totalMinimums = debts.reduce((sum, debt) => 
   sum + (debt.minimumPayment || 0), 0
  );
  
  if (extraPayment > 0) {
   const percentageAboveMinimum = Math.round((extraPayment / totalMinimums) * 100);
   insights.push({
    id: 'payment_boost',
    type: 'achievement',
    title: 'Great Payment Progress!',
    body: `You're paying ${percentageAboveMinimum}% above minimums. This extra £${extraPayment}/month is accelerating your debt freedom.`,
    priority: 2,
    icon: '🚀',
    data: { extraPayment, percentageAboveMinimum }
   });
  } else if (totalMinimums > 0) {
   insights.push({
    id: 'payment_opportunity',
    type: 'opportunity',
    title: 'Boost Your Payments',
    body: `Adding just £50 extra per month could save you months of payments and reduce interest.`,
    priority: 3,
    icon: '💡',
    cta: {
     label: 'Add Boost',
     action: 'navigate:/my-plan?tab=strategy'
    }
   });
  }
  
  // Insight 3: Credit card spending alert
  const creditCards = debts.filter(d => 
   d.type?.toLowerCase().includes('credit') || 
   d.name?.toLowerCase().includes('credit')
  );
  
  creditCards.forEach(card => {
   if (card.history && card.history.length >= 2) {
    const latestBalance = card.history[0].balance;
    const previousBalance = card.history[1].balance;
    const payment = card.history[0].payment || card.minimumPayment || 0;
    
    // Check if balance increased despite payment (new spending)
    if (latestBalance > previousBalance - payment) {
     const newSpending = latestBalance - (previousBalance - payment);
     insights.push({
      id: `spending_${card.id}`,
      type: 'spending_alert',
      title: `New spending on ${card.name}`,
      body: `You added £${Math.round(newSpending)} in new charges. Consider pausing spending to accelerate payoff.`,
      priority: 4,
      icon: '💳',
      data: { debtId: card.id, newSpending }
     });
    }
   }
  });
  
  // Insight 4: Smallest debt opportunity
  const smallestDebt = debts
   .filter(d => (d.amount || d.balance || 0) > 0)
   .sort((a, b) => (a.amount || a.balance || 0) - (b.amount || b.balance || 0))[0];
  
  if (smallestDebt) {
   const balance = smallestDebt.amount || smallestDebt.balance || 0;
   if (balance < 500) {
    insights.push({
     id: 'quick_win',
     type: 'opportunity',
     title: 'Quick Win Available',
     body: `${smallestDebt.name} has only £${Math.round(balance)} left. Clearing it would give you a psychological boost!`,
     priority: 5,
     icon: '🎯',
     cta: {
      label: 'Focus on this debt',
      action: 'navigate:/my-plan?tab=debts'
     },
     data: { debtId: smallestDebt.id, balance }
    });
   }
  }
  
  // Insight 5: Consistent payment streak
  const hasConsistentPayments = debts.every(debt => {
   if (!debt.history || debt.history.length < 3) return false;
   return debt.history.slice(0, 3).every(h => h.payment && h.payment > 0);
  });
  
  if (hasConsistentPayments && debts.some(d => d.history && d.history.length >= 3)) {
   insights.push({
    id: 'payment_streak',
    type: 'achievement',
    title: '3-Month Payment Streak!',
    body: 'You\'ve made consistent payments for 3 months. Keep up the great momentum!',
    priority: 6,
    icon: '🔥',
    data: { streakMonths: 3 }
   });
  }
  
  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
 }, [debts, extraPayment]);
};