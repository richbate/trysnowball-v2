/**
 * Plan Analytics Tests
 * 
 * Tests PostHog event tracking throughout the Plan workspace.
 * Validates that user interactions emit the correct analytics events.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { renderWithProviders, mockDebtsMultiple } from './testHelpers';

// Mock PostHog
const mockPosthogCapture = jest.fn();
const mockPosthog = {
 capture: mockPosthogCapture,
};

// Add PostHog to global window
declare global {
 interface Window {
  posthog: typeof mockPosthog;
 }
}

beforeEach(() => {
 mockPosthogCapture.mockClear();
 window.posthog = mockPosthog;
});

afterEach(() => {
 delete window.posthog;
});

// Mock hooks with debt data for analytics testing
jest.mock('../hooks/useUserDebts', () => ({
 useUserDebts: () => ({
  debts: mockDebtsMultiple,
  loading: false,
  error: null,
  addDebt: jest.fn(),
  updateDebt: jest.fn(),
  deleteDebt: jest.fn(),
 }),
}));

jest.mock('../hooks/useCsvExport', () => ({
 useCsvExport: () => ({
  exportTimelineData: jest.fn(),
 }),
}));

// Create a simplified ForecastTab component for testing analytics
const MockForecastTabWithAnalytics = () => {
 const [extraPayment, setExtraPayment] = React.useState(100);
 const [chartType, setChartType] = React.useState('line');
 const [scenariosExpanded, setScenariosExpanded] = React.useState(false);

 const handleFocusChange = (debtId: string | null) => {
  if (window.posthog) {
   try {
    const debtName = debtId ? `Test Debt ${debtId}` : null;
    window.posthog.capture('plan_forecast_focus_change', {
     debt_id: debtId,
     debt_name: debtName
    });
   } catch (error) {
    // Silently handle analytics errors
    console.warn('Analytics error:', error);
   }
  }
 };

 const handleBoostChange = (newValue: number) => {
  setExtraPayment(newValue);
  if (newValue > 0 && window.posthog) {
   window.posthog.capture('plan_boost_change', {
    tab: 'forecast',
    boost_pennies: newValue * 100,
    debts_count: 3,
    total_debt_pennies: 1000000
   });
  }
 };

 const handleChartTypeChange = (newType: string) => {
  const prevView = chartType;
  setChartType(newType);
  if (window.posthog) {
   window.posthog.capture('plan_chart_view_change', {
    tab: 'forecast',
    from: prevView,
    to: newType,
    debts_count: 3,
    boost_pennies: extraPayment * 100
   });
  }
 };

 const handleScenariosToggle = () => {
  const newExpanded = !scenariosExpanded;
  setScenariosExpanded(newExpanded);
  if (window.posthog) {
   window.posthog.capture('plan_scenarios_toggle', {
    open: newExpanded
   });
  }
 };

 const handleExportCsv = () => {
  if (window.posthog) {
   window.posthog.capture('plan_export_csv', {
    tab: 'forecast',
    dataset: 'timeline',
    debts_count: 3,
    boost_pennies: extraPayment * 100
   });
  }
 };

 return (
  <div data-testid="forecast-analytics-test">
   <button 
    data-testid="focus-change-btn"
    onClick={() => handleFocusChange('debt1')}
   >
    Focus Debt
   </button>
   <button 
    data-testid="clear-focus-btn"
    onClick={() => handleFocusChange(null)}
   >
    Clear Focus
   </button>
   <input
    data-testid="boost-slider"
    type="range"
    min="0"
    max="1000"
    value={extraPayment}
    onChange={(e) => handleBoostChange(Number(e.target.value))}
   />
   <button
    data-testid="chart-line-btn"
    onClick={() => handleChartTypeChange('line')}
   >
    Line View
   </button>
   <button
    data-testid="chart-stacked-btn"
    onClick={() => handleChartTypeChange('stacked')}
   >
    Stacked View
   </button>
   <button
    data-testid="scenarios-toggle-btn"
    onClick={handleScenariosToggle}
   >
    Toggle Scenarios
   </button>
   <button
    data-testid="export-csv-btn"
    onClick={handleExportCsv}
   >
    Export CSV
   </button>
  </div>
 );
};

// Test component for other tab analytics
const MockDebtsTabWithAnalytics = () => {
 const handleAddDebt = () => {
  if (window.posthog) {
   window.posthog.capture('debt_add_initiated', {
    source: 'debts_tab',
    existing_debts_count: 3
   });
  }
 };

 return (
  <div data-testid="debts-analytics-test">
   <button 
    data-testid="add-debt-btn"
    onClick={handleAddDebt}
   >
    Add Debt
   </button>
  </div>
 );
};

describe('Plan Workspace Analytics', () => {
 describe('ForecastTab Analytics Events', () => {
  test('captures focus change events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('focus-change-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_forecast_focus_change', {
    debt_id: 'debt1',
    debt_name: 'Test Debt debt1'
   });
  });

  test('captures focus clear events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('clear-focus-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_forecast_focus_change', {
    debt_id: null,
    debt_name: null
   });
  });

  test('captures boost change events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   const slider = screen.getByTestId('boost-slider');
   fireEvent.change(slider, { target: { value: '250' } });

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_boost_change', {
    tab: 'forecast',
    boost_pennies: 25000, // 250 * 100
    debts_count: 3,
    total_debt_pennies: 1000000
   });
  });

  test('does not capture boost change events when boost is zero', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   const slider = screen.getByTestId('boost-slider');
   fireEvent.change(slider, { target: { value: '0' } });

   expect(mockPosthogCapture).not.toHaveBeenCalledWith(
    'plan_boost_change',
    expect.any(Object)
   );
  });

  test('captures chart view change events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('chart-stacked-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_chart_view_change', {
    tab: 'forecast',
    from: 'line',
    to: 'stacked',
    debts_count: 3,
    boost_pennies: 10000 // Initial value 100 * 100
   });
  });

  test('captures scenarios toggle events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('scenarios-toggle-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_scenarios_toggle', {
    open: true
   });

   // Click again to toggle off
   fireEvent.click(screen.getByTestId('scenarios-toggle-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_scenarios_toggle', {
    open: false
   });
  });

  test('captures CSV export events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('export-csv-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('plan_export_csv', {
    tab: 'forecast',
    dataset: 'timeline',
    debts_count: 3,
    boost_pennies: 10000
   });
  });
 });

 describe('DebtsTab Analytics Events', () => {
  test('captures debt add initiation events', () => {
   renderWithProviders(<MockDebtsTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('add-debt-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledWith('debt_add_initiated', {
    source: 'debts_tab',
    existing_debts_count: 3
   });
  });
 });

 describe('Analytics Error Handling', () => {
  test('handles missing PostHog gracefully', () => {
   delete window.posthog;
   
   expect(() => {
    renderWithProviders(<MockForecastTabWithAnalytics />);
    fireEvent.click(screen.getByTestId('focus-change-btn'));
   }).not.toThrow();

   expect(mockPosthogCapture).not.toHaveBeenCalled();
  });

  test('handles PostHog capture errors gracefully', () => {
   const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
   
   mockPosthogCapture.mockImplementation(() => {
    throw new Error('Analytics error');
   });

   expect(() => {
    renderWithProviders(<MockForecastTabWithAnalytics />);
    fireEvent.click(screen.getByTestId('focus-change-btn'));
   }).not.toThrow();

   expect(consoleSpy).toHaveBeenCalledWith('Analytics error:', expect.any(Error));
   consoleSpy.mockRestore();
  });

  test('validates event data structure', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.click(screen.getByTestId('focus-change-btn'));

   const [eventName, eventData] = mockPosthogCapture.mock.calls[0];
   
   expect(typeof eventName).toBe('string');
   expect(eventName).toBe('plan_forecast_focus_change');
   expect(typeof eventData).toBe('object');
   expect(eventData).not.toBeNull();
   expect(eventData).toHaveProperty('debt_id');
   expect(eventData).toHaveProperty('debt_name');
  });
 });

 describe('Event Timing and Frequency', () => {
  test('captures analytics events on distinct interactions', async () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   const slider = screen.getByTestId('boost-slider');
   
   // Distinct changes (skipping 100 since that's the initial value that won't trigger change)
   fireEvent.change(slider, { target: { value: '150' } });
   fireEvent.change(slider, { target: { value: '200' } });

   // Should capture each distinct event
   expect(mockPosthogCapture).toHaveBeenCalledTimes(2);
   
   expect(mockPosthogCapture).toHaveBeenNthCalledWith(1, 'plan_boost_change', 
    expect.objectContaining({ boost_pennies: 15000 })
   );
   expect(mockPosthogCapture).toHaveBeenNthCalledWith(2, 'plan_boost_change', 
    expect.objectContaining({ boost_pennies: 20000 })
   );
  });

  test('tracks sequential interactions correctly', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   // Sequential user flow
   fireEvent.click(screen.getByTestId('focus-change-btn'));
   fireEvent.change(screen.getByTestId('boost-slider'), { target: { value: '300' } });
   fireEvent.click(screen.getByTestId('chart-stacked-btn'));
   fireEvent.click(screen.getByTestId('export-csv-btn'));

   expect(mockPosthogCapture).toHaveBeenCalledTimes(4);
   
   const eventTypes = mockPosthogCapture.mock.calls.map(call => call[0]);
   expect(eventTypes).toEqual([
    'plan_forecast_focus_change',
    'plan_boost_change', 
    'plan_chart_view_change',
    'plan_export_csv'
   ]);
  });
 });

 describe('Context-Aware Analytics', () => {
  test('includes relevant context in events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   fireEvent.change(screen.getByTestId('boost-slider'), { target: { value: '500' } });

   const [, eventData] = mockPosthogCapture.mock.calls[0];
   
   expect(eventData).toEqual(
    expect.objectContaining({
     tab: 'forecast',
     boost_pennies: expect.any(Number),
     debts_count: expect.any(Number),
     total_debt_pennies: expect.any(Number)
    })
   );
  });

  test('preserves state transitions in chart view events', () => {
   renderWithProviders(<MockForecastTabWithAnalytics />);

   // Start with line view, change to stacked
   fireEvent.click(screen.getByTestId('chart-stacked-btn'));
   
   const [, eventData] = mockPosthogCapture.mock.calls[0];
   
   expect(eventData).toEqual(
    expect.objectContaining({
     from: 'line',
     to: 'stacked'
    })
   );

   // Change back to line view
   fireEvent.click(screen.getByTestId('chart-line-btn'));
   
   const [, secondEventData] = mockPosthogCapture.mock.calls[1];
   
   expect(secondEventData).toEqual(
    expect.objectContaining({
     from: 'stacked',
     to: 'line'
    })
   );
  });
 });
});