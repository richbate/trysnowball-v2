/**
 * Challenge Tile - Glassmorphism Design
 * Shows suggested challenges with data-driven impact
 */

import React from 'react';
import { Challenge } from '../../types/NewGoals';

interface ChallengeTileProps {
  challenge: Challenge;
  onAccept: (challenge: Challenge) => void;
  onDismiss: (challengeId: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ChallengeTile: React.FC<ChallengeTileProps> = ({
  challenge,
  onAccept,
  onDismiss,
  className = '',
  disabled = false
}) => {

  const getTypeIcon = (type: Challenge['goalType']) => {
    switch (type) {
      case 'debt_clear': return '🎯';
      case 'interest_saved': return '💰';
      case 'time_saved': return '⚡';
      default: return '🚀';
    }
  };

  const getTypeColor = (type: Challenge['goalType']) => {
    switch (type) {
      case 'debt_clear': return 'from-blue-400 to-blue-600';
      case 'interest_saved': return 'from-green-400 to-green-600';
      case 'time_saved': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className={`rounded-2xl p-6 transition-all duration-200 hover:shadow-xl ${className} ${disabled ? 'opacity-50' : ''}`}>
      
      {/* Challenge Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTypeIcon(challenge.goalType)}</span>
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getTypeColor(challenge.goalType)}`}>
            Challenge
          </div>
        </div>
        
        <button
          onClick={() => onDismiss(challenge.id)}
          className="text-white/60 hover:text-white/90 transition-colors p-1"
        >
          ✕
        </button>
      </div>

      {/* Challenge Content */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">
          {challenge.title}
        </h3>
        <p className="text-white/80 text-sm mb-4">
          {challenge.description}
        </p>
        
        {/* Impact Summary */}
        {challenge.estimatedImpact && (
          <div className="bg-white/10 rounded-xl p-3 mb-4 border border-white/20">
            <p className="text-white/90 text-sm">
              💡 <strong>Impact:</strong> {challenge.estimatedImpact}
            </p>
          </div>
        )}

        {/* Reasoning */}
        {challenge.reasoning && (
          <p className="text-white/70 text-xs">
            {challenge.reasoning}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onAccept(challenge)}
          disabled={disabled}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Accept Challenge
        </button>
        
        <button
          onClick={() => onDismiss(challenge.id)}
          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20"
        >
          Dismiss
        </button>
      </div>

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-white font-medium mb-2">Upgrade to Pro</p>
            <p className="text-white/70 text-sm">Accept unlimited challenges</p>
          </div>
        </div>
      )}
    </div>
  );
};