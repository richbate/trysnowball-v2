/**
 * Impact Summary Component
 * Shows aggregate impact of all goals - interest saved, time saved, etc.
 */

import React from 'react';
import { GoalProgress } from '../../types/NewGoals';
import { ForecastResultV2 } from '../../utils/compositeSimulatorV2';

interface ImpactSummaryProps {
  goalProgress: GoalProgress[];
  forecast: ForecastResultV2;
  isBlurred?: boolean; // For tier gating
}

export const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  goalProgress,
  forecast,
  isBlurred = false
}) => {
  
  // Calculate total impact across all goals
  const totalInterestSaved = goalProgress.reduce((total, progress) => 
    total + (progress.impact.interestSaved || 0), 0
  );
  
  const totalTimeSaved = goalProgress.reduce((total, progress) => 
    total + (progress.impact.timeSaved || 0), 0
  );

  const achievedGoals = goalProgress.filter(p => p.achieved).length;
  const totalGoals = goalProgress.length;

  // Calculate debt-free date from forecast
  const freedomDate = new Date(forecast.freedomDate);
  const monthsToFreedom = forecast.totalMonths;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 ${isBlurred ? 'filter blur-sm' : ''}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Debt Freedom Journey</h2>
        <p className="text-gray-600">
          Track your progress toward financial freedom with data-driven goals
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Debt Free Date */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🗓️</div>
          <div className="text-2xl font-bold text-gray-900">{formatDate(freedomDate)}</div>
          <div className="text-sm text-gray-500">Debt Free Date</div>
          <div className="text-xs text-gray-400 mt-1">
            {monthsToFreedom} months to go
          </div>
        </div>

        {/* Interest Saved */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalInterestSaved)}
          </div>
          <div className="text-sm text-gray-500">Interest Saved</div>
          <div className="text-xs text-gray-400 mt-1">
            vs minimum payments
          </div>
        </div>

        {/* Time Saved */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(totalTimeSaved)}
          </div>
          <div className="text-sm text-gray-500">Months Saved</div>
          <div className="text-xs text-gray-400 mt-1">
            accelerated payoff
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-blue-600">
            {achievedGoals}/{totalGoals}
          </div>
          <div className="text-sm text-gray-500">Goals Achieved</div>
          <div className="text-xs text-gray-400 mt-1">
            {totalGoals === 0 ? 'Set your first goal!' : `${Math.round((achievedGoals / totalGoals) * 100)}% complete`}
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-white/70 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            {achievedGoals > 0 ? (
              <>
                <p className="font-medium text-gray-900 mb-1">
                  Amazing progress! You've achieved {achievedGoals} goal{achievedGoals > 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-gray-600">
                  Stay focused on your debt freedom date of {formatDate(freedomDate)} - 
                  you're saving {formatCurrency(totalInterestSaved)} in interest!
                </p>
              </>
            ) : totalGoals > 0 ? (
              <>
                <p className="font-medium text-gray-900 mb-1">
                  You're on track to be debt-free by {formatDate(freedomDate)}!
                </p>
                <p className="text-sm text-gray-600">
                  Keep working toward your {totalGoals} goal{totalGoals > 1 ? 's' : ''} to maximize your savings.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900 mb-1">
                  Ready to accelerate your debt freedom journey?
                </p>
                <p className="text-sm text-gray-600">
                  Set specific goals to save even more interest and reach freedom by {formatDate(freedomDate)}.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {goalProgress.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Goal Breakdown</h3>
          <div className="space-y-2">
            {goalProgress.map(progress => (
              <div key={progress.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{progress.impact.description}</span>
                <span className={`font-medium ${progress.achieved ? 'text-green-600' : 'text-gray-900'}`}>
                  {progress.achieved ? '✅' : `${progress.percentComplete}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};