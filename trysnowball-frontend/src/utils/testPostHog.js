// Quick PostHog test utility
import { analytics } from '../lib/posthog';

export const testPostHogConnection = () => {
  console.log('🧪 Testing PostHog connection...');
  
  // Test basic event
  analytics.track('test_event', {
    test: true,
    timestamp: new Date().toISOString(),
    source: 'manual_test'
  });
  
  // Test page view
  analytics.page('Test Page', {
    test: true,
    url: window.location.href
  });
  
  console.log('📊 PostHog test events sent! Check your dashboard in 1-2 minutes.');
  
  // Return instructions for user
  return {
    success: true,
    message: 'Test events sent to PostHog. Check your dashboard for "test_event" and page view.'
  };
};

// Make it available in browser console for testing
if (typeof window !== 'undefined') {
  window.testPostHog = testPostHogConnection;
}