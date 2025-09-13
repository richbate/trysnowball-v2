/**
 * CP-5 Goals Engine - Core Business Logic
 * Handles goal CRUD operations, validation, and progress tracking
 */

import { 
  Goal, 
  GoalType, 
  GoalStatus,
  GOAL_TYPES, 
  GOAL_STATUSES,
  CreateGoalInput,
  UpdateGoalInput,
  GoalEngineResult,
  GoalProgressResult,
  GoalValidationRules,
  GOAL_VALIDATION_ERRORS,
  GoalValidationError,
  ChallengeAssignment
} from '../types/Goals';

import { 
  EntitlementService,
  EntitlementCheckResult,
  USER_TIERS,
  UserTier 
} from '../types/Entitlements';

import { getMaxActiveGoals, getAllowedGoalTypes } from '../config/entitlements';
import { 
  trackGoalCreated, 
  trackGoalUpdated, 
  trackGoalProgressed,
  trackGoalAchieved,
  trackGoalFailed,
  trackEntitlementBlocked,
  trackChallengeAssigned
} from './analytics';

// Validation Rules Implementation
export const goalValidationRules: GoalValidationRules = {
  // Rule: target_value > 0 (except for DEBT_CLEAR where 0 means "cleared")
  target_value: (value: number): boolean => {
    return typeof value === 'number' && value >= 0;
  },

  // Rule: target_date > start_date
  date_range: (start: string, target: string): boolean => {
    const startDate = new Date(start);
    const targetDate = new Date(target);
    return targetDate > startDate;
  },

  // Rule: Status transitions: ACTIVE → [ACHIEVED | FAILED | CANCELLED]
  status_transition: (from: GoalStatus, to: GoalStatus): boolean => {
    const validTransitions: Record<GoalStatus, GoalStatus[]> = {
      [GOAL_STATUSES.ACTIVE]: [
        GOAL_STATUSES.ACHIEVED, 
        GOAL_STATUSES.FAILED, 
        GOAL_STATUSES.CANCELLED
      ],
      [GOAL_STATUSES.ACHIEVED]: [], // Terminal state
      [GOAL_STATUSES.FAILED]: [], // Terminal state
      [GOAL_STATUSES.CANCELLED]: [] // Terminal state
    };

    return validTransitions[from]?.includes(to) || false;
  },

  // Rule: Only one active DEBT_CLEAR goal per debt/bucket
  unique_debt_clear: (goals: Goal[], newGoal: Partial<Goal>): boolean => {
    if (newGoal.type !== GOAL_TYPES.DEBT_CLEAR) return true;
    
    const activeDebtClearGoals = goals.filter(g => 
      g.type === GOAL_TYPES.DEBT_CLEAR && 
      g.status === GOAL_STATUSES.ACTIVE &&
      g.id !== newGoal.id // Exclude current goal for updates
    );

    // Check for same debt_id or bucket_id conflict
    return !activeDebtClearGoals.some(g => 
      (newGoal.debt_id && g.debt_id === newGoal.debt_id) ||
      (newGoal.bucket_id && g.bucket_id === newGoal.bucket_id)
    );
  }
};

// Entitlement Service Implementation
class GoalEntitlementService implements EntitlementService {
  checkFeature(feature: string, tier: UserTier, currentUsage = 0): EntitlementCheckResult {
    try {
      if (feature === 'goals.max_active') {
        const limit = getMaxActiveGoals(tier);
        return {
          allowed: currentUsage < limit,
          feature: feature as any,
          limit_value: limit,
          current_usage: currentUsage,
          error: currentUsage >= limit ? 'ENTITLEMENT_LIMIT_EXCEEDED' as any : undefined
        };
      }

      if (feature === 'goals.allowed_types') {
        const allowedTypes = getAllowedGoalTypes(tier);
        return {
          allowed: true,
          feature: feature as any,
          limit_value: allowedTypes
        };
      }

      return {
        allowed: false,
        feature: feature as any,
        limit_value: [],
        error: 'ENTITLEMENT_CONFIGURATION_ERROR' as any
      };
    } catch (error) {
      return {
        allowed: false,
        feature: feature as any,
        limit_value: [],
        error: 'ENTITLEMENT_CONFIGURATION_ERROR' as any
      };
    }
  }

  getMaxActive(tier: UserTier): number {
    return getMaxActiveGoals(tier);
  }

  getAllowedTypes(tier: UserTier): GoalType[] {
    return getAllowedGoalTypes(tier) as GoalType[];
  }

  canCreateGoal(tier: UserTier, goalType: GoalType, activeGoalCount: number): EntitlementCheckResult {
    // Check max active limit
    const maxCheck = this.checkFeature('goals.max_active', tier, activeGoalCount);
    if (!maxCheck.allowed) {
      return maxCheck;
    }

    // Check allowed types
    const allowedTypes = this.getAllowedTypes(tier);
    if (!allowedTypes.includes(goalType)) {
      return {
        allowed: false,
        feature: 'goals.allowed_types' as any,
        limit_value: allowedTypes,
        error: 'ENTITLEMENT_FEATURE_NOT_ALLOWED' as any
      };
    }

    return {
      allowed: true,
      feature: 'goals.max_active' as any,
      limit_value: maxCheck.limit_value
    };
  }
}

// Core Goals Engine Class
export class GoalsEngine {
  private entitlementService: EntitlementService;
  private goals: Goal[] = []; // In-memory store for now - will be replaced with API calls

  constructor(entitlementService?: EntitlementService) {
    this.entitlementService = entitlementService || new GoalEntitlementService();
  }

  // Validate goal data against all rules
  private validateGoal(goalData: Partial<Goal>, existingGoals: Goal[] = []): GoalValidationError | null {
    // Check target_value > 0
    if (goalData.target_value !== undefined && !goalValidationRules.target_value(goalData.target_value)) {
      return GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE;
    }

    // Check date range
    if (goalData.start_date && goalData.target_date && 
        !goalValidationRules.date_range(goalData.start_date, goalData.target_date)) {
      return GOAL_VALIDATION_ERRORS.INVALID_DATE_RANGE;
    }

    // Check unique debt clear rule
    if (!goalValidationRules.unique_debt_clear(existingGoals, goalData)) {
      return GOAL_VALIDATION_ERRORS.DUPLICATE_DEBT_CLEAR;
    }

    return null;
  }

  // Create new goal with entitlement checks
  async createGoal(input: CreateGoalInput, userTier: UserTier): Promise<GoalEngineResult> {
    try {
      // Validate goal type is in locked vocabulary
      if (!Object.values(GOAL_TYPES).includes(input.type)) {
        return {
          success: false,
          error: GOAL_VALIDATION_ERRORS.INVALID_GOAL_TYPE,
          message: `Invalid goal type: ${input.type}`
        };
      }

      // Check entitlements
      const activeGoalCount = this.goals.filter(g => 
        g.user_id === input.user_id && g.status === GOAL_STATUSES.ACTIVE
      ).length;

      const entitlementCheck = this.entitlementService.canCreateGoal(
        userTier, 
        input.type, 
        activeGoalCount
      );

      if (!entitlementCheck.allowed) {
        // Fire entitlement_blocked analytics event
        trackEntitlementBlocked({
          user_id: input.user_id,
          feature: 'goals.max_active',
          user_tier: userTier,
          limit_value: entitlementCheck.limit_value,
          attempted_action: 'CREATE_GOAL',
          current_usage: activeGoalCount,
          forecast_version: 'v2.0'
        });

        return {
          success: false,
          error: GOAL_VALIDATION_ERRORS.ENTITLEMENT_LIMIT_EXCEEDED,
          message: `Entitlement blocked: ${entitlementCheck.error}`
        };
      }

      // Validate goal data
      const goalData: Partial<Goal> = {
        ...input,
        start_date: new Date().toISOString().split('T')[0], // Today's date
        current_value: 0,
        status: GOAL_STATUSES.ACTIVE
      };

      const validationError = this.validateGoal(goalData, this.goals);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          message: `Validation failed: ${validationError}`
        };
      }

      // Create goal object
      const goal: Goal = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: input.user_id,
        debt_id: input.debt_id,
        bucket_id: input.bucket_id,
        type: input.type,
        target_value: input.target_value,
        current_value: 0,
        status: GOAL_STATUSES.ACTIVE,
        start_date: goalData.start_date!,
        target_date: input.target_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store goal (in-memory for now)
      this.goals.push(goal);

      // Fire goal_created analytics event
      trackGoalCreated({
        goal_id: goal.id,
        user_id: goal.user_id,
        goal_type: goal.type,
        target_value: goal.target_value,
        target_date: goal.target_date,
        debt_id: goal.debt_id,
        bucket_id: goal.bucket_id,
        forecast_version: 'v2.0'
      });

      return {
        success: true,
        goal
      };

    } catch (error) {
      return {
        success: false,
        error: GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE,
        message: `Engine error: ${error}`
      };
    }
  }

  // Update existing goal
  async updateGoal(input: UpdateGoalInput, userTier: UserTier): Promise<GoalEngineResult> {
    try {
      const existingGoal = this.goals.find(g => g.id === input.id);
      if (!existingGoal) {
        return {
          success: false,
          error: GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE,
          message: 'Goal not found'
        };
      }

      // Check status transition if status is being changed
      if (input.status && !goalValidationRules.status_transition(existingGoal.status, input.status)) {
        return {
          success: false,
          error: GOAL_VALIDATION_ERRORS.INVALID_STATUS_TRANSITION,
          message: `Invalid status transition: ${existingGoal.status} → ${input.status}`
        };
      }

      // Validate updated goal data
      const updatedData: Partial<Goal> = {
        ...existingGoal,
        ...input,
        updated_at: new Date().toISOString()
      };

      const validationError = this.validateGoal(updatedData, this.goals);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          message: `Validation failed: ${validationError}`
        };
      }

      // Capture old values for analytics
      const oldValues = {
        target_value: existingGoal.target_value,
        target_date: existingGoal.target_date,
        status: existingGoal.status
      };

      // Apply updates
      Object.assign(existingGoal, updatedData);

      // Fire goal_updated analytics event
      const updateReason = input.status === GOAL_STATUSES.CANCELLED ? 'CANCELLATION' : 
                          (input.target_value || input.target_date) ? 'USER_EDIT' : 'SYSTEM_UPDATE';
      
      trackGoalUpdated({
        goal_id: existingGoal.id,
        user_id: existingGoal.user_id,
        goal_type: existingGoal.type,
        old_target_value: oldValues.target_value !== existingGoal.target_value ? oldValues.target_value : undefined,
        new_target_value: oldValues.target_value !== existingGoal.target_value ? existingGoal.target_value : undefined,
        old_target_date: oldValues.target_date !== existingGoal.target_date ? oldValues.target_date : undefined,
        new_target_date: oldValues.target_date !== existingGoal.target_date ? existingGoal.target_date : undefined,
        old_status: oldValues.status !== existingGoal.status ? oldValues.status : undefined,
        new_status: oldValues.status !== existingGoal.status ? existingGoal.status : undefined,
        update_reason: updateReason,
        forecast_version: 'v2.0'
      });

      return {
        success: true,
        goal: existingGoal
      };

    } catch (error) {
      return {
        success: false,
        error: GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE,
        message: `Update error: ${error}`
      };
    }
  }

  // Cancel goal (status → CANCELLED)
  async cancelGoal(goalId: string): Promise<GoalEngineResult> {
    return this.updateGoal({ 
      id: goalId, 
      status: GOAL_STATUSES.CANCELLED 
    }, USER_TIERS.FREE); // Tier doesn't matter for cancellation
  }

  // Update goal progress
  async updateProgress(goalId: string, newValue: number): Promise<GoalProgressResult> {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const oldValue = goal.current_value;
    goal.current_value = newValue;
    goal.updated_at = new Date().toISOString();

    const progress_percent = Math.min(100, (newValue / goal.target_value) * 100);
    
    // Fire goal_progressed analytics event  
    trackGoalProgressed({
      goal_id: goalId,
      user_id: goal.user_id,
      goal_type: goal.type,
      old_value: oldValue,
      new_value: newValue,
      progress_percent,
      target_value: goal.target_value,
      forecast_version: 'v2.0'
    });
    
    // Check if goal is achieved
    const achieved = newValue >= goal.target_value;
    if (achieved && goal.status === GOAL_STATUSES.ACTIVE) {
      goal.status = GOAL_STATUSES.ACHIEVED;
      
      // Fire goal_achieved analytics event
      const startDate = new Date(goal.start_date);
      const endDate = new Date();
      const daysTaken = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const targetDate = new Date(goal.target_date);
      const aheadOfSchedule = endDate < targetDate;
      
      trackGoalAchieved({
        goal_id: goalId,
        user_id: goal.user_id,
        goal_type: goal.type,
        target_value: goal.target_value,
        final_value: newValue,
        days_taken: daysTaken,
        ahead_of_schedule: aheadOfSchedule,
        forecast_version: 'v2.0'
      });
    }

    // Check if goal failed (past target date with incomplete progress)
    const today = new Date().toISOString().split('T')[0];
    const failed = today > goal.target_date && !achieved && goal.status === GOAL_STATUSES.ACTIVE;
    if (failed) {
      goal.status = GOAL_STATUSES.FAILED;
      
      // Fire goal_failed analytics event
      trackGoalFailed({
        goal_id: goalId,
        user_id: goal.user_id,
        goal_type: goal.type,
        target_value: goal.target_value,
        final_value: newValue,
        progress_percent,
        failure_reason: 'DEADLINE_MISSED',
        forecast_version: 'v2.0'
      });
    }

    return {
      goal_id: goalId,
      achieved,
      failed,
      progress_percent,
      current_value: newValue
    };
  }

  // Get goals for user
  getGoalsForUser(userId: string): Goal[] {
    return this.goals.filter(g => g.user_id === userId);
  }

  // Get active goals for user
  getActiveGoalsForUser(userId: string): Goal[] {
    return this.goals.filter(g => 
      g.user_id === userId && g.status === GOAL_STATUSES.ACTIVE
    );
  }

  // Challenge assignment flow (CP-5 scope - not generation logic)
  // Accepts pre-generated challenges from CP-5.1 and creates goals
  async assignChallenge(assignment: ChallengeAssignment, userTier: UserTier): Promise<GoalEngineResult> {
    try {
      // Check if user accepted the challenge
      if (!assignment.user_accepted) {
        // Fire analytics for rejected challenge
        trackChallengeAssigned({
          challenge_id: assignment.suggestion_id,
          user_id: 'anonymous', // Will be filled by actual auth system
          goal_type: assignment.goal_type,
          target_value: assignment.target_value,
          target_date: assignment.target_date,
          suggestion_reason: assignment.reason,
          confidence_score: 75, // Default confidence for CP-5 
          user_accepted: false,
          forecast_version: 'v2.0'
        });

        return {
          success: false,
          error: GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE,
          message: 'Challenge rejected by user'
        };
      }

      // Create goal from accepted challenge
      const createInput: CreateGoalInput = {
        user_id: 'anonymous', // Will be filled by actual auth system
        type: assignment.goal_type,
        target_value: assignment.target_value,
        target_date: assignment.target_date
      };

      const result = await this.createGoal(createInput, userTier);

      if (result.success && result.goal) {
        // Fire challenge_assigned analytics event for accepted challenge
        trackChallengeAssigned({
          challenge_id: assignment.suggestion_id,
          user_id: result.goal.user_id,
          goal_type: assignment.goal_type,
          target_value: assignment.target_value,
          target_date: assignment.target_date,
          suggestion_reason: assignment.reason,
          confidence_score: 75, // Default confidence for CP-5
          user_accepted: true,
          forecast_version: 'v2.0'
        });
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: GOAL_VALIDATION_ERRORS.INVALID_TARGET_VALUE,
        message: `Challenge assignment error: ${error}`
      };
    }
  }
}

// Export singleton instance
export const goalsEngine = new GoalsEngine();
export default goalsEngine;