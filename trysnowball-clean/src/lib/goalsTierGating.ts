/**
 * Goals Tier Gating Logic
 * Free vs Pro feature restrictions
 */

export interface TierLimits {
  maxActiveGoals: number;
  allowedGoalTypes: string[];
  showDetailedProgress: boolean;
  showAdvancedChallenges: boolean;
  showInterestBreakdown: boolean;
}

export function getTierLimits(userTier: string): TierLimits {
  switch (userTier) {
    case 'PRO':
      return {
        maxActiveGoals: 10,
        allowedGoalTypes: ['debt_clear', 'interest_saved', 'time_saved'],
        showDetailedProgress: true,
        showAdvancedChallenges: true,
        showInterestBreakdown: true
      };
    
    case 'FREE':
    default:
      return {
        maxActiveGoals: 3,
        allowedGoalTypes: ['debt_clear'],
        showDetailedProgress: false,
        showAdvancedChallenges: false,
        showInterestBreakdown: false
      };
  }
}

export function canCreateGoal(
  userTier: string,
  currentGoalCount: number,
  goalType: string
): { allowed: boolean; reason?: string } {
  
  const limits = getTierLimits(userTier);
  
  if (currentGoalCount >= limits.maxActiveGoals) {
    return {
      allowed: false,
      reason: `${userTier} tier limited to ${limits.maxActiveGoals} active goals. Upgrade to Pro for unlimited goals.`
    };
  }
  
  if (!limits.allowedGoalTypes.includes(goalType)) {
    return {
      allowed: false,
      reason: `${goalType} goals require Pro tier. Upgrade to unlock advanced goal types.`
    };
  }
  
  return { allowed: true };
}

export function shouldBlurContent(userTier: string): boolean {
  return userTier !== 'PRO';
}