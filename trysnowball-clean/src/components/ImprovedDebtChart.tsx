/**
 * Improved Debt Burndown Chart using Chart.js
 * Better performance, smaller bundle size, canvas-based rendering
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PlanResult } from '../types/Forecast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ImprovedDebtChartProps {
  results: PlanResult[];
  minimumResults?: PlanResult[];
  className?: string;
}

export default function ImprovedDebtChart({
  results,
  minimumResults,
  className = ''
}: ImprovedDebtChartProps) {

  const { chartData, chartOptions } = useMemo(() => {
    if (!results.length) {
      return { chartData: null, chartOptions: null };
    }

    // Determine the maximum number of months to show
    const maxMonths = Math.max(
      results.length,
      minimumResults?.length || 0
    );

    // Prepare labels and datasets
    const labels = Array.from({ length: maxMonths }, (_, i) => `Month ${i + 1}`);

    const snowballData = Array.from({ length: maxMonths }, (_, i) =>
      results[i]?.totalBalance || 0
    );

    const datasets = [
      {
        label: 'Debt with Snowball Payments',
        data: snowballData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.1,
      }
    ];

    // Add minimum payments comparison if available
    if (minimumResults) {
      const minimumData = Array.from({ length: maxMonths }, (_, i) =>
        minimumResults[i]?.totalBalance
      );

      datasets.push({
        label: 'Debt with Minimum Payments Only',
        data: minimumData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.1,
      });
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 'normal' as const,
            },
          },
        },
        title: {
          display: true,
          text: minimumResults
            ? 'Snowball vs Minimum Payments Comparison'
            : 'Debt Burndown Timeline',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
          padding: {
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1f2937',
          bodyColor: '#374151',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Timeline',
            font: {
              size: 12,
              weight: 'bold' as const,
            },
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Remaining Debt',
            font: {
              size: 12,
              weight: 'bold' as const,
            },
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            callback: function(value: any) {
              return formatCurrency(value);
            }
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const,
      },
    };

    return {
      chartData: {
        labels,
        datasets,
      },
      chartOptions: options,
    };
  }, [results, minimumResults]);

  if (!chartData) {
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {minimumResults
            ? 'See how the snowball method helps you pay off debt faster compared to minimum payments only'
            : 'Watch your debt balances decrease over time with your current payment plan'
          }
        </p>
      </div>

      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Enhanced Legend & Stats */}
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

        {/* Performance Benefits Notice */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-medium">📈 Chart Performance:</span> This improved chart uses Canvas rendering for better performance and smaller bundle size
          </div>
        </div>

        {/* Comparison Summary */}
        {minimumResults && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              <span className="font-medium">💡 Snowball Impact:</span> The green line shows how extra payments help you eliminate debt faster than minimum payments alone
            </div>
          </div>
        )}
      </div>
    </div>
  );
}