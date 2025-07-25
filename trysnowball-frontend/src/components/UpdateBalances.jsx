import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const UpdateBalances = ({ onClose, onUpdate }) => {
  const { colors } = useTheme();
  
  // January 2025 baseline data
  const [balances, setBalances] = useState({
    paypal: { name: 'Paypal', current: '', january: 1400, min: 255 },
    flex: { name: 'Flex', current: '', january: 2250, min: 70 },
    barclaycard: { name: 'Barclaycard', current: '', january: 2461, min: 75 },
    virgin: { name: 'Virgin', current: '', january: 4762, min: 255 },
    mbna: { name: 'MBNA', current: '', january: 5931, min: 255 },
    natwest: { name: 'Natwest', current: '', january: 6820, min: 70 },
    halifax2: { name: 'Halifax 2', current: '', january: 8587, min: 215 },
    halifax1: { name: 'Halifax 1', current: '', january: 11694, min: 300 },
  });

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

  const calculateProgress = (january, current) => {
    if (!current || current === '') return { change: 0, percentage: 0, status: 'no-data' };
    
    const change = january - parseInt(current);
    const percentage = ((change / january) * 100);
    
    let status = 'neutral';
    if (change > 500) status = 'excellent';
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
    
    // Convert to format expected by the app
    const updatedDebts = Object.entries(balances).map(([key, data]) => ({
      id: key,
      name: data.name,
      balance: parseInt(data.current) || data.january,
      january: data.january,
      minPayment: data.min,
      progress: calculateProgress(data.january, data.current)
    }));

    // Call parent update function
    if (onUpdate) {
      onUpdate(updatedDebts);
    }
    
    setIsSubmitting(false);
    onClose();
  };

  const totalJanuary = Object.values(balances).reduce((sum, debt) => sum + debt.january, 0);
  const totalCurrent = Object.values(balances).reduce((sum, debt) => {
    const current = parseInt(debt.current) || debt.january;
    return sum + current;
  }, 0);
  const totalProgress = totalJanuary - totalCurrent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${colors.surface} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Update Your Balances</h2>
              <p className={`${colors.text.secondary}`}>Enter your current balances to see your progress since January 2025</p>
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
              <div className="text-lg font-bold text-red-600">£{totalJanuary.toLocaleString()}</div>
              <div className={`text-sm ${colors.text.muted}`}>January 2025 Total</div>
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
              {Object.entries(balances).map(([key, debt]) => {
                const progress = calculateProgress(debt.january, debt.current);
                return (
                  <div key={key} className={`p-4 border rounded-lg ${colors.border}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className={`font-medium ${colors.text.primary}`}>{debt.name}</h3>
                        <p className={`text-sm ${colors.text.muted}`}>Min payment: £{debt.min}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-500">January 2025</div>
                        <div className="font-semibold">£{debt.january.toLocaleString()}</div>
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