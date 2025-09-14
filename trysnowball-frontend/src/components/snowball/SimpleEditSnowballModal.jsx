/**
 * SimpleEditSnowballModal
 * 
 * Simplified modal for editing snowball amount that avoids problematic imports.
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSnowballSettings } from '../../hooks/useSnowballSettings';

const SimpleEditSnowballModal = ({ isOpen, onClose }) => {
  const { snowballAmount, setSnowballAmount } = useSnowballSettings();
  const [tempAmount, setTempAmount] = useState(snowballAmount);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setSnowballAmount(tempAmount);
    onClose();
  };

  const handleCancel = () => {
    setTempAmount(snowballAmount);
    onClose();
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const newAmount = Math.max(0, value);
    setTempAmount(newAmount);
    setSnowballAmount(newAmount); // Real-time update like the slider
  };

  const quickAmounts = [0, 25, 50, 100, 150, 200, 300];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Snowball Amount
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly extra payment amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                min="0"
                step="1"
                value={tempAmount}
                onChange={handleInputChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                placeholder="Enter amount..."
                autoFocus
              />
            </div>
          </div>

          {/* Quick Pick Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick pick amounts
            </label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setTempAmount(amount);
                    setSnowballAmount(amount); // Real-time update like the slider
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                    tempAmount === amount
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-blue-600 border-blue-200 hover:border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  £{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-700">
                New snowball amount: £{tempAmount}/month
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {tempAmount > snowballAmount 
                  ? `+£${tempAmount - snowballAmount} increase from current amount`
                  : tempAmount < snowballAmount
                  ? `£${snowballAmount - tempAmount} decrease from current amount`
                  : 'No change from current amount'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Update Amount
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleEditSnowballModal;