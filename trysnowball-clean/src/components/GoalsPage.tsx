/**
 * CP-5 Goals Page Component
 * Entry point for the Goals & Challenges system
 */

import React, { useState, useEffect } from 'react';
import { Goal, GOAL_STATUSES } from '../types/Goals';
import { USER_TIERS, UserTier } from '../types/Entitlements';
import { goalsEngine } from '../lib/goalsEngine';
import GoalCard from './GoalCard';
import GoalFormModal from './GoalFormModal';
import EntitlementGate from './EntitlementGate';

interface GoalsPageProps {
  userId: string;
  userTier: UserTier;
}

const GoalsPage: React.FC<GoalsPageProps> = ({ userId, userTier }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Load user's goals
  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = () => {
    setLoading(true);
    try {
      const userGoals = goalsEngine.getGoalsForUser(userId);
      setGoals(userGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowCreateModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const handleGoalSubmit = async (goalData: any) => {
    try {
      if (editingGoal) {
        // Update existing goal
        await goalsEngine.updateGoal({
          id: editingGoal.id,
          ...goalData
        }, userTier);
      } else {
        // Create new goal
        await goalsEngine.createGoal({
          user_id: userId,
          ...goalData
        }, userTier);
      }
      
      loadGoals(); // Refresh the goals list
      setShowCreateModal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error; // Let the modal handle the error display
    }
  };

  const handleCancelGoal = async (goalId: string) => {
    try {
      await goalsEngine.cancelGoal(goalId);
      loadGoals(); // Refresh the goals list
    } catch (error) {
      console.error('Failed to cancel goal:', error);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingGoal(null);
  };

  // Separate active and archived goals
  const activeGoals = goals.filter(goal => goal.status === GOAL_STATUSES.ACTIVE);
  const archivedGoals = goals.filter(goal => goal.status !== GOAL_STATUSES.ACTIVE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals & Challenges</h1>
          <p className="text-gray-600 mt-1">
            Set targets, track progress, and celebrate achievements
          </p>
        </div>
        
        {/* Add Goal Button with Entitlement Gate */}
        <EntitlementGate
          userTier={userTier}
          feature="goals.max_active"
          currentUsage={activeGoals.length}
          onBlocked={() => console.log('Goal creation blocked - show upgrade prompt')}
        >
          <button
            onClick={handleCreateGoal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Goal
          </button>
        </EntitlementGate>
      </div>

      {/* Active Goals */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Goals ({activeGoals.length})
        </h2>
        
        {activeGoals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active goals</h3>
            <p className="text-gray-600 mb-4">
              Create your first goal to start tracking your debt payoff progress
            </p>
            <EntitlementGate
              userTier={userTier}
              feature="goals.max_active"
              currentUsage={0}
              onBlocked={() => console.log('Goal creation blocked')}
            >
              <button
                onClick={handleCreateGoal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create Your First Goal
              </button>
            </EntitlementGate>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                userTier={userTier}
                onEdit={() => handleEditGoal(goal)}
                onCancel={() => handleCancelGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Goals */}
      {archivedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Previous Goals ({archivedGoals.length})
          </h2>
          <div className="grid gap-4">
            {archivedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                userTier={userTier}
                onEdit={() => {}} // No editing for archived goals
                onCancel={() => {}} // No cancelling for archived goals
                isArchived={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Goal Form Modal */}
      {showCreateModal && (
        <GoalFormModal
          goal={editingGoal}
          userTier={userTier}
          onSubmit={handleGoalSubmit}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

export default GoalsPage;