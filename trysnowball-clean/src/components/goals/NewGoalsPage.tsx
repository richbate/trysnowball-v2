/**
 * New CP-5 Goals Page - Real Data Integration
 * Replaces the scaffolding with production-ready components
 */

import React, { useState, useEffect } from 'react';
import { Goal, Challenge } from '../../types/NewGoals';
import { goalProgressForUser } from '../../lib/goalProgressHelper';
import { getTierLimits, canCreateGoal, shouldBlurContent } from '../../lib/goalsTierGating';
import { goalAnalytics } from '../../lib/goalAnalytics';
import { GoalTrackerCard } from './GoalTrackerCard';
import { ImpactSummary } from './ImpactSummary';
import { ChallengeCTA } from './ChallengeCTA';
import { simulateCompositeSnowballPlan } from '../../utils/compositeSimulatorV2';
import { UKDebt } from '../../types/UKDebt';
import { useGoals } from '../../hooks/useGoals';
import { useUserTier } from '../../hooks/useUserTier';

interface NewGoalsPageProps {
  debts: UKDebt[];
  extraPerMonth: number;
}

export const NewGoalsPage: React.FC<NewGoalsPageProps> = ({
  debts,
  extraPerMonth,
}) => {
  
  // Use the API-backed goals hook
  const { 
    goals, 
    loading, 
    error,
    createGoal: createGoalApi,
    updateGoal: updateGoalApi,
    dismissGoal: dismissGoalApi,
    syncProgress
  } = useGoals();
  
  // Get user tier from JWT
  const { tierLabel: userTier, isPro, isFree } = useUserTier();
  
  const [showChallenge, setShowChallenge] = useState(true);

  // Calculate forecast using CP-4 engine
  const forecast = simulateCompositeSnowballPlan(debts, extraPerMonth);
  
  // Calculate progress for all goals
  const goalProgress = goalProgressForUser(goals, forecast, debts);
  
  // Get tier restrictions
  const tierLimits = getTierLimits(userTier);
  const shouldBlur = shouldBlurContent(userTier);

  // Sync goal progress when forecast changes
  useEffect(() => {
    if (!loading && goals.length > 0) {
      // Update progress for each goal based on current forecast
      goalProgress.forEach(progress => {
        const currentGoal = goals.find(g => g.id === progress.id);
        if (currentGoal) {
          // Sync current value based on progress percentage
          const calculatedCurrentValue = Math.round((progress.percentComplete / 100) * currentGoal.targetValue);
          if (calculatedCurrentValue !== currentGoal.currentValue) {
            syncProgress(progress.id, calculatedCurrentValue, progress.achieved);
          }
        }
      });
    }
  }, [forecast, goals, loading, syncProgress, goalProgress]);

  const handleCreateGoal = async (type: Goal['type'], targetValue: number, debtId?: string) => {
    const validation = canCreateGoal(userTier, goals.length, type);
    
    if (!validation.allowed) {
      alert(validation.reason);
      return;
    }

    try {
      await createGoalApi({
        type,
        targetValue,
        forecastDebtId: debtId,
      });
      
      // Find the newly created goal to track analytics
      const newGoal = goals[goals.length - 1]; // Latest goal should be the new one
      if (newGoal) {
        goalAnalytics.trackGoalCreated(newGoal, userTier, debts.length);
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleDismissGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goalAnalytics.trackGoalDismissed(goal, userTier);
    }
    
    try {
      await dismissGoalApi(goalId);
    } catch (error) {
      console.error('Failed to dismiss goal:', error);
      alert('Failed to dismiss goal. Please try again.');
    }
  };

  const handleAcceptChallenge = (challenge: Challenge) => {
    goalAnalytics.trackChallengeAccepted(challenge.id, challenge.goalType, userTier);
    
    // Convert challenge to goal
    handleCreateGoal(challenge.goalType, challenge.targetValue);
    setShowChallenge(false);
  };

  const handleDismissChallenge = () => {
    goalAnalytics.trackChallengeDismissed('general_challenge', 'mixed', userTier);
    setShowChallenge(false);
  };

  // Simple goal creation buttons
  const renderQuickActions = () => (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Goals</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Debt Clear Goals */}
        {debts.slice(0, 3).map(debt => (
          <button
            key={debt.id}
            onClick={() => handleCreateGoal('debt_clear', 0, debt.id)}
            className="p-3 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎯</span>
              <span className="font-medium text-sm">Clear Debt</span>
            </div>
            <p className="text-xs text-gray-600 truncate">{debt.name}</p>
            <p className="text-xs font-medium">£{debt.amount.toLocaleString()}</p>
          </button>
        ))}

        {/* Interest Saved Goal */}
        {tierLimits.allowedGoalTypes.includes('interest_saved') && (
          <button
            onClick={() => handleCreateGoal('interest_saved', 1000)}
            className="p-3 border border-gray-200 rounded-lg text-left hover:border-green-300 hover:bg-green-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💰</span>
              <span className="font-medium text-sm">Save Interest</span>
            </div>
            <p className="text-xs text-gray-600">Target: £1,000</p>
          </button>
        )}

        {/* Time Saved Goal */}
        {tierLimits.allowedGoalTypes.includes('time_saved') && (
          <button
            onClick={() => handleCreateGoal('time_saved', 6)}
            className="p-3 border border-gray-200 rounded-lg text-left hover:border-purple-300 hover:bg-purple-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <span className="font-medium text-sm">Save Time</span>
            </div>
            <p className="text-xs text-gray-600">Target: 6 months</p>
          </button>
        )}
      </div>

      {/* Tier limit notice */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {userTier === 'PRO' ? (
            `Pro: ${goals.length}/${tierLimits.maxActiveGoals} goals used`
          ) : (
            <>
              Free: {goals.length}/{tierLimits.maxActiveGoals} goals used. 
              <button className="text-blue-600 hover:underline ml-1">Upgrade to Pro</button> 
              for unlimited goals.
            </>
          )}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Goals Dashboard</h1>
          <p className="text-gray-600">
            Track your debt freedom progress with data-driven goals based on real forecast calculations.
          </p>
        </div>

        {/* Challenge CTA */}
        {showChallenge && debts.length > 0 && (
          <div className="mb-8">
            <ChallengeCTA
              forecast={forecast}
              debts={debts}
              userTier={userTier}
              onAcceptChallenge={handleAcceptChallenge}
              onDismiss={handleDismissChallenge}
            />
          </div>
        )}

        {/* Impact Summary */}
        <div className="mb-8">
          <ImpactSummary
            goalProgress={goalProgress}
            forecast={forecast}
            isBlurred={shouldBlur && goalProgress.length > 1}
          />
        </div>

        {/* Goals Grid */}
        {goals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal, index) => {
                const progress = goalProgress.find(p => p.id === goal.id);
                if (!progress) return null;
                
                return (
                  <GoalTrackerCard
                    key={goal.id}
                    goal={goal}
                    progress={progress}
                    onDismiss={handleDismissGoal}
                    isBlurred={shouldBlur && index > 0}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          {renderQuickActions()}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Set Your First Goal?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Based on your debt profile, we'll track your progress with real data from your forecast.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};