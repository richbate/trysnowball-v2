/**
 * Bucket Milestone Visualization Component
 * Shows when individual debt buckets are cleared in composite mode
 */

import React from 'react';
import { BucketSummary } from '../types/Forecast';

interface BucketMilestonesProps {
  bucketDetails: BucketSummary;
  className?: string;
}

export default function BucketMilestones({ bucketDetails, className = '' }: BucketMilestonesProps) {
  const { bucketMilestones, totalBucketsAtStart, totalBucketsCleared, highestAPRCleared } = bucketDetails;
  
  if (bucketMilestones.length === 0) {
    return null; // No milestones to show yet
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };
  
  const getAPRColor = (apr: number) => {
    if (apr >= 25) return 'bg-red-100 text-red-800 border-red-200';
    if (apr >= 20) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (apr >= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (apr > 0) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">
          🎯 Bucket Milestones
        </h3>
        <div className="text-sm text-blue-700">
          {totalBucketsCleared} of {totalBucketsAtStart} buckets cleared
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-700">Progress</span>
          <span className="text-sm text-blue-600">
            {Math.round((totalBucketsCleared / totalBucketsAtStart) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(totalBucketsCleared / totalBucketsAtStart) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Highest APR Achievement */}
      {highestAPRCleared.name && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-blue-900">Highest APR Cleared!</p>
              <p className="text-sm text-blue-700">
                <span className="font-medium">{highestAPRCleared.name}</span> at {highestAPRCleared.apr}% APR 
                (Month {highestAPRCleared.monthCleared})
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Milestone List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">Bucket Clearance Timeline</h4>
        {bucketMilestones
          .sort((a, b) => a.monthCleared - b.monthCleared)
          .map((milestone, index) => (
            <div 
              key={`${milestone.debtName}-${milestone.bucketName}`}
              className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-700">
                      {milestone.monthCleared}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{milestone.bucketName}</p>
                  <p className="text-sm text-gray-600">{milestone.debtName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAPRColor(milestone.apr)}`}>
                  {milestone.apr}% APR
                </span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{milestone.clearedIn}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(milestone.totalInterestPaid)} interest
                  </p>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      
      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-xs text-blue-800">
          <span className="font-medium">💡 Pro Tip:</span> The composite engine targets your highest APR buckets first, 
          maximizing interest savings. This view shows when each balance type gets cleared.
        </p>
      </div>
    </div>
  );
}

/**
 * Debug overlay for development - shows raw bucket data
 */
export function BucketMilestonesDebug({ bucketDetails }: { bucketDetails: BucketSummary }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <details className="mt-4 p-3 bg-gray-100 border rounded">
      <summary className="cursor-pointer text-sm font-mono text-gray-600">
        🔍 Debug: Raw Bucket Data
      </summary>
      <pre className="mt-2 text-xs text-gray-600 overflow-auto">
        {JSON.stringify(bucketDetails, null, 2)}
      </pre>
    </details>
  );
}