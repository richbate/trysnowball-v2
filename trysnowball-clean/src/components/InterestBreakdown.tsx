/**
 * Interest Breakdown Panel
 * Shows per-bucket interest calculations to build user trust
 */

import React, { useState } from 'react';
import { BucketSummary } from '../types/Forecast';
import { analytics } from '../services/analytics';

interface InterestBreakdownProps {
  bucketDetails?: BucketSummary;
  totalInterest: number;
  monthlyResults?: any[]; // TODO: Type properly when available
  className?: string;
}

export default function InterestBreakdown({ 
  bucketDetails, 
  totalInterest, 
  monthlyResults,
  className = '' 
}: InterestBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no bucket details, show simple total
  if (!bucketDetails) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Interest Breakdown</h4>
          <div className="text-sm text-gray-600">
            Total: £{totalInterest.toFixed(2)}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Standard simulation mode - no per-bucket breakdown available
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getAPRColor = (apr: number) => {
    if (apr >= 25) return 'text-red-700';
    if (apr >= 20) return 'text-orange-700'; 
    if (apr >= 15) return 'text-yellow-700';
    if (apr > 0) return 'text-blue-700';
    return 'text-green-700';
  };

  // Calculate per-bucket interest from milestones
  const bucketInterestBreakdown = bucketDetails.bucketMilestones.map(milestone => ({
    name: milestone.bucketName,
    apr: milestone.apr,
    totalInterest: milestone.totalInterestPaid,
    monthsActive: milestone.monthCleared
  }));

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-blue-900">
          💡 Interest Breakdown
        </h4>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-blue-700">
            Total: {formatCurrency(totalInterest)}
          </div>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);

              // Track interest breakdown being displayed
              if (!isExpanded) {
                const userId = 'user-' + Math.random().toString(36).substr(2, 9);
                analytics.trackInterestBreakdown({
                  bucketLabel: 'User-requested Breakdown',
                  debtName: 'Interest Breakdown Component',
                  apr: 0,
                  interestTotal: totalInterest,
                  userId
                });
              }
            }}
            className="text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            {isExpanded ? 'Hide details' : 'Show breakdown'}
          </button>
        </div>
      </div>

      {!isExpanded && (
        <p className="text-xs text-blue-600 mt-2">
          Multi-APR calculation active • Click "Show breakdown" for per-bucket details
        </p>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="text-sm text-blue-800">
            <strong>How Interest is Calculated:</strong>
          </div>
          
          <div className="bg-white rounded-lg p-3 space-y-2">
            {bucketInterestBreakdown.length > 0 ? (
              bucketInterestBreakdown.map((bucket, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{bucket.name}</span>
                    <span className={`text-xs font-mono ${getAPRColor(bucket.apr)}`}>
                      {bucket.apr}% APR
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(bucket.totalInterest)}
                    </div>
                    <div className="text-xs text-gray-500">
                      over {bucket.monthsActive} months
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">
                No buckets cleared yet - interest breakdown will appear as buckets are paid off
              </div>
            )}
          </div>

          <div className="border-t border-blue-200 pt-3">
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Formula per bucket:</strong> Balance × (APR ÷ 12) monthly</p>
              <p><strong>Payment targeting:</strong> Highest APR buckets paid first</p>
              <p><strong>Compounding:</strong> Interest calculated on remaining balance each month</p>
            </div>
          </div>

          <div className="bg-blue-100 rounded p-2">
            <p className="text-xs text-blue-800">
              <span className="font-medium">🎯 Why this matters:</span> By targeting your 27.9% cash advances first, 
              you save significantly compared to spreading payments across all balances equally.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Interest Total Display
 * For when user just wants the total without breakdown
 */
export function SimpleInterestTotal({ 
  totalInterest, 
  simulationEngine 
}: { 
  totalInterest: number; 
  simulationEngine?: string;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <span className="text-lg font-semibold text-gray-900">
        {formatCurrency(totalInterest)}
      </span>
      {simulationEngine === 'v2-composite' && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Multi-APR
        </span>
      )}
    </div>
  );
}