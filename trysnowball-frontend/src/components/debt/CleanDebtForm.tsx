/**
 * Clean UK Debt Form - Zero Conversion Logic
 * Native number inputs, clean validation, boring and reliable
 */

import React, { useState } from 'react';
import { CreateUKDebt } from '../../types/CleanUKDebt';
import { validateCreateDebt } from '../../lib/validation';
import { createDebt } from '../../api/cleanDebtsAPI';

interface CleanDebtFormProps {
  onSuccess?: (debt: any) => void;
  onCancel?: () => void;
}

export const CleanDebtForm: React.FC<CleanDebtFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateUKDebt>({
    name: '',
    amount: 0,
    original_amount: null,
    apr: 19.9,
    min_payment: 0,
    debt_limit: null,
    debt_type: 'credit_card',
    order_index: 0,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateUKDebt, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateCreateDebt(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[CleanForm] Submitting:', formData);
      
      const newDebt = await createDebt(formData);
      
      console.log('[CleanForm] Success:', newDebt);
      onSuccess?.(newDebt);
      
      // Reset form
      setFormData({
        name: '',
        amount: 0,
        original_amount: null,
        apr: 19.9,
        min_payment: 0,
        debt_limit: null,
        debt_type: 'credit_card',
        order_index: 0,
      });
      
    } catch (error) {
      console.error('[CleanForm] Error:', error);
      setErrors([error instanceof Error ? error.message : 'Unknown error']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Add New Debt</h3>
      
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <ul className="text-red-700 text-sm">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g. Barclaycard"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Current Balance (£) *
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          placeholder="1234.56"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Original Amount */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Original Balance (£)
        </label>
        <input
          type="number"
          value={formData.original_amount || ''}
          onChange={(e) => handleInputChange('original_amount', e.target.value ? parseFloat(e.target.value) : null)}
          step="0.01"
          min="0"
          placeholder="5000.00"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* APR */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Interest Rate (%) *
        </label>
        <input
          type="number"
          value={formData.apr}
          onChange={(e) => handleInputChange('apr', parseFloat(e.target.value) || 0)}
          step="0.1"
          min="0"
          max="100"
          placeholder="19.9"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Min Payment */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Minimum Payment (£) *
        </label>
        <input
          type="number"
          value={formData.min_payment}
          onChange={(e) => handleInputChange('min_payment', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          placeholder="45.00"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Credit Limit */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Credit Limit (£)
        </label>
        <input
          type="number"
          value={formData.debt_limit || ''}
          onChange={(e) => handleInputChange('debt_limit', e.target.value ? parseFloat(e.target.value) : null)}
          step="0.01"
          min="0"
          placeholder="5000.00"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Debt Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Debt Type *
        </label>
        <select
          value={formData.debt_type}
          onChange={(e) => handleInputChange('debt_type', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="credit_card">Credit Card</option>
          <option value="loan">Loan</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Order Index */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Priority Order
        </label>
        <input
          type="number"
          value={formData.order_index}
          onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
          step="1"
          min="0"
          placeholder="0"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Debt'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};