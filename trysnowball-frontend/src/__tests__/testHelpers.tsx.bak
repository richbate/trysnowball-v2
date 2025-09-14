/**
 * Test Utilities and Helpers
 * Centralized testing utilities for consistent test setup
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
 initialEntries?: string[];
 initialIndex?: number;
}

const AllTheProviders = ({ children, initialEntries = ['/'], initialIndex = 0 }: { 
 children: React.ReactNode;
 initialEntries?: string[];
 initialIndex?: number;
}) => {
 return (
  <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
   {children}
  </MemoryRouter>
 );
};

export const renderWithProviders = (
 ui: React.ReactElement,
 { initialEntries, initialIndex, ...renderOptions }: CustomRenderOptions = {}
) => {
 const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AllTheProviders initialEntries={initialEntries} initialIndex={initialIndex}>
   {children}
  </AllTheProviders>
 );

 return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock components for testing
export const createMockComponent = (name: string, testId: string) => {
 return function MockComponent(props: any) {
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
   <div data-testid={testId}>
    {name} - {propsDisplay || 'no props'}
    {props.children}
   </div>
  );
 };
};

// Mock debt data factory
export const createMockDebt = (id: string, name: string, amount_pennies: number, apr: number = 1999) => ({
 id,
 name,
 amount_pennies,
 apr_bps,
 min_payment_pennies: Math.round(amount_pennies * 0.02),
 debt_type: 'Credit Card',
 limit_pennies: amount_pennies * 2,
});

// Standard mock debt datasets
export const mockDebtsEmpty: any[] = [];

export const mockDebtsSingle = [
 createMockDebt('debt1', 'Credit Card', 500000, 1999)
];

export const mockDebtsMultiple = [
 createMockDebt('debt1', 'Credit Card 1', 500000, 1999),
 createMockDebt('debt2', 'Credit Card 2', 300000, 2499),
 createMockDebt('debt3', 'Personal Loan', 200000, 899),
];

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { renderWithProviders as render };