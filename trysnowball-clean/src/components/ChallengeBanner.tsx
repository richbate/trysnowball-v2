/**
 * CP-5 Challenge Banner Component
 * Displays system-suggested challenges from CP-5.1 generator
 */

import React, { useState } from 'react';
import { ChallengeAssignment, GoalType, GOAL_TYPES } from '../types/Goals';
import { UserTier } from '../types/Entitlements';
import { goalsEngine } from '../lib/goalsEngine';

interface ChallengeBannerProps {
  challenge: ChallengeAssignment;
  userTier: UserTier;
  onAccept?: () => void;
  onReject?: () => void;
}

const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ 
  challenge, 
  userTier, 
  onAccept, 
  onReject 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Challenge type display mapping
  const challengeTypeDisplay = {
    [GOAL_TYPES.DEBT_CLEAR]: 'Clear Debt',
    [GOAL_TYPES.AMOUNT_PAID]: 'Payment Goal',
    [GOAL_TYPES.INTEREST_SAVED]: 'Interest Savings',
    [GOAL_TYPES.TIMEBOUND]: 'Debt-Free Timeline'
  };

  // Challenge reason display mapping
  const reasonDisplay: { [key: string]: { emoji: string; title: string } } = {
    'AHEAD_OF_SCHEDULE': { emoji: '🚀', title: 'You\'re ahead of schedule!' },
    'MILESTONE_APPROACHING': { emoji: '🎯', title: 'Milestone within reach!' },
    'HIGH_APR_FOCUS': { emoji: '🔥', title: 'High-interest debt alert!' },
    'ENGAGEMENT_DROP': { emoji: '💪', title: 'Ready for a fresh start?' },
    'SNOWBALL_MOMENTUM': { emoji: '⛄', title: 'Build on your success!' },
    'SEASONAL_OPPORTUNITY': { emoji: '🌟', title: 'Special opportunity!' },
    'PEER_BENCHMARKING': { emoji: '📈', title: 'You can do better!' }
  };

  const reason = reasonDisplay[challenge.reason] || { emoji: '💡', title: 'Challenge suggestion' };

  // Format currency values
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Get challenge target display
  const getTargetDisplay = (): string => {
    switch (challenge.goal_type) {
      case GOAL_TYPES.DEBT_CLEAR:
        return `Clear by ${new Date(challenge.target_date).toLocaleDateString()}`;
      case GOAL_TYPES.AMOUNT_PAID:
        return formatCurrency(challenge.target_value);
      case GOAL_TYPES.INTEREST_SAVED:
        return `Save ${formatCurrency(challenge.target_value)}`;
      case GOAL_TYPES.TIMEBOUND:
        return `Debt-free by ${new Date(challenge.target_date).toLocaleDateString()}`;
      default:
        return formatCurrency(challenge.target_value);
    }
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    
    try {
      // Create challenge assignment with user acceptance
      const acceptedChallenge: ChallengeAssignment = {
        ...challenge,
        user_accepted: true
      };
      
      const result = await goalsEngine.assignChallenge(acceptedChallenge, userTier);
      
      if (result.success) {
        setIsDismissed(true);
        if (onAccept) {
          onAccept();
        }
      } else {
        console.error('Failed to assign challenge:', result.error);
        alert('Failed to create challenge goal. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    
    try {
      // Create challenge assignment with user rejection
      const rejectedChallenge: ChallengeAssignment = {
        ...challenge,
        user_accepted: false
      };
      
      // This will fire analytics for rejected challenge
      await goalsEngine.assignChallenge(rejectedChallenge, userTier);
      
      setIsDismissed(true);
      if (onReject) {
        onReject();
      }
    } catch (error) {
      console.error('Error rejecting challenge:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="text-3xl mr-4">
            {reason.emoji}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {reason.title}
            </h3>
            <p className="text-sm text-gray-600">
              System-suggested challenge
            </p>
          </div>
        </div>
        
        {/* Challenge Type Badge */}
        <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {challengeTypeDisplay[challenge.goal_type]}
        </div>
      </div>

      {/* Challenge Description */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
        <p className="text-gray-800 mb-3">
          {challenge.context}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium text-gray-700">Target:</span>
            <span className="ml-2 text-gray-900">{getTargetDisplay()}</span>
          </div>
          <div className="text-gray-600">
            By {new Date(challenge.target_date).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Achievability confidence</span>
          <span>75%</span> {/* Default confidence from CP-5 */}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: '75%' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Not Now'}
        </button>
        
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium transition-all ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
          }`}
        >
          {isProcessing ? 'Creating Goal...' : 'Accept Challenge'}
        </button>
      </div>

      {/* Dismissal Note */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        This challenge was suggested based on your current debt payoff progress.
        {/* In CP-5.1, we'll add "Learn how we generate suggestions" link */}
      </p>
    </div>
  );
};

export default ChallengeBanner;