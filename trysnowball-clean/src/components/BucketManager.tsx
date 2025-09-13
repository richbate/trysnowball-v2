/**
 * CP-4 Extended: Multi-APR Bucket Manager Component
 * Experimental pro feature for managing debt buckets with different APRs
 */

import React, { useState, useEffect } from 'react';
import { DebtBucket, validateBucketData, DEBT_VALIDATION } from '../types/UKDebt';
import { useMultiAPRFeature } from '../hooks/useFeatureFlags';

interface BucketManagerProps {
  buckets: DebtBucket[];
  totalAmount: number;
  onBucketsChange: (buckets: DebtBucket[]) => void;
  disabled?: boolean;
}

export default function BucketManager({
  buckets,
  totalAmount,
  onBucketsChange,
  disabled = false,
}: BucketManagerProps) {
  const { isEnabled, requiresUpgrade, isExperimental } = useMultiAPRFeature();
  const [errors, setErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(buckets.length > 0);

  // Update validation when buckets or total amount changes
  useEffect(() => {
    const validationErrors = validateBucketData(buckets, totalAmount);
    setErrors(validationErrors);
  }, [buckets, totalAmount]);

  // If feature is not enabled, show upgrade prompt
  if (!isEnabled) {
    return (
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Multi-APR Buckets {requiresUpgrade ? '(Pro Feature)' : '(Experimental)'}
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              Break down your debt into different categories with separate APRs (e.g., purchases at 22%, 
              cash advances at 28%, balance transfers at 0%).
            </p>
            {requiresUpgrade && (
              <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const addBucket = () => {
    const newBucket: DebtBucket = {
      id: `bucket_${Date.now()}`,
      name: '',
      balance: 0,
      apr: 0,
      payment_priority: buckets.length + 1,
      created_at: new Date().toISOString(),
    };
    onBucketsChange([...buckets, newBucket]);
  };

  const updateBucket = (index: number, updates: Partial<DebtBucket>) => {
    const updatedBuckets = buckets.map((bucket, i) => 
      i === index ? { ...bucket, ...updates } : bucket
    );
    onBucketsChange(updatedBuckets);
  };

  const removeBucket = (index: number) => {
    const updatedBuckets = buckets.filter((_, i) => i !== index);
    onBucketsChange(updatedBuckets);
  };

  const resetToSimpleMode = () => {
    onBucketsChange([]);
    setShowAdvanced(false);
  };

  const remainingBalance = totalAmount - buckets.reduce((sum, bucket) => sum + bucket.balance, 0);

  return (
    <div className="mt-6">
      {/* Feature Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            APR Configuration
            {isExperimental && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                Experimental
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {showAdvanced ? 'Multi-APR buckets enabled' : 'Using single APR'}
          </p>
        </div>
        
        {!showAdvanced ? (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            disabled={disabled}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Enable Multi-APR
          </button>
        ) : (
          <button
            type="button"
            onClick={resetToSimpleMode}
            disabled={disabled}
            className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Use Single APR
          </button>
        )}
      </div>

      {/* Bucket Management */}
      {showAdvanced && (
        <div className="space-y-4">
          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-1">Bucket Validation Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Balance Summary */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Total Debt Amount:</span>
              <span className="font-medium">£{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Allocated to Buckets:</span>
              <span className="font-medium">
                £{buckets.reduce((sum, bucket) => sum + bucket.balance, 0).toFixed(2)}
              </span>
            </div>
            <div className={`flex justify-between text-sm font-medium ${
              Math.abs(remainingBalance) > 0.01 ? 'text-red-600' : 'text-green-600'
            }`}>
              <span>Remaining:</span>
              <span>£{remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Bucket List */}
          {buckets.map((bucket, index) => (
            <div key={bucket.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Bucket {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeBucket(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket Name
                  </label>
                  <input
                    type="text"
                    value={bucket.name}
                    onChange={(e) => updateBucket(index, { name: e.target.value })}
                    placeholder="e.g., Purchases, Cash Advances"
                    disabled={disabled}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bucket.balance}
                      onChange={(e) => updateBucket(index, { balance: Number(e.target.value) || 0 })}
                      disabled={disabled}
                      className="pl-8 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    APR (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={bucket.apr}
                    onChange={(e) => updateBucket(index, { apr: Number(e.target.value) || 0 })}
                    disabled={disabled}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Priority
                  </label>
                  <select
                    value={bucket.payment_priority}
                    onChange={(e) => updateBucket(index, { payment_priority: Number(e.target.value) })}
                    disabled={disabled}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority} {priority === 1 ? '(Highest)' : priority === 10 ? '(Lowest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Add Bucket Button */}
          {buckets.length < DEBT_VALIDATION.bucket.max_buckets_per_debt && (
            <button
              type="button"
              onClick={addBucket}
              disabled={disabled}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
            >
              <svg className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Bucket ({buckets.length}/{DEBT_VALIDATION.bucket.max_buckets_per_debt})
            </button>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Bucket balances must sum exactly to the total debt amount</p>
            <p>• Lower payment priority numbers receive payments first</p>
            <p>• Each bucket can have its own APR to match your statement</p>
          </div>
        </div>
      )}
    </div>
  );
}