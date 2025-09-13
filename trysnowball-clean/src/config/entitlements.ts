/**
 * CP-5 Entitlement Configuration
 * Business rules separated from code logic - modify here to change limits
 */

import { Entitlement, USER_TIERS, ENTITLEMENT_FEATURES } from '../types/Entitlements';
import { GOAL_TYPES } from '../types/Goals';

// Default Entitlement Configuration - matches golden fixtures
export const ENTITLEMENT_DEFAULTS: Entitlement[] = [
  // Free Tier Limits - restrictive by design
  {
    feature: ENTITLEMENT_FEATURES.GOALS_MAX_ACTIVE,
    tier: USER_TIERS.FREE,
    value: 1 // Free users get 1 active goal
  },
  {
    feature: ENTITLEMENT_FEATURES.GOALS_ALLOWED_TYPES,  
    tier: USER_TIERS.FREE,
    value: [GOAL_TYPES.DEBT_CLEAR] // Free users can only set debt clearance goals
  },

  // Pro Tier Limits - generous limits
  {
    feature: ENTITLEMENT_FEATURES.GOALS_MAX_ACTIVE,
    tier: USER_TIERS.PRO, 
    value: 10 // Pro users get 10 active goals
  },
  {
    feature: ENTITLEMENT_FEATURES.GOALS_ALLOWED_TYPES,
    tier: USER_TIERS.PRO,
    value: [
      GOAL_TYPES.DEBT_CLEAR,
      GOAL_TYPES.AMOUNT_PAID, 
      GOAL_TYPES.INTEREST_SAVED,
      GOAL_TYPES.TIMEBOUND
    ] // Pro users get all goal types
  }
];

// Helper to get entitlement value by feature and tier
export function getEntitlementValue(feature: string, tier: string): number | string[] | boolean | undefined {
  const entitlement = ENTITLEMENT_DEFAULTS.find(e => 
    e.feature === feature && e.tier === tier
  );
  return entitlement?.value;
}

// Helper to get max active goals for tier
export function getMaxActiveGoals(tier: string): number {
  const value = getEntitlementValue(ENTITLEMENT_FEATURES.GOALS_MAX_ACTIVE, tier);
  return typeof value === 'number' ? value : 1; // Default to 1 if misconfigured
}

// Helper to get allowed goal types for tier
export function getAllowedGoalTypes(tier: string): string[] {
  const value = getEntitlementValue(ENTITLEMENT_FEATURES.GOALS_ALLOWED_TYPES, tier);
  return Array.isArray(value) ? value : [GOAL_TYPES.DEBT_CLEAR]; // Default to debt clear only
}

export default ENTITLEMENT_DEFAULTS;