import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DebtProgressSummary = ({ 
  extraPayment, 
  setExtraPayment, 
  hasProjections, 
  projections 
}) => {
  const { colors } = useTheme();

  return (
    <div className="bg-green-50 rounded-lg shadow-sm p-6 border border-green-200">
      <h3 className="text-lg font-semibold text-green-900 mb-4">Snowball Power</h3>
      <div className="mb-4">
        <label className={`block text-sm font-medium text-green-700 mb-2`}>
          Extra Monthly Payment (£)
        </label>
        <input
          type="number"
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          placeholder="100"
          min="0"
          step="10"
          data-testid="extra-payment-input"
          className={`w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${colors.surface} ${colors.text.primary}`}
        />
      </div>
      {hasProjections && projections.totalMonths > 0 && (
        <div className="text-center">
          <p className="text-sm text-green-700 mb-2">Estimated Payoff Time:</p>
          <p className="text-2xl font-bold text-green-900">
            {Math.floor(projections.totalMonths / 12)} years, {projections.totalMonths % 12} months
          </p>
        </div>
      )}
    </div>
  );
};

export default DebtProgressSummary;