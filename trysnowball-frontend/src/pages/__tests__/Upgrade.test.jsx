import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upgrade from '../Upgrade';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { capture } from '../../utils/analytics';

// Mock the hooks and utilities
jest.mock('../../contexts/AuthContext.tsx');
jest.mock('../../utils/analytics');

// Mock fetch
global.fetch = jest.fn();

const mockUseAuth = (authState) => {
 useAuth.mockReturnValue({
  user: null,
  token: null,
  plan: 'free',
  ...authState,
 });
};

describe('Upgrade Page', () => {
 beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
 });

 it('renders CTA for free users and calls session endpoint', async () => {
  mockUseAuth({ user: { id: 'u1' }, token: 't', plan: 'free' });
  
  fetch.mockResolvedValueOnce({
   ok: true,
   json: async () => ({ url: 'https://checkout.stripe.com/test' }),
  });

  render(<Upgrade />);
  
  // Should show upgrade content
  expect(screen.getByText('Join the Open Beta – £10/year')).toBeInTheDocument();
  expect(screen.getByTestId('upgrade-now')).toBeInTheDocument();
  expect(screen.getByText('✅ Unlimited debts')).toBeInTheDocument();
  
  // Should track page view
  expect(capture).toHaveBeenCalledWith('upgrade_page_viewed', { 
   plan: 'free', 
   isAuthenticated: true 
  });

  // Click upgrade button
  fireEvent.click(screen.getByTestId('upgrade-now'));
  
  await waitFor(() => {
   expect(fetch).toHaveBeenCalledWith('/api/checkout/session', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer t',
    },
    body: JSON.stringify({ priceId: 'price_1S4Kyj9OfFB3mfqAC3ppmvzN' }),
   });
  });

  // Should track checkout started
  expect(capture).toHaveBeenCalledWith('checkout_started', { planBefore: 'free' });
 });

 it('shows beta state for paid users', () => {
  mockUseAuth({ user: { id: 'u1' }, token: 't', plan: 'beta' });

  render(<Upgrade />);
  
  expect(screen.getByText(/You're on the Open Beta plan/)).toBeInTheDocument();
  expect(screen.getByText(/Your early-bird price is locked in/)).toBeInTheDocument();
  expect(screen.queryByTestId('upgrade-now')).not.toBeInTheDocument();
 });

 it('shows disabled CTA and sign-in nudge for anonymous users', () => {
  mockUseAuth({ user: null, token: null, plan: 'free' });

  render(<Upgrade />);
  
  expect(screen.getByTestId('upgrade-now')).toBeDisabled();
  expect(screen.getByText(/You'll need to sign in with a magic link/)).toBeInTheDocument();
 });

 it('handles checkout session creation failure', async () => {
  mockUseAuth({ user: { id: 'u1' }, token: 't', plan: 'free' });
  
  fetch.mockRejectedValueOnce(new Error('Network error'));

  // Mock alert
  global.alert = jest.fn();

  render(<Upgrade />);
  
  fireEvent.click(screen.getByTestId('upgrade-now'));
  
  await waitFor(() => {
   expect(capture).toHaveBeenCalledWith('checkout_failed', { 
    reason: 'Network error' 
   });
   expect(global.alert).toHaveBeenCalledWith('Unable to start checkout. Please try again.');
  });
 });

 it('tracks page views with correct analytics data', () => {
  mockUseAuth({ user: { id: 'u1' }, token: 't', plan: 'beta' });

  render(<Upgrade />);
  
  expect(capture).toHaveBeenCalledWith('upgrade_page_viewed', { 
   plan: 'beta', 
   isAuthenticated: true 
  });
 });

 it('shows loading state during checkout', async () => {
  mockUseAuth({ user: { id: 'u1' }, token: 't', plan: 'free' });
  
  // Mock a slow response
  let resolvePromise;
  const slowPromise = new Promise(resolve => { resolvePromise = resolve; });
  fetch.mockReturnValueOnce(slowPromise);

  render(<Upgrade />);
  
  fireEvent.click(screen.getByTestId('upgrade-now'));
  
  // Should show loading state
  await waitFor(() => {
   expect(screen.getByText('Starting checkout…')).toBeInTheDocument();
   expect(screen.getByTestId('upgrade-now')).toBeDisabled();
  });

  // Resolve the promise
  resolvePromise({
   ok: true,
   json: async () => ({ url: 'https://checkout.stripe.com/test' }),
  });
 });
});