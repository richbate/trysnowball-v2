/**
 * PaymentStrip Component
 * Shows total, minimums, boost amounts
 * @prop {number} total - in pennies
 * @prop {number} minimums - in pennies
 * @prop {number} boost - in pennies
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/debtFormatting';

const PaymentStrip = ({ total, minimums, boost }) => {
  const { colors } = useTheme();
  
  // Convert pennies to pounds for formatting
  const formatPennies = (pennies) => {
    return formatCurrency(pennies / 100);
  };
  
  const monthlyTotal = minimums + boost;
  
  return (
    <div className={`${colors.surface} rounded-lg p-4 border ${colors.border}`}>
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Total Debt */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Debt</p>
          <p className="text-2xl font-bold text-red-600" data-testid="home-total-debts">{formatPennies(total)}</p>
        </div>
        
        {/* Monthly Payment */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Your Payment</p>
          <p className="text-2xl font-bold text-blue-600">{formatPennies(monthlyTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatPennies(minimums)} min + {formatPennies(boost)} boost
          </p>
        </div>
        
        {/* Boost Amount */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Monthly Boost</p>
          <p className={`text-2xl font-bold ${boost > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {boost > 0 ? formatPennies(boost) : '£0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStrip;