/**
 * GPT Context Builders for TrySnowball
 * Clean, reusable functions to build context for different GPT agents
 */

import { calculateDebtJourneyState } from './debtJourneyStates';
import { loadUserProfile } from '../lib/userProfile.ts';

/**
 * Build coaching persona hints from user profile
 */
function buildCoachingPersonaHints(profile) {
  const personaHints = [];

  switch (profile.journeyStage) {
    case 'starter':
      personaHints.push('Tone: encouraging, step-by-step, avoid jargon.');
      personaHints.push('Prioritise building first snowball and minimums.');
      break;
    case 'progress':
      personaHints.push('Tone: pragmatic coach, focus on acceleration levers.');
      personaHints.push('Surface Avalanche vs Snowball trade-offs.');
      break;
    case 'optimizer':
      personaHints.push('Tone: expert. Emphasise optimisation and scenario comparisons.');
      personaHints.push('Offer Custom order and extra-payment strategies.');
      break;
  }

  if (profile.debtFocus?.includes('payoff_faster')) {
    personaHints.push('User priority: pay off faster. Recommend highest-impact actions first.');
  }
  if (profile.debtFocus?.includes('stop_paycheck')) {
    personaHints.push('User priority: cashflow relief. Emphasise buffer creation and minimum-risk steps.');
  }
  if (profile.debtFocus?.includes('get_organized')) {
    personaHints.push('User priority: clarity. Provide tidy summaries and next 1–2 actions.');
  }

  return personaHints.join(' ');
}

/**
 * Build comprehensive coaching context from user debts and profile
 */
export const buildGPTCoachContext = (debts, user, options = {}) => {
  const { projections = null, paymentHistory = [], settings = {} } = options;
  
  // Load user profile for personalization
  const profile = loadUserProfile();
  
  // Calculate journey state for personalized context
  const journeyState = calculateDebtJourneyState(debts, paymentHistory, projections);
  
  // Calculate summary metrics
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || debt.amount || 0), 0);
  const totalMinPayments = debts.reduce((sum, debt) => sum + (debt.minPayment || debt.regularPayment || 0), 0);
  const activeDebts = debts.filter(debt => (debt.balance || debt.amount || 0) > 0);
  const clearedDebts = debts.filter(debt => (debt.balance || debt.amount || 0) === 0);

  return {
    // User Profile
    user: {
      name: user?.email?.split('@')[0] || 'User',
      email: user?.email || null,
      accountAge: user?.createdAt ? calculateAccountAge(user.createdAt) : null,
      userId: user?.id || null
    },

    // Debt Summary
    debtSummary: {
      totalDebt,
      totalMinPayments,
      totalDebts: debts.length,
      activeDebts: activeDebts.length,
      clearedDebts: clearedDebts.length,
      averageInterestRate: calculateAverageInterestRate(activeDebts),
      projectedPayoffMonths: projections?.totalMonths || null,
      extraPaymentBudget: settings.extraPayment || 0
    },

    // Individual Debts (limit to 10 for context size)
    debts: activeDebts.slice(0, 10).map(debt => ({
      name: debt.name,
      balance: debt.balance || debt.amount || 0,
      minPayment: debt.minPayment || debt.regularPayment || 0,
      interestRate: debt.interestRate || debt.interest || 0,
      order: debt.order || 999,
      type: debt.type || 'credit_card',
      originalAmount: debt.originalAmount || debt.balance || debt.amount || 0
    })),

    // Recent Progress (if available)
    recentProgress: {
      totalPaid: clearedDebts.reduce((sum, debt) => sum + (debt.originalAmount || 0), 0),
      recentPayments: paymentHistory.slice(-5).map(payment => ({
        amount: payment.amount,
        debtName: debts.find(d => d.id === payment.debtId)?.name || 'Unknown',
        date: payment.paymentDate || payment.recordedAt
      }))
    },

    // Strategy Context
    strategy: {
      method: 'snowball', // TrySnowball uses snowball method
      nextTarget: activeDebts.length > 0 ? activeDebts[0]?.name : null,
      momentum: calculateMomentumScore(debts, paymentHistory)
    },
    
    // Journey Context - Personalization based on user's progress
    journey: {
      state: journeyState.type,
      headline: journeyState.headline,
      body: journeyState.body,
      suggestedAction: journeyState.ctaAction,
      isFirstTime: journeyState.type === 'start',
      isDebtFree: journeyState.type === 'debtFree' || journeyState.type === 'alreadyFree',
      progressStage: getProgressStage(journeyState.type)
    },

    // User Profile & Coaching Personalization
    userProfile: profile,
    coachingPersonaHints: buildCoachingPersonaHints(profile)
  };
};

