/**
 * CP-4 Forecast Page
 * User-facing debt payoff forecast with configurable extra payments
 */

import React, { useState } from 'react';
import { useForecast, useCompareForecast } from '../hooks/useForecast';
import ForecastTable from './ForecastTable';
import BucketMilestones, { BucketMilestonesDebug } from './BucketMilestones';
import CompositeWarningBanner, { DevLimitationsPanel } from './CompositeWarningBanner';
import InterestBreakdown from './InterestBreakdown';
import DebtBurndownChart from './DebtBurndownChart';

export default function ForecastPage() {
  const [extraPerMonth, setExtraPerMonth] = useState<number>(100);
  const [showComparison, setShowComparison] = useState(false);

  const forecast = useForecast({ extraPerMonth });
  const comparison = useCompareForecast(extraPerMonth);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (forecast.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating your debt freedom plan...</p>
        </div>
      </div>
    );
  }

  if (forecast.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Calculate Forecast</h3>
          <p className="text-gray-600">
            {forecast.error?.message || 'Please try again or check your debt data.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Debt Freedom Forecast
              </h1>
              <p className="text-sm text-gray-500">
                Your personalized debt payoff plan
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {forecast.results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Debts to Forecast</h3>
            <p className="text-gray-600 mb-4">Add some debts to see your debt freedom plan.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Your First Debt
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Forecast Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Forecast Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="extraPayment" className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Payment Per Month
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    <input
                      id="extraPayment"
                      type="number"
                      min="0"
                      step="10"
                      value={extraPerMonth}
                      onChange={(e) => setExtraPerMonth(Number(e.target.value) || 0)}
                      className="pl-8 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Amount above minimum payments to apply to debts
                  </p>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showComparison}
                      onChange={(e) => setShowComparison(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Show comparison with minimum payments only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Composite Mode Warning */}
            {forecast.summary.simulationEngine === 'v2-composite' && (
              <>
                <CompositeWarningBanner />
                <DevLimitationsPanel />
              </>
            )}

            {/* Impact Summary */}
            {extraPerMonth > 0 && comparison.comparison.monthsSaved > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Impact of Extra Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Time Saved</p>
                    <p className="text-2xl font-bold text-green-900">
                      {comparison.comparison.monthsSaved} months
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Interest Saved</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(comparison.comparison.interestSaved)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Reduction</p>
                    <p className="text-2xl font-bold text-green-900">
                      {comparison.comparison.percentageReduction}%
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-green-800">
                  By paying an extra {formatCurrency(extraPerMonth)} per month, you'll be debt-free{' '}
                  <span className="font-semibold">{comparison.comparison.monthsSaved} months earlier</span> and save{' '}
                  <span className="font-semibold">{formatCurrency(comparison.comparison.interestSaved)}</span> in interest!
                </p>
              </div>
            )}

            {/* Interest Breakdown */}
            <InterestBreakdown 
              bucketDetails={forecast.summary.bucketDetails}
              totalInterest={forecast.summary.totalInterestPaid}
              className="mb-6"
            />

            {/* Bucket Milestones (Composite Mode Only) */}
            {forecast.summary.bucketDetails && (
              <>
                <BucketMilestones bucketDetails={forecast.summary.bucketDetails} />
                <BucketMilestonesDebug bucketDetails={forecast.summary.bucketDetails} />
              </>
            )}

            {/* Debt Burndown Chart */}
            <DebtBurndownChart 
              results={forecast.results}
              className="mb-8"
            />

            {/* Main Forecast Table */}
            <ForecastTable 
              results={forecast.results} 
              summary={forecast.summary}
            />

            {/* Comparison Table (if enabled) */}
            {showComparison && comparison.minimumOnlyForecast.results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comparison: Minimum Payments Only
                </h3>
                <ForecastTable 
                  results={comparison.minimumOnlyForecast.results}
                  summary={comparison.minimumOnlyForecast.summary}
                  className="opacity-75"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}