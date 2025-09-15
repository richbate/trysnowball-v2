/**
 * Strategy Selection Component for TRY-64
 * Allows users to choose between Snowball and Avalanche debt repayment strategies
 */

import React, { useState } from 'react';

export type DebtStrategy = 'snowball' | 'avalanche';

interface StrategySelectorProps {
  currentStrategy?: DebtStrategy;
  onStrategySelect: (strategy: DebtStrategy) => void;
  comparisonData?: {
    snowball: { timeline: string; totalInterest: number };
    avalanche: { timeline: string; totalInterest: number; savings: number };
  };
}

const StrategySelector: React.FC<StrategySelectorProps> = ({
  currentStrategy,
  onStrategySelect,
  comparisonData
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<DebtStrategy | null>(currentStrategy || null);

  const handleStrategySelect = (strategy: DebtStrategy) => {
    setSelectedStrategy(strategy);
    onStrategySelect(strategy);
  };

  return (
    <div className="glass-card p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Your Debt Repayment Strategy</h3>
        <p className="text-white/70">Both methods work - pick the one that motivates you most:</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Snowball Method */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
            selectedStrategy === 'snowball'
              ? 'border-blue-400 bg-blue-500/20'
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }`}
          onClick={() => handleStrategySelect('snowball')}
        >
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">🏔️</span>
              <div>
                <h4 className="text-lg font-semibold text-white">Snowball Method</h4>
                <span className="text-sm text-white/60">Start Small, Build Momentum</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/90 mb-3">
              Pay off your <strong>smallest debt first</strong>, regardless of interest rate.
            </p>

            <div className="mb-3">
              <h5 className="text-sm font-medium text-green-400 mb-2">✅ Best for:</h5>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Quick psychological wins</li>
                <li>• Building confidence and momentum</li>
                <li>• Staying motivated long-term</li>
              </ul>
            </div>

            <div className="text-xs text-white/50 p-2 bg-white/10 rounded">
              Example: Pay off £500 store card before £5,000 credit card
            </div>
          </div>

          {comparisonData && (
            <div className="text-sm text-white/70 mb-4">
              <div>Timeline: {comparisonData.snowball.timeline}</div>
              <div>Total interest: £{comparisonData.snowball.totalInterest.toLocaleString()}</div>
            </div>
          )}

          <button
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              selectedStrategy === 'snowball'
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleStrategySelect('snowball');
            }}
          >
            {selectedStrategy === 'snowball' ? 'Selected' : 'Choose Snowball'}
          </button>
        </div>

        {/* Avalanche Method */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
            selectedStrategy === 'avalanche'
              ? 'border-purple-400 bg-purple-500/20'
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }`}
          onClick={() => handleStrategySelect('avalanche')}
        >
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">⚡</span>
              <div>
                <h4 className="text-lg font-semibold text-white">Avalanche Method</h4>
                <span className="text-sm text-white/60">Save Maximum Money</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/90 mb-3">
              Pay off your <strong>highest interest rate debt first</strong>, regardless of balance.
            </p>

            <div className="mb-3">
              <h5 className="text-sm font-medium text-green-400 mb-2">✅ Best for:</h5>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Minimizing total interest paid</li>
                <li>• Mathematical optimization</li>
                <li>• Long-term financial discipline</li>
              </ul>
            </div>

            <div className="text-xs text-white/50 p-2 bg-white/10 rounded">
              Example: Pay off 24.9% credit card before 7% personal loan
            </div>
          </div>

          {comparisonData && (
            <div className="text-sm text-white/70 mb-4">
              <div>Timeline: {comparisonData.avalanche.timeline}</div>
              <div>Total interest: £{comparisonData.avalanche.totalInterest.toLocaleString()}</div>
              {comparisonData.avalanche.savings > 0 && (
                <div className="text-green-400 font-medium">
                  Save £{comparisonData.avalanche.savings.toLocaleString()}
                </div>
              )}
            </div>
          )}

          <button
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              selectedStrategy === 'avalanche'
                ? 'bg-purple-600 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleStrategySelect('avalanche');
            }}
          >
            {selectedStrategy === 'avalanche' ? 'Selected' : 'Choose Avalanche'}
          </button>
        </div>
      </div>

      {selectedStrategy && (
        <div className="glass-subtle p-4">
          <div className="flex items-center text-white">
            <span className="text-lg mr-2">
              {selectedStrategy === 'snowball' ? '🏔️' : '⚡'}
            </span>
            <span className="font-medium">
              {selectedStrategy === 'snowball' ? 'Snowball Method' : 'Avalanche Method'} selected
            </span>
            <span className="ml-auto text-sm text-white/60">
              Your debts will be reordered accordingly
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategySelector;