/**
 * CP-5 Forecast Integration Layer
 * Connects goals engine to real forecast data from CP-2/CP-4 engines
 * Tracks goal progress based on actual debt simulation results
 */

import { UKDebt } from '../types/UKDebt';
import { Goal, GOAL_TYPES, GOAL_STATUSES, GoalProgressResult } from '../types/Goals';
import { simulateSnowballPlanV1, ForecastResultV1 } from '../utils/snowballSimulatorV1';
import { simulateCompositeSnowballPlan, ForecastResultV2 } from '../utils/compositeSimulatorV2';
import { UserTier, USER_TIERS } from '../types/Entitlements';
import { GoalsEngine } from './goalsEngine';

export interface ForecastGoalUpdate {
  goalId: string;
  oldValue: number;
  newValue: number;
  progressPercent: number;
  achieved: boolean;
  failed: boolean;
  debtClearedDate?: string;
  projectedCompletionDate?: string;
}

export interface GoalsForecastResult {
  forecastResult: ForecastResultV1 | ForecastResultV2;
  goalUpdates: ForecastGoalUpdate[];
  engine: 'CP-2' | 'CP-4';
}

/**
 * Calculates goal progress based on forecast simulation results
 */
export class ForecastIntegrationService {
  private goalsEngine: GoalsEngine;

  constructor(goalsEngine: GoalsEngine) {
    this.goalsEngine = goalsEngine;
  }

  /**
   * Run forecast and update all active goals with progress
   */
  async runForecastWithGoalTracking(
    debts: UKDebt[],
    extraPerMonth: number,
    userTier: UserTier,
    userId: string,
    startDate: Date = new Date()
  ): Promise<GoalsForecastResult> {
    
    // Determine which engine to use based on debt complexity and user tier
    const hasMultiAPRDebts = debts.some(debt => debt.buckets && debt.buckets.length > 1);
    const useCompositeEngine = hasMultiAPRDebts && userTier !== USER_TIERS.FREE;
    
    let forecastResult: ForecastResultV1 | ForecastResultV2;
    let engine: 'CP-2' | 'CP-4';

    if (useCompositeEngine) {
      forecastResult = simulateCompositeSnowballPlan(debts, extraPerMonth, startDate);
      engine = 'CP-4';
    } else {
      forecastResult = simulateSnowballPlanV1(debts, extraPerMonth, startDate);
      engine = 'CP-2';
    }

    // Get user's active goals
    const activeGoals = this.goalsEngine.getActiveGoalsForUser(userId);
    
    // Update each goal based on forecast results
    const goalUpdates: ForecastGoalUpdate[] = [];
    
    for (const goal of activeGoals) {
      const update = await this.updateGoalFromForecast(goal, forecastResult, engine);
      if (update) {
        goalUpdates.push(update);
      }
    }

    return {
      forecastResult,
      goalUpdates,
      engine
    };
  }

  /**
   * Update a single goal based on forecast results
   */
  private async updateGoalFromForecast(
    goal: Goal,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): Promise<ForecastGoalUpdate | null> {
    
    try {
      const oldValue = goal.current_value;
      let newValue: number;
      let debtClearedDate: string | undefined;
      let projectedCompletionDate: string | undefined;

      switch (goal.type) {
        case GOAL_TYPES.DEBT_CLEAR:
          newValue = this.calculateDebtClearProgress(goal, forecastResult, engine);
          debtClearedDate = this.getDebtClearedDate(goal.debt_id!, forecastResult, engine);
          break;

        case GOAL_TYPES.AMOUNT_PAID:
          newValue = this.calculateAmountPaidProgress(goal, forecastResult, engine);
          projectedCompletionDate = this.getProjectedCompletionDate(goal, forecastResult, engine);
          break;

        case GOAL_TYPES.INTEREST_SAVED:
          newValue = this.calculateInterestSavedProgress(goal, forecastResult, engine);
          projectedCompletionDate = this.getProjectedCompletionDate(goal, forecastResult, engine);
          break;

        case GOAL_TYPES.TIMEBOUND:
          newValue = this.calculateTimeboundProgress(goal, forecastResult, engine);
          break;

        default:
          // Unknown goal type, skip
          return null;
      }

      // Update goal progress in engine
      const progressResult = await this.goalsEngine.updateProgress(goal.id, newValue);
      
      const progressPercent = goal.target_value > 0 
        ? Math.min(100, (newValue / goal.target_value) * 100)
        : (newValue >= goal.target_value ? 100 : 0);

      return {
        goalId: goal.id,
        oldValue,
        newValue,
        progressPercent,
        achieved: progressResult.achieved,
        failed: progressResult.failed,
        debtClearedDate,
        projectedCompletionDate
      };

    } catch (error) {
      console.error(`Failed to update goal ${goal.id}:`, error);
      return null;
    }
  }

  /**
   * Calculate debt clear progress (0 = not cleared, 1 = cleared)
   */
  private calculateDebtClearProgress(
    goal: Goal, 
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): number {
    if (!goal.debt_id) return 0;

    if (engine === 'CP-4') {
      const result = forecastResult as ForecastResultV2;
      
      // Check if debt is paid off in any month
      const debtPaidOff = result.monthlySnapshots.some(snapshot => 
        snapshot.debts[goal.debt_id!]?.isPaidOff
      );
      
      return debtPaidOff ? 1 : 0;
    } else {
      const result = forecastResult as ForecastResultV1;
      
      // Check if debt is paid off in any month
      const debtPaidOff = result.monthlySnapshots.some(snapshot =>
        snapshot.debts[goal.debt_id!]?.isPaidOff
      );
      
      return debtPaidOff ? 1 : 0;
    }
  }

  /**
   * Calculate amount paid progress (cumulative principal payments)
   */
  private calculateAmountPaidProgress(
    goal: Goal,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): number {
    if (!goal.debt_id) return 0;

    if (engine === 'CP-4') {
      const result = forecastResult as ForecastResultV2;
      
      // Sum up all principal payments for this debt
      let totalPrincipalPaid = 0;
      for (const snapshot of result.monthlySnapshots) {
        const debt = snapshot.debts[goal.debt_id!];
        if (debt) {
          totalPrincipalPaid += debt.totalPrincipal;
        }
      }
      
      return totalPrincipalPaid;
    } else {
      const result = forecastResult as ForecastResultV1;
      
      // Sum up all principal payments for this debt
      let totalPrincipalPaid = 0;
      for (const snapshot of result.monthlySnapshots) {
        const debt = snapshot.debts[goal.debt_id!];
        if (debt) {
          totalPrincipalPaid += debt.principal || 0;
        }
      }
      
      return totalPrincipalPaid;
    }
  }

  /**
   * Calculate interest saved progress
   */
  private calculateInterestSavedProgress(
    goal: Goal,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): number {
    // Interest saved requires baseline comparison - simplified for CP-5
    // In a full implementation, we'd run two forecasts (with/without extra payments)
    // For now, return a proportion of total interest saved
    
    if (engine === 'CP-4') {
      const result = forecastResult as ForecastResultV2;
      // Use total interest paid as proxy for interest saved calculation
      return Math.min(goal.target_value, result.totalInterestPaid * 0.1); // 10% approximation
    } else {
      const result = forecastResult as ForecastResultV1;
      return Math.min(goal.target_value, result.totalInterestPaid * 0.1); // 10% approximation
    }
  }

  /**
   * Calculate timebound progress (debt-free by target date)
   */
  private calculateTimeboundProgress(
    goal: Goal,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): number {
    const targetDate = new Date(goal.target_date);
    const freedomDate = new Date(forecastResult.freedomDate);
    
    // If we're debt-free before target date, goal is achieved (value = 1)
    // If we're not debt-free by target date, goal failed (value = 0)
    return freedomDate <= targetDate ? 1 : 0;
  }

  /**
   * Get the date when a specific debt is cleared
   */
  private getDebtClearedDate(
    debtId: string,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): string | undefined {
    
    if (engine === 'CP-4') {
      const result = forecastResult as ForecastResultV2;
      
      const clearSnapshot = result.monthlySnapshots.find(snapshot => 
        ((snapshot as any).newlyPaidOffDebts || []).includes(debtId)
      );
      
      if (clearSnapshot) {
        const clearDate = new Date();
        clearDate.setMonth(clearDate.getMonth() + clearSnapshot.month);
        return clearDate.toISOString().split('T')[0];
      }
    } else {
      const result = forecastResult as ForecastResultV1;
      
      const clearSnapshot = result.monthlySnapshots.find(snapshot =>
        ((snapshot as any).newlyPaidOffDebts || []).includes(debtId)
      );
      
      if (clearSnapshot) {
        const clearDate = new Date();
        clearDate.setMonth(clearDate.getMonth() + clearSnapshot.month);
        return clearDate.toISOString().split('T')[0];
      }
    }
    
    return undefined;
  }

  /**
   * Get projected completion date for amount-based goals
   */
  private getProjectedCompletionDate(
    goal: Goal,
    forecastResult: ForecastResultV1 | ForecastResultV2,
    engine: 'CP-2' | 'CP-4'
  ): string | undefined {
    
    // Find the month where cumulative progress reaches target
    const targetValue = goal.target_value;
    let cumulativeProgress = 0;
    
    if (engine === 'CP-4') {
      const result = forecastResult as ForecastResultV2;
      
      for (const snapshot of result.monthlySnapshots) {
        if (goal.debt_id && snapshot.debts[goal.debt_id]) {
          const debt = snapshot.debts[goal.debt_id];
          
          if (goal.type === GOAL_TYPES.AMOUNT_PAID) {
            cumulativeProgress += debt.totalPrincipal;
          } else if (goal.type === GOAL_TYPES.INTEREST_SAVED) {
            cumulativeProgress += debt.totalInterest * 0.1; // Approximation
          }
          
          if (cumulativeProgress >= targetValue) {
            const projectedDate = new Date();
            projectedDate.setMonth(projectedDate.getMonth() + snapshot.month);
            return projectedDate.toISOString().split('T')[0];
          }
        }
      }
    } else {
      const result = forecastResult as ForecastResultV1;
      
      for (const snapshot of result.monthlySnapshots) {
        if (goal.debt_id && snapshot.debts[goal.debt_id]) {
          const debt = snapshot.debts[goal.debt_id];
          
          if (goal.type === GOAL_TYPES.AMOUNT_PAID) {
            cumulativeProgress += debt.principal || 0;
          } else if (goal.type === GOAL_TYPES.INTEREST_SAVED) {
            cumulativeProgress += (debt.interest || 0) * 0.1; // Approximation
          }
          
          if (cumulativeProgress >= targetValue) {
            const projectedDate = new Date();
            projectedDate.setMonth(projectedDate.getMonth() + snapshot.month);
            return projectedDate.toISOString().split('T')[0];
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Run forecast for goal planning (without updating existing goals)
   */
  async runForecastForGoalPlanning(
    debts: UKDebt[],
    extraPerMonth: number,
    userTier: UserTier,
    startDate: Date = new Date()
  ): Promise<{ result: ForecastResultV1 | ForecastResultV2; engine: 'CP-2' | 'CP-4' }> {
    
    const hasMultiAPRDebts = debts.some(debt => debt.buckets && debt.buckets.length > 1);
    const useCompositeEngine = hasMultiAPRDebts && userTier !== USER_TIERS.FREE;
    
    if (useCompositeEngine) {
      return {
        result: simulateCompositeSnowballPlan(debts, extraPerMonth, startDate),
        engine: 'CP-4'
      };
    } else {
      return {
        result: simulateSnowballPlanV1(debts, extraPerMonth, startDate),
        engine: 'CP-2'
      };
    }
  }
}

// Export singleton instance
export const forecastIntegration = new ForecastIntegrationService(
  // Will be injected by the app's dependency injection
  {} as GoalsEngine
);

export default ForecastIntegrationService;