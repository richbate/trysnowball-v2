/**
 * BoostRow Component
 * Inline slider with presets for boosting payments
 * @prop {number} value - in pennies
 * @prop {number[]} [presets] - preset values in pennies
 * @prop {function} onChange - callback with next value in pennies
 * @prop {string} [helperText] - dynamic help text
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const BoostRow = ({ value, presets = [2500, 5000, 10000], onChange, helperText }) => {
  const { colors } = useTheme();
  
  const formatCurrency = (pennies) => {
    return `£${(pennies / 100).toFixed(0)}`;
  };
  
  const maxValue = Math.max(50000, value); // Max £500 or current value
  
  return (
    <div className={`${colors.surface} rounded-lg p-4 border ${colors.border}`}>
      <div className="flex items-center justify-between mb-3">
        <label className="font-medium">Boost Your Payments</label>
        <span className="text-xl font-bold text-green-600">
          {value > 0 ? `+${formatCurrency(value)}` : '£0'}
        </span>
      </div>
      
      {/* Slider */}
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max={maxValue}
          step="500" // £5 increments
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-green-600"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(value / maxValue) * 100}%, #e5e7eb ${(value / maxValue) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
      
      {/* Preset Buttons */}
      <div className="flex gap-2 mb-3">
        {presets.map(preset => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${value === preset 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-green-100'
              }
            `}
          >
            {formatCurrency(preset)}
          </button>
        ))}
        {value > 0 && (
          <button
            onClick={() => onChange(0)}
            className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 ml-auto"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Helper Text */}
      {helperText && (
        <p className="text-sm text-green-600 font-medium animate-pulse">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default BoostRow;