/**
 * TeaserGoals Component
 * Single-line teaser for goals
 * @prop {number} progressPct - 0-100
 * @prop {number} targetPennies
 * @prop {function} onManageClick
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const TeaserGoals = ({ progressPct, targetPennies, onManageClick }) => {
  const { colors } = useTheme();
  
  const formatCurrency = (pennies) => {
    return `£${(pennies / 100).toFixed(0)}`;
  };
  
  return (
    <div className={`${colors.surface} rounded-lg p-3 border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🎯</span>
          <div>
            <span className="font-medium">
              {progressPct}% to {formatCurrency(targetPennies)} goal
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        
        <button
          onClick={onManageClick}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage →
        </button>
      </div>
    </div>
  );
};

export default TeaserGoals;