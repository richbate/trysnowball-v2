/**
 * HeroForecast Component
 * Shows debt-free headline with deltas
 * @prop {string} debtFreeDateLabel - "June 2029"
 * @prop {number} [monthsSooner] - undefined if no delta
 * @prop {number} [interestSavedApprox] - in pennies
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HeroForecast = ({ debtFreeDateLabel, monthsSooner, interestSavedApprox }) => {
  const { colors } = useTheme();
  
  const formatCurrency = (pennies) => {
    return `£${Math.round(pennies / 100).toLocaleString()}`;
  };
  
  return (
    <div className={`${colors.surface} rounded-xl p-8 border ${colors.border} text-center`}>
      {/* Main Headline */}
      <h1 className="text-4xl font-bold mb-2">
        Debt-free by <span className="text-primary">{debtFreeDateLabel || 'calculating...'}</span>
      </h1>
      
      {/* Clean impact line with dot separator */}
      {(monthsSooner > 0 || interestSavedApprox > 0) && (
        <div className="text-lg font-medium text-green-600 mt-4">
          {[
            monthsSooner > 0 ? `${monthsSooner} ${monthsSooner === 1 ? 'month' : 'months'} sooner` : null,
            interestSavedApprox > 0 ? `save ${formatCurrency(interestSavedApprox)}` : null
          ].filter(Boolean).join(' · ')}
        </div>
      )}
      
      {/* Motivational line */}
      <p className="text-gray-600 mt-4">
        {monthsSooner > 0 
          ? "Great progress! Keep boosting to get there even faster."
          : "Your journey to debt freedom starts here."}
      </p>
    </div>
  );
};

export default HeroForecast;