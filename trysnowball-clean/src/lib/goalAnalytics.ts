/**
 * Goal Analytics Events - PostHog Integration
 * Triggers events for goal lifecycle and user interactions
 */

import { Goal, GoalEvent } from '../types/NewGoals';

// Simple analytics interface - will be connected to PostHog
class GoalAnalytics {
  
  private trackEvent(eventName: string, properties: Record<string, any>) {
    // For now, just log to console - replace with actual PostHog integration
    console.log('[Goal Analytics]', eventName, properties);
    
    // TODO: Replace with actual PostHog call
    // posthog.capture(eventName, properties);
  }

  trackGoalCreated(goal: Goal, userTier: string, debtCount: number) {
    this.trackEvent('goal_created', {
      goal_id: goal.id,
      goal_type: goal.type,
      target_value: goal.targetValue,
      user_tier: userTier,
      debt_id: goal.forecastDebtId,
      total_debts: debtCount,
      created_at: goal.createdAt
    });
  }

  trackGoalCompleted(goal: Goal, userTier: string, timeTaken: number) {
    this.trackEvent('goal_completed', {
      goal_id: goal.id,
      goal_type: goal.type,
      target_value: goal.targetValue,
      user_tier: userTier,
      debt_id: goal.forecastDebtId,
      time_to_complete_days: timeTaken,
      completed_at: goal.completedAt
    });
  }

  trackGoalDismissed(goal: Goal, userTier: string, reason: string = 'user_action') {
    this.trackEvent('goal_dismissed', {
      goal_id: goal.id,
      goal_type: goal.type,
      target_value: goal.targetValue,
      user_tier: userTier,
      debt_id: goal.forecastDebtId,
      reason: reason,
      dismissed_at: new Date().toISOString()
    });
  }

  trackChallengeAccepted(challengeId: string, goalType: string, userTier: string) {
    this.trackEvent('challenge_accepted', {
      challenge_id: challengeId,
      goal_type: goalType,
      user_tier: userTier,
      accepted_at: new Date().toISOString()
    });
  }

  trackChallengeDismissed(challengeId: string, goalType: string, userTier: string) {
    this.trackEvent('challenge_dismissed', {
      challenge_id: challengeId,
      goal_type: goalType,
      user_tier: userTier,
      dismissed_at: new Date().toISOString()
    });
  }

  trackGoalProgress(goal: Goal, progress: number, userTier: string) {
    // Only track progress at meaningful milestones
    if (progress % 25 === 0 || progress === 100) {
      this.trackEvent('goal_progress', {
        goal_id: goal.id,
        goal_type: goal.type,
        progress_percent: progress,
        user_tier: userTier,
        milestone: progress === 100 ? 'completed' : `${progress}%`,
        updated_at: new Date().toISOString()
      });
    }
  }
}

export const goalAnalytics = new GoalAnalytics();