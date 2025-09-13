/**
 * Challenge CTA Component
 * Dynamic suggestions based on forecast analysis
 */

import React from 'react';
import { Challenge } from '../../types/NewGoals';
import { ForecastResultV2 } from '../../utils/compositeSimulatorV2';
import { UKDebt } from '../../types/UKDebt';

interface ChallengeCTAProps {
  forecast: ForecastResultV2;
  debts: UKDebt[];
  userTier: string;
  onAcceptChallenge: (challenge: Challenge) => void;
  onDismiss: () => void;
}

export const ChallengeCTA: React.FC<ChallengeCTAProps> = ({
  forecast,
  debts,
  userTier,
  onAcceptChallenge,
  onDismiss
}) => {
  
  // Generate a relevant challenge based on forecast data
  const generateChallenge = (): Challenge | null => {
    
    // Challenge 1: Clear smallest debt early if close
    const smallestDebt = debts.reduce((smallest, debt) => 
      debt.amount < smallest.amount ? debt : smallest
    );
    
    if (smallestDebt && smallestDebt.amount < 2000) {
      const currentSnapshot = forecast.monthlySnapshots[0];
      const debtProgress = currentSnapshot?.debts[smallestDebt.id];
      
      if (debtProgress && debtProgress.totalBalance < smallestDebt.amount * 0.7) {
        return {
          id: `challenge_clear_${smallestDebt.id}`,
          title: `Clear Your ${smallestDebt.name}`,
          description: `You're 70% of the way there! Challenge yourself to pay off your smallest debt 2 months early.`,
          goalType: 'debt_clear',
          targetValue: 0,
          reasoning: `With only £${Math.round(debtProgress.totalBalance)} remaining, you could be debt-free on this account in just a few months.`,
          estimatedImpact: `Save £${Math.round(smallestDebt.amount * (smallestDebt.apr / 100) * 0.25)} in interest`
        };
      }
    }

    // Challenge 2: Save significant interest
    if (forecast.totalInterestPaid > 500) {
      const potentialSavings = forecast.totalInterestPaid * 0.2;
      return {
        id: `challenge_interest_${Date.now()}`,
        title: `Save £${Math.round(potentialSavings)} in Interest`,
        description: `Increase your debt payments to save hundreds in interest charges.`,
        goalType: 'interest_saved',
        targetValue: potentialSavings,
        reasoning: `Your current plan will cost £${Math.round(forecast.totalInterestPaid)} in interest. With focused payments, you could save 20% or more.`,
        estimatedImpact: `Reduce total interest by £${Math.round(potentialSavings)}`
      };
    }

    // Challenge 3: Time-based if long payoff period
    if (forecast.totalMonths > 24) {
      const timeSavingTarget = Math.floor(forecast.totalMonths * 0.15);
      return {
        id: `challenge_time_${Date.now()}`,
        title: `Get Debt-Free ${timeSavingTarget} Months Faster`,
        description: `Accelerate your debt freedom with strategic extra payments.`,
        goalType: 'time_saved',
        targetValue: timeSavingTarget,
        reasoning: `You're currently on track for ${forecast.totalMonths} months to debt freedom. With focus, you could shave off ${timeSavingTarget} months.`,
        estimatedImpact: `Achieve debt freedom ${timeSavingTarget} months earlier`
      };
    }

    return null;
  };

  const challenge = generateChallenge();

  if (!challenge) {
    return null; // No relevant challenge to show
  }

  const getGradientClass = (goalType: Challenge['goalType']) => {
    switch (goalType) {
      case 'debt_clear':
        return 'from-blue-500 to-purple-600';
      case 'interest_saved':
        return 'from-green-500 to-emerald-600';
      case 'time_saved':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getIcon = (goalType: Challenge['goalType']) => {
    switch (goalType) {
      case 'debt_clear':
        return '🎯';
      case 'interest_saved':
        return '💰';
      case 'time_saved':
        return '⚡';
      default:
        return '🚀';
    }
  };

  return (
    <div className={`relative bg-gradient-to-r ${getGradientClass(challenge.goalType)} rounded-lg p-6 text-white overflow-hidden`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/10 bg-opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Content */}
      <div className="relative">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getIcon(challenge.goalType)}</div>
            <div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white mb-2">
                💪 Personal Challenge
              </div>
              <h3 className="text-xl font-bold">{challenge.title}</h3>
            </div>
          </div>
          
          <button 
            onClick={onDismiss}
            className="p-1 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-white/90 mb-4">
          {challenge.description}
        </p>

        {/* Reasoning */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <p className="text-sm text-white/80 mb-2">
            <strong>Why this challenge?</strong>
          </p>
          <p className="text-sm text-white/70">
            {challenge.reasoning}
          </p>
        </div>

        {/* Impact */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/90 mb-1">Estimated Impact:</p>
          <p className="text-lg font-bold text-white">
            {challenge.estimatedImpact}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAcceptChallenge(challenge)}
            className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Accept Challenge
          </button>
          
          <button
            onClick={onDismiss}
            className="px-4 py-3 text-white/80 hover:text-white font-medium"
          >
            Maybe Later
          </button>
        </div>

        {/* Pro Badge */}
        {userTier !== 'PRO' && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>⭐</span>
              <span>Unlock advanced challenges with Pro</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};