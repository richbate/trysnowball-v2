/**
 * Analytics Infrastructure for TrySnowball Clean
 * PostHog integration with Golden Analytics Event Suite — CP-4.x + CP-5 Goals
 */

import posthog from 'posthog-js';
import { GoalType, GoalStatus } from '../types/Goals';
import { EntitlementFeature } from '../types/Entitlements';

// Golden Analytics Event Suite — CP-4.x
// Events: forecast_run, bucket_cleared, forecast_failed, bucket_interest_breakdown, forecast_compared

// CP-5 Goals Analytics Suite
// Events: goal_created, goal_updated, goal_progressed, goal_achieved, goal_failed, challenge_assigned, entitlement_blocked

// Fixed error code vocabulary for forecast_failed events
export const FORECAST_ERROR_CODES = {
  MISSING_APR: 'MISSING_APR',
  INVALID_BUCKET_SUM: 'INVALID_BUCKET_SUM', 
  MALFORMED_BUCKETS: 'MALFORMED_BUCKETS',
  SIMULATION_ERROR: 'SIMULATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  NEGATIVE_BALANCE: 'NEGATIVE_BALANCE',
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO'
} as const;

export type ForecastErrorCode = typeof FORECAST_ERROR_CODES[keyof typeof FORECAST_ERROR_CODES];

interface ForecastRunEvent {
  mode: 'composite' | 'flat';
  user_id?: string;
  debt_count: number;
  bucket_count: number;
  extra_per_month: number;
  forecast_version: string;
}

interface BucketClearedEvent {
  bucket_label: string;
  debt_name: string;
  apr: number;
  cleared_month: number;
  total_interest_paid: number;
  forecast_version: string;
  user_id?: string;
}

interface ForecastFailedEvent {
  error_code: ForecastErrorCode;
  error_message: string;
  debt_count: number;
  has_buckets: boolean;
  forecast_version: string;
  user_id?: string;
}

interface BucketInterestBreakdownEvent {
  bucket_label: string;
  debt_name: string;
  apr: number;
  interest_total: number;
  forecast_version: string;
  user_id?: string;
}

interface ForecastComparedEvent {
  months_saved: number;
  interest_difference: number;
  percentage_reduction: number;
  composite_months: number;
  flat_months: number;
  debt_count: number;
  bucket_count: number;
  extra_per_month: number;
  forecast_version: string;
  user_id?: string;
}

/**
 * Initialize PostHog analytics
 * In development, events are logged but not sent
 */
export function initializeAnalytics() {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Add actual PostHog project key from environment
    const posthogKey = process.env.REACT_APP_POSTHOG_KEY;
    
    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: 'https://app.posthog.com',
        debug: false,
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  } else {
    console.log('📊 Analytics: Development mode - events logged locally');
  }
}

/**
 * Track forecast run - every simulation
 * Fires at the start of any forecast simulation
 */
