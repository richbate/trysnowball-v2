/**
 * PostHog Route Analytics Integration
 * 
 * Links frontend events directly to canonical routes for goldmine analytics.
 * Every action is tied to a route = perfect debugging & usage insights.
 */

import { RouteHelpers } from '../routes/routeRegistry';

// Type definitions for route analytics
type RoutePath = Parameters<typeof RouteHelpers.getRoute>[0];
type RouteEventData = Record<string, any>;

interface RouteEventOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status?: 'success' | 'error' | 'pending';
  responseTime?: number;
  errorCode?: string;
  userId?: string;
  metadata?: RouteEventData;
}

/**
 * Track route-based events with standardized schemas
 */
export const trackRouteEvent = (
  event: string,
  routeKey: RoutePath,
  options: RouteEventOptions = {}
) => {
  try {
    // For analytics, use the route key for categorization without calling getRoute()
    // This avoids parameter requirement issues for parameterized routes
    const routePattern = routeKey.includes('.update') ? '/api/*/debts/:id' : 
                        routeKey.includes('.delete') ? '/api/*/debts/:id' :
                        routeKey.includes('.getAll') ? '/api/*/debts' :
                        routeKey.includes('.create') ? '/api/*/debts' : routeKey;
    
    // Build standardized event data
    const eventData: RouteEventData = {
      route: routePattern,
      route_key: routeKey,
      domain: routeKey.split('.')[0], // e.g., 'debts', 'auth', 'billing'
      operation: routeKey.split('.')[1], // e.g., 'create', 'update', 'getAll'
      timestamp: Date.now(),
      ...options.metadata
    };

    // Add optional fields
    if (options.method) eventData.method = options.method;
    if (options.status) eventData.status = options.status;
    if (options.responseTime) eventData.response_time_ms = options.responseTime;
    if (options.errorCode) eventData.error_code = options.errorCode;
    if (options.userId) eventData.user_id = options.userId;

    // Send to PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(event, eventData);
    }

  } catch (error) {
    console.warn('Route analytics tracking failed:', error);
  }
};

/**
 * Pre-built event trackers for common scenarios
 */
export const RouteAnalytics = {
  /**
   * Track API call start
   */
  apiCallStarted: (routeKey: RoutePath, method: RouteEventOptions['method'] = 'GET') => {
    trackRouteEvent('api_call_started', routeKey, { 
      method, 
      status: 'pending' 
    });
  },

  /**
   * Track successful API call
   */
  apiCallSuccess: (routeKey: RoutePath, method: RouteEventOptions['method'], responseTime?: number) => {
    trackRouteEvent('api_call_completed', routeKey, { 
      method, 
      status: 'success',
      responseTime 
    });
  },

  /**
   * Track failed API call
   */
  apiCallError: (routeKey: RoutePath, method: RouteEventOptions['method'], errorCode: string) => {
    trackRouteEvent('api_call_completed', routeKey, { 
      method, 
      status: 'error',
      errorCode 
    });
  },

  /**
   * Track user actions
   */
  userAction: (action: string, routeKey: RoutePath, metadata?: RouteEventData) => {
    trackRouteEvent('user_action', routeKey, { metadata: { action, ...metadata } });
  },

  /**
   * Track debt operations specifically
   */
  debtOperation: (operation: 'created' | 'updated' | 'deleted' | 'viewed', debtId?: string) => {
    const routeKey = operation === 'viewed' ? 'debts.getAll' : 
                     operation === 'created' ? 'debts.create' :
                     operation === 'updated' ? 'debts.update' : 'debts.delete';
    
    trackRouteEvent('debt_operation', routeKey, {
      metadata: { operation, debt_id: debtId }
    });
  },

  /**
   * Track authentication events
   */
  authEvent: (event: 'login_requested' | 'login_success' | 'logout' | 'token_refresh') => {
    const routeKey = event === 'login_requested' ? 'auth.requestLink' :
                     event === 'login_success' ? 'auth.me' :
                     event === 'logout' ? 'auth.logout' : 'auth.refresh';
    
    trackRouteEvent('auth_event', routeKey, {
      metadata: { event }
    });
  },

  /**
   * Track route performance
   */
  routePerformance: (routeKey: RoutePath, metrics: {
    loadTime: number;
    renderTime?: number; 
    interactive?: boolean;
  }) => {
    trackRouteEvent('route_performance', routeKey, {
      metadata: metrics
    });
  }
};

/**
 * Route usage heatmap data
 */
export const RouteHeatmap = {
  /**
   * Track which routes are accessed most frequently
   */
  trackRouteAccess: (routeKey: RoutePath) => {
    trackRouteEvent('route_accessed', routeKey);
  },

  /**
   * Track route abandonment (user starts but doesn't complete)
   */
  trackRouteAbandonment: (routeKey: RoutePath, reason?: string) => {
    trackRouteEvent('route_abandoned', routeKey, {
      metadata: { reason }
    });
  },

  /**
   * Track successful route completion
   */
  trackRouteCompletion: (routeKey: RoutePath, duration: number) => {
    trackRouteEvent('route_completed', routeKey, {
      metadata: { duration_ms: duration }
    });
  }
};

/**
 * Gateway-level analytics (for automatic tracking)
 */
export const GatewayAnalytics = {
  /**
   * Wrap fetch calls with automatic analytics
   */
  trackFetch: async (routeKey: RoutePath, fetchPromise: Promise<Response>, method: RouteEventOptions['method'] = 'GET') => {
    const startTime = Date.now();
    
    RouteAnalytics.apiCallStarted(routeKey, method);
    
    try {
      const response = await fetchPromise;
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        RouteAnalytics.apiCallSuccess(routeKey, method, responseTime);
      } else {
        RouteAnalytics.apiCallError(routeKey, method, `HTTP_${response.status}`);
      }
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      RouteAnalytics.apiCallError(routeKey, method, 'NETWORK_ERROR');
      throw error;
    }
  },

  /**
   * Track gateway operation patterns
   */
  trackOperation: (operation: string, routeKey: RoutePath, success: boolean, metadata?: RouteEventData) => {
    trackRouteEvent('gateway_operation', routeKey, {
      status: success ? 'success' : 'error',
      metadata: { operation, ...metadata }
    });
  }
};

/**
 * Debug helpers for development
 */
export const RouteAnalyticsDebug = {
  /**
   * Log all route events to console (development only)
   */
  enableDebugLogging: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const originalTrack = trackRouteEvent;
    (window as any).trackRouteEvent = (event: string, routeKey: RoutePath, options: RouteEventOptions = {}) => {
      console.log('🔍 Route Analytics:', {
        event,
        routeKey,
        route: RouteHelpers.getRoute(routeKey),
        ...options
      });
      return originalTrack(event, routeKey, options);
    };
  },

  /**
   * Get route usage statistics
   */
  getRouteStats: () => {
    if (typeof window !== 'undefined' && window.posthog) {
      // This would normally query PostHog, but we'll simulate
      console.log('Route statistics available in PostHog dashboard');
      return {
        mostUsedRoutes: ['debts.getAll', 'auth.me', 'debts.create'],
        leastUsedRoutes: ['settings.update', 'auth.stats'],
        errorRates: {
          'debts.getAll': 0.02,
          'auth.refresh': 0.01,
          'debts.create': 0.05
        }
      };
    }
    return null;
  }
};

// Types for external usage
export type {
  RoutePath,
  RouteEventData,
  RouteEventOptions
};