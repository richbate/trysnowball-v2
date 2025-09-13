/**
 * Clean UK Debt Form Component
 * Zero conversion, bulletproof validation, fail-fast approach
 */

import React, { useState, useEffect } from 'react';
import { UKDebt, CreateUKDebt, UpdateUKDebt, validateDebtData, validateBucketData, DebtBucket, DEBT_VALIDATION } from '../types/UKDebt';
import BucketManager from './BucketManager';

interface DebtFormProps {
  debt?: UKDebt; // If provided, we're editing. If not, we're creating
  onSubmit: (data: CreateUKDebt | UpdateUKDebt) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DebtForm: React.FC<DebtFormProps> = ({ debt, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: debt?.name || '',
    amount: debt?.amount?.toString() || '',
    min_payment: debt?.min_payment?.toString() || '',
    apr: debt?.apr?.toString() || '',
    limit: debt?.limit?.toString() || '',
    original_amount: debt?.original_amount?.toString() || '',
  });

  const [buckets, setBuckets] = useState<DebtBucket[]>(debt?.buckets || []);
  const [errors, setErrors] = useState<string[]>([]);

  const isEditing = !!debt;

  // Update form when debt prop changes
  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        amount: debt.amount.toString(),
        min_payment: debt.min_payment.toString(),
        apr: debt.apr.toString(),
        limit: debt.limit?.toString() || '',
        original_amount: debt.original_amount?.toString() || '',
      });
      setBuckets(debt.buckets || []);
    }
  }, [debt]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Build submission data with proper number conversion
    const submissionData: CreateUKDebt | UpdateUKDebt = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount) || 0,
      min_payment: parseFloat(formData.min_payment) || 0,
      apr: parseFloat(formData.apr) || 0,
    };

    // Add optional fields if they have values
    if (formData.limit) {
      submissionData.limit = parseFloat(formData.limit);
    }
    if (formData.original_amount) {
      submissionData.original_amount = parseFloat(formData.original_amount);
    }

    // Add buckets to submission data if they exist
    if (buckets.length > 0) {
      submissionData.buckets = buckets;
    }

    // Validate the data
    const validationErrors = validateDebtData(submissionData);
    const bucketValidationErrors = validateBucketData(buckets, submissionData.amount || 0);
    const allErrors = [...validationErrors, ...bucketValidationErrors];
    
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    try {
      await onSubmit(submissionData);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An error occurred']);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Debt' : 'Add New Debt'}
          </h2>

          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Debt Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Debt Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                maxLength={DEBT_VALIDATION.name.max_length}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Credit Card, Car Loan"
                required
                disabled={isLoading}
              />
            </div>

            {/* Current Balance */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance (£) *
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min={DEBT_VALIDATION.amount.min}
                max={DEBT_VALIDATION.amount.max}
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1234.56"
                required
                disabled={isLoading}
              />
            </div>

            {/* Minimum Payment */}
            <div>
              <label htmlFor="min_payment" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payment (£) *
              </label>
              <input
                type="number"
                id="min_payment"
                step="0.01"
                min={DEBT_VALIDATION.min_payment.min}
                max={DEBT_VALIDATION.min_payment.max}
                value={formData.min_payment}
                onChange={(e) => handleInputChange('min_payment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="50.00"
                required
                disabled={isLoading}
              />
            </div>

            {/* APR */}
            <div>
              <label htmlFor="apr" className="block text-sm font-medium text-gray-700 mb-1">
                APR (%) *
              </label>
              <input
                type="number"
                id="apr"
                step="0.1"
                min={DEBT_VALIDATION.apr.min}
                max={DEBT_VALIDATION.apr.max}
                value={formData.apr}
                onChange={(e) => handleInputChange('apr', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="19.9"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {buckets.length > 0 ? 'Fallback APR (overridden by bucket APRs)' : 'Annual Percentage Rate'}
              </p>
            </div>

            {/* Multi-APR Bucket Manager */}
            <BucketManager
              buckets={buckets}
              totalAmount={parseFloat(formData.amount) || 0}
              onBucketsChange={setBuckets}
              disabled={isLoading}
            />

            {/* Credit Limit (Optional) */}
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                Credit Limit (£) - Optional
              </label>
              <input
                type="number"
                id="limit"
                step="0.01"
                min={DEBT_VALIDATION.limit?.min}
                max={DEBT_VALIDATION.limit?.max}
                value={formData.limit}
                onChange={(e) => handleInputChange('limit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="5000.00"
                disabled={isLoading}
              />
            </div>

            {/* Original Amount (Optional) */}
            <div>
              <label htmlFor="original_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Original Amount (£) - Optional
              </label>
              <input
                type="number"
                id="original_amount"
                step="0.01"
                min={DEBT_VALIDATION.amount.min}
                max={DEBT_VALIDATION.amount.max}
                value={formData.original_amount}
                onChange={(e) => handleInputChange('original_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="2000.00"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Track progress from your original debt amount
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Debt' : 'Add Debt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DebtForm;