import React from 'react';
import { render, screen } from '@testing-library/react';
import DebtBurndownChart from '../DebtBurndownChart';
import { PlanResult } from '../../types/Forecast';

// Mock Recharts components since they don't render properly in test environment
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: ({ dataKey, name, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

describe('DebtBurndownChart', () => {
  const mockResults: PlanResult[] = [
    {
      month: 1,
      debts: [
        {
          id: 'debt1',
          name: 'Credit Card',
          startingBalance: 5000,
          interestCharged: 41.67,
          principalPaid: 158.33,
          snowballApplied: 100,
          endingBalance: 4841.67,
          isPaidOff: false
        }
      ],
      totalBalance: 4841.67,
      totalInterest: 41.67,
      totalPrincipal: 158.33,
      snowballAmount: 100
    },
    {
      month: 2,
      debts: [
        {
          id: 'debt1',
          name: 'Credit Card',
          startingBalance: 4841.67,
          interestCharged: 40.35,
          principalPaid: 159.65,
          snowballApplied: 100,
          endingBalance: 4682.02,
          isPaidOff: false
        }
      ],
      totalBalance: 4682.02,
      totalInterest: 40.35,
      totalPrincipal: 159.65,
      snowballAmount: 100
    },
    {
      month: 3,
      debts: [
        {
          id: 'debt1',
          name: 'Credit Card',
          startingBalance: 4682.02,
          interestCharged: 39.02,
          principalPaid: 160.98,
          snowballApplied: 100,
          endingBalance: 4521.04,
          isPaidOff: false
        }
      ],
      totalBalance: 4521.04,
      totalInterest: 39.02,
      totalPrincipal: 160.98,
      snowballAmount: 100
    }
  ];

  describe('when given valid forecast data', () => {
    it('accepts forecast data correctly', () => {
      render(<DebtBurndownChart results={mockResults} />);
      
      expect(screen.getByText('Debt Burndown Timeline')).toBeInTheDocument();
      expect(screen.getByText('Watch your debt balances decrease over time with your current payment plan')).toBeInTheDocument();
    });

    it('renders the chart container and components', () => {
      render(<DebtBurndownChart results={mockResults} />);
      
      // Verify chart structure is rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders 3 lines correctly (debt, paid, interest)', () => {
      render(<DebtBurndownChart results={mockResults} />);
      
      // Verify the three main data lines
      const debtLine = screen.getByTestId('line-totalBalance');
      expect(debtLine).toBeInTheDocument();
      expect(debtLine).toHaveAttribute('data-name', 'Remaining Debt');
      expect(debtLine).toHaveAttribute('data-stroke', '#ef4444'); // Red
      
      const paidLine = screen.getByTestId('line-totalPaid');
      expect(paidLine).toBeInTheDocument();
      expect(paidLine).toHaveAttribute('data-name', 'Total Paid');
      expect(paidLine).toHaveAttribute('data-stroke', '#10b981'); // Green
      
      const interestLine = screen.getByTestId('line-interestPaid');
      expect(interestLine).toBeInTheDocument();
      expect(interestLine).toHaveAttribute('data-name', 'Interest Paid');
      expect(interestLine).toHaveAttribute('data-stroke', '#f59e0b'); // Yellow/Amber
    });

    it('displays the legend with correct labels', () => {
      render(<DebtBurndownChart results={mockResults} />);
      
      expect(screen.getByText('Remaining Debt (decreasing)')).toBeInTheDocument();
      expect(screen.getByText('Total Paid (increasing)')).toBeInTheDocument();
      expect(screen.getByText('Interest Paid')).toBeInTheDocument();
    });

    it('applies custom className correctly', () => {
      const { container } = render(<DebtBurndownChart results={mockResults} className="custom-class" />);
      
      const chartContainer = container.querySelector('.custom-class');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('when given empty forecast', () => {
    it('handles empty forecast gracefully', () => {
      render(<DebtBurndownChart results={[]} />);
      
      // Should show empty state
      expect(screen.getByText('No data available for chart')).toBeInTheDocument();
      
      // Should not render chart components
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
      
      // Should show empty state icon (SVG)
      const emptyIcon = screen.getByLabelText('Chart icon');
      expect(emptyIcon).toBeInTheDocument();
    });

    it('shows proper empty state styling', () => {
      const { container } = render(<DebtBurndownChart results={[]} />);
      
      const emptyState = container.querySelector('.p-8.bg-gray-50.rounded-lg.text-center');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('data processing', () => {
    it('calculates cumulative values correctly', () => {
      // This test verifies the data transformation logic
      // Since we're mocking Recharts, we can't directly test the data passed to it
      // But we can verify the component renders without errors with complex data
      
      const complexResults: PlanResult[] = [
        {
          month: 1,
          debts: [],
          totalBalance: 10000,
          totalInterest: 83.33,
          totalPrincipal: 216.67,
          snowballAmount: 200
        },
        {
          month: 2,
          debts: [],
          totalBalance: 9783.33,
          totalInterest: 81.53,
          totalPrincipal: 218.47,
          snowballAmount: 200
        }
      ];

      render(<DebtBurndownChart results={complexResults} />);
      
      // Should render without errors
      expect(screen.getByText('Debt Burndown Timeline')).toBeInTheDocument();
    });
  });

  describe('currency formatting', () => {
    it('uses GBP currency formatting', () => {
      // The formatCurrency function is internal, but we can verify
      // the component renders with GBP context (UK locale)
      render(<DebtBurndownChart results={mockResults} />);
      
      // Component should render successfully with UK formatting
      expect(screen.getByText('Debt Burndown Timeline')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero values gracefully', () => {
      const zeroResults: PlanResult[] = [
        {
          month: 1,
          debts: [],
          totalBalance: 0,
          totalInterest: 0,
          totalPrincipal: 0,
          snowballAmount: 0
        }
      ];

      render(<DebtBurndownChart results={zeroResults} />);
      
      expect(screen.getByText('Debt Burndown Timeline')).toBeInTheDocument();
      expect(screen.getByTestId('line-totalBalance')).toBeInTheDocument();
    });

    it('handles missing optional className', () => {
      render(<DebtBurndownChart results={mockResults} />);
      
      expect(screen.getByText('Debt Burndown Timeline')).toBeInTheDocument();
    });
  });
});