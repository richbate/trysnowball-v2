/**
 * FocusDebtCard Component
 * Shows the next debt to attack
 * @prop {string} debtId
 * @prop {string} name
 * @prop {string} [payoffMonthLabel] - "Nov 2025"
 * @prop {function} onAttackClick - callback with debtId
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const FocusDebtCard = ({ debtId, name, payoffMonthLabel, onAttackClick }) => {
  const { colors } = useTheme();
  
  return (
    <div className={`${colors.surface} rounded-lg p-4 border-2 border-green-500`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Attack This</p>
            <p className="text-lg font-bold">{name}</p>
            {payoffMonthLabel && (
              <p className="text-sm text-green-600">Clear by {payoffMonthLabel}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onAttackClick(debtId)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          View Strategy →
        </button>
      </div>
    </div>
  );
};

export default FocusDebtCard;