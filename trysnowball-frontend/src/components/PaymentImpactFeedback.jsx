import React from 'react';
import { TrendingUp, DollarSign, Target, Calendar, Sparkles } from 'lucide-react';
import Card from './ui/Card';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * PaymentImpactFeedback - Shows immediate impact of payment entry
 *
 * Implements TRY-9 (CP-6.1A): Real-Time Payment Impact Feedback
 * Optional TRY-10 (CP-6.1B): Compare Actual vs Baseline Forecast
 */
export default function PaymentImpactFeedback({
  impact,
  forecastComparison = null, // Optional TRY-10 data
  onClose,
  className = ""
}) {
  if (!impact) return null;

  const {
    principalCleared,
    interestSavedThisMonth,
    newBalance,
    originalBalance,
    paymentAmount,
    debtName,
    balancePercentage
  } = impact;

  const balanceReduction = originalBalance - newBalance;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Payment Impact</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Context Message */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium text-center">
              You just cleared {formatCurrency(principalCleared)} of debt principal from {debtName}!
            </p>
          </div>

          {/* Impact Metrics - TRY-9 Implementation */}
          <div className="space-y-4 mb-6">
            {/* Principal Cleared */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Principal Cleared</span>
              </div>
              <span className="font-bold text-blue-600">{formatCurrency(principalCleared)}</span>
            </div>

            {/* Interest Saved This Month */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Interest Saved This Month</span>
              </div>
              <span className="font-bold text-purple-600">{formatCurrency(interestSavedThisMonth)}</span>
            </div>

            {/* Balance Progress */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">New Balance</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{formatCurrency(newBalance)}</div>
                <div className="text-sm text-gray-500">{balancePercentage}% remaining</div>
              </div>
            </div>
          </div>

          {/* TRY-10: Forecast Comparison (Optional) */}
          {forecastComparison && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Timeline Impact</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Time Saved:</span>
                  <span className="font-bold text-purple-900">
                    {forecastComparison.monthsSaved} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Total Interest Saved:</span>
                  <span className="font-bold text-purple-900">
                    {formatCurrency(forecastComparison.totalInterestSaved)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">New Payoff Date:</span>
                  <span className="font-bold text-purple-900">
                    {forecastComparison.newPayoffDate}
                  </span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-purple-100 rounded text-center">
                <p className="text-purple-800 text-sm font-medium">
                  Your {formatCurrency(paymentAmount)} payment just shaved {forecastComparison.monthsSaved} months off your debt freedom journey!
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="border-t pt-4 mb-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Payment of {formatCurrency(paymentAmount)} reduced balance by {formatCurrency(balanceReduction)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (balanceReduction / paymentAmount) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}