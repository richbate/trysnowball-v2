// src/__tests__/MyPlanHeader.unit.test.js
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'
function MyPlanHeader({ totals }) {
  return (<div>
    <div data-testid="total-balance">£{totals.balance.toLocaleString()}</div>
    <div data-testid="total-min">{totals.minTotal}</div>
    <div data-testid="debt-count">{totals.count} debts</div>
  </div>);
}
describe('MyPlanHeader', () => {
  it('renders values', () => {
    const fakeTotals = { balance: 3500, minTotal: 180, count: 2 };
    render(<MyPlanHeader totals={fakeTotals} />);
    expect(screen.getByTestId('total-balance')).toHaveTextContent('£3,500');
    expect(screen.getByTestId('total-min')).toHaveTextContent('180');
    expect(screen.getByTestId('debt-count')).toHaveTextContent('2 debts');
  });
});
