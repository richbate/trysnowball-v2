/**
 * CP-5 Entitlement System
 * Free vs Pro feature gating with business rule separation
 */

import { GoalType } from './Goals';

// User Tiers - locked vocabulary
export const USER_TIERS = {
  FREE: 'free',
  PRO: 'pro'
} as const;

export type UserTier = typeof USER_TIERS[keyof typeof USER_TIERS];

// Entitlement Features - locked vocabulary
export const ENTITLEMENT_FEATURES = {
  GOALS_MAX_ACTIVE: 'goals.max_active',
  GOALS_ALLOWED_TYPES: 'goals.allowed_types'
} as const;

export type EntitlementFeature = typeof ENTITLEMENT_FEATURES[keyof typeof ENTITLEMENT_FEATURES];

// Core Entitlement Interface
export interface Entitlement {
  feature: EntitlementFeature;
  tier: UserTier;
  value: number | string[] | boolean;
}

// Entitlement Check Result
export interface EntitlementCheckResult {
  allowed: boolean;
  feature: EntitlementFeature;
  limit_value: number | string[];
  current_usage?: number;
  error?: EntitlementError;
}

// Entitlement Error Types - locked ENUMs
export const ENTITLEMENT_ERRORS = {
  LIMIT_EXCEEDED: 'ENTITLEMENT_LIMIT_EXCEEDED',
  FEATURE_NOT_ALLOWED: 'ENTITLEMENT_FEATURE_NOT_ALLOWED',
  INVALID_TIER: 'ENTITLEMENT_INVALID_TIER',
  CONFIGURATION_ERROR: 'ENTITLEMENT_CONFIGURATION_ERROR'
} as const;

export type EntitlementError = typeof ENTITLEMENT_ERRORS[keyof typeof ENTITLEMENT_ERRORS];

// Entitlement Service Interface
export interface EntitlementService {
  checkFeature(feature: EntitlementFeature, tier: UserTier, currentUsage?: number): EntitlementCheckResult;
  getMaxActive(tier: UserTier): number;
  getAllowedTypes(tier: UserTier): GoalType[];
  canCreateGoal(tier: UserTier, goalType: GoalType, activeGoalCount: number): EntitlementCheckResult;
}

// Business Configuration Type
export interface EntitlementConfig {
  [key: string]: {
    [tier: string]: number | string[] | boolean;
  };
}