export function trackForecastRun(data: ForecastRunEvent) {
  const event = {
    event: 'forecast_run',
    properties: {
      mode: data.mode,
      user_id: data.user_id || getUserId(),
      debt_count: data.debt_count,
      bucket_count: data.bucket_count,
      extra_per_month: typeof data.extra_per_month === 'number' ? parseFloat(data.extra_per_month.toFixed(2)) : 0,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('forecast_run', event.properties);
  }
}

/**
 * Track bucket clearance milestone
 * Fires when a bucket balance reaches zero in simulation
 */
export function trackBucketCleared(data: BucketClearedEvent) {
  const event = {
    event: 'bucket_cleared',
    properties: {
      bucket_label: data.bucket_label,
      debt_name: data.debt_name,
      apr: parseFloat(data.apr.toFixed(1)),
      cleared_month: data.cleared_month,
      total_interest_paid: parseFloat(data.total_interest_paid.toFixed(2)),
      forecast_version: data.forecast_version,
      user_id: data.user_id || getUserId(),
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('bucket_cleared', event.properties);
  }
}

/**
 * Track forecast simulation failures
 * Fires when composite engine cannot run due to invalid data
 */
export function trackForecastFailed(data: ForecastFailedEvent) {
  const event = {
    event: 'forecast_failed',
    properties: {
      error_code: data.error_code,
      error_message: data.error_message,
      debt_count: data.debt_count,
      has_buckets: data.has_buckets,
      forecast_version: data.forecast_version,
      user_id: data.user_id || getUserId(),
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('forecast_failed', event.properties);
  }
}

/**
 * Track bucket interest breakdown - trust/transparency event
 * Fires when interest breakdown is displayed to user
 */
export function trackBucketInterestBreakdown(data: BucketInterestBreakdownEvent) {
  const event = {
    event: 'bucket_interest_breakdown',
    properties: {
      bucket_label: data.bucket_label,
      debt_name: data.debt_name,
      apr: parseFloat(data.apr.toFixed(1)),
      interest_total: parseFloat(data.interest_total.toFixed(2)),
      forecast_version: data.forecast_version,
      user_id: data.user_id || getUserId(),
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('bucket_interest_breakdown', event.properties);
  }
}

/**
 * Track forecast comparison - Pro justification event
 * Fires when composite vs flat comparison is run
 */
export function trackForecastCompared(data: ForecastComparedEvent) {
  const event = {
    event: 'forecast_compared',
    properties: {
      months_saved: data.months_saved,
      interest_difference: parseFloat(data.interest_difference.toFixed(2)),
      percentage_reduction: parseFloat(data.percentage_reduction.toFixed(1)),
      composite_months: data.composite_months,
      flat_months: data.flat_months,
      debt_count: data.debt_count,
      bucket_count: data.bucket_count,
      extra_per_month: typeof data.extra_per_month === 'number' ? parseFloat(data.extra_per_month.toFixed(2)) : 0,
      forecast_version: data.forecast_version,
      user_id: data.user_id || getUserId(),
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('forecast_compared', event.properties);
  }
}

/**
 * Track Pro feature usage
 * General tracking for composite mode adoption
 */
export function trackProFeatureUsed(feature: string, metadata: Record<string, any> = {}) {
  const event = {
    event: 'pro_feature_used',
    properties: {
      feature_name: feature,
      ...metadata,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('pro_feature_used', event.properties);
  }
}

/**
 * Helper to get user identifier for tracking
 * Falls back to anonymous ID if no auth system
 */
export function getUserId(): string {
  // TODO: Integrate with actual auth system
  // For now, use PostHog's anonymous ID or generate stable ID
  if (typeof window !== 'undefined') {
    return posthog.get_distinct_id() || 'anonymous';
  }
  return 'server';
}

/**
 * Development helper to test analytics events
 * Golden Analytics Event Suite — CP-4.x
 */
export function testAnalyticsEvents() {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🧪 Testing Golden Analytics Event Suite — CP-4.x...');
  
  // Test forecast_run event
  trackForecastRun({
    mode: 'composite',
    debt_count: 1,
    bucket_count: 3,
    extra_per_month: 100,
    forecast_version: 'v2.0'
  });
  
  // Test bucket_cleared event
  trackBucketCleared({
    bucket_label: 'Cash Advances',
    debt_name: 'Barclaycard Platinum',
    apr: 27.9,
    cleared_month: 4,
    total_interest_paid: 45.33,
    forecast_version: 'v2.0'
  });
  
  // Test forecast_failed event
  trackForecastFailed({
    error_code: FORECAST_ERROR_CODES.INVALID_BUCKET_SUM,
    error_message: 'Bucket balances do not sum to total debt',
    debt_count: 1,
    has_buckets: true,
    forecast_version: 'v2.0'
  });
  
  // Test bucket_interest_breakdown event
  trackBucketInterestBreakdown({
    bucket_label: 'Cash Advances',
    debt_name: 'Barclaycard Platinum',
    apr: 27.9,
    interest_total: 123.45,
    forecast_version: 'v2.0'
  });
  
  // Test forecast_compared event
  trackForecastCompared({
    months_saved: 6,
    interest_difference: 250.75,
    percentage_reduction: 15.2,
    composite_months: 18,
    flat_months: 24,
    debt_count: 2,
    bucket_count: 6,
    extra_per_month: 150,
    forecast_version: 'v2.0'
  });
  
  console.log('✅ Golden Analytics Event Suite test events fired');
}

// CP-5 Goals Analytics Events
// Locked schema definitions - changes require docs sync

interface GoalCreatedEvent {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  debt_id?: string;
  bucket_id?: string;
  forecast_version: string;
}

interface GoalUpdatedEvent {
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
}

interface GoalProgressedEvent {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  old_value: number;
  new_value: number;
  progress_percent: number;
  target_value: number;
  forecast_version: string;
}

interface GoalAchievedEvent {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  final_value: number;
  days_taken: number;
  ahead_of_schedule: boolean;
  forecast_version: string;
}

interface GoalFailedEvent {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  final_value: number;
  progress_percent: number;
  failure_reason: 'DEADLINE_MISSED' | 'IMPOSSIBLE_TARGET';
  forecast_version: string;
}

interface ChallengeAssignedEvent {
  challenge_id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  suggestion_reason: string;
  confidence_score: number;
  user_accepted: boolean;
  forecast_version: string;
}

interface EntitlementBlockedEvent {
  user_id: string;
  feature: EntitlementFeature;
  user_tier: string;
  limit_value: number | string[];
  attempted_action: string;
  current_usage?: number;
  forecast_version: string;
}

/**
 * Track goal creation - every new goal
 * Fires when user creates any goal type
 */
export function trackGoalCreated(data: GoalCreatedEvent) {
  const event = {
    event: 'goal_created',
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value: parseFloat(data.target_value.toFixed(2)),
      target_date: data.target_date,
      debt_id: data.debt_id,
      bucket_id: data.bucket_id,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('goal_created', event.properties);
  }
}

/**
 * Track goal updates - edits, cancellations, status changes
 * Fires when goal data is modified
 */
export function trackGoalUpdated(data: GoalUpdatedEvent) {
  const event = {
    event: 'goal_updated',
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      old_target_value: data.old_target_value ? parseFloat(data.old_target_value.toFixed(2)) : undefined,
      new_target_value: data.new_target_value ? parseFloat(data.new_target_value.toFixed(2)) : undefined,
      old_target_date: data.old_target_date,
      new_target_date: data.new_target_date,
      old_status: data.old_status,
      new_status: data.new_status,
      update_reason: data.update_reason,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('goal_updated', event.properties);
  }
}

/**
 * Track goal progress - value increases
 * Fires when goal current_value changes (batched to prevent spam)
 */
export function trackGoalProgressed(data: GoalProgressedEvent) {
  const event = {
    event: 'goal_progressed',
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      old_value: parseFloat(data.old_value.toFixed(2)),
      new_value: parseFloat(data.new_value.toFixed(2)),
      progress_percent: parseFloat(data.progress_percent.toFixed(1)),
      target_value: parseFloat(data.target_value.toFixed(2)),
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('goal_progressed', event.properties);
  }
}

/**
 * Track goal achievement - target reached
 * Fires when goal status changes to ACHIEVED
 */
export function trackGoalAchieved(data: GoalAchievedEvent) {
  const event = {
    event: 'goal_achieved',
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value: parseFloat(data.target_value.toFixed(2)),
      final_value: parseFloat(data.final_value.toFixed(2)),
      days_taken: data.days_taken,
      ahead_of_schedule: data.ahead_of_schedule,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('goal_achieved', event.properties);
  }
}

/**
 * Track goal failure - deadline missed or impossible
 * Fires when goal status changes to FAILED
 */
export function trackGoalFailed(data: GoalFailedEvent) {
  const event = {
    event: 'goal_failed',
    properties: {
      goal_id: data.goal_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value: parseFloat(data.target_value.toFixed(2)),
      final_value: parseFloat(data.final_value.toFixed(2)),
      progress_percent: parseFloat(data.progress_percent.toFixed(1)),
      failure_reason: data.failure_reason,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('goal_failed', event.properties);
  }
}

/**
 * Track challenge assignment - system suggestions
 * Fires when user is shown a challenge suggestion (CP-5 assignment, not CP-5.1 generation)
 */
export function trackChallengeAssigned(data: ChallengeAssignedEvent) {
  const event = {
    event: 'challenge_assigned',
    properties: {
      challenge_id: data.challenge_id,
      user_id: data.user_id,
      goal_type: data.goal_type,
      target_value: parseFloat(data.target_value.toFixed(2)),
      target_date: data.target_date,
      suggestion_reason: data.suggestion_reason,
      confidence_score: parseFloat(data.confidence_score.toFixed(1)),
      user_accepted: data.user_accepted,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('challenge_assigned', event.properties);
  }
}

/**
 * Track entitlement blocks - Free vs Pro gating
 * Fires when user hits feature limits
 */
export function trackEntitlementBlocked(data: EntitlementBlockedEvent) {
  const event = {
    event: 'entitlement_blocked',
    properties: {
      user_id: data.user_id,
      feature: data.feature,
      user_tier: data.user_tier,
      limit_value: data.limit_value,
      attempted_action: data.attempted_action,
      current_usage: data.current_usage,
      forecast_version: data.forecast_version,
      timestamp: new Date().toISOString(),
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  } else {
    posthog.capture('entitlement_blocked', event.properties);
  }
}

/**
 * Development helper to test CP-5 goals analytics events
 */
export function testGoalsAnalyticsEvents() {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🧪 Testing CP-5 Goals Analytics Events...');
  
  // Test goal_created event
  trackGoalCreated({
    goal_id: 'goal_test_123',
    user_id: 'user_test_456',
    goal_type: 'DEBT_CLEAR',
    target_value: 5000,
    target_date: '2025-06-01',
    debt_id: 'debt_barclaycard',
    forecast_version: 'v2.0'
  });
  
  // Test goal_updated event
  trackGoalUpdated({
    goal_id: 'goal_test_123',
    user_id: 'user_test_456',
    goal_type: 'DEBT_CLEAR',
    old_target_value: 5000,
    new_target_value: 4500,
    update_reason: 'USER_EDIT',
    forecast_version: 'v2.0'
  });
  
  // Test goal_achieved event
  trackGoalAchieved({
    goal_id: 'goal_test_123',
    user_id: 'user_test_456',
    goal_type: 'DEBT_CLEAR',
    target_value: 4500,
    final_value: 4500,
    days_taken: 120,
    ahead_of_schedule: true,
    forecast_version: 'v2.0'
  });
  
  // Test entitlement_blocked event
  trackEntitlementBlocked({
    user_id: 'user_test_456',
    feature: 'goals.max_active',
    user_tier: 'free',
    limit_value: 1,
    attempted_action: 'CREATE_SECOND_GOAL',
    current_usage: 1,
    forecast_version: 'v2.0'
  });
  
  console.log('✅ CP-5 Goals Analytics Events test complete');
}