/**
 * CP-5 Goal Form Modal Component
 * Allows user to create or edit goals with validation
 */

import React, { useState, useEffect } from 'react';
import { Goal, GOAL_TYPES, CreateGoalInput, GoalType } from '../types/Goals';
import { UserTier, USER_TIERS } from '../types/Entitlements';
import { getAllowedGoalTypes } from '../config/entitlements';

interface GoalFormModalProps {
  goal?: Goal | null; // If provided, we're editing. If not, we're creating
  userTier: UserTier;
  onSubmit: (data: Partial<CreateGoalInput>) => Promise<void>;
  onCancel: () => void;
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({ goal, userTier, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: goal?.type || GOAL_TYPES.DEBT_CLEAR as GoalType,
    target_value: goal?.target_value?.toString() || '',
    target_date: goal?.target_date || '',
    debt_id: goal?.debt_id || '',
    bucket_id: goal?.bucket_id || ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!goal;
  const allowedGoalTypes = getAllowedGoalTypes(userTier);

  // Goal type display mapping
  const goalTypeOptions = [
    { value: GOAL_TYPES.DEBT_CLEAR, label: 'Clear Debt', description: 'Target clearing a specific debt' },
    { value: GOAL_TYPES.AMOUNT_PAID, label: 'Amount Paid', description: 'Pay a specific amount toward debts' },
    { value: GOAL_TYPES.INTEREST_SAVED, label: 'Interest Saved', description: 'Save money on interest payments' },
    { value: GOAL_TYPES.TIMEBOUND, label: 'Debt-Free By', description: 'Become completely debt-free by a date' }
  ];

  // Filter goal types by entitlement
  const availableGoalTypes = goalTypeOptions.filter(option => 
    allowedGoalTypes.includes(option.value as string)
  );

  // Set default target value based on goal type
  useEffect(() => {
    if (!isEditing && formData.type === GOAL_TYPES.DEBT_CLEAR) {
      setFormData(prev => ({ ...prev, target_value: '0' }));
    } else if (!isEditing && formData.type === GOAL_TYPES.TIMEBOUND) {
      setFormData(prev => ({ ...prev, target_value: '0' }));
    }
  }, [formData.type, isEditing]);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    // Type validation
    if (!formData.type) {
      validationErrors.push('Goal type is required');
    }

    // Target value validation
    if (formData.target_value === '') {
      validationErrors.push('Target value is required');
    } else {
      const targetValue = parseFloat(formData.target_value);
      if (isNaN(targetValue)) {
        validationErrors.push('Target value must be a valid number');
      } else if (targetValue < 0) {
        validationErrors.push('Target value cannot be negative');
      } else if (formData.type !== GOAL_TYPES.DEBT_CLEAR && formData.type !== GOAL_TYPES.TIMEBOUND && targetValue <= 0) {
        validationErrors.push('Target value must be greater than zero');
      }
    }

    // Date validation
    if (!formData.target_date) {
      validationErrors.push('Target date is required');
    } else {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      
      if (targetDate <= today) {
        validationErrors.push('Target date must be in the future');
      }
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const submitData: Partial<CreateGoalInput> = {
        type: formData.type,
        target_value: parseFloat(formData.target_value),
        target_date: formData.target_date,
        debt_id: formData.debt_id || undefined,
        bucket_id: formData.bucket_id || undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit goal:', error);
      setErrors(['Failed to save goal. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="text-red-400 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Goal Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type
            </label>
            <div className="space-y-3">
              {availableGoalTypes.map((option) => (
                <label key={option.value} className="flex items-start">
                  <input
                    type="radio"
                    name="goalType"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={(e) => handleInputChange('type', e.target.value as GoalType)}
                    disabled={isEditing} // Can't change type when editing
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Entitlement Message for Free Users */}
            {userTier === USER_TIERS.FREE && (
              <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                💡 <strong>Free users</strong> can create debt clearance goals. 
                <a href="#" className="text-blue-600 hover:text-blue-700 ml-1">
                  Upgrade to Pro
                </a> to unlock all goal types.
              </p>
            )}
          </div>

          {/* Target Value */}
          <div className="mb-6">
            <label htmlFor="target_value" className="block text-sm font-medium text-gray-700 mb-2">
              Target Value
            </label>
            <div className="relative">
              {(formData.type === GOAL_TYPES.AMOUNT_PAID || formData.type === GOAL_TYPES.INTEREST_SAVED) && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
              )}
              <input
                id="target_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.target_value}
                onChange={(e) => handleInputChange('target_value', e.target.value)}
                disabled={formData.type === GOAL_TYPES.DEBT_CLEAR || formData.type === GOAL_TYPES.TIMEBOUND}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  (formData.type === GOAL_TYPES.AMOUNT_PAID || formData.type === GOAL_TYPES.INTEREST_SAVED) ? 'pl-7' : ''
                } ${
                  (formData.type === GOAL_TYPES.DEBT_CLEAR || formData.type === GOAL_TYPES.TIMEBOUND) ? 'bg-gray-50' : ''
                }`}
                placeholder={
                  formData.type === GOAL_TYPES.DEBT_CLEAR ? 'Debt clearance (automatically set)' :
                  formData.type === GOAL_TYPES.TIMEBOUND ? 'Debt-free target (automatically set)' :
                  formData.type === GOAL_TYPES.AMOUNT_PAID ? '1000.00' :
                  '500.00'
                }
              />
            </div>
            {(formData.type === GOAL_TYPES.DEBT_CLEAR || formData.type === GOAL_TYPES.TIMEBOUND) && (
              <p className="mt-1 text-sm text-gray-600">
                This goal type uses date-based targets rather than amount targets.
              </p>
            )}
          </div>

          {/* Target Date */}
          <div className="mb-6">
            <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <input
              id="target_date"
              type="date"
              min={getMinDate()}
              value={formData.target_date}
              onChange={(e) => handleInputChange('target_date', e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Debt ID */}
            <div>
              <label htmlFor="debt_id" className="block text-sm font-medium text-gray-700 mb-2">
                Specific Debt (Optional)
              </label>
              <input
                id="debt_id"
                type="text"
                value={formData.debt_id}
                onChange={(e) => handleInputChange('debt_id', e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g. credit-card-1"
              />
              <p className="mt-1 text-sm text-gray-600">Link this goal to a specific debt</p>
            </div>

            {/* Bucket ID - Pro Only */}
            <div>
              <label htmlFor="bucket_id" className="block text-sm font-medium text-gray-700 mb-2">
                Bucket (Pro Only)
              </label>
              <input
                id="bucket_id"
                type="text"
                value={formData.bucket_id}
                onChange={(e) => handleInputChange('bucket_id', e.target.value)}
                disabled={userTier === USER_TIERS.FREE}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  userTier === USER_TIERS.FREE ? 'bg-gray-50' : ''
                }`}
                placeholder="e.g. high-interest-bucket"
              />
              <p className="mt-1 text-sm text-gray-600">
                {userTier === USER_TIERS.FREE ? 'Upgrade to Pro for bucket targeting' : 'Target a specific bucket'}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 
                (isEditing ? 'Updating...' : 'Creating...') : 
                (isEditing ? 'Update Goal' : 'Create Goal')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalFormModal;