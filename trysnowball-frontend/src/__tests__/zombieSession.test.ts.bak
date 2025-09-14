/**
 * Zombie Session Detection & Recovery Tests
 * Comprehensive test suite for bulletproof auth recovery system
 */

import { renderHook, act } from '@testing-library/react';
import { useZombieSessionDetector } from '../hooks/useZombieSessionDetector';

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
 useAuth: jest.fn(),
}));

jest.mock('../hooks/useUserDebts', () => ({
 useUserDebts: jest.fn(),
}));

const mockUseAuth = require('../contexts/AuthContext').useAuth as jest.Mock;
const mockUseUserDebts = require('../hooks/useUserDebts').useUserDebts as jest.Mock;

// Mock window.posthog
const mockPosthog = {
 capture: jest.fn(),
};

beforeEach(() => {
 jest.clearAllMocks();
 
 // Setup default mocks
 mockUseAuth.mockReturnValue({
  isAuthenticated: false,
  user: null,
  refreshAuth: jest.fn(),
 });
 
 mockUseUserDebts.mockReturnValue({
  debts: [],
 });
 
 // Mock window objects
 Object.defineProperty(window, 'posthog', {
  value: mockPosthog,
  writable: true,
 });
 
 // Mock localStorage
 Object.defineProperty(window, 'localStorage', {
  value: {
   removeItem: jest.fn(),
   clear: jest.fn(),
  },
  writable: true,
 });
 
 // Mock sessionStorage
 Object.defineProperty(window, 'sessionStorage', {
  value: {
   setItem: jest.fn(),
   removeItem: jest.fn(),
   clear: jest.fn(),
   getItem: jest.fn(),
  },
  writable: true,
 });
 
 // Mock location
 Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
 });
});

describe('useZombieSessionDetector', () => {
 
 describe('Zombie Detection', () => {
  
  test('detects zombie session when user has local data but no auth', () => {
   // Setup: User not authenticated but has local debts
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [
     { id: '1', name: 'Credit Card', balance: 1000 },
     { id: '2', name: 'Student Loan', balance: 5000 },
    ],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   const [state] = result.current;
   
   // Should detect zombie state
   expect(state.isZombie).toBe(true);
   expect(state.showModal).toBe(true);
   expect(state.localDataCount).toBe(2);
   
   // Should track detection event
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_detected', {
    debt_count: 2,
    last_auth_timestamp: null,
    time_since_auth: null,
   });
  });
  
  test('does not detect zombie when authenticated with data', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { id: 'user1', email: 'test@example.com' },
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [{ id: '1', name: 'Credit Card', balance: 1000 }],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   const [state] = result.current;
   
   expect(state.isZombie).toBe(false);
   expect(state.showModal).toBe(false);
   expect(mockPosthog.capture).not.toHaveBeenCalledWith('zombie_session_detected', expect.any(Object));
  });
  
  test('does not detect zombie when not authenticated and no local data', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   const [state] = result.current;
   
   expect(state.isZombie).toBe(false);
   expect(state.showModal).toBe(false);
  });
 });
 
 describe('Recovery Actions', () => {
  
  test('dismiss modal hides UI and tracks event', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [{ id: '1', name: 'Debt', balance: 1000 }],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   let [state, actions] = result.current;
   
   // Initially showing modal
   expect(state.showModal).toBe(true);
   
   // Dismiss modal
   act(() => {
    actions.dismissModal();
   });
   
   [state] = result.current;
   expect(state.showModal).toBe(false);
   expect(state.dismissedThisSession).toBe(true);
   
   // Should track dismissal
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_dismissed');
  });
  
  test('continue offline sets offline mode and tracks event', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [{ id: '1', name: 'Debt', balance: 1000 }],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   const [, actions] = result.current;
   
   act(() => {
    actions.continueOffline();
   });
   
   // Should set offline mode flag
   expect(window.sessionStorage.setItem).toHaveBeenCalledWith('offline-mode', 'true');
   
   // Should track offline choice
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_offline_chosen', {
    debt_count: 1,
   });
  });
  
  test('initiate reauth clears storage and redirects', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [{ id: '1', name: 'Debt', balance: 1000 }],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   const [, actions] = result.current;
   
   act(() => {
    actions.initiateReauth();
   });
   
   // Should clear auth storage
   expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
   expect(window.sessionStorage.clear).toHaveBeenCalled();
   
   // Should redirect to login
   expect(window.location.href).toBe('/auth/login');
   
   // Should track reauth attempt
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_relogin_clicked', {
    debt_count: 1,
   });
  });
 });
 
 describe('401 Detection', () => {
  
  test('responds to 401 events and shows modal', () => {
   mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    refreshAuth: jest.fn(),
   });
   
   mockUseUserDebts.mockReturnValue({
    debts: [{ id: '1', name: 'Debt', balance: 1000 }],
   });
   
   const { result } = renderHook(() => useZombieSessionDetector());
   let [state] = result.current;
   
   // Initially dismiss the modal from initial detection
   act(() => {
    result.current[1].dismissModal();
   });
   
   [state] = result.current;
   expect(state.showModal).toBe(false);
   
   // Simulate 401 event
   act(() => {
    const event = new CustomEvent('auth-401-detected', {
     detail: { endpoint: '/api/debts' }
    });
    window.dispatchEvent(event);
   });
   
   [state] = result.current;
   // Should show modal again due to 401
   expect(state.showModal).toBe(true);
   
   // Should track 401 detection
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_backend_401', {
    endpoint: '/api/debts',
    authenticated_state: false,
   });
  });
 });
 
 describe('Recovery Detection', () => {
  
  test('detects recovery when user re-authenticates', () => {
   const { result, rerender } = renderHook(() => useZombieSessionDetector());
   
   // Initially in zombie state
   let [state] = result.current;
   expect(state.isZombie).toBe(true);
   
   // User re-authenticates
   mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { id: 'user1', email: 'test@example.com' },
    refreshAuth: jest.fn(),
   });
   
   rerender();
   
   [state] = result.current;
   expect(state.isZombie).toBe(false);
   expect(state.showModal).toBe(false);
   
   // Should track recovery
   expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_recovered', {
    recovery_method: 'reauth',
    debt_count: 1,
   });
  });
 });
});

describe('Edge Cases', () => {
 
 test('handles multiple rapid zombie detections gracefully', () => {
  mockUseAuth.mockReturnValue({
   isAuthenticated: false,
   user: null,
   refreshAuth: jest.fn(),
  });
  
  mockUseUserDebts.mockReturnValue({
   debts: [{ id: '1', name: 'Debt', balance: 1000 }],
  });
  
  renderHook(() => useZombieSessionDetector());
  
  // Should only track detection once even with multiple renders
  expect(mockPosthog.capture).toHaveBeenCalledWith('zombie_session_detected', expect.any(Object));
  expect(mockPosthog.capture).toHaveBeenCalledTimes(1);
 });
 
 test('handles missing posthog gracefully', () => {
  // Remove posthog from window
  delete (window as any).posthog;
  
  mockUseAuth.mockReturnValue({
   isAuthenticated: false,
   user: null,
   refreshAuth: jest.fn(),
  });
  
  mockUseUserDebts.mockReturnValue({
   debts: [{ id: '1', name: 'Debt', balance: 1000 }],
  });
  
  // Should not throw error
  expect(() => {
   renderHook(() => useZombieSessionDetector());
  }).not.toThrow();
 });
});