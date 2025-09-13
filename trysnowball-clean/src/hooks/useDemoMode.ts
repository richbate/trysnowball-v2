/**
 * Demo Mode Hook
 * Manages demo scenario state and integration with debt data
 */

import { useState, useCallback } from 'react';
import { DemoScenario, DemoDebt } from '../data/demoScenarios';
import { UKDebt } from '../types/UKDebt';
import { analytics } from '../services/analytics';

const DEMO_MODE_STORAGE_KEY = 'trysnowball_demo_mode';
const DEMO_SCENARIO_STORAGE_KEY = 'trysnowball_demo_scenario';

export interface DemoModeState {
  isEnabled: boolean;
  currentScenario: DemoScenario | null;
  scenarioId: string | null;
}

export function useDemoMode() {
  const [demoState, setDemoState] = useState<DemoModeState>(() => {
    try {
      const savedDemoMode = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
      const savedScenarioId = localStorage.getItem(DEMO_SCENARIO_STORAGE_KEY);

      return {
        isEnabled: savedDemoMode === 'true',
        currentScenario: null,
        scenarioId: savedScenarioId
      };
    } catch {
      return {
        isEnabled: false,
        currentScenario: null,
        scenarioId: null
      };
    }
  });

  // Enable demo mode with a specific scenario
  const enableDemo = useCallback((scenario: DemoScenario) => {
    setDemoState({
      isEnabled: true,
      currentScenario: scenario,
      scenarioId: scenario.id
    });

    // Persist to localStorage
    try {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
      localStorage.setItem(DEMO_SCENARIO_STORAGE_KEY, scenario.id);
    } catch (error) {
      console.warn('Failed to persist demo mode state:', error);
    }

    // Track demo activation
    analytics.track('cta_clicked', {
      text: `Enable Demo: ${scenario.title}`,
      location: 'demo_mode_hook',
      page: 'Dashboard'
    });
  }, []);

  // Disable demo mode
  const disableDemo = useCallback(() => {
    setDemoState({
      isEnabled: false,
      currentScenario: null,
      scenarioId: null
    });

    // Clear localStorage
    try {
      localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      localStorage.removeItem(DEMO_SCENARIO_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear demo mode state:', error);
    }

    // Track demo deactivation
    analytics.track('cta_clicked', {
      text: 'Disable Demo Mode',
      location: 'demo_mode_hook',
      page: 'Dashboard'
    });
  }, []);

  // Switch to a different demo scenario
  const switchScenario = useCallback((scenario: DemoScenario | null) => {
    if (!scenario) {
      disableDemo();
      return;
    }

    enableDemo(scenario);
  }, [enableDemo, disableDemo]);

  // Convert demo debts to UKDebt format for compatibility
  const getDemoDebts = useCallback((): UKDebt[] => {
    if (!demoState.isEnabled || !demoState.currentScenario) {
      return [];
    }

    return demoState.currentScenario.debts.map((debt: DemoDebt, index: number): UKDebt => ({
      id: debt.id,
      user_id: 'demo-user',
      name: debt.name,
      amount: debt.amount,
      apr: debt.interest_rate,
      min_payment: debt.min_payment,
      order_index: index + 1,
      debt_type: debt.debt_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }, [demoState.isEnabled, demoState.currentScenario]);

  // Check if a specific debt is from demo data
  const isDemoDebt = useCallback((debtId: string): boolean => {
    if (!demoState.isEnabled || !demoState.currentScenario) {
      return false;
    }

    return demoState.currentScenario.debts.some(debt => debt.id === debtId);
  }, [demoState.isEnabled, demoState.currentScenario]);

  // Get demo analytics context
  const getDemoAnalyticsContext = useCallback(() => {
    if (!demoState.isEnabled || !demoState.currentScenario) {
      return {};
    }

    return {
      demo_mode: true,
      demo_scenario: demoState.currentScenario.id,
      demo_scenario_name: demoState.currentScenario.title,
      demo_total_debt: demoState.currentScenario.totalDebt,
      demo_monthly_payments: demoState.currentScenario.monthlyPayments
    };
  }, [demoState.isEnabled, demoState.currentScenario]);

  // Track page views with demo context
  const trackDemoPageView = useCallback((pageName: string, additionalProps?: Record<string, any>) => {
    const demoContext = getDemoAnalyticsContext();

    analytics.trackPageView(pageName, {
      ...additionalProps,
      ...demoContext
    });
  }, [getDemoAnalyticsContext]);

  return {
    // State
    isEnabled: demoState.isEnabled,
    currentScenario: demoState.currentScenario,
    scenarioId: demoState.scenarioId,

    // Actions
    enableDemo,
    disableDemo,
    switchScenario,

    // Utilities
    getDemoDebts,
    isDemoDebt,
    getDemoAnalyticsContext,
    trackDemoPageView
  };
}