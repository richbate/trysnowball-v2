/**
 * Progress Dashboard Component
 * Example component showing how to use the progress tracking system
 */

import React, { useState } from 'react';
import { useProgressTracker, useDebtTracker, useMilestones } from '../hooks/useProgressTracker';
import { DebtType } from '../types/database';

interface ProgressDashboardProps {
  userId: string;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ userId }) => {
  const {
    debts,
    activeDebts,
    currentBalance,
    totalMinPayments,
    latestProgress,
    recentMilestones,
    loading,
    error,
    createDebt,
    recordPayment,
    getDebtSummary
  } = useProgressTracker(userId);

  const { milestones } = useMilestones(userId);
  
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showAddDebt, setShowAddDebt] = useState(false);

  // Form state for adding new debt
  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'credit_card' as DebtType,
    limit: '',
    interestRate: '',
    minPayment: '',
    notes: ''
  });

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDebt({
        name: newDebt.name,
        type: newDebt.type,
        limit: parseFloat(newDebt.limit),
        interestRate: parseFloat(newDebt.interestRate),
        minPayment: parseFloat(newDebt.minPayment),
        notes: newDebt.notes,
        isActive: true
      });
      
      // Reset form
      setNewDebt({
        name: '',
        type: 'credit_card',
        limit: '',
        interestRate: '',
        minPayment: '',
        notes: ''
      });
      setShowAddDebt(false);
    } catch (err) {
      console.error('Failed to add debt:', err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !paymentAmount) return;

    try {
      const debt = debts.find(d => d.debtId === selectedDebtId);
      const amount = parseFloat(paymentAmount);
      const extraPayment = debt ? Math.max(0, amount - debt.minPayment) : 0;
      
      await recordPayment(selectedDebtId, amount, extraPayment);
      setPaymentAmount('');
      setSelectedDebtId('');
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Debt Progress Dashboard</h1>
        <p className="text-gray-600">Track your journey to debt freedom</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
          <p className="text-2xl font-bold text-red-600">£{currentBalance.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Minimums</h3>
          <p className="text-2xl font-bold text-orange-600">£{totalMinPayments.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Debts</h3>
          <p className="text-2xl font-bold text-blue-600">{activeDebts.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Milestones</h3>
          <p className="text-2xl font-bold text-green-600">{milestones.filter(m => m.type === 'debt_paid_off').length}</p>
        </div>
      </div>

      {/* Recent Milestones */}
      {recentMilestones.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements 🎉</h2>
          <div className="space-y-3">
            {recentMilestones.map(milestone => (
              <div key={milestone.milestoneId} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">🏆</div>
                <div>
                  <h3 className="font-semibold text-green-800">{milestone.title}</h3>
                  <p className="text-sm text-green-600">{milestone.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(milestone.achievedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Debts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Active Debts</h2>
          <button
            onClick={() => setShowAddDebt(!showAddDebt)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Debt
          </button>
        </div>

        {/* Add Debt Form */}
        {showAddDebt && (
          <form onSubmit={handleAddDebt} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Debt name (e.g., Barclaycard)"
                value={newDebt.name}
                onChange={(e) => setNewDebt({...newDebt, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={newDebt.type}
                onChange={(e) => setNewDebt({...newDebt, type: e.target.value as DebtType})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="credit_card">Credit Card</option>
                <option value="overdraft">Overdraft</option>
                <option value="personal_loan">Personal Loan</option>
                <option value="car_finance">Car Finance</option>
                <option value="store_card">Store Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Credit limit/loan amount"
                value={newDebt.limit}
                onChange={(e) => setNewDebt({...newDebt, limit: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Interest rate %"
                value={newDebt.interestRate}
                onChange={(e) => setNewDebt({...newDebt, interestRate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Min payment"
                value={newDebt.minPayment}
                onChange={(e) => setNewDebt({...newDebt, minPayment: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newDebt.notes}
              onChange={(e) => setNewDebt({...newDebt, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Debt
              </button>
              <button
                type="button"
                onClick={() => setShowAddDebt(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Debts List */}
        <div className="space-y-3">
          {activeDebts.map(debt => (
            <DebtCard key={debt.debtId} debt={debt} userId={userId} />
          ))}
        </div>
      </div>

      {/* Record Payment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h2>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select debt</option>
              {activeDebts.map(debt => (
                <option key={debt.debtId} value={debt.debtId}>
                  {debt.name} (Min: £{debt.minPayment})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              step="0.01"
              placeholder="Payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Record Payment
          </button>
        </form>
      </div>
    </div>
  );
};

// Debt Card Component
const DebtCard: React.FC<{ debt: any; userId: string }> = ({ debt, userId }) => {
  const { currentBalance, lastPayment, latestSnapshot } = useDebtTracker(userId, debt.debtId);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{debt.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{debt.type.replace('_', ' ')}</p>
          <p className="text-sm text-gray-600">{debt.interestRate}% APR</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-600">£{currentBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-500">of £{debt.limit.toLocaleString()}</p>
          {lastPayment > 0 && (
            <p className="text-sm text-green-600">Last: £{lastPayment}</p>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, 100 - (currentBalance / debt.limit) * 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round((1 - currentBalance / debt.limit) * 100)}% paid off
        </p>
      </div>
    </div>
  );
};

export default ProgressDashboard;