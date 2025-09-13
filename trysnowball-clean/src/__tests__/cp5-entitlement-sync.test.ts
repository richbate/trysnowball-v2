/**
 * CP-5 Entitlement Sync Test
 * Tests integration between goals engine and entitlement service
 * Ensures Free vs Pro tier limits are properly enforced
 */

import { GoalsEngine } from '../lib/goalsEngine';
import { USER_TIERS } from '../types/Entitlements';
import { GOAL_TYPES, GOAL_STATUSES } from '../types/Goals';

// Mock analytics to capture events
const mockAnalyticsEvents: any[] = [];

jest.mock('../lib/analytics', () => ({
  trackGoalCreated: (event: any) => mockAnalyticsEvents.push({ type: 'goal_created', ...event }),
  trackEntitlementBlocked: (event: any) => mockAnalyticsEvents.push({ type: 'entitlement_blocked', ...event }),
  trackGoalUpdated: (event: any) => mockAnalyticsEvents.push({ type: 'goal_updated', ...event }),
  trackGoalProgressed: (event: any) => mockAnalyticsEvents.push({ type: 'goal_progressed', ...event }),
  trackGoalAchieved: (event: any) => mockAnalyticsEvents.push({ type: 'goal_achieved', ...event }),
  trackGoalFailed: (event: any) => mockAnalyticsEvents.push({ type: 'goal_failed', ...event }),
  trackChallengeAssigned: (event: any) => mockAnalyticsEvents.push({ type: 'challenge_assigned', ...event })
}));

describe('CP-5 Entitlement Sync Integration Tests', () => {
  let engine: GoalsEngine;

  beforeEach(() => {
    engine = new GoalsEngine();
    mockAnalyticsEvents.length = 0; // Clear events
  });

  describe('Free Tier Limits', () => {
    test('free user can create 1 DEBT_CLEAR goal', async () => {
      const result = await engine.createGoal({
        user_id: 'free_user_1',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.FREE);

      expect(result.success).toBe(true);
      expect(result.goal?.type).toBe(GOAL_TYPES.DEBT_CLEAR);
      expect(result.goal?.status).toBe(GOAL_STATUSES.ACTIVE);

      // Should not fire entitlement_blocked event for allowed action
      const entitlementEvent = mockAnalyticsEvents.find(e => e.type === 'entitlement_blocked');
      expect(entitlementEvent).toBeUndefined();
    });

    test('free user blocked from creating 2nd goal', async () => {
      // Create first goal
      const firstGoal = await engine.createGoal({
        user_id: 'free_user_2',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.FREE);

      expect(firstGoal.success).toBe(true);

      // Try to create second goal (should be blocked)
      const secondGoal = await engine.createGoal({
        user_id: 'free_user_2',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_2'
      }, USER_TIERS.FREE);

      expect(secondGoal.success).toBe(false);
      expect(secondGoal.error).toContain('ENTITLEMENT_LIMIT_EXCEEDED');
      
      // Should fire entitlement_blocked analytics event
      const entitlementEvent = mockAnalyticsEvents.find(e => e.type === 'entitlement_blocked');
      expect(entitlementEvent).toBeDefined();
      expect(entitlementEvent.feature).toBe('goals.max_active');
      expect(entitlementEvent.user_tier).toBe('free');
      expect(entitlementEvent.attempted_action).toBe('CREATE_GOAL');
    });

    test('free user blocked from advanced goal types', async () => {
      // Try to create AMOUNT_PAID goal (Pro only)
      const result = await engine.createGoal({
        user_id: 'free_user_3',
        type: GOAL_TYPES.AMOUNT_PAID,
        target_value: 500,
        target_date: '2025-06-01',
        debt_id: 'debt_loan_1'
      }, USER_TIERS.FREE);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENTITLEMENT');

      // Should fire entitlement_blocked analytics event
      const entitlementEvent = mockAnalyticsEvents.find(e => e.type === 'entitlement_blocked');
      expect(entitlementEvent).toBeDefined();
      expect(entitlementEvent.user_tier).toBe('free');
    });

    test('free user can cancel their single goal and create new one', async () => {
      // Create goal
      const createResult = await engine.createGoal({
        user_id: 'free_user_4',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.FREE);

      expect(createResult.success).toBe(true);

      // Cancel the goal
      const cancelResult = await engine.cancelGoal(createResult.goal!.id);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.goal?.status).toBe(GOAL_STATUSES.CANCELLED);

      // Should be able to create a new goal now
      const newGoal = await engine.createGoal({
        user_id: 'free_user_4',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-07-01',
        debt_id: 'debt_cc_2'
      }, USER_TIERS.FREE);

      expect(newGoal.success).toBe(true);
      expect(newGoal.goal?.status).toBe(GOAL_STATUSES.ACTIVE);

      // Verify only 1 active goal exists
      const activeGoals = engine.getActiveGoalsForUser('free_user_4');
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe(newGoal.goal!.id);
    });
  });

  describe('Pro Tier Privileges', () => {
    test('pro user can create multiple goals', async () => {
      // Create first goal
      const firstGoal = await engine.createGoal({
        user_id: 'pro_user_1',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.PRO);

      expect(firstGoal.success).toBe(true);

      // Create second goal (should succeed for Pro)
      const secondGoal = await engine.createGoal({
        user_id: 'pro_user_1',
        type: GOAL_TYPES.AMOUNT_PAID,
        target_value: 1000,
        target_date: '2025-08-01',
        debt_id: 'debt_loan_1'
      }, USER_TIERS.PRO);

      expect(secondGoal.success).toBe(true);

      // Verify both goals are active
      const activeGoals = engine.getActiveGoalsForUser('pro_user_1');
      expect(activeGoals).toHaveLength(2);

      // Should not fire entitlement_blocked events
      const entitlementEvents = mockAnalyticsEvents.filter(e => e.type === 'entitlement_blocked');
      expect(entitlementEvents).toHaveLength(0);
    });

    test('pro user can create advanced goal types', async () => {
      // Test AMOUNT_PAID goal
      const amountPaidGoal = await engine.createGoal({
        user_id: 'pro_user_2',
        type: GOAL_TYPES.AMOUNT_PAID,
        target_value: 500,
        target_date: '2025-06-01',
        debt_id: 'debt_loan_1'
      }, USER_TIERS.PRO);

      expect(amountPaidGoal.success).toBe(true);

      // Test INTEREST_SAVED goal
      const interestSavedGoal = await engine.createGoal({
        user_id: 'pro_user_2',
        type: GOAL_TYPES.INTEREST_SAVED,
        target_value: 200,
        target_date: '2025-08-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.PRO);

      expect(interestSavedGoal.success).toBe(true);

      // Test TIMEBOUND goal
      const timeboundGoal = await engine.createGoal({
        user_id: 'pro_user_2',
        type: GOAL_TYPES.TIMEBOUND,
        target_value: 0,
        target_date: '2026-01-01'
      }, USER_TIERS.PRO);

      expect(timeboundGoal.success).toBe(true);

      // Verify all goals created successfully
      const allGoals = engine.getGoalsForUser('pro_user_2');
      expect(allGoals).toHaveLength(3);
      
      const goalTypes = allGoals.map(g => g.type);
      expect(goalTypes).toContain(GOAL_TYPES.AMOUNT_PAID);
      expect(goalTypes).toContain(GOAL_TYPES.INTEREST_SAVED);
      expect(goalTypes).toContain(GOAL_TYPES.TIMEBOUND);
    });

    test('pro user has higher active goal limit', async () => {
      const userId = 'pro_user_3';
      
      // Create multiple goals (testing Pro limit)
      const goals = [];
      for (let i = 1; i <= 5; i++) {
        const result = await engine.createGoal({
          user_id: userId,
          type: GOAL_TYPES.DEBT_CLEAR,
          target_value: 0,
          target_date: '2025-06-01',
          debt_id: `debt_${i}`
        }, USER_TIERS.PRO);

        if (result.success) {
          goals.push(result.goal);
        }
      }

      // Pro users should be able to create more than 1 goal
      expect(goals.length).toBeGreaterThan(1);
      
      // Verify active goals count
      const activeGoals = engine.getActiveGoalsForUser(userId);
      expect(activeGoals.length).toBe(goals.length);
      expect(activeGoals.length).toBeGreaterThan(1);
    });
  });

  describe('Cross-User Isolation', () => {
    test('entitlements are enforced per user', async () => {
      // Free user creates their allowed goal
      const freeUserGoal = await engine.createGoal({
        user_id: 'free_user_isolation',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.FREE);

      expect(freeUserGoal.success).toBe(true);

      // Different free user should still be able to create their goal
      const otherFreeUserGoal = await engine.createGoal({
        user_id: 'other_free_user_isolation',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_cc_1'
      }, USER_TIERS.FREE);

      expect(otherFreeUserGoal.success).toBe(true);

      // Pro user should not be affected by free users' limits
      const proUserGoal = await engine.createGoal({
        user_id: 'pro_user_isolation',
        type: GOAL_TYPES.AMOUNT_PAID,
        target_value: 1000,
        target_date: '2025-06-01',
        debt_id: 'debt_loan_1'
      }, USER_TIERS.PRO);

      expect(proUserGoal.success).toBe(true);

      // Verify isolation: each user has their own goals
      expect(engine.getActiveGoalsForUser('free_user_isolation')).toHaveLength(1);
      expect(engine.getActiveGoalsForUser('other_free_user_isolation')).toHaveLength(1);
      expect(engine.getActiveGoalsForUser('pro_user_isolation')).toHaveLength(1);
    });
  });

  describe('Entitlement Analytics', () => {
    test('analytics events capture entitlement context', async () => {
      // Clear previous events
      mockAnalyticsEvents.length = 0;

      // Trigger entitlement block
      const firstGoal = await engine.createGoal({
        user_id: 'analytics_user',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_1'
      }, USER_TIERS.FREE);

      const blockedGoal = await engine.createGoal({
        user_id: 'analytics_user',
        type: GOAL_TYPES.DEBT_CLEAR,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_2'
      }, USER_TIERS.FREE);

      // Verify entitlement_blocked event has correct structure
      const entitlementEvent = mockAnalyticsEvents.find(e => e.type === 'entitlement_blocked');
      expect(entitlementEvent).toBeDefined();
      
      // Required fields for analytics
      expect(entitlementEvent).toHaveProperty('user_id');
      expect(entitlementEvent).toHaveProperty('feature');
      expect(entitlementEvent).toHaveProperty('user_tier');
      expect(entitlementEvent).toHaveProperty('attempted_action');
      expect(entitlementEvent).toHaveProperty('forecast_version');

      // Verify values
      expect(entitlementEvent.feature).toBe('goals.max_active');
      expect(entitlementEvent.user_tier).toBe('free');
      expect(entitlementEvent.attempted_action).toBe('CREATE_GOAL');
      expect(entitlementEvent.forecast_version).toBe('v2.0');
    });
  });
});