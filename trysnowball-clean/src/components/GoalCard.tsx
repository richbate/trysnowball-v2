/**
 * CP-5 Goal Card Component
 * Displays a single goal with progress tracking and actions
 */

import React from 'react';
import { Goal, GOAL_TYPES, GOAL_STATUSES } from '../types/Goals';
import { UserTier } from '../types/Entitlements';

interface GoalCardProps {
  goal: Goal;
  userTier: UserTier;
  onEdit: () => void;
  onCancel: () => void;
  isArchived?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, userTier, onEdit, onCancel, isArchived = false }) => {
  
  // Calculate progress percentage
  const progressPercent = goal.target_value > 0 ? 
    Math.min(100, (goal.current_value / goal.target_value) * 100) : 
    goal.current_value > 0 ? 100 : 0;

  // Goal type display mapping
  const goalTypeDisplay = {
    [GOAL_TYPES.DEBT_CLEAR]: 'Clear Debt',
    [GOAL_TYPES.AMOUNT_PAID]: 'Amount Paid',
    [GOAL_TYPES.INTEREST_SAVED]: 'Interest Saved',
    [GOAL_TYPES.TIMEBOUND]: 'Debt-Free By'
  };

  // Status display mapping with colors
  const statusDisplay = {
    [GOAL_STATUSES.ACTIVE]: { label: 'Active', color: 'bg-blue-100 text-blue-800' },
    [GOAL_STATUSES.ACHIEVED]: { label: 'Achieved', color: 'bg-green-100 text-green-800' },
    [GOAL_STATUSES.FAILED]: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    [GOAL_STATUSES.CANCELLED]: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  };

  const status = statusDisplay[goal.status];

  // Format currency values
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Format target display based on goal type
  const getTargetDisplay = (): string => {
    switch (goal.type) {
      case GOAL_TYPES.DEBT_CLEAR:
        return `Clear by ${new Date(goal.target_date).toLocaleDateString()}`;
      case GOAL_TYPES.AMOUNT_PAID:
        return formatCurrency(goal.target_value);
      case GOAL_TYPES.INTEREST_SAVED:
        return formatCurrency(goal.target_value);
      case GOAL_TYPES.TIMEBOUND:
        return `Debt-free by ${new Date(goal.target_date).toLocaleDateString()}`;
      default:
        return formatCurrency(goal.target_value);
    }
  };

  const getCurrentDisplay = (): string => {
    switch (goal.type) {
      case GOAL_TYPES.DEBT_CLEAR:
        return goal.current_value > 0 ? 'Cleared' : 'In progress';
      case GOAL_TYPES.AMOUNT_PAID:
        return formatCurrency(goal.current_value);
      case GOAL_TYPES.INTEREST_SAVED:
        return formatCurrency(goal.current_value);
      case GOAL_TYPES.TIMEBOUND:
        return goal.current_value > 0 ? 'Debt-free!' : 'In progress';
      default:
        return formatCurrency(goal.current_value);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (): string => {
    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return '1 day remaining';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {goalTypeDisplay[goal.type]}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          
          {goal.debt_id && (
            <p className="text-sm text-gray-600 mt-2">
              Debt: {goal.debt_id}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isArchived && goal.status === GOAL_STATUSES.ACTIVE && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
              title="Edit goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100"
              title="Cancel goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              goal.status === GOAL_STATUSES.ACHIEVED ? 'bg-green-500' :
              goal.status === GOAL_STATUSES.FAILED ? 'bg-red-500' :
              goal.status === GOAL_STATUSES.CANCELLED ? 'bg-gray-400' :
              'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Target and Current Values */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Target</p>
          <p className="font-semibold text-gray-900">{getTargetDisplay()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current</p>
          <p className="font-semibold text-gray-900">{getCurrentDisplay()}</p>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="text-sm text-gray-600">
        {goal.status === GOAL_STATUSES.ACTIVE && (
          <p>{getDaysRemaining()}</p>
        )}
        {goal.status === GOAL_STATUSES.ACHIEVED && (
          <p>Achieved on {new Date(goal.updated_at).toLocaleDateString()}</p>
        )}
        {goal.status === GOAL_STATUSES.FAILED && (
          <p>Failed to achieve by target date</p>
        )}
        {goal.status === GOAL_STATUSES.CANCELLED && (
          <p>Cancelled on {new Date(goal.updated_at).toLocaleDateString()}</p>
        )}
      </div>

      {/* Achievement Celebration */}
      {goal.status === GOAL_STATUSES.ACHIEVED && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-400 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Congratulations!</p>
              <p className="text-sm text-green-700">You achieved your goal!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalCard;