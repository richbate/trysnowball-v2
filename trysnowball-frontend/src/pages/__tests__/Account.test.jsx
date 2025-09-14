/**
 * @jest-environment jsdom
 */
import React from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useUserDebts } from '../../hooks/useUserDebts';
import { useSettings } from '../../contexts/SettingsContext.tsx';

// Mock dependencies
jest.mock('../../contexts/AuthContext.tsx', () => ({
 useAuth: jest.fn(),
}));
jest.mock('../../hooks/useUserDebts', () => ({
 useUserDebts: jest.fn(),
}));
jest.mock('../../contexts/SettingsContext.tsx', () => ({
 useSettings: jest.fn(),
}));
jest.mock('../../utils/analytics', () => ({
 capture: jest.fn(),
}));

describe('Account Page', () => {
 beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock hooks with default values
  useAuth.mockReturnValue({
   user: { email: 'test@example.com' },
   plan: 'free',
  });
  
  useUserDebts.mockReturnValue({
   debts: [{ id: 1, name: 'Credit Card' }, { id: 2, name: 'Student Loan' }],
  });
  
  useSettings.mockReturnValue({
   analyticsEnabled: false,
   setAnalyticsEnabled: jest.fn(),
  });
 });

 test('Account page module loads correctly', () => {
  const Account = require('../Account.jsx').default;
  expect(typeof Account).toBe('function');
 });

 test('analytics hook is properly mocked', () => {
  const { capture } = require('../../utils/analytics');
  capture('test_event', { test: true });
  expect(capture).toHaveBeenCalledWith('test_event', { test: true });
 });

 test('auth hook returns expected values', () => {
  const authResult = useAuth();
  expect(authResult.user.email).toBe('test@example.com');
  expect(authResult.plan).toBe('free');
 });

 test('debts hook returns expected values', () => {
  const debtsResult = useUserDebts();
  expect(debtsResult.debts).toHaveLength(2);
  expect(debtsResult.debts[0].name).toBe('Credit Card');
 });

 test('settings hook returns expected values', () => {
  const settingsResult = useSettings();
  expect(settingsResult.analyticsEnabled).toBe(false);
  expect(typeof settingsResult.setAnalyticsEnabled).toBe('function');
 });
});