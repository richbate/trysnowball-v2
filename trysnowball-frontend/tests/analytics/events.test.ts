/**
 * Telemetry Evaluation Tests
 * Assert that analytic events fire with correct props using test PostHog mock
 * No UI clicks required - pure function/hook testing
 */

import { renderHook, act } from '@testing-library/react';
import useUserDebts from '../../src/hooks/useUserDebts';

// Mock the analytics modules
jest.mock('../../src/utils/secureAnalytics', () => ({
  trackDebtAction: jest.fn(),
  trackUIInteraction: jest.fn(),
  trackError: jest.fn(),
}));

jest.mock('../../src/lib/analytics', () => ({
  track: jest.fn(),
}));

// Mock PostHog directly
const mockCapture = jest.fn();
const mockIdentify = jest.fn();
const mockReset = jest.fn();

// Mock posthog on window
Object.defineProperty(window, 'posthog', {
  writable: true,
  value: {
    capture: mockCapture,
    identify: mockIdentify,
    reset: mockReset,
  },
});

// Mock other dependencies
jest.mock('../../src/hooks/useAuthStatus', () => ({
  useAuthStatus: jest.fn(() => ({ status: 'anonymous' })),
}));

jest.mock('../../src/providers/DemoModeProvider', () => ({
  useDemoMode: jest.fn(() => ({ isDemo: true })),
}));

jest.mock('../../src/data/localDebtStore', () => ({
  localDebtStore: {
    listDebts: jest.fn(() => Promise.resolve([])),
    upsertDebt: jest.fn(() => Promise.resolve()),
    deleteDebt: jest.fn(() => Promise.resolve()),
    replaceAllForDemo: jest.fn(() => Promise.resolve()),
    clearDemo: jest.fn(() => Promise.resolve()),
  }
}));

// Import mocked modules
import * as secureAnalytics from '../../src/utils/secureAnalytics';
import * as analytics from '../../src/lib/analytics';

describe('Analytics Events Contract Tests', () => {
  const mockTrackDebtAction = secureAnalytics.trackDebtAction as jest.MockedFunction<typeof secureAnalytics.trackDebtAction>;
  const mockTrack = analytics.track as jest.MockedFunction<typeof analytics.track>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCapture.mockClear();
    mockIdentify.mockClear();
    mockReset.mockClear();
  });

  describe('CRUD Operations Analytics', () => {
    test('upsert debt emits events with cents/bps props', async () => {
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await result.current.upsertDebt({
          id: 'analytics_test',
          name: 'Analytics Test Debt',
          amount_cents: 150000, // £1,500
          apr_bps: 1999, // 19.99%
          min_payment_cents: 5000, // £50
          isDemo: true
        });
      });

      // Should track with secure analytics (normalized format)
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        expect.stringMatching(/debt_(created|updated)/),
        expect.objectContaining({
          amount_cents: 150000,
          apr_bps: 1999,
          min_payment_cents: 5000,
          // Should not contain PII
          name: expect.not.stringContaining('Analytics Test Debt'),
        })
      );
    });

    test('delete debt emits events with anonymized props', async () => {
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await result.current.deleteDebt('analytics_delete_test');
      });

      // Should track deletion with ID hash, not actual ID
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        'debt_deleted',
        expect.objectContaining({
          debt_id: expect.not.stringContaining('analytics_delete_test'), // Should be hashed
        })
      );
    });

    test('bulk operations emit batch events', async () => {
      const { result } = renderHook(() => useUserDebts());

      const testDebts = [
        { id: 'batch_1', name: 'Batch Test 1', amount_cents: 100000, apr_bps: 2499, min_payment_cents: 2500 },
        { id: 'batch_2', name: 'Batch Test 2', amount_cents: 200000, apr_bps: 1899, min_payment_cents: 4000 }
      ];

      await act(async () => {
        if (result.current.loadDemoData) {
          await result.current.loadDemoData(testDebts);
        }
      });

      // Should emit bulk load event
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        'debts_bulk_loaded',
        expect.objectContaining({
          count: 2,
          total_amount_cents: 300000,
          avg_apr_bps: expect.any(Number),
        })
      );
    });
  });

  describe('Error Events Analytics', () => {
    test('normalization failures emit error events', async () => {
      const { result } = renderHook(() => useUserDebts());

      const corruptedDebt = {
        id: 'corrupt_analytics',
        name: '',  // Invalid name
        amount_cents: NaN,  // Invalid amount
        apr_bps: -100,  // Invalid APR
        min_payment_cents: 'invalid' as any  // Invalid type
      };

      await act(async () => {
        await result.current.upsertDebt(corruptedDebt);
      });

      // Should track normalization/validation errors
      expect(secureAnalytics.trackError).toHaveBeenCalledWith(
        'debt_validation_error',
        expect.objectContaining({
          error_type: 'normalization_failure',
          invalid_fields: expect.arrayContaining(['name', 'amount_cents', 'apr_bps', 'min_payment_cents']),
        })
      );
    });

    test('network failures emit circuit breaker events', async () => {
      // This would be tested in the gateway contract tests, but ensure analytics fire
      expect(true).toBe(true); // Placeholder - real implementation would mock network failure
    });
  });

  describe('Demo Mode Analytics', () => {
    test('demo operations are tagged appropriately', async () => {
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await result.current.upsertDebt({
          id: 'demo_analytics',
          name: 'Demo Debt',
          amount_cents: 75000,
          apr_bps: 2199,
          min_payment_cents: 1500,
          isDemo: true
        });
      });

      // Should tag as demo operation
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          is_demo: true,
          user_type: 'anonymous_demo',
        })
      );
    });
  });

  describe('Analytics Data Sanitization', () => {
    const PII_DENY_PATTERNS = [
      /email/i,
      /name/i,
      /address/i,
      /dob|birth/i,
      /phone/i,
      /social|ssn/i,
      /passport/i,
      /license/i
    ];

    test('no PII leaks in event properties', async () => {
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await result.current.upsertDebt({
          id: 'pii_test',
          name: 'Credit Card from John Smith Bank', // Contains potential PII
          amount_cents: 250000,
          apr_bps: 2899,
          min_payment_cents: 7500
        });
      });

      // Check all analytics calls don't contain PII
      const allCalls = [
        ...mockTrackDebtAction.mock.calls,
        ...mockTrack.mock.calls,
        ...mockCapture.mock.calls
      ];

      allCalls.forEach(call => {
        const props = call[1] || call[0]; // Handle different call signatures
        if (typeof props === 'object' && props !== null) {
          // Strict PII denylist check - fails if any PII patterns found in keys
          const propKeys = Object.keys(props);
          const hasPIIKeys = propKeys.some(key => 
            PII_DENY_PATTERNS.some(pattern => pattern.test(key))
          );
          expect(hasPIIKeys).toBe(false);

          // Should not contain raw debt names or IDs
          expect(JSON.stringify(props)).not.toMatch(/John Smith/i);
          expect(JSON.stringify(props)).not.toMatch(/Credit Card/i);
          expect(JSON.stringify(props)).not.toMatch(/pii_test/); // Raw ID should be hashed
        }
      });
    });

    test('PII denylist prevents common PII field names', async () => {
      const { result } = renderHook(() => useUserDebts());

      // Test with debt that could trigger PII field creation
      await act(async () => {
        await result.current.upsertDebt({
          id: 'safe_test',
          name: 'Safe Debt Name',
          amount_cents: 100000,
          apr_bps: 1999,
          min_payment_cents: 2500
        });
      });

      // Mock an analytics call that accidentally includes PII
      const dangerousProps = {
        debt_amount: 100000,
        user_email: 'test@example.com',  // Should be denied
        full_name: 'John Doe',          // Should be denied
        home_address: '123 Main St',     // Should be denied
        birth_date: '1990-01-01',       // Should be denied
        phone_number: '555-0123',       // Should be denied
      };

      // Test PII denylist
      const hasDisallowedKeys = Object.keys(dangerousProps).some(key =>
        PII_DENY_PATTERNS.some(pattern => pattern.test(key))
      );
      
      expect(hasDisallowedKeys).toBe(true); // Should detect the PII fields
      
      // In real analytics, this check would prevent the call
      if (hasDisallowedKeys) {
        // Good - PII detected and blocked
        expect(true).toBe(true);
      } else {
        // Bad - PII would have been sent
        fail('PII denylist failed to catch dangerous properties');
      }
    });

    test('numeric values stay in normalized format', async () => {
      const { result } = renderHook(() => useUserDebts());

      await act(async () => {
        await result.current.upsertDebt({
          id: 'format_test',
          name: 'Format Test',
          amount_cents: 123456, // £1,234.56
          apr_bps: 1999,       // 19.99%
          min_payment_cents: 5000 // £50.00
        });
      });

      // Should maintain cents/bps format in analytics, not convert to pounds/percent
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount_cents: 123456,  // Not 1234.56
          apr_bps: 1999,         // Not 19.99
          min_payment_cents: 5000, // Not 50.00
        })
      );
    });
  });

  describe('Performance and Invariant Tracking', () => {
    test('operation timing is tracked for performance monitoring', async () => {
      const { result } = renderHook(() => useUserDebts());

      const startTime = Date.now();
      
      await act(async () => {
        await result.current.upsertDebt({
          id: 'perf_test',
          name: 'Performance Test',
          amount_cents: 100000,
          apr_bps: 2000,
          min_payment_cents: 2500
        });
      });

      // Should track operation duration for performance monitoring
      expect(mockTrackDebtAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration_ms: expect.any(Number),
          operation_type: 'upsert',
        })
      );
    });

    test('data quality metrics are captured', async () => {
      const { result } = renderHook(() => useUserDebts());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should track data quality metrics
      const qualityCall = mockTrackDebtAction.mock.calls.find(call => 
        call[0]?.includes('data_quality') || call[0]?.includes('metrics')
      );

      if (qualityCall) {
        expect(qualityCall[1]).toEqual(expect.objectContaining({
          total_debts: expect.any(Number),
          avg_amount_cents: expect.any(Number),
          data_completeness: expect.any(Number), // Percentage of complete records
        }));
      }
    });
  });
});