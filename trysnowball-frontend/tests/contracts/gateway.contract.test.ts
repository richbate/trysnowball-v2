/**
 * API Gateway Contract Tests
 * Tests network failures, auth errors, and CRUD behavior without actual network calls
 */

import { renderHook, act } from '@testing-library/react';
import useUserDebts from '../../src/hooks/useUserDebts';

// Mock the debtsGateway module
jest.mock('../../src/data/debtsGateway', () => ({
  fetchDebts: jest.fn(),
  upsertDebt: jest.fn(),
  deleteDebt: jest.fn(),
}));

// Mock the auth status hook
jest.mock('../../src/hooks/useAuthStatus', () => ({
  useAuthStatus: jest.fn(),
}));

// Mock the demo mode provider
jest.mock('../../src/providers/DemoModeProvider', () => ({
  useDemoMode: jest.fn(),
}));

// Mock local debt store
jest.mock('../../src/data/localDebtStore', () => ({
  localDebtStore: {
    listDebts: jest.fn(),
    upsertDebt: jest.fn(),
    replaceAllForDemo: jest.fn(),
    clearDemo: jest.fn(),
  }
}));

import * as debtsGateway from '../../src/data/debtsGateway';
import { useAuthStatus } from '../../src/hooks/useAuthStatus';
import { useDemoMode } from '../../src/providers/DemoModeProvider';
import { localDebtStore } from '../../src/data/localDebtStore';

