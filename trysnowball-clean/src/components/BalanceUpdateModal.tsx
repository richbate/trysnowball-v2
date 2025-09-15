/**
 * Balance Update Modal Component
 * Quick balance update for tracking debt progress (preserves original_amount)
 */

import React, { useState } from 'react';
import { UKDebt } from '../types/UKDebt';

interface BalanceUpdateModalProps {
  debt: UKDebt;
  onSubmit: (newBalance: number) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BalanceUpdateModal: React.FC<BalanceUpdateModalProps> = ({
  debt,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [newBalance, setNewBalance] = useState(debt.amount.toString());
  const [error, setError] = useState<string>('');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const balance = parseFloat(newBalance);

    // Validation
    if (isNaN(balance) || balance < 0) {
      setError('Balance must be a valid positive number');
      return;
    }

    if (balance > 999999.99) {
      setError('Balance cannot exceed £999,999.99');
      return;
    }

    try {
      await onSubmit(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
    }
  };

  const originalAmount = debt.original_amount || debt.amount;
  const currentBalance = debt.amount;
  const newBalanceValue = parseFloat(newBalance) || 0;
  const paidOff = originalAmount - newBalanceValue;
  const progressPercent = originalAmount > 0 ? (paidOff / originalAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <h2 className="text-xl font-semibold text-white">Update Balance</h2>
              <p className="text-white/70 text-sm">{debt.name}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 glass bg-red-500/20 border-red-400/30">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Balance Display */}
            <div className="glass-subtle p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Current Balance:</span>
                  <p className="font-medium text-white">{formatCurrency(currentBalance)}</p>
                </div>
                <div>
                  <span className="text-white/60">Original Amount:</span>
                  <p className="font-medium text-white">{formatCurrency(originalAmount)}</p>
                </div>
              </div>

              {originalAmount !== currentBalance && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400 font-medium">
                      {formatCurrency(originalAmount - currentBalance)} paid off
                    </span>
                    <span className="text-white/60">
                      {Math.round(((originalAmount - currentBalance) / originalAmount) * 100)}% complete
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* New Balance Input */}
            <div>
              <label htmlFor="newBalance" className="block text-sm font-medium text-white mb-2">
                New Balance (£)
              </label>
              <input
                type="number"
                id="newBalance"
                step="0.01"
                min="0"
                max="999999.99"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                placeholder="0.00"
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-white/60 mt-1">
                Enter your current debt balance to track progress
              </p>
            </div>

            {/* Progress Preview */}
            {newBalanceValue !== currentBalance && (
              <div className="glass-subtle p-4">
                <h4 className="text-sm font-medium text-white mb-3">Progress Preview:</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Amount paid off:</span>
                    <span className={`font-medium ${paidOff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(Math.abs(paidOff))} {paidOff < 0 ? '(increased)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Progress:</span>
                    <span className={`font-medium ${progressPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Math.round(Math.max(0, progressPercent))}%
                    </span>
                  </div>

                  {progressPercent > 0 && (
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-white/60 border border-white/30 rounded-xl hover:bg-white/10 hover:text-white hover:border-white/50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Balance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BalanceUpdateModal;