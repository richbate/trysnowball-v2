/**
 * Demo Mode Component
 * Scenario selector and demo data management
 */

import React, { useState, useEffect } from 'react';
import { getDemoScenario, getScenarioOptions, DemoScenario } from '../data/demoScenarios';
import { analytics } from '../services/analytics';

interface DemoModeProps {
  onScenarioSelect: (scenario: DemoScenario | null) => void;
  currentScenarioId?: string;
  isVisible: boolean;
}

export default function DemoMode({ onScenarioSelect, currentScenarioId, isVisible }: DemoModeProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>(currentScenarioId || '');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (currentScenarioId) {
      setSelectedScenario(currentScenarioId);
    }
  }, [currentScenarioId]);

  const handleScenarioChange = (scenarioId: string) => {
    const scenario = getDemoScenario(scenarioId);

    if (scenarioId === '') {
      // Clear demo mode
      analytics.track('cta_clicked', {
        text: 'Exit Demo Mode',
        location: 'demo_selector',
        page: 'Dashboard'
      });

      setSelectedScenario('');
      onScenarioSelect(null);
      setIsExpanded(false);
      return;
    }

    if (scenario) {
      analytics.track('cta_clicked', {
        text: `Demo: ${scenario.title}`,
        location: 'demo_selector',
        page: 'Dashboard'
      });

      setSelectedScenario(scenarioId);
      onScenarioSelect(scenario);
      setIsExpanded(false);
    }
  };

  const currentScenario = selectedScenario ? getDemoScenario(selectedScenario) : null;
  const scenarioOptions = getScenarioOptions();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Demo Mode Banner */}
      <div className="glass-card bg-blue-600/20 border-blue-400/30 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/30 rounded-full">
              <span className="text-lg">🎭</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Demo Mode</h3>
              <p className="text-blue-200 text-sm">
                {currentScenario
                  ? `Viewing: ${currentScenario.persona.name}'s scenario`
                  : 'Select a realistic UK household scenario'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Hide Options' : 'Change Scenario'}
          </button>
        </div>
      </div>

      {/* Scenario Selector */}
      {isExpanded && (
        <div className="glass-card space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Choose a Demo Scenario</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clear Demo Option */}
            <button
              onClick={() => handleScenarioChange('')}
              className={`text-left p-4 rounded-lg border transition-all ${
                selectedScenario === ''
                  ? 'border-red-400 bg-red-500/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🚪</span>
                <h5 className="font-semibold text-white">Exit Demo Mode</h5>
              </div>
              <p className="text-white/70 text-sm">
                Return to your own debt data
              </p>
            </button>

            {/* Demo Scenarios */}
            {scenarioOptions.map((option) => {
              return (
                <button
                  key={option.id}
                  onClick={() => handleScenarioChange(option.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selectedScenario === option.id
                      ? 'border-fuchsia-400 bg-fuchsia-500/10'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-white">{option.title}</h5>
                      <p className="text-white/70 text-sm">{option.subtitle}</p>
                    </div>
                    {selectedScenario === option.id && (
                      <span className="text-fuchsia-400">✓</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">
                      Total: {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                        minimumFractionDigits: 0
                      }).format(option.totalDebt)}
                    </span>
                    <span className="text-white/60">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                        minimumFractionDigits: 0
                      }).format(option.monthlyPayments)}/mo
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Scenario Details */}
      {currentScenario && !isExpanded && (
        <div className="glass-card">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-fuchsia-600/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{currentScenario.persona.name}</h4>
                  <p className="text-white/70 text-sm">{currentScenario.persona.situation}</p>
                </div>
              </div>

              <p className="text-white/80 text-sm leading-relaxed mb-4">
                {currentScenario.description}
              </p>

              <div className="space-y-2">
                {currentScenario.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-400 text-sm mt-0.5">💡</span>
                    <span className="text-white/80 text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:w-48 space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-fuchsia-300">
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    minimumFractionDigits: 0
                  }).format(currentScenario.totalDebt)}
                </div>
                <div className="text-white/60 text-sm">Total Debt</div>
              </div>

              <div className="text-center">
                <div className="text-xl font-semibold text-orange-300">
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    minimumFractionDigits: 0
                  }).format(currentScenario.monthlyPayments)}
                </div>
                <div className="text-white/60 text-sm">Monthly Payments</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-blue-300">
                  {Math.round(currentScenario.estimatedPayoffMonths / 12 * 10) / 10} years
                </div>
                <div className="text-white/60 text-sm">Payoff Time</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}