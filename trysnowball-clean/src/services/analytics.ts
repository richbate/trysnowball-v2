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
}

export type AnalyticsEventName = keyof AnalyticsEvent;
export type AnalyticsEventData<T extends AnalyticsEventName> = AnalyticsEvent[T];

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
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Auto-initialize on import
analytics.initialize();