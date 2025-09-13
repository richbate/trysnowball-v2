/**
 * Debug test for CP-5 Goals Engine
 */

import { GoalsEngine } from '../lib/goalsEngine';
import { USER_TIERS } from '../types/Entitlements';
import { GOAL_TYPES } from '../types/Goals';

// Mock analytics to capture events for debugging
const mockAnalyticsEvents: any[] = [];

jest.mock('../lib/analytics', () => ({
  trackGoalCreated: (event: any) => {
    console.log('📊 trackGoalCreated called:', event);
    mockAnalyticsEvents.push({ type: 'goal_created', ...event });
  },
  trackEntitlementBlocked: (event: any) => {
    console.log('🚫 trackEntitlementBlocked called:', event);
    mockAnalyticsEvents.push({ type: 'entitlement_blocked', ...event });
  }
}));

describe('Debug Goals Engine', () => {
  let engine: GoalsEngine;

  beforeEach(() => {
    engine = new GoalsEngine();
    mockAnalyticsEvents.length = 0;
    console.log('🔄 Starting new test...');
  });

  test('debug goal creation for free user', async () => {
    console.log('🎯 Creating DEBT_CLEAR goal for FREE user...');
    
    const result = await engine.createGoal({
      user_id: 'test_user_123',
      type: GOAL_TYPES.DEBT_CLEAR as any,
      target_value: 0,
      target_date: '2026-06-01', // Future date
      debt_id: 'debt_cc'
    }, USER_TIERS.FREE);

    console.log('📄 Result:', result);
    console.log('📊 Analytics events:', mockAnalyticsEvents);

    if (!result.success) {
      console.log('❌ Goal creation failed');
      console.log('   Error:', result.error);
      console.log('   Message:', result.message);
    } else {
      console.log('✅ Goal creation successful');
      console.log('   Goal:', result.goal);
    }

    // Let's see what the entitlement service is doing
    const engine2 = new GoalsEngine();
    console.log('🔍 Testing entitlement check directly...');
    
    const activeGoals = engine2.getActiveGoalsForUser('test_user_123');
    console.log('   Active goals count:', activeGoals.length);
  });
});