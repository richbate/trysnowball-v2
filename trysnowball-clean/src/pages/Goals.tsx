/**
 * CP-5 Goals & Challenges Dashboard
 * Glassmorphism + Purple Theme with Real Data Integration
 */

import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useUserTier } from '../hooks/useUserTier';
import { useDebts } from '../hooks/useDebts';
import { simulateCompositeSnowballPlan } from '../utils/compositeSimulatorV2';
import { GoalTrackerCard } from '../components/goals/GoalTrackerCard';
import { ChallengeTile } from '../components/goals/ChallengeTile';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { generateSmartChallenges } from '../lib/simpleChallengGenerator';
import { Challenge } from '../types/NewGoals';

export default function Goals() {
  const { goals, loading, error, createGoal, dismissGoal } = useGoals();
  const { isPro, isFree, tierLabel } = useUserTier();
  const { data: debts = [] } = useDebts();
  const extraPerMonth = 200; // Default extra payment amount
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllChallenges, setShowAllChallenges] = useState(false);

  // Calculate forecast and progress  
  const forecast = simulateCompositeSnowballPlan(debts, extraPerMonth);
  const challenges = generateSmartChallenges(forecast, debts, goals);

  // Tier restrictions
  const maxGoals = isFree ? 3 : 999;
  const canCreateMore = goals.length < maxGoals;

  const handleCreateGoal = async (goalData: any) => {
    try {
      await createGoal(goalData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleAcceptChallenge = async (challenge: any) => {
    try {
      const goalData = {
        type: challenge.goalType,
        targetValue: challenge.targetValue,
        forecastDebtId: challenge.debtId,
      };
      await createGoal(goalData);
    } catch (error) {
      console.error('Failed to accept challenge:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Your Debt Goals & Challenges
                </h1>
                <p className="text-white/80">
                  Track your progress and stay on plan
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={!canCreateMore}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  ➕ Add New Goal
                </button>
                
                <button
                  onClick={() => setShowAllChallenges(!showAllChallenges)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  🎯 View All Challenges
                </button>
              </div>
            </div>
          </div>

          {/* Tier Banner */}
          {isFree && goals.length >= 2 && (
            <div className="mt-4 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 backdrop-blur-md rounded-xl border border-yellow-400/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="text-white font-medium">
                      {goals.length}/{maxGoals} free goals used
                    </p>
                    <p className="text-white/80 text-sm">
                      Upgrade to unlock unlimited goals and advanced features
                    </p>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Your Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Your Goals</h2>
          
          {goals.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Set Your First Goal?</h3>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                Based on your debt profile, we'll track your progress with real data from your forecast.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal, index) => {
                const shouldBlur = isFree && index >= 3;
                
                return (
                  <div key={goal.id} className={shouldBlur ? 'filter blur-sm' : ''}>
                    <GoalTrackerCard
                      goal={goal}
                      onDismiss={dismissGoal}
                      isBlurred={shouldBlur}
                      className="bg-white/10 backdrop-blur-md border border-white/20"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggested Challenges Section */}
        {challenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Suggested Challenges</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.slice(0, showAllChallenges ? challenges.length : 4).map((challenge: Challenge) => (
                <ChallengeTile
                  key={challenge.id}
                  challenge={challenge}
                  onAccept={handleAcceptChallenge}
                  onDismiss={() => {/* Handle dismiss */}}
                  className="bg-white/10 backdrop-blur-md border border-white/20"
                  disabled={!canCreateMore}
                />
              ))}
            </div>

            {challenges.length > 4 && !showAllChallenges && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllChallenges(true)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  View {challenges.length - 4} more challenges →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Goal Modal */}
        {showAddModal && (
          <AddGoalModal
            debts={debts}
            forecast={forecast}
            onClose={() => setShowAddModal(false)}
            onCreateGoal={handleCreateGoal}
            maxGoalsReached={!canCreateMore}
            userTier={tierLabel}
          />
        )}
      </div>
    </div>
  );
}