/**
 * TeaserSnowflakes Component
 * Single-line teaser for snowflakes
 * @prop {number} totalAmount - in pennies
 * @prop {number} [monthsSooner]
 * @prop {function} onManageClick
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const TeaserSnowflakes = ({ totalAmount, monthsSooner, onManageClick }) => {
  const { colors } = useTheme();
  
  const formatCurrency = (pennies) => {
    return `£${(pennies / 100).toFixed(0)}`;
  };
  
  return (
    <div className={`${colors.surface} rounded-lg p-3 border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">❄️</span>
          <div>
            <span className="font-medium">{formatCurrency(totalAmount)} in snowflakes</span>
            {monthsSooner > 0 && (
              <span className="text-sm text-green-600 ml-2">
                (-{monthsSooner} months)
              </span>
            )}
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

export default TeaserSnowflakes;