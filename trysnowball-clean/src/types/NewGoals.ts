/**
 * New CP-5 Goals System - Clean, Real Data Only
 * This replaces the existing Goals.ts scaffolding
 */

export type Goal = {
  id: string;
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  targetValue: number;
  currentValue: number;
  forecastDebtId?: string;
  createdAt: string;
  completedAt?: string;
  dismissed?: boolean;
};

export type GoalProgress = {
  id: string;
  percentComplete: number;
  projectedDate?: string;
  achieved: boolean;
  onTrack: boolean;
  impact: {
    interestSaved?: number;
    timeSaved?: number; // months
    description: string;
  };
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  goalType: Goal['type'];
  targetValue: number;
  reasoning: string;
  estimatedImpact: string;
};

export type GoalEvent = {
  goal_id: string;
  goal_type: string;
  action: 'created' | 'completed' | 'dismissed' | 'challenge_accepted';
  user_tier: string;
  debt_id?: string;
  target_value?: number;
  interest_saved?: number;
  time_saved?: number;
};