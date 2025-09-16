import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDebts } from '../hooks/useDebts';

const UpdateBalances = ({ onClose, onUpdate }) => {
  const { colors } = useTheme();
  const { debts } = useDebts(); // Get actual debts from the system
  
  console.log('🔍 [DEBUG] UpdateBalances received debts:', debts);
  console.log('🔍 [DEBUG] Number of debts:', debts?.length);
  if (debts && debts.length > 0) {
    debts.forEach((debt, i) => {
      console.log(`🔍 [DEBUG] Debt ${i}:`, {
        id: debt.id,
        name: debt.name,
        balance: debt.balance,
        minPayment: debt.minPayment,
        order: debt.order,
        originalAmount: debt.originalAmount
      });
    });
  }
  
  const [balances, setBalances] = useState({});

  // Initialize balances from actual debt data
  useEffect(() => {
    if (debts && debts.length > 0) {
      const initialBalances = {};
      
      // Convert debts to balance update format, maintaining order
      debts.forEach(debt => {
        initialBalances[debt.id] = {
          name: debt.name,
          current: debt.balance || '', // Pre-fill with current balance
          originalBalance: debt.originalAmount || debt.balance, // Use as baseline
          currentBalance: debt.balance, // Current stored balance
          minPayment: debt.minPayment || 0,
          interestRate: debt.interestRate || 20, // Include interest rate
          order: debt.order || 999 // Preserve order
        };
      });
      
      setBalances(initialBalances);
    }
  }, [debts]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBalanceChange = (debtKey, value) => {
    setBalances(prev => ({
      ...prev,
      [debtKey]: {
        ...prev[debtKey],
        current: value
      }
    }));
  };

  const calculateProgress = (previousBalance, current) => {
    if (!current || current === '') return { change: 0, percentage: 0, status: 'no-data' };
    
    const currentNum = parseInt(current);
    const change = previousBalance - currentNum;
    const percentage = previousBalance > 0 ? ((change / previousBalance) * 100) : 0;
    
    let status = 'neutral';
    if (currentNum === 0) status = 'excellent'; // Debt cleared!
    else if (change > 500) status = 'excellent';
    else if (change > 100) status = 'good';
    else if (change < -500) status = 'poor';
    else if (change < 0) status = 'concern';
    
    return { change, percentage, status };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'concern': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return '🎉';
      case 'good': return '👍';
      case 'concern': return '⚠️';
      case 'poor': return '🚨';
      default: return '➡️';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert to format expected by the app, preserving order
    const updatedDebts = Object.entries(balances)
      .map(([key, data]) => ({
        id: key,
        name: data.name,
        balance: parseInt(data.current) || data.currentBalance,
        previousBalance: data.currentBalance, // Track the previous balance
        minPayment: data.minPayment,
        interestRate: data.interestRate, // Include interest rate
        order: data.order,
        originalAmount: data.originalBalance,
        progress: calculateProgress(data.currentBalance, data.current)
      }))
      .sort((a, b) => a.order - b.order); // Maintain order

    // Call parent update function
    if (onUpdate) {
      onUpdate(updatedDebts);
    }
    
    setIsSubmitting(false);
    onClose();
  };

  const totalOriginal = Object.values(balances).reduce((sum, debt) => sum + (debt.originalBalance || 0), 0);
  const totalCurrent = Object.values(balances).reduce((sum, debt) => {
    const current = parseInt(debt.current) || debt.currentBalance || 0;
    return sum + current;
  }, 0);
  const totalProgress = totalOriginal - totalCurrent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${colors.surface} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Update Your Balances</h2>
              <p className={`${colors.text.secondary}`}>Enter your current balances to track your debt reduction progress</p>
            </div>
            <button
              onClick={onClose}
              className={`${colors.text.secondary} hover:${colors.text.primary} p-2`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg border ${colors.border}`}>
              <div className="text-lg font-bold text-red-600">£{totalOriginal.toLocaleString()}</div>
              <div className={`text-sm ${colors.text.muted}`}>Original Total</div>
            </div>
            <div className={`p-4 rounded-lg border ${colors.border}`}>
              <div className="text-lg font-bold text-blue-600">£{totalCurrent.toLocaleString()}</div>
              <div className={`text-sm ${colors.text.muted}`}>Current Total</div>
            </div>
            <div className={`p-4 rounded-lg border ${colors.border}`}>
              <div className={`text-lg font-bold ${totalProgress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProgress >= 0 ? '-' : '+'}£{Math.abs(totalProgress).toLocaleString()}
              </div>
              <div className={`text-sm ${colors.text.muted}`}>Total Progress</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Balance Update Grid */}
            <div className="space-y-4 mb-6">
              {Object.entries(balances)
                .sort(([,a], [,b]) => (a.order || 999) - (b.order || 999)) // Sort by order
                .map(([key, debt]) => {
                  const progress = calculateProgress(debt.currentBalance, debt.current);
                  return (
                    <div key={key} className={`p-4 border rounded-lg ${colors.border}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {debt.order || 1}
                            </div>
                            <h3 className={`font-medium ${colors.text.primary}`}>{debt.name}</h3>
                          </div>
                          <p className={`text-sm ${colors.text.muted}`}>Min payment: £{debt.minPayment}</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Current</div>
                          <div className="font-semibold">£{(debt.currentBalance || 0).toLocaleString()}</div>
                        </div>
                      
                      <div>
                        <label className={`block text-sm ${colors.text.secondary} mb-1`}>Current Balance</label>
                        <input
                          type="number"
                          value={debt.current}
                          onChange={(e) => handleBalanceChange(key, e.target.value)}
                          data-testid={`balance-input-${key}`}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${colors.border}`}
                          placeholder="Enter current balance"
                        />
                      </div>
                      
                      <div className="text-center">
                        {debt.current && (
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-lg">{getStatusIcon(progress.status)}</span>
                            <div>
                              <div className={`font-semibold ${getStatusColor(progress.status)}`}>
                                {progress.change >= 0 ? '-' : '+'}£{Math.abs(progress.change)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {progress.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 border rounded-lg ${colors.border} ${colors.text.secondary} hover:${colors.surfaceSecondary}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="update-balances-submit-btn"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Balances'}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className={`mt-6 p-4 ${colors.surfaceSecondary} rounded-lg`}>
            <h4 className={`font-medium ${colors.text.primary} mb-2`}>💡 Tips for accurate tracking:</h4>
            <ul className={`text-sm ${colors.text.secondary} space-y-1`}>
              <li>• Enter your current statement balance, not available credit</li>
              <li>• Check all your cards/accounts on the same day for consistency</li>
              <li>• Don't worry if some balances increased - we'll help you get back on track</li>
              <li>• Your progress will be automatically calculated and saved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateBalances;