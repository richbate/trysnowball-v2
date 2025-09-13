/**
 * Analytics Service - PostHog Integration
 * Centralized analytics tracking for TrySnowball
 */

import posthog from 'posthog-js';

// Event type definitions for type safety
export interface AnalyticsEvent {
  // Page views
  page_viewed: {
    page: string;
    path: string;
    referrer?: string;
  };

  // Upgrade/Payment flow events
  beta_signup_started: {
    source: 'landing_page' | 'upgrade_page';
    cta_location: 'hero' | 'pricing_card' | 'final_cta';
  };

  stripe_checkout_initiated: {
    price_id: string;
    amount: number;
    currency: string;
  };

  stripe_checkout_completed: {
    session_id: string;
    price_id: string;
    amount: number;
    currency: string;
  };

  stripe_checkout_failed: {
    error: string;
    price_id?: string;
  };

  payment_completed: {
    subscription_id: string;
    plan: string;
    amount: number;
  };

  user_onboarded: {
    source: 'payment_success';
    plan: string;
  };

  // User engagement
  dashboard_accessed: {
    user_type: 'new' | 'returning';
  };

  debt_added: {
    debt_type: string;
    amount_range: string;
  };

  // FAQ and content engagement
  faq_item_clicked: {
    question: string;
    section: string;
  };

  cta_clicked: {
    text: string;
    location: string;
    page: string;
  };

  // CP-4 Forecast Analytics Events
  forecast_run: {
    mode: 'composite' | 'flat';
    user_id: string;
    debt_count: number;
    bucket_count: number;
    extra_per_month: number;
    forecast_version: string;
  };

  bucket_cleared: {
    bucket_label: string;
    debt_name: string;
    apr: number;
    cleared_month: number;
    total_interest_paid: number;
    forecast_version: string;
    user_id: string;
  };

  forecast_failed: {
    error_code: string;
    error_message: string;
    debt_count: number;
    has_buckets: boolean;
    forecast_version: string;
    user_id: string;
  };

  bucket_interest_breakdown: {
    bucket_label: string;
    debt_name: string;
    apr: number;
    interest_total: number;
    forecast_version: string;
    user_id: string;
  };

  forecast_compared: {
    months_saved: number;
    interest_difference: number;
    percentage_reduction: number;
    composite_months: number;
    flat_months: number;
    debt_count: number;
    bucket_count: number;
    extra_per_month: number;
    forecast_version: string;
    user_id: string;
  };
}

export type AnalyticsEventName = keyof AnalyticsEvent;
export type AnalyticsEventData<T extends AnalyticsEventName> = AnalyticsEvent[T];

// Forecast Error Codes as specified in CP-4
export const FORECAST_ERROR_CODES = {
  MISSING_APR: 'MISSING_APR',
  INVALID_BUCKET_SUM: 'INVALID_BUCKET_SUM',
  MALFORMED_BUCKETS: 'MALFORMED_BUCKETS',
  SIMULATION_ERROR: 'SIMULATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  NEGATIVE_BALANCE: 'NEGATIVE_BALANCE',
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO'
} as const;

export type ForecastErrorCode = typeof FORECAST_ERROR_CODES[keyof typeof FORECAST_ERROR_CODES];

class AnalyticsService {
  private isInitialized = false;

