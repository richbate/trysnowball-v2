/**
 * GlobalSnowballWidget
 * 
 * Floating widget for global snowball amount control.
 * Shows current amount, quick increment buttons, and navigation to forecast.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnowballSettings } from '../../hooks/useSnowballSettings';
import { useUserDebts } from '../../hooks/useUserDebts';
import { calculateSnowballTimeline } from '../../selectors/amortization';
import { formatCurrency } from '../../utils/debtFormatting';
import { Edit3, TrendingUp, Plus } from 'lucide-react';
import EditSnowballModal from './EditSnowballModal';

const GlobalSnowballWidget = ({ className = '', position = 'bottom-right' }) => {
  const navigate = useNavigate();
  const { snowballAmount, incrementSnowballAmount } = useSnowballSettings();
  const { debts } = useUserDebts();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate impact (months saved) if we have debts
  const impact = React.useMemo(() => {
    if (!debts || debts.length === 0 || snowballAmount === 0) {
      return { monthsSaved: 0, interestSaved: 0 };
    }

    try {
      // Calculate timeline with and without snowball
      const withSnowball = calculateSnowballTimeline(debts, { extraPayment: snowballAmount });
      const withoutSnowball = calculateSnowballTimeline(debts, { extraPayment: 0 });
      
      const monthsSaved = Math.max(0, withoutSnowball.months - withSnowball.months);
      const interestSaved = Math.max(0, (withoutSnowball.totalInterestCents - withSnowball.totalInterestCents) / 100);
      
      return { monthsSaved, interestSaved };
    } catch (error) {
      console.warn('[GlobalSnowballWidget] Impact calculation error:', error);
      return { monthsSaved: 0, interestSaved: 0 };
    }
  }, [debts, snowballAmount]);

  const handleIncrement = (amount) => {
    incrementSnowballAmount(amount);
    
    // Show confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSeeForecast = () => {
    navigate('/my-plan?tab=forecast');
  };

  // Don't show widget if no debts
  if (!debts || debts.length === 0) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-20 right-4',
    'header': 'relative'
  };

  const { monthsSaved, interestSaved } = impact;

  return (
    <div className={`${positionClasses[position]} z-50 ${className}`}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
            🎉 Debt-free {monthsSaved} months sooner!
          </div>
        </div>
      )}
      
      {/* Main widget */}
      <div className="bg-white rounded-2xl shadow-xl border border-border p-4 min-w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">Snowball Amount</h3>
              <p className="text-xs text-muted">Extra monthly payment</p>
            </div>
          </div>
        </div>

        {/* Amount display */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-text">
            {formatCurrency(snowballAmount)} /mo
          </div>
          {snowballAmount > 0 && monthsSaved > 0 && (
            <div className="text-sm text-green-600 font-medium">
              💨 {monthsSaved} months faster
            </div>
          )}
          {snowballAmount > 0 && interestSaved > 0 && (
            <div className="text-xs text-muted">
              Save ~{formatCurrency(interestSaved)} interest
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick increment buttons */}
          <button
            onClick={() => handleIncrement(25)}
            className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            +£25
          </button>
          <button
            onClick={() => handleIncrement(50)}
            className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            +£50
          </button>
          
          {/* Edit button */}
          <button
            onClick={handleEdit}
            className="p-2 bg-surface-secondary hover:bg-border rounded-lg transition-colors"
            title="Edit amount"
          >
            <Edit3 className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* See forecast link */}
        <button
          onClick={handleSeeForecast}
          className="w-full mt-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          See Forecast →
        </button>
      </div>

      {/* Edit Modal */}
      <EditSnowballModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default GlobalSnowballWidget;