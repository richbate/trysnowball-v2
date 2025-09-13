/**
 * CP-5 Analytics Events - Goals & Challenges Layer
 * Privacy-safe analytics for goal tracking and challenge assignment
 * All events use bucketed metadata following CP-3 privacy rules
 */

import { Goal, GoalType, GoalStatus } from '../types/Goals';
import { analytics } from './analyticsPrivacy';

/**
 * CP-5 Analytics Event Types (7 required events)
 */
export const CP5_ANALYTICS_EVENTS = {
  GOAL_CREATED: 'goal_created',
  GOAL_UPDATED: 'goal_updated',
  GOAL_PROGRESSED: 'goal_progressed',
  GOAL_ACHIEVED: 'goal_achieved',
  GOAL_FAILED: 'goal_failed',
  CHALLENGE_ASSIGNED: 'challenge_assigned',
  ENTITLEMENT_BLOCKED: 'entitlement_blocked'
} as const;

/**
 * Analytics Event: goal_created
 * Fired when user creates a new goal
 */
export function trackGoalCreated(data: {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  debt_id?: string;
  bucket_id?: string;
  forecast_version: string;
}) {
  // Bucket target value for privacy
  const targetValueRange = data.target_value === 0 ? 'debt_clear' :
                          data.target_value < 100 ? 'under_100' :
                          data.target_value < 500 ? '100_500' :
                          data.target_value < 1000 ? '500_1k' :
                          data.target_value < 5000 ? '1k_5k' : 'over_5k';

  // Calculate days to target
  const today = new Date();
  const targetDate = new Date(data.target_date);
  const daysToTarget = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const timeframe = daysToTarget <= 30 ? 'under_1_month' :
                   daysToTarget <= 90 ? '1_3_months' :
                   daysToTarget <= 180 ? '3_6_months' :
                   daysToTarget <= 365 ? '6_12_months' : 'over_1_year';

  const event = {
    event: CP5_ANALYTICS_EVENTS.GOAL_CREATED,
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value_range: targetValueRange,
      target_timeframe: timeframe,
      days_to_target: Math.min(daysToTarget, 1825), // Cap at 5 years
      has_debt_id: !!data.debt_id,
      has_bucket_id: !!data.bucket_id,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: goal_updated
 * Fired when user modifies an existing goal
 */
export function trackGoalUpdated(data: {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  old_target_value?: number;
  new_target_value?: number;
  old_target_date?: string;
  new_target_date?: string;
  old_status?: GoalStatus;
  new_status?: GoalStatus;
  update_reason: 'USER_EDIT' | 'CANCELLATION' | 'SYSTEM_UPDATE';
  forecast_version: string;
}) {
  // Bucket target values for privacy
  const bucketValue = (value?: number) => {
    if (value === undefined) return undefined;
    return value === 0 ? 'debt_clear' :
           value < 100 ? 'under_100' :
           value < 500 ? '100_500' :
           value < 1000 ? '500_1k' :
           value < 5000 ? '1k_5k' : 'over_5k';
  };

  // Calculate date change direction
  let dateChangeDirection: string | undefined;
  if (data.old_target_date && data.new_target_date) {
    const oldDate = new Date(data.old_target_date);
    const newDate = new Date(data.new_target_date);
    dateChangeDirection = newDate > oldDate ? 'extended' : 
                         newDate < oldDate ? 'shortened' : 'unchanged';
  }

  const event = {
    event: CP5_ANALYTICS_EVENTS.GOAL_UPDATED,
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      old_target_value_range: bucketValue(data.old_target_value),
      new_target_value_range: bucketValue(data.new_target_value),
      old_status: data.old_status,
      new_status: data.new_status,
      update_reason: data.update_reason,
      date_change_direction: dateChangeDirection,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: goal_progressed
 * Fired when goal progress is updated (usually from forecast integration)
 */
export function trackGoalProgressed(data: {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  old_value: number;
  new_value: number;
  progress_percent: number;
  target_value: number;
  forecast_version: string;
}) {
  // Calculate progress buckets
  const progressBand = data.progress_percent < 25 ? '0_25' :
                      data.progress_percent < 50 ? '25_50' :
                      data.progress_percent < 75 ? '50_75' :
                      data.progress_percent < 100 ? '75_100' : '100_plus';

  // Calculate progression magnitude
  const progressIncrease = data.new_value - data.old_value;
  const increasePercent = data.old_value > 0 ? (progressIncrease / data.old_value) * 100 : 0;
  
  const progressMagnitude = increasePercent < 5 ? 'small' :
                           increasePercent < 20 ? 'medium' :
                           increasePercent < 50 ? 'large' : 'major';

  const event = {
    event: CP5_ANALYTICS_EVENTS.GOAL_PROGRESSED,
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      progress_percent: Math.round(data.progress_percent * 10) / 10, // 1dp
      progress_band: progressBand,
      progress_magnitude: progressMagnitude,
      is_major_milestone: data.progress_percent >= 50 && data.progress_percent < 60,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: goal_achieved
 * Fired when goal target is reached
 */
export function trackGoalAchieved(data: {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  final_value: number;
  days_taken: number;
  ahead_of_schedule: boolean;
  forecast_version: string;
}) {
  // Bucket completion time
  const completionTimeframe = data.days_taken <= 30 ? 'under_1_month' :
                             data.days_taken <= 90 ? '1_3_months' :
                             data.days_taken <= 180 ? '3_6_months' :
                             data.days_taken <= 365 ? '6_12_months' : 'over_1_year';

  // Calculate overachievement
  const overachievement = data.final_value > data.target_value;
  const overachievementPercent = overachievement 
    ? ((data.final_value - data.target_value) / data.target_value) * 100 
    : 0;

  const event = {
    event: CP5_ANALYTICS_EVENTS.GOAL_ACHIEVED,
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      completion_timeframe: completionTimeframe,
      days_taken: Math.min(data.days_taken, 1825), // Cap at 5 years
      ahead_of_schedule: data.ahead_of_schedule,
      overachieved: overachievement,
      overachievement_percent: Math.round(overachievementPercent * 10) / 10, // 1dp
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: goal_failed
 * Fired when goal deadline passes without achievement
 */
export function trackGoalFailed(data: {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  final_value: number;
  progress_percent: number;
  failure_reason: 'DEADLINE_MISSED' | 'USER_CANCELLED' | 'FORECAST_CHANGED';
  forecast_version: string;
}) {
  // Bucket final progress
  const finalProgressBand = data.progress_percent < 25 ? '0_25' :
                           data.progress_percent < 50 ? '25_50' :
                           data.progress_percent < 75 ? '50_75' : '75_100';

  // Classify failure severity
  const failureSeverity = data.progress_percent < 10 ? 'early_abandon' :
                         data.progress_percent < 50 ? 'mid_struggle' :
                         data.progress_percent < 90 ? 'near_miss' : 'very_close';

  const event = {
    event: CP5_ANALYTICS_EVENTS.GOAL_FAILED,
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      final_progress_percent: Math.round(data.progress_percent * 10) / 10, // 1dp
      final_progress_band: finalProgressBand,
      failure_reason: data.failure_reason,
      failure_severity: failureSeverity,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: challenge_assigned
 * Fired when system assigns a challenge to user (from CP-5.1)
 */
export function trackChallengeAssigned(data: {
  challenge_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  suggestion_reason: string;
  confidence_score: number;
  user_accepted: boolean;
  forecast_version: string;
}) {
  // Bucket target value
  const targetValueRange = data.target_value === 0 ? 'debt_clear' :
                          data.target_value < 100 ? 'under_100' :
                          data.target_value < 500 ? '100_500' :
                          data.target_value < 1000 ? '500_1k' :
                          data.target_value < 5000 ? '1k_5k' : 'over_5k';

  // Calculate challenge timeframe
  const today = new Date();
  const targetDate = new Date(data.target_date);
  const daysToTarget = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const challengeTimeframe = daysToTarget <= 30 ? 'under_1_month' :
                            daysToTarget <= 90 ? '1_3_months' :
                            daysToTarget <= 180 ? '3_6_months' : 'over_6_months';

  // Bucket confidence score
  const confidenceLevel = data.confidence_score < 50 ? 'low' :
                         data.confidence_score < 80 ? 'medium' : 'high';

  const event = {
    event: CP5_ANALYTICS_EVENTS.CHALLENGE_ASSIGNED,
    properties: {
      challenge_id: data.challenge_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value_range: targetValueRange,
      challenge_timeframe: challengeTimeframe,
      suggestion_reason: data.suggestion_reason,
      confidence_level: confidenceLevel,
      confidence_score: Math.round(data.confidence_score),
      user_accepted: data.user_accepted,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: entitlement_blocked
 * Fired when user hits entitlement limit
 */
export function trackEntitlementBlocked(data: {
  user_id: string;
  feature: string;
  user_tier: string;
  limit_value: any;
  attempted_action: string;
  current_usage?: number;
  forecast_version: string;
}) {
  // Classify limit type
  const limitType = typeof data.limit_value === 'number' ? 'numeric' :
                   Array.isArray(data.limit_value) ? 'list' : 'other';

  // Calculate usage percentage for numeric limits
  const usagePercent = (typeof data.limit_value === 'number' && data.current_usage !== undefined)
    ? Math.round((data.current_usage / data.limit_value) * 100)
    : undefined;

  const event = {
    event: CP5_ANALYTICS_EVENTS.ENTITLEMENT_BLOCKED,
    properties: {
      user_id: data.user_id,
      feature: data.feature,
      user_tier: data.user_tier,
      limit_type: limitType,
      attempted_action: data.attempted_action,
      current_usage: data.current_usage,
      usage_percent: usagePercent,
      limit_hit: true,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Main CP-5 analytics interface
 */
export const cp5Analytics = {
  // Goal events
  goalCreated: (data: Parameters<typeof trackGoalCreated>[0]) =>
    console.log('CP5 Analytics: goalCreated', data),
    
  goalUpdated: (data: Parameters<typeof trackGoalUpdated>[0]) =>
    console.log('CP5 Analytics: goalUpdated', data),
    
  goalProgressed: (data: Parameters<typeof trackGoalProgressed>[0]) =>
    console.log('CP5 Analytics: goalProgressed', data),
    
  goalAchieved: (data: Parameters<typeof trackGoalAchieved>[0]) =>
    console.log('CP5 Analytics: goalAchieved', data),
    
  goalFailed: (data: Parameters<typeof trackGoalFailed>[0]) =>
    console.log('CP5 Analytics: goalFailed', data),
    
  challengeAssigned: (data: Parameters<typeof trackChallengeAssigned>[0]) =>
    console.log('CP5 Analytics: challengeAssigned', data),
    
  entitlementBlocked: (data: Parameters<typeof trackEntitlementBlocked>[0]) =>
    console.log('CP5 Analytics: entitlementBlocked', data),
  
  // Generators for testing
  generateGoalCreatedEvent: trackGoalCreated,
  generateGoalUpdatedEvent: trackGoalUpdated,
  generateGoalProgressedEvent: trackGoalProgressed,
  generateGoalAchievedEvent: trackGoalAchieved,
  generateGoalFailedEvent: trackGoalFailed,
  generateChallengeAssignedEvent: trackChallengeAssigned,
  generateEntitlementBlockedEvent: trackEntitlementBlocked
};

export default cp5Analytics;