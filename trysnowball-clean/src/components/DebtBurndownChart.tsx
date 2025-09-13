/**
 * Debt Burndown Line Chart
 * Shows debt balance decreasing over time for visual progress tracking
 */

import React, { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { PlanResult } from '../types/Forecast';

interface DebtBurndownChartProps {
  results: PlanResult[];
  className?: string;
}

interface ChartDataPoint {
  month: string;
  monthNumber: number;
  totalBalance: number;
  totalPaid: number;
  interestPaid: number;
  principalPaid: number;
}

export default function DebtBurndownChart({ results, className = '' }: DebtBurndownChartProps) {
  
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!results.length) return [];

    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    return results.map((result, index) => {
      // Accumulate actual payments (snowball is already included in principal)
      cumulativeInterest += result.totalInterest;
      cumulativePrincipal += result.totalPrincipal;
      
      // Total paid is simply principal + interest (no double counting)
      const totalPaid = cumulativePrincipal + cumulativeInterest;

      return {
        month: `Month ${index + 1}`,
        monthNumber: index + 1,
        totalBalance: result.totalBalance,
        totalPaid: totalPaid,
        interestPaid: cumulativeInterest,
        principalPaid: cumulativePrincipal
      };
    });
  }, [results]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      totalBalance: 'Remaining Debt',
      totalPaid: 'Total Paid',
      interestPaid: 'Interest Paid',
      principalPaid: 'Principal Paid'
    };
    return [formatCurrency(value), labels[name] || name];
  };

  if (!chartData.length) {
    return (
      <div className={`p-8 bg-gray-50 rounded-lg text-center ${className}`}>
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Chart icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V3a2 2 0 012-2h2a2 2 0 00-2-2" />
          </svg>
        </div>
        <p className="text-gray-600">No data available for chart</p>
      </div>
    );
  }

  const maxBalance = Math.max(...chartData.map(d => d.totalBalance));

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Debt Burndown Timeline</h3>
        <p className="text-sm text-gray-600">
          Watch your debt balances decrease over time with your current payment plan
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="monthNumber" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `Month ${value}`}
            />
            
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatCurrency}
              domain={[0, maxBalance * 1.1]}
            />
            
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => `Month ${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            
            <Legend />

            {/* Total Balance Line - Main debt burndown */}
            <Line
              type="monotone"
              dataKey="totalBalance"
              stroke="#ef4444"
              strokeWidth={3}
              name="Remaining Debt"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />


            {/* Interest Paid Line - Shows cumulative interest costs */}
            <Line
              type="monotone"
              dataKey="interestPaid"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Interest Paid"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend & Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Remaining Debt (decreasing to £0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-gray-600">Interest Paid (cumulative cost)</span>
          </div>
        </div>

        {/* Total Repayment Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-medium">💰 Total Repayment:</span> You'll repay your debt principal + interest shown above = your total cost of debt elimination
          </div>
        </div>
      </div>
    </div>
  );
}