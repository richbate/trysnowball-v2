import React from 'react';
import { screen } from '@testing-library/react';
import MyPlan from '../pages/MyPlan';
import { renderWithProviders } from '../testUtils';

// 👇 Mock the user context for this test
jest.mock('../contexts/UserContext', () => {
  const actual = jest.requireActual('../contexts/UserContext');
  return {
    ...actual,
    // No-op provider so we can wrap components if they import it
    UserProvider: ({ children }) => <>{children}</>,
    // Force an authenticated user shape that your components expect
    useUser: () => ({
      isAuthenticated: true,
      user: { id: 'test-user', email: 't@example.com' },
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    }),
  };
});

describe('MyPlan – header totals', () => {
  test('shows 3,500 total and £180 min; no legacy totals', async () => {
    renderWithProviders(<MyPlan />, { theme: 'light' });

    // Adjust matchers to your exact UI copy/formatting:
    expect(await screen.findByText(/£?\s*3,?500/i)).toBeInTheDocument();
    expect(screen.getByText(/£?\s*180\s*\/\s*mo/i)).toBeInTheDocument();

    // Ensure the legacy value does NOT appear
    expect(screen.queryByText(/18,?512/)).toBeNull();
  });
});