/**
 * Build context for share message generation
 */
export const buildGPTShareContext = (milestone, debts, user) => {
  return {
    milestone: {
      type: milestone.type,
      debtName: milestone.debtName || null,
      amount: milestone.amount || 0,
      timeframe: milestone.timeframe || null,
      achievedAt: milestone.achievedAt || new Date().toISOString()
    },
    user: {
      name: user?.email?.split('@')[0] || 'User',
      totalDebts: debts.length,
      totalRemaining: debts.reduce((sum, d) => sum + (d.balance || d.amount || 0), 0)
    },
    context: {
      totalClearedThisYear: calculateYearlyProgress(debts),
      isFirstDebt: milestone.type === 'debt_cleared' && debts.filter(d => (d.balance || d.amount || 0) === 0).length === 1,
      isDebtFree: debts.every(d => (d.balance || d.amount || 0) === 0)
    }
  };
};

/**
 * Build context for debt ingestion/parsing
 */
export const buildGPTIngestionContext = (existingDebts = []) => {
  return {
    existingDebts: existingDebts.map(debt => ({
      name: debt.name,
      balance: debt.balance || debt.amount || 0,
      minPayment: debt.minPayment || debt.regularPayment || 0,
      order: debt.order || 999
    })),
    debtCount: existingDebts.length,
    totalExistingDebt: existingDebts.reduce((sum, d) => sum + (d.balance || d.amount || 0), 0),
    validationRules: {
      maxBalance: 1000000,
      minBalance: 0,
      maxMinPayment: 10000,
      reasonableInterestRange: [5, 35]
    }
  };
};

/**
 * Helper function to calculate account age
 */
function calculateAccountAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMonths = Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30));
  
  if (diffMonths < 1) return 'less than a month';
  if (diffMonths === 1) return '1 month';
  if (diffMonths < 12) return `${diffMonths} months`;
  
  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}

/**
 * Calculate average interest rate across active debts
 */
function calculateAverageInterestRate(debts) {
  if (debts.length === 0) return 0;
  
  const totalBalance = debts.reduce((sum, debt) => sum + (debt.balance || debt.amount || 0), 0);
  if (totalBalance === 0) return 0;
  
  const weightedRate = debts.reduce((sum, debt) => {
    const balance = debt.balance || debt.amount || 0;
    const rate = debt.interestRate || debt.interest || 0;
    return sum + (balance * rate);
  }, 0);
  
  return Math.round((weightedRate / totalBalance) * 10) / 10; // Round to 1 decimal
}

/**
 * Get progress stage for GPT context
 */
function getProgressStage(journeyType) {
  const stages = {
    start: 'getting_started',
    early: 'building_momentum', 
    mid: 'making_progress',
    nearly: 'almost_finished',
    debtFree: 'celebrating_success',
    alreadyFree: 'planning_ahead'
  };
  
  return stages[journeyType] || 'unknown';
}

/**
 * Calculate momentum score based on recent progress
 */
function calculateMomentumScore(debts, paymentHistory) {
  // Simple momentum calculation based on recent activity
  const recentPayments = paymentHistory.filter(payment => {
    const paymentDate = new Date(payment.paymentDate || payment.recordedAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return paymentDate > thirtyDaysAgo;
  });
  
  const clearedDebts = debts.filter(debt => (debt.balance || debt.amount || 0) === 0);
  
  if (recentPayments.length > 5) return 'high';
  if (recentPayments.length > 2 || clearedDebts.length > 0) return 'moderate';
  if (recentPayments.length > 0) return 'building';
  return 'starting';
}

/**
 * Calculate total debt paid off this year
 */
function calculateYearlyProgress(debts) {
  const currentYear = new Date().getFullYear();
  
  return debts.reduce((total, debt) => {
    if (!debt.clearedDate) return total;
    
    const clearedYear = new Date(debt.clearedDate).getFullYear();
    if (clearedYear === currentYear) {
      return total + (debt.originalAmount || 0);
    }
    
    return total;
  }, 0);
}

/**
 * Debug helper to log context in development
 */
export const debugContext = (contextType, context) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [GPT Context - ${contextType}]:`, {
      summary: {
        totalDebt: context.debtSummary?.totalDebt,
        debtCount: context.debts?.length || context.debtCount,
        userName: context.user?.name
      },
      fullContext: context
    });
  }
};

export default {
  buildGPTCoachContext,
  buildGPTShareContext,
  buildGPTIngestionContext,
  debugContext
};