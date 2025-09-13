/**
 * CP-5 Goals & Challenges Schema
 * Locked interface definition - changes require docs + fixture sync
 */

// Locked ENUMs - no modifications without CP-5 docs update
export const GOAL_TYPES = {
  DEBT_CLEAR: 'DEBT_CLEAR',
  AMOUNT_PAID: 'AMOUNT_PAID', 
  INTEREST_SAVED: 'INTEREST_SAVED',
  TIMEBOUND: 'TIMEBOUND'
} as const;

export const GOAL_STATUSES = {
  ACTIVE: 'ACTIVE',
  ACHIEVED: 'ACHIEVED',
  FAILED: 'FAILED', 
  CANCELLED: 'CANCELLED'
} as const;

export type GoalType = typeof GOAL_TYPES[keyof typeof GOAL_TYPES];
export type GoalStatus = typeof GOAL_STATUSES[keyof typeof GOAL_STATUSES];

// Core Goal Interface - locked schema from CP-5_GOALS_ENGINE.md
export interface Goal {
  id: string;
  user_id: string;
  debt_id?: string;        // Optional: tie goal to specific debt
  bucket_id?: string;      // Optional: tie goal to specific bucket (Pro only)  
  type: GoalType;
  target_value: number;    // Amount or months, depending on type
  current_value: number;   // Progress tracking
  status: GoalStatus;
  start_date: string;      // ISO YYYY-MM-DD
  target_date: string;     // ISO YYYY-MM-DD
  created_at: string;      // ISO date string
  updated_at: string;      // ISO date string
}

// Validation Rules Interface
export interface GoalValidationRules {
  target_value: (value: number) => boolean;
  date_range: (start: string, target: string) => boolean;
  status_transition: (from: GoalStatus, to: GoalStatus) => boolean;
  unique_debt_clear: (goals: Goal[], newGoal: Partial<Goal>) => boolean;
}

// Goal Creation Input
export interface CreateGoalInput {
  user_id: string;
  debt_id?: string;
  bucket_id?: string;
  type: GoalType;
  target_value: number;
  target_date: string;
}

// Goal Update Input  
export interface UpdateGoalInput {
  id: string;
  target_value?: number;
  target_date?: string;
  status?: GoalStatus;
}

// Goal Progress Event
export interface GoalProgressEvent {
  goal_id: string;
  old_value: number;
  new_value: number;
  progress_percent: number;
  timestamp: string;
}

// Challenge Assignment (CP-5 scope - assignment only)
export interface ChallengeAssignment {
  suggestion_id: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  reason: string;
  context: string;
  user_accepted: boolean;
}

// Validation Error Types
export const GOAL_VALIDATION_ERRORS = {
  INVALID_TARGET_VALUE: 'INVALID_TARGET_VALUE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE', 
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  DUPLICATE_DEBT_CLEAR: 'DUPLICATE_DEBT_CLEAR',
  ENTITLEMENT_LIMIT_EXCEEDED: 'ENTITLEMENT_LIMIT_EXCEEDED',
  INVALID_GOAL_TYPE: 'INVALID_GOAL_TYPE'
} as const;

export type GoalValidationError = typeof GOAL_VALIDATION_ERRORS[keyof typeof GOAL_VALIDATION_ERRORS];

// Goal Engine Response Types
export interface GoalEngineResult {
  success: boolean;
  goal?: Goal;
  error?: GoalValidationError;
  message?: string;
}

export interface GoalProgressResult {
  goal_id: string;
  achieved: boolean;
  failed: boolean;
  progress_percent: number;
  current_value: number;
}