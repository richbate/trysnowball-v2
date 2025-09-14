/**
 * SimplePersistentSnowballControlBar
 * 
 * Simplified version that works around import issues
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Snowflake, TrendingUp } from 'lucide-react';
import { useSnowballSettings } from '../../hooks/useSnowballSettings';
import { useUserDebts } from '../../hooks/useUserDebts';
import { calculateSnowballTimeline } from '../../selectors/amortization';
import { addSnowflake } from '../../lib/snowflakes';
import { track } from '../../lib/analytics';

const SimplePersistentSnowballControlBar = ({ 
  onForecastUpdate, 
  className = ""
}) => {
  const { snowballAmount, setSnowballAmount, incrementSnowballAmount } = useSnowballSettings();
  const { debts } = useUserDebts();
  const [isSnowflakeModalOpen, setIsSnowflakeModalOpen] = useState(false);
  const [snowflakeAmount, setSnowflakeAmount] = useState('');

  // Calculate impact preview
  const impact = useMemo(() => {
    if (!debts || debts.length === 0) {
      return {
        monthsSaved: 0,
        interestSaved: 0,
        newPayoffDate: null,
        hasData: false
      };
    }

    try {
      // Current timeline (minimum payments only)
      const baseTimeline = calculateSnowballTimeline(debts, { extraPayment: 0 });
      // Timeline with snowball
      const snowballTimeline = calculateSnowballTimeline(debts, { extraPayment: snowballAmount });
      
      const monthsSaved = Math.max(0, baseTimeline.months - snowballTimeline.months);
      const interestSaved = Math.max(0, (baseTimeline.totalInterestCents - snowballTimeline.totalInterestCents) / 100);
      
      // Calculate payoff date
      const newPayoffDate = new Date();
      newPayoffDate.setMonth(newPayoffDate.getMonth() + snowballTimeline.months);
      
      return {
        monthsSaved,
        interestSaved: Math.round(interestSaved),
        newPayoffDate: newPayoffDate.toLocaleDateString('en-GB', { 
          month: 'long', 
          year: 'numeric' 
        }),
        hasData: true,
        totalMonths: snowballTimeline.months
      };
    } catch (error) {
      console.warn('[SimplePersistentSnowballControlBar] Impact calculation error:', error);
      return {
        monthsSaved: 0,
        interestSaved: 0,
        newPayoffDate: null,
        hasData: false
      };
    }
  }, [debts, snowballAmount]);

  // Quick increment handlers
  const handleQuickIncrement = (increment) => {
    incrementSnowballAmount(increment);
    
    track('snowball_bar_quick_increment', {
      increment,
      from: snowballAmount,
      to: snowballAmount + increment,
      source: 'quick_button'
    });
  };

  // Debounced slider change handler  
  const handleSliderChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    setSnowballAmount(value);
    
    track('snowball_bar_amount_changed', {
      from: snowballAmount,
      to: value,
      source: 'persistent_slider',
      monthsSaved: impact.monthsSaved || 0,
      interestSaved: impact.interestSaved || 0
    });
  }, [snowballAmount, impact, setSnowballAmount]);

  // Snowflake handlers
  const handleSnowflakeSubmit = () => {
    const amount = parseFloat(snowflakeAmount);
    if (amount > 0) {
      // Get next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthIndex = 1; // Next month
      
      // Find the smallest debt (snowball strategy)
      const sortedDebts = [...debts].sort((a, b) => {
        const balanceA = a.amount_pennies || (a.balance * 100);
        const balanceB = b.amount_pennies || (b.balance * 100);
        return balanceA - balanceB;
      });
      
      const targetDebt = sortedDebts[0];
      
      if (targetDebt) {
        addSnowflake({
          debtId: targetDebt.id,
          monthIndex,
          amount,
          note: `Quick snowflake from control bar`
        });

        track('snowflake_logged', {
          amount,
          month: nextMonth.toISOString().slice(0, 7), // YYYY-MM format
          debtId: targetDebt.id,
          source: 'persistent_control_bar'
        });

        setSnowflakeAmount('');
        setIsSnowflakeModalOpen(false);
      }
    }
  };

  const maxSliderValue = 500; // £500 max
  const quickIncrements = [25, 50, 100];

  // Don't render if no debts  
  if (!debts || debts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Impact Preview Row */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-primary mb-1">
            💷 £{snowballAmount} /month extra
          </div>
          
          {impact.hasData && snowballAmount > 0 && impact.monthsSaved > 0 ? (
            <div className="text-lg text-green-700 font-semibold animate-pulse">
              🎉 Save {impact.monthsSaved} months, £{impact.interestSaved.toLocaleString()} interest
            </div>
          ) : snowballAmount > 0 && impact.hasData ? (
            <div className="text-base text-blue-700">
              📊 Debt-free by: <strong>{impact.newPayoffDate}</strong>
            </div>
          ) : (
            <div className="text-base text-gray-600">
              Drag the slider to see potential debt payoff acceleration! 🚀
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-6">
          {/* Slider */}
          <div className="flex-1 max-w-md relative">
            <input
              type="range"
              min="0"
              max={maxSliderValue}
              step="5"
              value={Math.min(snowballAmount, maxSliderValue)}
              onChange={handleSliderChange}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-500 [&::-webkit-slider-thumb]:to-blue-500
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-lg"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${(Math.min(snowballAmount, maxSliderValue) / maxSliderValue) * 100}%, #E5E7EB ${(Math.min(snowballAmount, maxSliderValue) / maxSliderValue) * 100}%, #E5E7EB 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>£0</span>
              <span>£{maxSliderValue}</span>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex gap-2">
            {quickIncrements.map(increment => (
              <button
                key={increment}
                onClick={() => handleQuickIncrement(increment)}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
              >
                +£{increment}
              </button>
            ))}
          </div>

          {/* Snowflake Button */}
          <div className="relative">
            {!isSnowflakeModalOpen ? (
              <button
                onClick={() => {
                  setIsSnowflakeModalOpen(true);
                  track('snowball_bar_snowflake_opened', {
                    currentAmount: snowballAmount
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Snowflake className="w-4 h-4" />
                Log Snowflake
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <span className="text-xs text-blue-700 font-medium">£</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={snowflakeAmount}
                  onChange={(e) => setSnowflakeAmount(e.target.value)}
                  placeholder="60"
                  className="w-16 text-sm px-1 py-1 border-none outline-none bg-transparent"
                  autoFocus
                />
                <button
                  onClick={handleSnowflakeSubmit}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsSnowflakeModalOpen(false);
                    setSnowflakeAmount('');
                  }}
                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePersistentSnowballControlBar;