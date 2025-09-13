/**
 * CP-5 Golden Test Suite — Goals & Challenges Layer
 * Auto-enforced fixtures prevent implementation drift
 * 
 * Test Coverage:
 * - Goal creation, progression, achievement, failure
 * - Goal cancellation and editing
 * - Challenge assignment
 * - Entitlement blocks (Free vs Pro)
 * - Analytics event validation
 */

import { GoalsEngine } from '../lib/goalsEngine';
import { USER_TIERS } from '../types/Entitlements';
import { GOAL_TYPES, GOAL_STATUSES } from '../types/Goals';
import goldenFixtures from './fixtures/cp5-goals.fixtures.json';

// Mock analytics to capture events for validation
const mockAnalyticsEvents: any[] = [];

jest.mock('../lib/analytics', () => ({
  trackGoalCreated: (event: any) => mockAnalyticsEvents.push({ type: 'goal_created', ...event }),
  trackGoalUpdated: (event: any) => mockAnalyticsEvents.push({ type: 'goal_updated', ...event }),
  trackGoalProgressed: (event: any) => mockAnalyticsEvents.push({ type: 'goal_progressed', ...event }),
  trackGoalAchieved: (event: any) => mockAnalyticsEvents.push({ type: 'goal_achieved', ...event }),
  trackGoalFailed: (event: any) => mockAnalyticsEvents.push({ type: 'goal_failed', ...event }),
  trackChallengeAssigned: (event: any) => mockAnalyticsEvents.push({ type: 'challenge_assigned', ...event }),
  trackEntitlementBlocked: (event: any) => mockAnalyticsEvents.push({ type: 'entitlement_blocked', ...event })
}));

