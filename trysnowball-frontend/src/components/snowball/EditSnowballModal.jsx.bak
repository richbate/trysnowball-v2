/**
 * EditSnowballModal
 * 
 * Modal for editing snowball amount with slider and number input.
 * Shows preview of payoff date and interest saved.
 */

import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useSnowballSettings } from '../../hooks/useSnowballSettings';
import { useUserDebts } from '../../hooks/useUserDebts';
import { calculateSnowballTimeline } from '../../selectors/amortization';
import { formatCurrency } from '../../utils/debtFormatting';
import { track } from '../../lib/analytics';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';

const EditSnowballModal = ({ isOpen, onClose }) => {
  const { snowballAmount, setSnowballAmount } = useSnowballSettings();
  const { debts } = useUserDebts();
  const [tempAmount, setTempAmount] = useState(snowballAmount);

  // Calculate preview data
  const preview = useMemo(() => {
    if (!debts || debts.length === 0) {
      return {
        hasData: false,
        currentDate: null,
        newDate: null,
        interestSaved: 0,
        monthsSaved: 0
      };
    }

    try {
      // Current timeline (with existing snowball amount)
      const current = calculateSnowballTimeline(debts, { extraPayment: snowballAmount });
      // New timeline (with temp amount)
      const updated = calculateSnowballTimeline(debts, { extraPayment: tempAmount });
      
      const monthsSaved = Math.max(0, current.months - updated.months);
      const interestSaved = Math.max(0, (current.totalInterestCents - updated.totalInterestCents) / 100);
      
      // Calculate payoff dates
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + current.months);
      
      const newDate = new Date();
      newDate.setMonth(newDate.getMonth() + updated.months);
      
      return {
        hasData: true,
        currentDate,
        newDate,
        interestSaved,
        monthsSaved,
        currentMonths: current.months,
        newMonths: updated.months
      };
    } catch (error) {
      console.warn('[EditSnowballModal] Preview calculation error:', error);
      return {
        hasData: false,
        currentDate: null,
        newDate: null,
        interestSaved: 0,
        monthsSaved: 0
      };
    }
  }, [debts, snowballAmount, tempAmount]);

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setTempAmount(value);
    
    // Track slider adjustment
    track('snowball_slider_adjusted', {
      from: tempAmount,
      to: value,
      source: 'EditSnowballModal'
    });
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTempAmount(Math.max(0, value));
  };

  const handleConfirm = () => {
    const oldAmount = snowballAmount;
    setSnowballAmount(tempAmount);
    
    // Track modal confirmation
    track('snowball_modal_confirmed', {
      amount: tempAmount,
      from: oldAmount,
      monthsSaved: preview.monthsSaved,
      interestSaved: preview.interestSaved,
      source: 'EditSnowballModal'
    });
    
    onClose();
  };

  const handleCancel = () => {
    setTempAmount(snowballAmount); // Reset to original
    onClose();
  };

  // Reset temp amount when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempAmount(snowballAmount);
      
      track('snowball_slider_opened', {
        currentAmount: snowballAmount,
        from: 'modal',
        source: 'EditSnowballModal'
      });
      
      // Track preview shown if there's impact data
      if (preview.hasData && preview.monthsSaved > 0) {
        track('forecast_preview_shown', {
          monthsSaved: preview.monthsSaved,
          interestSaved: preview.interestSaved,
          currentAmount: snowballAmount
        });
      }
    }
  }, [isOpen, snowballAmount]);

  if (!isOpen) return null;

  const formatDate = (date) => {
    return date ? date.toLocaleDateString('en-GB', { 
      month: 'long', 
      year: 'numeric' 
    }) : 'Unknown';
  };

  const maxSliderValue = 500; // £500 max on slider
  const snapPoints = [25, 50, 100, 250, 500]; // Segment button values

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">Boost Your Snowball</h2>
              <p className="text-sm text-muted">Your current snowball: {formatCurrency(snowballAmount)} /mo</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Amount Display - Prominent */}
          <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
            <div className="text-4xl font-bold text-primary mb-2">
              £{tempAmount} /month
            </div>
            {tempAmount !== snowballAmount && (
              <div className="text-sm text-muted">
                (was £{snowballAmount})
              </div>
            )}
            {/* Live Preview Impact */}
            {preview.hasData && tempAmount > snowballAmount && preview.monthsSaved > 0 && (
              <div className="text-green-600 font-medium mt-2 animate-pulse">
                🎉 Save {preview.monthsSaved} months, £{Math.round(preview.interestSaved)} interest
              </div>
            )}
          </div>

          {/* Enhanced Slider with Markers */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text">
              Drag to see the impact
            </label>
            
            <div className="relative px-2">
              {/* Slider Track with Snap Points */}
              <input
                type="range"
                min="0"
                max={maxSliderValue}
                step="5"
                value={Math.min(tempAmount, maxSliderValue)}
                onChange={handleSliderChange}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-500 [&::-webkit-slider-thumb]:to-blue-500
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb:active]:cursor-grabbing
                  [&::-webkit-slider-thumb:active]:scale-110
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-green-500 [&::-moz-range-thumb]:to-blue-500
                  [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-grab"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${(Math.min(tempAmount, maxSliderValue) / maxSliderValue) * 100}%, #E5E7EB ${(Math.min(tempAmount, maxSliderValue) / maxSliderValue) * 100}%, #E5E7EB 100%)`
                }}
              />
              
              {/* Snap Point Markers */}
              {snapPoints.map(point => (
                <div
                  key={point}
                  className="absolute top-0 w-1 h-3 bg-white border border-gray-300 rounded-full"
                  style={{
                    left: `${(point / maxSliderValue) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              ))}
              
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>£0</span>
                <span>£{maxSliderValue}</span>
              </div>
            </div>

            {/* Segment Buttons - Quick Pick */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                Quick pick amounts
              </label>
              <div className="flex flex-wrap gap-2">
                {snapPoints.map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setTempAmount(amount);
                      track('snowball_slider_adjusted', {
                        from: tempAmount,
                        to: amount,
                        source: 'quick_pick_button'
                      });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                      tempAmount === amount
                        ? 'bg-primary text-white border-primary shadow-lg scale-105'
                        : 'bg-white text-primary border-primary/30 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    £{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-tune Input */}
            <FormField>
              <label className="block text-sm font-medium text-text mb-1">
                Or enter exact amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">£</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={tempAmount}
                  onChange={handleInputChange}
                  className="pl-8"
                  placeholder="Enter amount..."
                />
              </div>
            </FormField>
          </div>

          {/* Enhanced Impact Preview */}
          {preview.hasData && tempAmount > 0 && (
            <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-green-200">
              {tempAmount > snowballAmount && preview.monthsSaved > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-2xl mb-2">🎉</div>
                    <div className="text-lg font-bold text-green-700">
                      Debt-free {preview.monthsSaved} months sooner
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="bg-white/80 rounded-lg p-3">
                      <div className="text-muted text-xs">Debt-free by:</div>
                      <div className="font-bold text-green-700 text-lg">
                        {formatDate(preview.newDate)}
                      </div>
                      {preview.currentDate && snowballAmount > 0 && (
                        <div className="text-xs text-muted line-through">
                          was {formatDate(preview.currentDate)}
                        </div>
                      )}
                    </div>
                    
                    {preview.interestSaved > 0 && (
                      <div className="bg-white/80 rounded-lg p-3">
                        <div className="text-muted text-xs">Interest saved:</div>
                        <div className="font-bold text-green-700 text-lg">
                          ≈ £{Math.round(preview.interestSaved)} less interest
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-base font-semibold text-blue-700">
                    Current Plan Preview
                  </div>
                  <div className="text-sm text-muted mt-2">
                    Debt-free by: <strong>{formatDate(preview.newDate)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No debts message */}
          {!preview.hasData && (
            <div className="text-center text-muted py-4">
              <p className="text-sm">Add some debts to see the impact of your snowball amount!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            onClick={handleCancel}
            variant="muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Update Snowball
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditSnowballModal;