/**
 * Analytics Events Unit Tests — CP-4.x Golden Suite
 * Jest tests to verify event firing and payload structure
 */

import { 
  trackForecastRun, 
  trackBucketCleared, 
  trackForecastFailed, 
  trackBucketInterestBreakdown, 
  trackForecastCompared 
} from '../lib/analytics';
import posthog from 'posthog-js';

// Mock PostHog
jest.mock('posthog-js', () => ({
  capture: jest.fn(),
  get_distinct_id: jest.fn(() => 'test-user-123'),
}));

describe('Analytics Events - Forecast Engine V2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('forecast_run event', () => {
    it('fires forecast_run with mandatory props', () => {
      trackForecastRun({
        mode: 'composite',
        debt_count: 2,
        bucket_count: 6,
        extra_per_month: 150,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_run', expect.objectContaining({
        mode: 'composite',
        debt_count: 2,
        bucket_count: 6,
        extra_per_month: 150,
        forecast_version: 'v2.0',
        user_id: expect.any(String),
        timestamp: expect.any(String)
      }));
    });

    it('fires forecast_run for flat mode', () => {
      trackForecastRun({
        mode: 'flat',
        debt_count: 1,
        bucket_count: 0,
        extra_per_month: 50,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_run', expect.objectContaining({
        mode: 'flat',
        debt_count: 1,
        bucket_count: 0,
        extra_per_month: 50,
        forecast_version: 'v2.0'
      }));
    });

    it('rounds extra_per_month to 2 decimal places', () => {
      trackForecastRun({
        mode: 'composite',
        debt_count: 1,
        bucket_count: 3,
        extra_per_month: 99.999,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_run', expect.objectContaining({
        extra_per_month: 100.00
      }));
    });
  });

  describe('bucket_cleared event', () => {
    it('fires bucket_cleared when balance reaches zero', () => {
      trackBucketCleared({
        bucket_label: 'Cash Advances',
        debt_name: 'Barclaycard Platinum',
        apr: 27.9,
        cleared_month: 4,
        total_interest_paid: 123.45,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('bucket_cleared', expect.objectContaining({
        bucket_label: 'Cash Advances',
        debt_name: 'Barclaycard Platinum',
        apr: 27.9,
        cleared_month: 4,
        total_interest_paid: 123.45,
        forecast_version: 'v2.0',
        user_id: expect.any(String),
        timestamp: expect.any(String)
      }));
    });

    it('rounds monetary values to 2 decimal places', () => {
      trackBucketCleared({
        bucket_label: 'Purchases',
        debt_name: 'Credit Card',
        apr: 22.999,
        cleared_month: 6,
        total_interest_paid: 99.999,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('bucket_cleared', expect.objectContaining({
        apr: 23.0,
        total_interest_paid: 100.00
      }));
    });
  });

  describe('forecast_failed event', () => {
    it('fires forecast_failed on malformed data', () => {
      trackForecastFailed({
        error_code: 'MISSING_APR',
        error_message: 'Bucket missing APR field',
        debt_count: 1,
        has_buckets: true,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_failed', expect.objectContaining({
        error_code: 'MISSING_APR',
        error_message: 'Bucket missing APR field',
        debt_count: 1,
        has_buckets: true,
        forecast_version: 'v2.0',
        user_id: expect.any(String),
        timestamp: expect.any(String)
      }));
    });

    it('handles validation errors correctly', () => {
      trackForecastFailed({
        error_code: 'INVALID_BUCKET_SUM',
        error_message: 'Bucket balances do not sum to total debt',
        debt_count: 2,
        has_buckets: true,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_failed', expect.objectContaining({
        error_code: 'INVALID_BUCKET_SUM',
        has_buckets: true
      }));
    });
  });

  describe('bucket_interest_breakdown event', () => {
    it('fires bucket_interest_breakdown for each bucket', () => {
      trackBucketInterestBreakdown({
        bucket_label: 'Balance Transfer',
        debt_name: 'Halifax Clarity',
        apr: 0,
        interest_total: 0,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('bucket_interest_breakdown', expect.objectContaining({
        bucket_label: 'Balance Transfer',
        debt_name: 'Halifax Clarity',
        apr: 0,
        interest_total: 0,
        forecast_version: 'v2.0',
        user_id: expect.any(String),
        timestamp: expect.any(String)
      }));
    });

    it('rounds interest values correctly', () => {
      trackBucketInterestBreakdown({
        bucket_label: 'Cash Advances',
        debt_name: 'Barclaycard',
        apr: 27.95678,
        interest_total: 156.789,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('bucket_interest_breakdown', expect.objectContaining({
        apr: 28.0,
        interest_total: 156.79
      }));
    });
  });

  describe('forecast_compared event', () => {
    it('fires forecast_compared when comparison run triggered', () => {
      trackForecastCompared({
        months_saved: 6,
        interest_difference: 250.75,
        percentage_reduction: 15.2,
        composite_months: 18,
        flat_months: 24,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_compared', expect.objectContaining({
        months_saved: 6,
        interest_difference: 250.75,
        percentage_reduction: 15.2,
        composite_months: 18,
        flat_months: 24,
        forecast_version: 'v2.0',
        user_id: expect.any(String),
        timestamp: expect.any(String)
      }));
    });

    it('rounds financial values appropriately', () => {
      trackForecastCompared({
        months_saved: 3,
        interest_difference: 199.999,
        percentage_reduction: 12.666,
        composite_months: 15,
        flat_months: 18,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_compared', expect.objectContaining({
        interest_difference: 200.00,
        percentage_reduction: 12.7
      }));
    });

    it('handles zero savings scenario', () => {
      trackForecastCompared({
        months_saved: 0,
        interest_difference: 0,
        percentage_reduction: 0,
        composite_months: 24,
        flat_months: 24,
        forecast_version: 'v2.0'
      });

      expect(posthog.capture).toHaveBeenCalledWith('forecast_compared', expect.objectContaining({
        months_saved: 0,
        interest_difference: 0,
        percentage_reduction: 0
      }));
    });
  });

  describe('common properties', () => {
    it('includes user_id in all events', () => {
      const events = [
        () => trackForecastRun({ mode: 'flat', debt_count: 1, bucket_count: 0, extra_per_month: 0, forecast_version: 'v2.0' }),
        () => trackBucketCleared({ bucket_label: 'Test', debt_name: 'Test', apr: 0, cleared_month: 1, total_interest_paid: 0, forecast_version: 'v2.0' }),
        () => trackForecastFailed({ error_code: 'TEST', error_message: 'Test', debt_count: 0, has_buckets: false, forecast_version: 'v2.0' }),
        () => trackBucketInterestBreakdown({ bucket_label: 'Test', debt_name: 'Test', apr: 0, interest_total: 0, forecast_version: 'v2.0' }),
        () => trackForecastCompared({ months_saved: 0, interest_difference: 0, percentage_reduction: 0, composite_months: 0, flat_months: 0, forecast_version: 'v2.0' })
      ];

      events.forEach(eventFn => {
        jest.clearAllMocks();
        eventFn();
        expect(posthog.capture).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
          user_id: expect.any(String)
        }));
      });
    });

    it('includes forecast_version in all events', () => {
      const events = [
        () => trackForecastRun({ mode: 'composite', debt_count: 1, bucket_count: 3, extra_per_month: 100, forecast_version: 'v2.1' }),
        () => trackBucketCleared({ bucket_label: 'Test', debt_name: 'Test', apr: 10, cleared_month: 5, total_interest_paid: 50, forecast_version: 'v2.1' }),
        () => trackForecastFailed({ error_code: 'TIMEOUT', error_message: 'Simulation timeout', debt_count: 3, has_buckets: true, forecast_version: 'v2.1' }),
        () => trackBucketInterestBreakdown({ bucket_label: 'Test', debt_name: 'Test', apr: 15, interest_total: 75, forecast_version: 'v2.1' }),
        () => trackForecastCompared({ months_saved: 3, interest_difference: 150, percentage_reduction: 8.5, composite_months: 20, flat_months: 23, forecast_version: 'v2.1' })
      ];

      events.forEach(eventFn => {
        jest.clearAllMocks();
        eventFn();
        expect(posthog.capture).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
          forecast_version: 'v2.1'
        }));
      });
    });

    it('includes timestamp in all events', () => {
      trackForecastRun({ mode: 'composite', debt_count: 1, bucket_count: 2, extra_per_month: 75, forecast_version: 'v2.0' });
      
      expect(posthog.capture).toHaveBeenCalledWith('forecast_run', expect.objectContaining({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      }));
    });
  });
});