/**
 * CP-4 Forecast Table Component
 * Displays month-by-month debt payoff breakdown
 */

import React, { useMemo } from 'react';
import { PlanResult, ForecastSummary } from '../types/Forecast';

interface ForecastTableProps {
  results: PlanResult[];
  summary: ForecastSummary;
  className?: string;
}

export default function ForecastTable({ results, summary, className = '' }: ForecastTableProps) {
  // Group results by quarters for better readability
  const groupedResults = useMemo(() => {
    const groups = [];
    for (let i = 0; i < results.length; i += 3) {
      groups.push(results.slice(i, i + 3));
    }
    return groups;
  }, [results]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (!results.length) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">No forecast data available. Add debts to see your payoff plan.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Your Debt Freedom Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Debt-Free Date</p>
            <p className="text-2xl font-bold text-blue-900">{summary.debtFreeDate}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700">Total Months</p>
            <p className="text-2xl font-bold text-blue-900">{summary.totalMonths}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700">Total Interest</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalInterestPaid)}</p>
          </div>
        </div>

        {/* Milestone Preview */}
        {summary.milestoneDates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-medium text-blue-700 mb-2">First Victory</p>
            <p className="text-blue-900">
              <span className="font-semibold">{summary.milestoneDates[0].debtName}</span> paid off in{' '}
              <span className="font-semibold">{summary.milestoneDates[0].dateCleared}</span>
            </p>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h4>
          <p className="text-sm text-gray-600">Your debt payoff timeline, month by month</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Principal Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extra Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debts Cleared
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => {
                const clearedDebts = result.debts.filter(debt => 
                  debt.isPaidOff && (index === 0 || 
                  !results[index - 1]?.debts.find(prevDebt => 
                    prevDebt.id === debt.id && prevDebt.isPaidOff
                  ))
                );

                return (
                  <tr key={result.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(result.totalBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(result.totalInterest)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(result.totalPrincipal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.snowballAmount > 0 ? formatCurrency(result.snowballAmount) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clearedDebts.length > 0 ? (
                        <div className="space-y-1">
                          {clearedDebts.map(debt => (
                            <span
                              key={debt.id}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                            >
                              {debt.name} ✓
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestones Summary */}
      {summary.milestoneDates.length > 1 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4">Victory Timeline</h4>
          <div className="space-y-2">
            {summary.milestoneDates.map((milestone, index) => (
              <div key={milestone.debtName} className="flex items-center space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-green-900">
                  <span className="font-semibold">{milestone.debtName}</span> cleared in{' '}
                  <span className="font-semibold">{milestone.dateCleared}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}