import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const RecordPaymentForm = ({ 
  debts, 
  extraPayment, 
  projections, 
  getPaymentHistory, 
  recordPayment, 
  getCurrentMonth 
}) => {
  const { colors } = useTheme();
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const currentMonthKey = getCurrentMonth();
  const monthlyPayments = getPaymentHistory(currentMonthKey);
  
  const handleRecordPayment = async (debtId, amount) => {
    try {
      await recordPayment({
        debtId,
        month: currentMonthKey,
        amount: parseFloat(amount),
        actualPayment: parseFloat(amount),
        projectedPayment: debts.find(d => d.id === debtId)?.regularPayment || 0,
        paymentDate: new Date().toISOString().split('T')[0]
      });
      setEditingPayment(null);
      setPaymentAmount('');
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };
  
  const getPaymentForDebt = (debtId) => {
    return monthlyPayments.find(p => p.debtId === debtId);
  };
  
  const getProjectedPayment = (debt) => {
    // If debt is paid off (balance is 0), check if it was paid off this month
    if (debt.amount <= 0) {
      const currentMonthPayment = getPaymentForDebt(debt.id);
      // If there's a payment recorded for this month, use that as the "projected" amount
      // since it represents what was needed to pay off the debt
      if (currentMonthPayment) {
        return currentMonthPayment.amount;
      }
      return 0;
    }
    
    // Use the first month of projections as the baseline for current month
    const projectedMonth = projections?.months?.[0];
    const projectedDebt = projectedMonth?.debts?.[debt.id];
    
    // If we have projection data for this debt, use it
    if (projectedDebt) {
      return projectedDebt.payment;
    }
    
    // Fallback: distribute extra payment evenly among debts with balance > 0
    const activeDebts = debts.filter(d => d.amount > 0);
    const extraPerDebt = activeDebts.length > 0 ? extraPayment / activeDebts.length : 0;
    return debt.regularPayment + extraPerDebt;
  };

  if (debts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="text-center py-8 text-gray-500">
            <p>Add some debts first to start tracking payments!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Payment History - {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
          <div className="text-sm text-gray-600">
            Total Recorded: £{monthlyPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> "Vs Projected" compares your actual payment to what was projected for this month. 
            For paid-off debts, it shows the difference between what you actually paid and what was needed to pay them off.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projected Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vs Projected (This Month)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debts.map((debt) => {
                const payment = getPaymentForDebt(debt.id);
                const projectedPayment = getProjectedPayment(debt);
                const actualPayment = payment?.amount || 0;
                const difference = actualPayment - projectedPayment;
                const isEditing = editingPayment === debt.id;
                
                return (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{debt.name}</div>
                      <div className="text-xs text-gray-500">Balance: £{debt.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      £{projectedPayment.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-sm text-gray-500">£</span>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={projectedPayment.toFixed(2)}
                            data-testid={`payment-input-${debt.id}`}
                            className={`w-24 px-2 py-1 border ${colors.border} rounded text-sm text-right ${colors.surface} ${colors.text.primary}`}
                            min="0"
                            step="0.01"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {actualPayment > 0 ? `£${actualPayment.toFixed(2)}` : '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {actualPayment > 0 ? (
                        <span className={`font-medium ${
                          difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {difference > 0 ? '+' : ''}£{difference.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRecordPayment(debt.id, paymentAmount)}
                            disabled={!paymentAmount}
                            data-testid={`save-payment-${debt.id}`}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingPayment(null);
                              setPaymentAmount('');
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPayment(debt.id);
                            setPaymentAmount(payment?.amount?.toString() || '');
                          }}
                          data-testid={`record-payment-${debt.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {actualPayment > 0 ? 'Edit' : 'Record'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Total Projected</h4>
          <p className="text-2xl font-bold text-blue-600">
            £{debts.reduce((sum, debt) => sum + getProjectedPayment(debt), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-medium text-green-900 mb-2">Total Actual</h4>
          <p className="text-2xl font-bold text-green-600">
            £{monthlyPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Difference</h4>
          <p className={`text-2xl font-bold ${
            (monthlyPayments.reduce((sum, p) => sum + p.amount, 0) - debts.reduce((sum, debt) => sum + getProjectedPayment(debt), 0)) > 0 
              ? 'text-green-600' : 'text-red-600'
          }`}>
            £{(monthlyPayments.reduce((sum, p) => sum + p.amount, 0) - debts.reduce((sum, debt) => sum + getProjectedPayment(debt), 0)).toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              // Record all minimum payments
              debts.forEach(debt => {
                if (!getPaymentForDebt(debt.id)) {
                  handleRecordPayment(debt.id, debt.regularPayment);
                }
              });
            }}
            data-testid="record-all-minimum-btn"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Record All Minimum Payments
          </button>
          <button
            onClick={() => {
              // Record all projected payments
              debts.forEach(debt => {
                if (!getPaymentForDebt(debt.id)) {
                  handleRecordPayment(debt.id, getProjectedPayment(debt));
                }
              });
            }}
            data-testid="record-all-projected-btn"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Record All Projected Payments
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentForm;