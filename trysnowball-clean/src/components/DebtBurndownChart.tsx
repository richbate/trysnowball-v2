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
  minimumResults?: PlanResult[];
  className?: string;
}

interface ChartDataPoint {
  month: string;
  monthNumber: number;
  snowballBalance: number;
  minimumBalance?: number;
}

export default function DebtBurndownChart({ results, minimumResults, className = '' }: DebtBurndownChartProps) {
  
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!results.length) return [];

    // Determine the maximum number of months to show
    const maxMonths = Math.max(
      results.length,
      minimumResults?.length || 0
    );

    const data: ChartDataPoint[] = [];

    for (let i = 0; i < maxMonths; i++) {
      const snowballResult = results[i];
      const minimumResult = minimumResults?.[i];

      data.push({
        month: `Month ${i + 1}`,
        monthNumber: i + 1,
        snowballBalance: snowballResult?.totalBalance || 0,
        minimumBalance: minimumResult?.totalBalance
      });
    }

    return data;
  }, [results, minimumResults]);

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
      snowballBalance: 'Remaining Debt (Snowball)',
      minimumBalance: 'Remaining Debt (Minimum Payments)'
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

  const maxBalance = Math.max(
    ...chartData.map(d => Math.max(d.snowballBalance, d.minimumBalance || 0))
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {minimumResults ? 'Snowball vs Minimum Payments Comparison' : 'Debt Burndown Timeline'}
        </h3>
        <p className="text-sm text-gray-600">
          {minimumResults
            ? 'See how the snowball method helps you pay off debt faster compared to minimum payments only'
            : 'Watch your debt balances decrease over time with your current payment plan'
          }
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

            {/* Green Line - Snowball Debt Burndown */}
            <Line
              type="monotone"
              dataKey="snowballBalance"
              stroke="#10b981"
              strokeWidth={3}
              name="Debt with Snowball Payments"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />

            {/* Yellow Line - Minimum Payments Only (if available) */}
            {minimumResults && (
              <Line
                type="monotone"
                dataKey="minimumBalance"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Debt with Minimum Payments Only"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend & Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Snowball Method (faster payoff)</span>
          </div>
          {minimumResults && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-gray-600">Minimum Payments Only (slower payoff)</span>
            </div>
          )}
        </div>

        {/* Comparison Summary */}
        {minimumResults && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              <span className="font-medium">💡 Snowball Impact:</span> The green line shows how extra payments help you eliminate debt faster than minimum payments alone
            </div>
          </div>
        )}
      </div>
    </div>
  );
}