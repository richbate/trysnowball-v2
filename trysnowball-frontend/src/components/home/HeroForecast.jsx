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
      
      {/* Deltas */}
      {(monthsSooner > 0 || interestSavedApprox > 0) && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {monthsSooner > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-2xl">↓</span>
              <span className="text-lg font-medium">
                {monthsSooner} {monthsSooner === 1 ? 'month' : 'months'} sooner
              </span>
            </div>
          )}
          
          {interestSavedApprox > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-2xl">💰</span>
              <span className="text-lg font-medium">
                Save {formatCurrency(interestSavedApprox)}
              </span>
            </div>
          )}
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