  /**
   * Initialize PostHog with project configuration
   */
  initialize() {
    const projectKey = process.env.REACT_APP_POSTHOG_PROJECT_KEY;
    const apiHost = process.env.REACT_APP_POSTHOG_API_HOST || 'https://us.i.posthog.com';

    if (!projectKey) {
      console.warn('PostHog project key not found. Analytics disabled.');
      return;
    }

    try {
      posthog.init(projectKey, {
        api_host: apiHost,
        person_profiles: 'always',
        // Disable in development unless explicitly enabled
        disable_session_recording: process.env.NODE_ENV === 'development',
        disable_persistence: process.env.NODE_ENV === 'test',
        debug: process.env.NODE_ENV === 'development',
        capture_pageview: false, // We'll handle this manually
      });

      this.isInitialized = true;
      console.log('PostHog analytics initialized');
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Track a typed analytics event
   */
  track<T extends AnalyticsEventName>(
    eventName: T,
    properties: AnalyticsEventData<T>,
    options?: {
      timestamp?: Date;
      send_instantly?: boolean;
    }
  ) {
    if (!this.isInitialized) {
      console.warn(`Analytics event "${eventName}" not tracked - PostHog not initialized`);
      return;
    }

    try {
      const eventData = {
        ...properties,
        // Add common properties
        environment: process.env.NODE_ENV,
        app_version: process.env.REACT_APP_VERSION || '0.1.0',
        timestamp: options?.timestamp?.toISOString() || new Date().toISOString(),
      };

      posthog.capture(eventName, eventData, {
        timestamp: options?.timestamp,
        send_instantly: options?.send_instantly,
      });

      console.log(`📊 Analytics: ${eventName}`, eventData);
    } catch (error) {
      console.error(`Failed to track event "${eventName}":`, error);
    }
  }

  /**
   * Track page view with automatic path detection
   */
  trackPageView(pageName: string, additionalProps?: Record<string, any>) {
    this.track('page_viewed', {
      page: pageName,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      ...additionalProps,
    });
  }

  /**
   * Identify user for tracking
   */
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.isInitialized) return;

    try {
      posthog.identify(userId, {
        ...properties,
        first_seen: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.isInitialized) return;

    try {
      posthog.people.set(properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Reset user session (for logout)
   */
  reset() {
    if (!this.isInitialized) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error('Failed to reset analytics:', error);
    }
  }

  /**
   * Check if analytics is available
   */
  get isAvailable() {
    return this.isInitialized;
  }

  // CP-4 Forecast Analytics Helper Methods

  /**
   * Track forecast simulation run
   */
  trackForecastRun(params: {
    mode: 'composite' | 'flat';
    userId: string;
    debtCount: number;
    bucketCount: number;
    extraPerMonth: number;
  }) {
    this.track('forecast_run', {
      mode: params.mode,
      user_id: params.userId,
      debt_count: params.debtCount,
      bucket_count: params.bucketCount,
      extra_per_month: Math.round(params.extraPerMonth * 100) / 100, // Round to 2 decimal places
      forecast_version: 'v2.0',
    });
  }

  /**
   * Track bucket being fully paid off
   */
  trackBucketCleared(params: {
    bucketLabel: string;
    debtName: string;
    apr: number;
    clearedMonth: number;
    totalInterestPaid: number;
    userId: string;
  }) {
    this.track('bucket_cleared', {
      bucket_label: params.bucketLabel,
      debt_name: params.debtName,
      apr: Math.round(params.apr * 10) / 10, // Round to 1 decimal place
      cleared_month: params.clearedMonth,
      total_interest_paid: Math.round(params.totalInterestPaid * 100) / 100, // Round to 2 decimal places
      forecast_version: 'v2.0',
      user_id: params.userId,
    });
  }

  /**
   * Track forecast simulation failure
   */
  trackForecastFailed(params: {
    errorCode: ForecastErrorCode;
    errorMessage: string;
    debtCount: number;
    hasBuckets: boolean;
    userId: string;
  }) {
    this.track('forecast_failed', {
      error_code: params.errorCode,
      error_message: params.errorMessage,
      debt_count: params.debtCount,
      has_buckets: params.hasBuckets,
      forecast_version: 'v2.0',
      user_id: params.userId,
    });
  }

  /**
   * Track interest breakdown being displayed
   */
  trackInterestBreakdown(params: {
    bucketLabel: string;
    debtName: string;
    apr: number;
    interestTotal: number;
    userId: string;
  }) {
    this.track('bucket_interest_breakdown', {
      bucket_label: params.bucketLabel,
      debt_name: params.debtName,
      apr: Math.round(params.apr * 10) / 10, // Round to 1 decimal place
      interest_total: Math.round(params.interestTotal * 100) / 100, // Round to 2 decimal places
      forecast_version: 'v2.0',
      user_id: params.userId,
    });
  }

  /**
   * Track composite vs flat forecast comparison
   */
  trackForecastComparison(params: {
    monthsSaved: number;
    interestDifference: number;
    percentageReduction: number;
    compositeMonths: number;
    flatMonths: number;
    debtCount: number;
    bucketCount: number;
    extraPerMonth: number;
    userId: string;
  }) {
    this.track('forecast_compared', {
      months_saved: params.monthsSaved,
      interest_difference: Math.round(params.interestDifference * 100) / 100, // Round to 2 decimal places
      percentage_reduction: Math.round(params.percentageReduction * 10) / 10, // Round to 1 decimal place
      composite_months: params.compositeMonths,
      flat_months: params.flatMonths,
      debt_count: params.debtCount,
      bucket_count: params.bucketCount,
      extra_per_month: Math.round(params.extraPerMonth * 100) / 100, // Round to 2 decimal places
      forecast_version: 'v2.0',
      user_id: params.userId,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Auto-initialize on import
analytics.initialize();