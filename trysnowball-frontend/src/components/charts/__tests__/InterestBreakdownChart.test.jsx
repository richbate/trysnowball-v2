import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InterestBreakdownChart from '../InterestBreakdownChart';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}));

describe('InterestBreakdownChart', () => {
  const mockInterestBreakdown = {
    'cash_advances': {
      bucketName: 'Cash Advances',
      apr: 27.9,
      totalInterest: 500.00,
      totalPrincipal: 1000.00
    },
    'purchases': {
      bucketName: 'Purchases', 
      apr: 22.9,
      totalInterest: 800.00,
      totalPrincipal: 2000.00
    },
    'balance_transfer': {
      bucketName: 'Balance Transfer',
      apr: 0.0,
      totalInterest: 0.00,
      totalPrincipal: 1500.00
    }
  };

  it('renders pie chart by default', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
      />
    );

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByText('Interest by Bucket Type')).toBeInTheDocument();
    expect(screen.getByText('Total interest paid: £1300.00')).toBeInTheDocument();
  });

  it('renders bar chart when displayMode is bar', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
        displayMode="bar"
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Interest Breakdown by Bucket')).toBeInTheDocument();
  });

  it('shows empty state when no breakdown data', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={{}}
        totalInterestPaid={0}
      />
    );

    expect(screen.getByText('No interest breakdown available')).toBeInTheDocument();
  });

  it('renders summary table in pie mode', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
      />
    );

    // Check table headers
    expect(screen.getByText('Bucket')).toBeInTheDocument();
    expect(screen.getByText('APR')).toBeInTheDocument(); 
    expect(screen.getByText('Interest')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();

    // Check bucket data (excluding zero-interest buckets)
    expect(screen.getByText('Cash Advances')).toBeInTheDocument();
    expect(screen.getByText('Purchases')).toBeInTheDocument();
    expect(screen.getByText('27.9%')).toBeInTheDocument();
    expect(screen.getByText('22.9%')).toBeInTheDocument();
    expect(screen.getByText('£500.00')).toBeInTheDocument();
    expect(screen.getByText('£800.00')).toBeInTheDocument();
  });

  it('filters out zero interest buckets', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
      />
    );

    // Balance Transfer with 0% interest should not appear in the table
    expect(screen.queryByText('Balance Transfer')).not.toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
      />
    );

    // Cash Advances: 500/1300 = 38.5%
    expect(screen.getByText('38.5%')).toBeInTheDocument();
    // Purchases: 800/1300 = 61.5%  
    expect(screen.getByText('61.5%')).toBeInTheDocument();
  });

  it('sorts buckets by interest amount descending', () => {
    render(
      <InterestBreakdownChart 
        interestBreakdown={mockInterestBreakdown}
        totalInterestPaid={1300.00}
      />
    );

    const tableRows = screen.getByRole('table').querySelectorAll('tbody tr');
    expect(tableRows).toHaveLength(2);
    
    // First row should be Purchases (£800.00), second should be Cash Advances (£500.00)
    expect(tableRows[0]).toHaveTextContent('Purchases');
    expect(tableRows[1]).toHaveTextContent('Cash Advances');
  });
});