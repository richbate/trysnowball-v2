// Web Vitals performance monitoring
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import logger from './utils/logger';
import { isDevelopment } from './env';

export function reportVital(metric) {
  // In development, just log to console
  if (isDevelopment) {
    logger.info('[Web Vital]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: metric.delta
    });
    return;
  }

  // In production, send to PostHog if available
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('web_vital_measured', {
      metric_name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating, // 'good', 'needs-improvement', 'poor'
      delta: metric.delta,
      id: metric.id,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  // Also log to console in production for debugging
  logger.info(`[${metric.name}]`, `${Math.round(metric.value)}ms (${metric.rating})`);
}

// Initialize web vitals monitoring
export function initWebVitals() {
  // Only run in browsers (not during SSR)
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  onCLS(reportVital);  // Cumulative Layout Shift
  onINP(reportVital);  // Interaction to Next Paint (replaces FID)
  onLCP(reportVital);  // Largest Contentful Paint
  
  // Additional useful metrics
  onFCP(reportVital);  // First Contentful Paint
  onTTFB(reportVital); // Time to First Byte

  logger.info('🔍 Web Vitals monitoring initialized');
}

// Legacy compatibility
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Use new approach
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onFCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
