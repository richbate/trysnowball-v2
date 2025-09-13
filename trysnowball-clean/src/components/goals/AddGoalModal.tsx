/**
 * Add Goal Modal - Glassmorphism Design
 * Modal for creating new goals with real debt data
 */

import React, { useState } from 'react';
import { Goal } from '../../types/NewGoals';
import { UKDebt } from '../../types/UKDebt';
import { ForecastResultV2 } from '../../utils/compositeSimulatorV2';

interface AddGoalModalProps {
  debts: UKDebt[];
  forecast: ForecastResultV2;
  onClose: () => void;
  onCreateGoal: (goalData: Partial<Goal>) => void;
  maxGoalsReached: boolean;
  userTier: string;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  debts,
  forecast,
  onClose,
  onCreateGoal,
  maxGoalsReached,
  userTier
}) => {
  const [goalType, setGoalType] = useState<Goal['type']>('debt_clear');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (maxGoalsReached) {
      alert('You have reached your goal limit. Upgrade to Pro for unlimited goals.');
      return;
    }

    const goalData: Partial<Goal> = {
      type: goalType,
      targetValue,
      forecastDebtId: selectedDebtId || undefined,
    };

    onCreateGoal(goalData);
  };

  const getDefaultTarget = (type: Goal['type']) => {
    switch (type) {
      case 'interest_saved': return 1000;
      case 'time_saved': return 6;
      case 'debt_clear': return 0;
      default: return 0;
    }
  };

  const handleTypeChange = (type: Goal['type']) => {
    setGoalType(type);
    setTargetValue(getDefaultTarget(type));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Goal</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Goal Type Selection */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">
              Goal Type
            </label>
            <div className="space-y-3">
              
              <label className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input
                  type="radio"
                  name="goalType"
                  value="debt_clear"
                  checked={goalType === 'debt_clear'}
                  onChange={() => handleTypeChange('debt_clear')}
                  className="text-blue-500"
                />
                <span className="text-xl">🎯</span>
                <div>
                  <div className="text-white font-medium">Clear Debt</div>
                  <div className="text-white/70 text-xs">Pay off a specific debt completely</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input
                  type="radio"
                  name="goalType"
                  value="interest_saved"
                  checked={goalType === 'interest_saved'}
                  onChange={() => handleTypeChange('interest_saved')}
                  className="text-green-500"
                />
                <span className="text-xl">💰</span>
                <div>
                  <div className="text-white font-medium">Save Interest</div>
                  <div className="text-white/70 text-xs">Target a specific amount of interest savings</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input
                  type="radio"
                  name="goalType"
                  value="time_saved"
                  checked={goalType === 'time_saved'}
                  onChange={() => handleTypeChange('time_saved')}
                  className="text-purple-500"
                />
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-white font-medium">Save Time</div>
                  <div className="text-white/70 text-xs">Reduce payoff time by specific months</div>
                </div>
              </label>
            </div>
          </div>

          {/* Target Value */}
          {goalType !== 'debt_clear' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Target {goalType === 'interest_saved' ? 'Amount (£)' : 'Time (Months)'}
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                min="1"
                required
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                placeholder={goalType === 'interest_saved' ? '1000' : '6'}
              />
            </div>
          )}

          {/* Debt Selection for Clear Debt goals */}
          {goalType === 'debt_clear' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Select Debt to Clear
              </label>
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                required
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none"
              >
                <option value="">Choose a debt...</option>
                {debts.map(debt => (
                  <option key={debt.id} value={debt.id} className="text-gray-900">
                    {debt.name} - £{debt.amount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tier Warning */}
          {maxGoalsReached && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <div>
                  <p className="text-yellow-400 font-medium">Goal Limit Reached</p>
                  <p className="text-yellow-400/80 text-sm">
                    Upgrade to Pro for unlimited goals and advanced features
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 border border-white/20"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={maxGoalsReached}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};