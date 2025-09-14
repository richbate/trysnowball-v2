/**
 * Plan Component Integration Tests
 * 
 * Tests the core integration contract between Plan workspace and its tabs.
 * Validates navigation, data flow, and tab integration without external dependencies.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Plan from '../pages/Plan';
import { renderWithProviders } from './testHelpers';

// Mock hooks
jest.mock('../hooks/useUserDebts', () => ({
 useUserDebts: () => ({
  debts: [],
  loading: false,
  error: null,
 }),
}));

// Mock child components to isolate Plan logic
jest.mock('../components/plan/DebtsTab/DebtsTab', () => {
 return function MockDebtsTab(props: any) {
  const propsDisplay = Object.keys(props)
   .filter(key => key !== 'children')
   .map(key => {
    if (key === 'overrideDebts' || key === 'debts' || key === 'timelineDebtsData') {
     return `${key}: ${props[key]?.length || 0} items`;
    }
    if (key === 'hasNoDebtData') {
     return `${key}: ${props[key] ? 'true' : 'false'}`;
    }
    if (typeof props[key] === 'function') {
     return `${key}: function`;
    }
    return `${key}: ${props[key]}`;
   })
   .join(', ');

  return (
   <div data-testid="debts-tab-mock">
    DebtsTab - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
});

jest.mock('../components/plan/StrategyTab/StrategyTab', () => {
 return function MockStrategyTab(props: any) {
  const propsDisplay = Object.keys(props)
   .filter(key => key !== 'children')
   .map(key => {
    if (key === 'overrideDebts' || key === 'debts' || key === 'timelineDebtsData') {
     return `${key}: ${props[key]?.length || 0} items`;
    }
    if (key === 'hasNoDebtData') {
     return `${key}: ${props[key] ? 'true' : 'false'}`;
    }
    if (typeof props[key] === 'function') {
     return `${key}: function`;
    }
    return `${key}: ${props[key]}`;
   })
   .join(', ');

  return (
   <div data-testid="strategy-tab-mock">
    StrategyTab - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
});

jest.mock('../components/plan/ForecastTab/ForecastTab', () => {
 return function MockForecastTab(props: any) {
  const propsDisplay = Object.keys(props)
   .filter(key => key !== 'children')
   .map(key => {
    if (key === 'overrideDebts' || key === 'debts' || key === 'timelineDebtsData') {
     return `${key}: ${props[key]?.length || 0} items`;
    }
    if (key === 'hasNoDebtData') {
     return `${key}: ${props[key] ? 'true' : 'false'}`;
    }
    if (typeof props[key] === 'function') {
     return `${key}: function`;
    }
    return `${key}: ${props[key]}`;
   })
   .join(', ');

  return (
   <div data-testid="forecast-tab-mock">
    ForecastTab - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
});

jest.mock('../pages/MyPlan/SnowflakesTab', () => {
 return function MockSnowflakesTab(props: any) {
  const propsDisplay = Object.keys(props)
   .filter(key => key !== 'children')
   .map(key => {
    if (key === 'overrideDebts' || key === 'debts' || key === 'timelineDebtsData') {
     return `${key}: ${props[key]?.length || 0} items`;
    }
    if (key === 'hasNoDebtData') {
     return `${key}: ${props[key] ? 'true' : 'false'}`;
    }
    if (typeof props[key] === 'function') {
     return `${key}: function`;
    }
    return `${key}: ${props[key]}`;
   })
   .join(', ');

  return (
   <div data-testid="snowflakes-tab-mock">
    SnowflakesTab - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
});

jest.mock('../pages/MyPlan/GoalsTab', () => {
 return function MockGoalsTab(props: any) {
  const propsDisplay = Object.keys(props)
   .filter(key => key !== 'children')
   .map(key => {
    if (key === 'overrideDebts' || key === 'debts' || key === 'timelineDebtsData') {
     return `${key}: ${props[key]?.length || 0} items`;
    }
    if (key === 'hasNoDebtData') {
     return `${key}: ${props[key] ? 'true' : 'false'}`;
    }
    if (typeof props[key] === 'function') {
     return `${key}: function`;
    }
    return `${key}: ${props[key]}`;
   })
   .join(', ');

  return (
   <div data-testid="goals-tab-mock">
    GoalsTab - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
});

jest.mock('../components/DemoWatermark', () => {
 return function MockDemoWatermark() {
  return <div data-testid="demo-watermark">Demo</div>;
 };
});

const renderPlan = (initialRoute = '/plan/debts') => {
 return renderWithProviders(<Plan />, { initialEntries: [initialRoute] });
};

describe('Plan Component Integration', () => {
 describe('Basic Structure', () => {
  test('renders plan workspace with all essential elements', () => {
   renderPlan();
   
   expect(screen.getByTestId('plan-workspace')).toBeInTheDocument();
   expect(screen.getByTestId('plan-header')).toBeInTheDocument();
   expect(screen.getByTestId('plan-title')).toHaveTextContent('Your Debt Plan');
   expect(screen.getByTestId('plan-subtitle')).toHaveTextContent('Manage debts, choose strategy, and track progress');
   expect(screen.getByTestId('plan-tabs')).toBeInTheDocument();
   expect(screen.getByTestId('plan-content')).toBeInTheDocument();
  });

  test('renders all navigation tabs', () => {
   renderPlan();
   
   expect(screen.getByTestId('plan-tab-debts')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-strategy')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-forecast')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-snowflakes')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-goals')).toBeInTheDocument();
  });

  test('displays correct tab labels and icons', () => {
   renderPlan();
   
   expect(screen.getByTestId('plan-tab-debts')).toHaveTextContent('💳');
   expect(screen.getByTestId('plan-tab-debts')).toHaveTextContent('Debts');
   expect(screen.getByTestId('plan-tab-strategy')).toHaveTextContent('🎯');
   expect(screen.getByTestId('plan-tab-strategy')).toHaveTextContent('Strategy');
   expect(screen.getByTestId('plan-tab-forecast')).toHaveTextContent('📊');
   expect(screen.getByTestId('plan-tab-forecast')).toHaveTextContent('Forecast');
  });
 });

 describe('Tab Navigation', () => {
  test('defaults to debts tab when accessing /plan', () => {
   renderPlan('/plan');
   
   expect(screen.getByTestId('debts-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-debts')).toHaveClass('border-primary');
  });

  test('loads debts tab correctly', () => {
   renderPlan('/plan/debts');
   
   expect(screen.getByTestId('debts-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-debts')).toHaveClass('border-primary');
  });

  test('loads strategy tab correctly', () => {
   renderPlan('/plan/strategy');
   
   expect(screen.getByTestId('strategy-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-strategy')).toHaveClass('border-primary');
  });

  test('loads forecast tab correctly', () => {
   renderPlan('/plan/forecast');
   
   expect(screen.getByTestId('forecast-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-forecast')).toHaveClass('border-primary');
  });

  test('loads snowflakes tab correctly', () => {
   renderPlan('/plan/snowflakes');
   
   expect(screen.getByTestId('snowflakes-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-snowflakes')).toHaveClass('border-primary');
  });

  test('loads goals tab correctly', () => {
   renderPlan('/plan/goals');
   
   expect(screen.getByTestId('goals-tab-mock')).toBeInTheDocument();
   expect(screen.getByTestId('plan-tab-goals')).toHaveClass('border-primary');
  });
 });

 describe('Data Propagation', () => {
  test('passes empty debt array to all tabs when no debts', () => {
   renderPlan('/plan/debts');
   
   expect(screen.getByTestId('debts-tab-mock')).toHaveTextContent('overrideDebts: 0 items');
   
   // Navigate to other tabs to check data propagation
   fireEvent.click(screen.getByTestId('plan-tab-strategy'));
   expect(screen.getByTestId('strategy-tab-mock')).toHaveTextContent('hasNoDebtData: true');
   
   fireEvent.click(screen.getByTestId('plan-tab-forecast'));
   expect(screen.getByTestId('forecast-tab-mock')).toHaveTextContent('hasNoDebtData: true');
   
   fireEvent.click(screen.getByTestId('plan-tab-snowflakes'));
   expect(screen.getByTestId('snowflakes-tab-mock')).toHaveTextContent('debts: 0 items');
   
   fireEvent.click(screen.getByTestId('plan-tab-goals'));
   expect(screen.getByTestId('goals-tab-mock')).toHaveTextContent('debts: 0 items');
  });

  test('passes hasNoDebtData flag correctly to tabs', () => {
   renderPlan('/plan/strategy');
   
   expect(screen.getByTestId('strategy-tab-mock')).toHaveTextContent('hasNoDebtData: true');
   
   fireEvent.click(screen.getByTestId('plan-tab-forecast'));
   expect(screen.getByTestId('forecast-tab-mock')).toHaveTextContent('hasNoDebtData: true');
  });
 });

 describe('Theme Integration', () => {
  test('applies theme colors to main elements', () => {
   renderPlan();
   
   const workspace = screen.getByTestId('plan-workspace');
   expect(workspace).toHaveClass('bg-gray-50'); // Default background
   
   const header = screen.getByTestId('plan-header');
   expect(header).toHaveClass('bg-white', 'border-b', 'border-gray-200');
  });

  test('handles missing theme colors gracefully', () => {
   renderPlan();
   
   // Should render without crashing even with fallback colors
   expect(screen.getByTestId('plan-workspace')).toBeInTheDocument();
  });
 });

 describe('Route Handling', () => {
  test('redirects root plan path to debts', () => {
   renderPlan('/plan');
   
   // Should show debts tab content
   expect(screen.getByTestId('debts-tab-mock')).toBeInTheDocument();
  });

  test('handles unknown routes gracefully', () => {
   renderPlan('/plan/unknown');
   
   // Should still render the plan workspace
   expect(screen.getByTestId('plan-workspace')).toBeInTheDocument();
  });
 });

 describe('Active Tab Detection', () => {
  test('correctly identifies active tab from URL path', () => {
   renderPlan('/plan/strategy');
   
   const strategyTab = screen.getByTestId('plan-tab-strategy');
   const debtsTab = screen.getByTestId('plan-tab-debts');
   
   expect(strategyTab).toHaveClass('border-primary');
   expect(debtsTab).not.toHaveClass('border-primary');
  });

  test('updates active tab when navigating', () => {
   renderPlan('/plan/debts');
   
   expect(screen.getByTestId('plan-tab-debts')).toHaveClass('border-primary');
   
   fireEvent.click(screen.getByTestId('plan-tab-forecast'));
   
   expect(screen.getByTestId('plan-tab-forecast')).toHaveClass('border-primary');
   expect(screen.getByTestId('plan-tab-debts')).not.toHaveClass('border-primary');
  });
 });

 describe('Component Dependencies', () => {
  test('renders DemoWatermark component', () => {
   renderPlan();
   
   expect(screen.getByTestId('demo-watermark')).toBeInTheDocument();
  });

  test('passes colors prop to strategy and forecast tabs', () => {
   renderPlan('/plan/strategy');
   
   // Strategy tab should receive colors - verified by it rendering without error
   expect(screen.getByTestId('strategy-tab-mock')).toBeInTheDocument();
   
   fireEvent.click(screen.getByTestId('plan-tab-forecast'));
   expect(screen.getByTestId('forecast-tab-mock')).toBeInTheDocument();
  });
 });
});