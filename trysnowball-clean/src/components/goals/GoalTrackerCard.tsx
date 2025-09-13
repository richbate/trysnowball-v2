/**
 * Goal Tracker Card - Glassmorphism Design
 * Shows individual goal progress with real CP-4 data
 */

import React, { useState } from 'react';
import { Goal, GoalProgress } from '../../types/NewGoals';

interface GoalTrackerCardProps {
  goal: Goal;
  progress?: GoalProgress;
  onDismiss: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
  isBlurred?: boolean; // For tier gating
  className?: string;
}

export const GoalTrackerCard: React.FC<GoalTrackerCardProps> = ({
  goal,
  progress,
  onDismiss,
  onEdit,
  isBlurred = false,
  className = ''
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  const getGoalTypeInfo = (type: Goal['type']) => {
    switch (type) {
      case 'debt_clear':
        return { icon: '🎯', label: 'Clear Debt', color: 'blue' };
      case 'interest_saved':
        return { icon: '💰', label: 'Save Interest', color: 'green' };
      case 'time_saved':
        return { icon: '⚡', label: 'Save Time', color: 'purple' };
      default:
        return { icon: '📊', label: 'Goal', color: 'gray' };
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'green';
    if (percent >= 75) return 'blue';
    if (percent >= 50) return 'yellow';
    return 'red';
  };

  const formatTargetValue = (type: Goal['type'], value: number) => {
    switch (type) {
      case 'debt_clear':
        return 'Complete payoff';
      case 'interest_saved':
        return `£${value.toLocaleString()}`;
      case 'time_saved':
        return `${value} months`;
      default:
        return value.toString();
    }
  };

  const typeInfo = getGoalTypeInfo(goal.type);
  const progressPercent = progress?.percentComplete || 0;
  const progressColor = getProgressColor(progressPercent);
  const isComplete = progress?.achieved || false;

  return (
    <div className={`rounded-2xl p-6 transition-all duration-200 hover:shadow-xl relative ${className} ${isBlurred ? 'filter blur-sm' : ''}`}>
      
      {/* Completion Banner */}
      {isComplete && (
        <div className="mb-4 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-xl p-4 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span className="text-green-400 font-semibold">Goal Achieved!</span>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-${typeInfo.color}-400 to-${typeInfo.color}-600`}>
              {typeInfo.label}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onDismiss(goal.id)}
          className="text-white/60 hover:text-white/90 transition-colors p-1"
        >
          ✕
        </button>
      </div>

      {/* Goal Title */}
      <h3 className="text-white font-semibold text-lg mb-1">
        {goal.type === 'debt_clear' ? 'Clear Debt Goal' : 
         goal.type === 'interest_saved' ? `Save £${goal.targetValue.toLocaleString()} Interest` :
         `Save ${goal.targetValue} Months`}
      </h3>
      <p className="text-white/70 text-sm mb-4">
        Target: {formatTargetValue(goal.type, goal.targetValue)}
      </p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-sm">Progress</span>
          <span className="text-white font-medium">{progressPercent}%</span>
        </div>
        
        <div className="bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-${typeInfo.color}-400 to-${typeInfo.color}-600 transition-all duration-500`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-6">
        {progress?.impact?.description && (
          <div className="flex justify-between items-center">
            <span className="text-white/70">Status</span>
            <span className="text-white text-sm">{progress.impact.description}</span>
          </div>
        )}

        {progress?.projectedDate && (
          <div className="flex justify-between items-center">
            <span className="text-white/70">Target Date</span>
            <span className="text-white font-medium">
              {new Date(progress.projectedDate).toLocaleDateString('en-GB', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>
        )}

        {progress?.impact?.interestSaved && (
          <div className="flex justify-between items-center">
            <span className="text-white/70">Interest Saved</span>
            <span className="text-green-400 font-medium">
              £{Math.round(progress.impact.interestSaved).toLocaleString()}
            </span>
          </div>
        )}

        {progress?.impact?.timeSaved && (
          <div className="flex justify-between items-center">
            <span className="text-white/70">Time Saved</span>
            <span className="text-purple-400 font-medium">
              {Math.round(progress.impact.timeSaved)} months
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="text-center">
        {progress?.onTrack ? (
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span>✓</span>
            <span className="text-sm font-medium">On Track</span>
          </div>
        ) : progress?.achieved ? (
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span>🎉</span>
            <span className="text-sm font-medium">Completed</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span>⚠️</span>
            <span className="text-sm font-medium">Needs Attention</span>
          </div>
        )}
      </div>

      {/* Blur Overlay for Free Users */}
      {isBlurred && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-white font-medium mb-2">Upgrade to Pro</p>
            <p className="text-white/70 text-sm">Unlock unlimited goals</p>
          </div>
        </div>
      )}
    </div>
  );
};