import React from 'react';
import { useDataManager } from '../hooks/useDataManager';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgressPage = () => {
  const { debts, paymentHistory, loading } = useDataManager();

  // Calculate progress metrics
  const calculateProgress = () => {
    if (!debts.length) return { totalDebt: 0, totalPaid: 0, progressPercent: 0 };
    
    const currentDebt = debts.reduce((sum, debt) => sum + (debt.amount || debt.balance || 0), 0);
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const originalDebt = currentDebt + totalPaid;
    const progressPercent = originalDebt > 0 ? (totalPaid / originalDebt) * 100 : 0;
    
    return { totalDebt: currentDebt, totalPaid, progressPercent };
  };

  const progress = calculateProgress();

  // Create chart data from payment history
  const chartData = paymentHistory
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, payment) => {
      const month = new Date(payment.date).toLocaleDateString('en-GB', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.payments += payment.amount;
      } else {
        acc.push({ month, payments: payment.amount });
      }
      return acc;
    }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Advanced Progress Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Detailed analytics and reports for your debt-free journey</p>
        </div>

        {/* Progress Metrics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Debt Remaining</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              £{progress.totalDebt.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Paid Off</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              £{progress.totalPaid.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Progress</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.progressPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Payment History Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment History</h2>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`£${value}`, 'Payments']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="payments" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Monthly Payments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No payment history available yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start recording payments to see your progress!</p>
            </div>
          )}
        </div>

        {/* Debt Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Debt Breakdown</h2>
          {debts.length > 0 ? (
            <div className="space-y-4">
              {debts.map((debt, index) => (
                <div key={debt.id || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{debt.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {debt.interest}% APR • Min payment: £{debt.regularPayment || debt.minPayment || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      £{(debt.amount || debt.balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No debts found.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your debts to start tracking progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;