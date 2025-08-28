/**
 * Achievements System
 * Pure selectors for bite-size wins, derived from existing debt state
 */

// Achievement types defined as constants for reference
// AchievementKey: 'first_debt_added' | 'first_500_paid' | 'first_debt_cleared' | 
//                'halfway_total_balance' | 'snowball_over_250' | 'snowball_over_500' | 
//                'interest_saved_1k' | 'all_debts_cleared'
// Achievement: { key, label, desc, unlocked, unlockedAt?, emoji? }

export function computeAchievements(ctx) {
  const achievements = [];
  
  // Defensive defaults
  const debts = ctx.debts || [];
  const currentTotalBalance = ctx.currentTotalBalance ?? 
    debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  
  // Use startTotalBalance if provided, otherwise use originalAmount or current balance
  const startTotalBalance = ctx.startTotalBalance ?? 
    debts.reduce((sum, d) => sum + (d.originalAmount || d.startBalance || d.balance || 0), 0);
  
  const principalPaidSoFar = Math.max(0, startTotalBalance - currentTotalBalance);
  const currentSnowball = ctx.currentSnowball || 0;
  const clearedDebts = debts.filter(d => d.balance === 0);
  
  // 1. First debt added
  achievements.push({
    key: 'first_debt_added',
    label: 'First Debt Added',
    desc: 'Started your debt-free journey',
    emoji: '🎯',
    unlocked: debts.length >= 1,
    unlockedAt: debts.length >= 1 ? getFirstAddedDate(debts) : undefined
  });
  
  // 2. First £500 paid
  achievements.push({
    key: 'first_500_paid',
    label: 'First £500 Paid',
    desc: 'Crushed £500 of principal',
    emoji: '💪',
    unlocked: principalPaidSoFar >= 500,
    unlockedAt: principalPaidSoFar >= 500 ? getPaymentMilestoneDate(ctx.timelineActive, 500) : undefined
  });
  
  // 3. First debt cleared
  const firstDebtCleared = clearedDebts.length > 0;
  achievements.push({
    key: 'first_debt_cleared',
    label: 'First Victory',
    desc: 'Eliminated your first debt',
    emoji: '🎉',
    unlocked: firstDebtCleared,
    unlockedAt: ctx.firstClearedAtISO || getFirstClearDate(ctx.timelineActive)
  });
  
  // 4. Halfway to freedom
  const halfwayReached = currentTotalBalance <= startTotalBalance / 2 && startTotalBalance > 0;
  achievements.push({
    key: 'halfway_total_balance',
    label: 'Halfway There',
    desc: 'Crossed the 50% mark',
    emoji: '🏔️',
    unlocked: halfwayReached,
    unlockedAt: halfwayReached ? getHalfwayDate(ctx.timelineActive, startTotalBalance) : undefined
  });
  
  // 5. Snowball over £250
  achievements.push({
    key: 'snowball_over_250',
    label: 'Snowball Building',
    desc: '£250+ monthly snowball',
    emoji: '❄️',
    unlocked: currentSnowball >= 250,
    unlockedAt: currentSnowball >= 250 ? getSnowballMilestoneDate(ctx.timelineActive, 250) : undefined
  });
  
  // 6. Snowball over £500
  achievements.push({
    key: 'snowball_over_500',
    label: 'Avalanche Mode',
    desc: '£500+ monthly snowball',
    emoji: '🏔️',
    unlocked: currentSnowball >= 500,
    unlockedAt: currentSnowball >= 500 ? getSnowballMilestoneDate(ctx.timelineActive, 500) : undefined
  });
  
  // 7. Interest saved £1k (if available)
  if (ctx.interestAvoidedSoFar !== undefined) {
    achievements.push({
      key: 'interest_saved_1k',
      label: 'Smart Saver',
      desc: 'Avoided £1,000 in interest',
      emoji: '🧠',
      unlocked: ctx.interestAvoidedSoFar >= 1000,
      unlockedAt: ctx.interestAvoidedSoFar >= 1000 ? new Date().toISOString() : undefined
    });
  }
  
  // 8. All debts cleared
  const allCleared = debts.length > 0 && debts.every(d => d.balance === 0);
  achievements.push({
    key: 'all_debts_cleared',
    label: 'Debt Free!',
    desc: 'Complete financial freedom',
    emoji: '🚀',
    unlocked: allCleared,
    unlockedAt: allCleared ? getAllClearedDate(ctx.timelineActive) : undefined
  });
  
  return achievements;
}

// Helper functions for deriving dates
function getFirstAddedDate(debts) {
  // Could check localStorage or just use now for simplicity
  return new Date().toISOString();
}

function getPaymentMilestoneDate(timeline, amount) {
  if (!timeline?.length) return new Date().toISOString();
  
  // Find first month where cumulative principal paid >= amount
  // For now, return current date as placeholder
  return new Date().toISOString();
}

function getFirstClearDate(timeline) {
  if (!timeline?.length) return undefined;
  
  // Find first month where any debt hits 0
  for (let monthIdx = 0; monthIdx < timeline.length; monthIdx++) {
    const month = timeline[monthIdx];
    if (month?.items?.some((item) => item.remaining === 0)) {
      // Convert month index to date
      const date = new Date();
      date.setMonth(date.getMonth() + monthIdx);
      return date.toISOString();
    }
  }
  return undefined;
}

function getHalfwayDate(timeline, startTotal) {
  if (!timeline?.length) return new Date().toISOString();
  
  const halfwayPoint = startTotal / 2;
  for (let monthIdx = 0; monthIdx < timeline.length; monthIdx++) {
    const month = timeline[monthIdx];
    const totalRemaining = month?.items?.reduce((sum, item) => 
      sum + (item.remaining || 0), 0) || 0;
    
    if (totalRemaining <= halfwayPoint) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthIdx);
      return date.toISOString();
    }
  }
  return undefined;
}

function getSnowballMilestoneDate(timeline, threshold) {
  if (!timeline?.length) return new Date().toISOString();
  
  // Find first month where snowball >= threshold
  for (let monthIdx = 0; monthIdx < timeline.length; monthIdx++) {
    const month = timeline[monthIdx];
    if (month?.snowball >= threshold) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthIdx);
      return date.toISOString();
    }
  }
  return new Date().toISOString();
}

function getAllClearedDate(timeline) {
  if (!timeline?.length) return undefined;
  
  // Find first month where all debts are 0
  for (let monthIdx = 0; monthIdx < timeline.length; monthIdx++) {
    const month = timeline[monthIdx];
    const allZero = month?.items?.every((item) => item.remaining === 0);
    
    if (allZero && month?.items?.length > 0) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthIdx);
      return date.toISOString();
    }
  }
  return undefined;
}

// Cache start total balance helper
export function cacheStartTotalBalance(debts) {
  const CACHE_KEY = 'SNOWBALL_START_TOTAL';
  
  // Only cache if not already set
  if (!localStorage.getItem(CACHE_KEY)) {
    const startTotal = debts.reduce((sum, d) => 
      sum + (d.originalAmount || d.startBalance || d.balance || 0), 0);
    
    if (startTotal > 0) {
      localStorage.setItem(CACHE_KEY, startTotal.toString());
      localStorage.setItem(CACHE_KEY + '_DATE', new Date().toISOString());
    }
  }
}

export function getCachedStartTotalBalance() {
  const cached = localStorage.getItem('SNOWBALL_START_TOTAL');
  return cached ? parseFloat(cached) : null;
}