describe('CP-5 Golden Test Suite — Goals Engine', () => {
  let engine: GoalsEngine;

  beforeEach(() => {
    engine = new GoalsEngine();
    mockAnalyticsEvents.length = 0; // Clear events
  });

  describe('Golden Scenario 1: Debt Clear Goal Success', () => {
    test('should match fixture exactly', async () => {
      const fixture = goldenFixtures.debt_clear_goal_success;
      
      // Create goal as per fixture input
      const result = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.DEBT_CLEAR as any,
        target_value: 0, // Debt clearance goal
        target_date: fixture.input.goal.target_date,
        debt_id: fixture.input.goal.debt_id
      }, USER_TIERS.FREE);

      expect(result.success).toBe(true);
      expect(result.goal).toBeDefined();
      expect(result.goal?.type).toBe(GOAL_TYPES.DEBT_CLEAR);

      // Simulate debt clearance in forecast (goal achievement)
      const progressResult = await engine.updateProgress(result.goal!.id, 1); // Debt cleared
      
      expect(progressResult.achieved).toBe(true);
      expect(result.goal?.status).toBe(GOAL_STATUSES.ACHIEVED);

      // Validate analytics event was fired and matches fixture
      const goalAchievedEvent = mockAnalyticsEvents.find(e => e.type === 'goal_achieved');
      expect(goalAchievedEvent).toBeDefined();
      expect(goalAchievedEvent.goal_type).toBe(fixture.expected.analytics_event.properties.goal_type);
      expect(goalAchievedEvent.forecast_version).toBe(fixture.expected.analytics_event.properties.forecast_version);
    });

    test('debt clear goal failed when target date passed', async () => {
      const fixture = goldenFixtures.debt_clear_goal_failure;
      
      // Create goal that should fail (target date in the past)
      const result = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.DEBT_CLEAR as any,
        target_value: 0,
        target_date: fixture.input.goal.target_date, // Date in past
        debt_id: fixture.input.goal.debt_id
      }, USER_TIERS.FREE);

      expect(result.success).toBe(true);
      
      // Simulate time passing and debt not being cleared by target date
      const today = new Date().toISOString().split('T')[0];
      if (today > fixture.input.goal.target_date) {
        const progressResult = await engine.updateProgress(result.goal!.id, 0); // Debt not cleared
        expect(progressResult.failed).toBe(true);

        // Validate analytics event
        const goalFailedEvent = mockAnalyticsEvents.find(e => e.type === 'goal_failed');
        expect(goalFailedEvent).toBeDefined();
        expect(goalFailedEvent.goal_type).toBe(fixture.expected.analytics_event.properties.goal_type);
      }
    });

    test('amount paid goal progression tracked correctly', async () => {
      const fixture = goldenFixtures.amount_paid_goal_progression;
      
      // Create AMOUNT_PAID goal
      const result = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.AMOUNT_PAID as any,
        target_value: fixture.input.goal.target_value,
        target_date: '2025-12-31',
        debt_id: fixture.input.goal.debt_id
      }, USER_TIERS.PRO); // Pro tier for AMOUNT_PAID goals

      expect(result.success).toBe(true);

      // Update progress
      const progressResult = await engine.updateProgress(
        result.goal!.id, 
        fixture.expected.current_value
      );

      expect(progressResult.current_value).toBe(fixture.expected.current_value);
      expect(result.goal?.status).toBe(GOAL_STATUSES.ACTIVE);

      // Validate analytics event
      const goalProgressedEvent = mockAnalyticsEvents.find(e => e.type === 'goal_progressed');
      expect(goalProgressedEvent).toBeDefined();
      expect(goalProgressedEvent.goal_type).toBe(fixture.expected.analytics_event.properties.goal_type);
      expect(Math.round(goalProgressedEvent.progress_percent)).toBe(Math.round(fixture.expected.analytics_event.properties.progress_percentage));
    });

    test('amount paid goal achieved when target reached', async () => {
      const fixture = goldenFixtures.amount_paid_goal_achievement;
      
      // Create AMOUNT_PAID goal
      const result = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.AMOUNT_PAID as any,
        target_value: fixture.input.goal.target_value,
        target_date: '2025-12-31',
        debt_id: fixture.input.goal.debt_id
      }, USER_TIERS.PRO);

      expect(result.success).toBe(true);

      // Update progress to achieve goal (current + payment made >= target)
      const finalValue = fixture.input.goal.current_value + fixture.input.payment_made;
      const progressResult = await engine.updateProgress(result.goal!.id, finalValue);

      expect(progressResult.current_value).toBe(fixture.expected.current_value);
      expect(progressResult.achieved).toBe(true);

      // Validate analytics event
      const goalAchievedEvent = mockAnalyticsEvents.find(e => e.type === 'goal_achieved');
      expect(goalAchievedEvent).toBeDefined();
      expect(goalAchievedEvent.goal_type).toBe(fixture.expected.analytics_event.properties.goal_type);
      expect(goalAchievedEvent.target_value).toBe(fixture.expected.analytics_event.properties.target_value);
    });
  });

  describe('Goal Management Flow', () => {
    test('goal cancellation updates status and fires analytics', async () => {
      const fixture = goldenFixtures.goal_cancellation;
      
      // First create a goal
      const createResult = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.TIMEBOUND as any,
        target_value: 0,
        target_date: fixture.input.goal.target_date
      }, USER_TIERS.PRO);

      expect(createResult.success).toBe(true);

      // Then cancel it
      const cancelResult = await engine.cancelGoal(createResult.goal!.id);
      
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.goal?.status).toBe(GOAL_STATUSES.CANCELLED);

      // Validate analytics event
      const goalUpdatedEvent = mockAnalyticsEvents.find(e => 
        e.type === 'goal_updated' && e.new_status === 'CANCELLED'
      );
      expect(goalUpdatedEvent).toBeDefined();
      expect(goalUpdatedEvent.old_status).toBe('ACTIVE');
      expect(goalUpdatedEvent.new_status).toBe('CANCELLED');
    });

    test('goal editing updates target and fires analytics', async () => {
      const fixture = goldenFixtures.goal_editing;
      
      // First create an INTEREST_SAVED goal
      const createResult = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.INTEREST_SAVED as any,
        target_value: fixture.input.goal.target_value,
        target_date: '2025-12-31'
      }, USER_TIERS.PRO);

      expect(createResult.success).toBe(true);

      // Update the goal's target value
      const updateResult = await engine.updateGoal({
        id: createResult.goal!.id,
        target_value: fixture.input.new_target_value
      }, USER_TIERS.PRO);

      expect(updateResult.success).toBe(true);
      expect(updateResult.goal?.target_value).toBe(fixture.expected.target_value);
      expect(updateResult.goal?.status).toBe(GOAL_STATUSES.ACTIVE);

      // Validate analytics event
      const goalUpdatedEvent = mockAnalyticsEvents.find(e => 
        e.type === 'goal_updated' && e.goal_id === createResult.goal!.id
      );
      expect(goalUpdatedEvent).toBeDefined();
      expect(goalUpdatedEvent.goal_type).toBe(fixture.expected.analytics_event.properties.goal_type);
    });
  });

  describe('Challenge Assignment Flow', () => {
    test('system challenge assigned and tracked', async () => {
      const fixture = goldenFixtures.challenge_assignment;
      
      // Create challenge assignment
      const challengeAssignment = {
        suggestion_id: fixture.input.challenge.id,
        goal_type: GOAL_TYPES.AMOUNT_PAID as any,
        target_value: fixture.input.challenge.target_value,
        target_date: fixture.input.challenge.target_date,
        reason: fixture.input.challenge.suggested_reason,
        user_accepted: true
      };

      const result = await engine.assignChallenge(challengeAssignment, USER_TIERS.PRO);

      expect(result.success).toBe(true);
      expect(result.goal?.status).toBe(GOAL_STATUSES.ACTIVE);

      // Validate analytics event
      const challengeAssignedEvent = mockAnalyticsEvents.find(e => e.type === 'challenge_assigned');
      expect(challengeAssignedEvent).toBeDefined();
      expect(challengeAssignedEvent.challenge_type).toBe(fixture.expected.analytics_event.properties.challenge_type);
      expect(challengeAssignedEvent.target_value).toBe(fixture.expected.analytics_event.properties.target_value);
      expect(challengeAssignedEvent.user_accepted).toBe(true);
    });
  });

  describe('Entitlement Enforcement', () => {
    test('free user blocked from creating second goal', async () => {
      const fixture = goldenFixtures.entitlement_block_max_active;
      
      // Create first goal (should succeed for free user)
      const firstGoal = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.DEBT_CLEAR as any,
        target_value: 0,
        target_date: '2025-06-01',
        debt_id: 'debt_1'
      }, USER_TIERS.FREE);

      expect(firstGoal.success).toBe(true);

      // Try to create second goal (should be blocked for free user)
      const secondGoal = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.DEBT_CLEAR as any,
        target_value: 0,
        target_date: fixture.input.attempted_goal.target_date,
        debt_id: fixture.input.attempted_goal.debt_id
      }, USER_TIERS.FREE);

      expect(secondGoal.success).toBe(false);
      expect(secondGoal.error).toContain('ENTITLEMENT_LIMIT_EXCEEDED');

      // Validate analytics event
      const entitlementBlockedEvent = mockAnalyticsEvents.find(e => e.type === 'entitlement_blocked');
      expect(entitlementBlockedEvent).toBeDefined();
      expect(entitlementBlockedEvent.feature).toBe('goals.max_active');
      expect(entitlementBlockedEvent.user_tier).toBe('free');
    });

    test('free user blocked from creating advanced goal type', async () => {
      const fixture = goldenFixtures.entitlement_block_goal_type;
      
      // Try to create AMOUNT_PAID goal as free user (should be blocked)
      const result = await engine.createGoal({
        user_id: fixture.input.user_id,
        type: GOAL_TYPES.AMOUNT_PAID as any,
        target_value: fixture.input.attempted_goal.target_value,
        target_date: '2025-12-31',
        debt_id: fixture.input.attempted_goal.debt_id
      }, USER_TIERS.FREE);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENTITLEMENT');

      // Validate analytics event
      const entitlementBlockedEvent = mockAnalyticsEvents.find(e => 
        e.type === 'entitlement_blocked' && e.feature === 'goals.max_active'
      );
      expect(entitlementBlockedEvent).toBeDefined();
      expect(entitlementBlockedEvent.user_tier).toBe('free');
    });
  });

  describe('Analytics Data Quality', () => {
    test('all events include required fields', () => {
      const fixtures = Object.values(goldenFixtures);
      
      fixtures.forEach(fixture => {
        if (fixture.expected?.analytics_event) {
          const event = fixture.expected.analytics_event;
          const props = event.properties;
          
          // Required fields check
          expect(props).toHaveProperty('forecast_version', 'v2.0');
          
          // Currency rounding check (when present)
          if (props.target_value !== undefined) {
            expect(Number.isInteger(props.target_value * 100)).toBeTruthy();
          }
          if (props.current_value !== undefined) {
            expect(Number.isInteger(props.current_value * 100)).toBeTruthy();
          }
          
          // Percentage rounding check (when present) 
          if (props.progress_percentage !== undefined) {
            expect(Number.isInteger(props.progress_percentage * 10)).toBeTruthy();
          }
        }
      });
    });

    test('ENUMs are enforced in analytics payloads', () => {
      const validGoalTypes = ['DEBT_CLEAR', 'AMOUNT_PAID', 'INTEREST_SAVED', 'TIMEBOUND'];
      const validGoalStatuses = ['ACTIVE', 'ACHIEVED', 'FAILED', 'CANCELLED'];
      
      const fixtures = Object.values(goldenFixtures);
      
      fixtures.forEach(fixture => {
        if (fixture.expected?.analytics_event?.properties?.goal_type) {
          expect(validGoalTypes).toContain(
            fixture.expected.analytics_event.properties.goal_type
          );
        }
        
        if (fixture.expected?.analytics_event?.properties?.old_status) {
          expect(validGoalStatuses).toContain(
            fixture.expected.analytics_event.properties.old_status
          );
        }
        
        if (fixture.expected?.analytics_event?.properties?.new_status) {
          expect(validGoalStatuses).toContain(
            fixture.expected.analytics_event.properties.new_status
          );
        }
      });
    });
  });

  describe('Fixture Coverage Verification', () => {
    test('all required golden scenarios are present', () => {
      const requiredScenarios = [
        'debt_clear_goal_success',
        'debt_clear_goal_failure', 
        'amount_paid_goal_progression',
        'amount_paid_goal_achievement',
        'goal_cancellation',
        'goal_editing',
        'challenge_assignment',
        'entitlement_block_max_active',
        'entitlement_block_goal_type'
      ];
      
      requiredScenarios.forEach(scenario => {
        expect(goldenFixtures).toHaveProperty(scenario);
        expect(goldenFixtures[scenario]).toHaveProperty('name');
        expect(goldenFixtures[scenario]).toHaveProperty('input');
        expect(goldenFixtures[scenario]).toHaveProperty('expected');
      });
    });

    test('fixtures are deterministic and well-formed', () => {
      Object.entries(goldenFixtures).forEach(([key, fixture]) => {
        // Each fixture has required structure
        expect(fixture).toHaveProperty('name');
        expect(fixture).toHaveProperty('input');
        expect(fixture).toHaveProperty('expected');
        
        // Input has user_id (for analytics)
        expect(fixture.input).toHaveProperty('user_id');
        
        // Expected includes analytics_event (when applicable)
        if (fixture.expected.analytics_event) {
          expect(fixture.expected.analytics_event).toHaveProperty('event');
          expect(fixture.expected.analytics_event).toHaveProperty('properties');
        }
      });
    });
  });
});