describe('Gateway Contract Tests', () => {
  const mockFetchDebts = debtsGateway.fetchDebts as jest.MockedFunction<typeof debtsGateway.fetchDebts>;
  const mockUpsertDebt = debtsGateway.upsertDebt as jest.MockedFunction<typeof debtsGateway.upsertDebt>;
  const mockUseAuthStatus = useAuthStatus as jest.MockedFunction<typeof useAuthStatus>;
  const mockUseDemoMode = useDemoMode as jest.MockedFunction<typeof useDemoMode>;
  const mockLocalStore = localDebtStore as jest.Mocked<typeof localDebtStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseAuthStatus.mockReturnValue({ status: 'anonymous' });
    mockUseDemoMode.mockReturnValue({ isDemo: false });
    mockLocalStore.listDebts.mockResolvedValue([]);
  });

  describe('Authentication Circuit Breaker', () => {
    test('401 error triggers fallback to local storage without retry loop', async () => {
      // Setup: authenticated user, server returns 401
      mockUseAuthStatus.mockReturnValue({ status: 'authenticated' });
      mockFetchDebts
        .mockRejectedValueOnce(new Error('401 Unauthorized'))
        .mockResolvedValueOnce([
          { id: 'remote1', name: 'Remote Debt', amount_cents: 100000, apr_bps: 1999, min_payment_cents: 2500 }
        ]);
      
      mockLocalStore.listDebts.mockResolvedValue([
        { id: 'local1', name: 'Local Debt', amount_cents: 50000, apr_bps: 2199, min_payment_cents: 1500 }
      ]);

      const { result, rerender } = renderHook(() => useUserDebts());

      // Wait for initial load (should fallback to local after 401)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have called fetchDebts once and fallen back to local
      expect(mockFetchDebts).toHaveBeenCalledTimes(1);
      expect(mockLocalStore.listDebts).toHaveBeenCalled();
      
      // Should not retry on re-render (circuit breaker active)
      rerender();
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      expect(mockFetchDebts).toHaveBeenCalledTimes(1); // No additional calls
    });

    test('successful auth recovery re-enables server calls', async () => {
      let authStatus = 'authenticated';
      mockUseAuthStatus.mockImplementation(() => ({ status: authStatus }));
      
      // First call fails with 401
      mockFetchDebts
        .mockRejectedValueOnce(new Error('401 Unauthorized'))
        .mockResolvedValueOnce([{ id: 'recovered', name: 'Recovered', amount_cents: 75000, apr_bps: 1899, min_payment_cents: 2000 }]);
      
      mockLocalStore.listDebts.mockResolvedValue([]);

      const { result, rerender } = renderHook(() => useUserDebts());

      // Initial 401 failure
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockFetchDebts).toHaveBeenCalledTimes(1);
      
      // Simulate auth status change (user re-authenticates)
      authStatus = 'checking'; // Intermediate state
      rerender();
      
      authStatus = 'authenticated';
      rerender();
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should attempt server call again after auth recovery
      expect(mockFetchDebts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Demo Mode Isolation', () => {
    test('demo mode uses local storage with demo flag', async () => {
      mockUseDemoMode.mockReturnValue({ isDemo: true });
      mockUseAuthStatus.mockReturnValue({ status: 'anonymous' });
      
      mockLocalStore.listDebts.mockResolvedValue([
        { id: 'demo_1', name: 'Demo Debt', amount_cents: 100000, apr_bps: 2499, min_payment_cents: 3000, isDemo: true }
      ]);

      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should call local store with demo flag
      expect(mockLocalStore.listDebts).toHaveBeenCalledWith({ includeDemo: true });
      // Should NOT call network gateway
      expect(mockFetchDebts).not.toHaveBeenCalled();
    });

    test('normal mode excludes demo data from local storage', async () => {
      mockUseDemoMode.mockReturnValue({ isDemo: false });
      mockUseAuthStatus.mockReturnValue({ status: 'anonymous' });
      
      mockLocalStore.listDebts.mockResolvedValue([
        { id: 'real_1', name: 'Real Debt', amount_cents: 200000, apr_bps: 1999, min_payment_cents: 4000, isDemo: false }
      ]);

      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should call local store WITHOUT demo flag
      expect(mockLocalStore.listDebts).toHaveBeenCalledWith({ includeDemo: false });
      expect(mockFetchDebts).not.toHaveBeenCalled();
    });
  });

  describe('CRUD Operation Contracts', () => {
    test('upsert always succeeds locally before attempting sync', async () => {
      mockUseAuthStatus.mockReturnValue({ status: 'authenticated' });
      mockUseDemoMode.mockReturnValue({ isDemo: false });
      
      // Mock server sync failure
      mockUpsertDebt.mockRejectedValue(new Error('Network timeout'));
      mockLocalStore.upsertDebt.mockResolvedValue(undefined);
      mockLocalStore.listDebts.mockResolvedValue([]);

      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const testDebt = {
        id: 'test_debt',
        name: 'Test Debt',
        amount_cents: 150000,
        apr_bps: 2199,
        min_payment_cents: 3500
      };

      // Upsert should succeed locally even if server sync fails
      await act(async () => {
        await result.current.upsertDebt(testDebt);
      });

      // Local storage should be updated immediately
      expect(mockLocalStore.upsertDebt).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test_debt',
          name: 'Test Debt',
          amount_cents: 150000,
          apr_bps: 2199,
          min_payment_cents: 3500
        })
      );

      // Server sync attempted but failure doesn't block UI
      expect(mockUpsertDebt).toHaveBeenCalled();
    });

    test('data normalization applied before any operations', async () => {
      mockUseAuthStatus.mockReturnValue({ status: 'anonymous' });
      mockUseDemoMode.mockReturnValue({ isDemo: false });
      mockLocalStore.listDebts.mockResolvedValue([]);

      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Pass corrupted debt data
      const corruptedDebt = {
        id: 'corrupt',
        name: 'Corrupted Debt',
        balance: 'NaN', // Old field name with invalid value
        interestRate: 'invalid%', // Old field name with invalid value
        minPayment: -50 // Invalid negative payment
      };

      await act(async () => {
        await result.current.upsertDebt(corruptedDebt);
      });

      // Should normalize data before storage
      expect(mockLocalStore.upsertDebt).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'corrupt',
          name: 'Corrupted Debt',
          amount_cents: 0, // Normalized from invalid balance
          apr_bps: 0, // Normalized from invalid interestRate
          min_payment_cents: 0, // Normalized from negative minPayment
        })
      );
    });
  });

  describe('Error Boundary Contracts', () => {
    test('network failures don\'t crash the hook', async () => {
      mockUseAuthStatus.mockReturnValue({ status: 'authenticated' });
      mockFetchDebts.mockRejectedValue(new Error('Network error'));
      mockLocalStore.listDebts.mockResolvedValue([]);

      // Should not throw
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Hook should still return valid structure
      expect(result.current.debts).toEqual([]);
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.upsertDebt).toBe('function');
    });

    test('malformed server response doesn\'t crash normalization', async () => {
      mockUseAuthStatus.mockReturnValue({ status: 'authenticated' });
      
      // Return malformed data from server
      mockFetchDebts.mockResolvedValue([
        null,
        { id: 'malformed', name: '', amount_cents: NaN },
        { /* missing required fields */ },
        { id: 'valid', name: 'Valid Debt', amount_cents: 100000, apr_bps: 1999, min_payment_cents: 2500 }
      ] as any);

      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should filter out invalid entries and normalize valid ones
      expect(Array.isArray(result.current.debts)).toBe(true);
      // Valid debt should be present and normalized
      const validDebts = result.current.debts.filter(d => d.id === 'valid');
      expect(validDebts).toHaveLength(1);
    });
  });
});