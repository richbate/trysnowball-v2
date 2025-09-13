/**
 * CP-4 Extended: Feature Flags System Tests
 * Tests for user tier permissions and feature access
 */

import { 
  getFeatureFlags, 
  isFeatureEnabled, 
  getDevFeatureFlags,
  USER_TIERS 
} from '../config/featureFlags';

// Mock environment for testing
const originalEnv = process.env.NODE_ENV;

describe('Feature Flags System', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('User Tier Permissions', () => {
    test('free tier has limited features', () => {
      const features = getFeatureFlags('free');
      
      expect(features.multiAPRBuckets).toBe(false);
      expect(features.advancedForecast).toBe(false);
      expect(features.debtOptimization).toBe(false);
      expect(features.exportData).toBe(false);
      expect(features.prioritySupport).toBe(false);
    });

    test('pro tier has access to experimental features', () => {
      const features = getFeatureFlags('pro');
      
      expect(features.multiAPRBuckets).toBe(true);  // Experimental feature
      expect(features.advancedForecast).toBe(true);
      expect(features.debtOptimization).toBe(true);
      expect(features.exportData).toBe(true);
      expect(features.prioritySupport).toBe(true);
    });

    test('admin tier has access to all features', () => {
      const features = getFeatureFlags('admin');
      
      expect(features.multiAPRBuckets).toBe(true);
      expect(features.advancedForecast).toBe(true);
      expect(features.debtOptimization).toBe(true);
      expect(features.exportData).toBe(true);
      expect(features.prioritySupport).toBe(true);
    });
  });

  describe('Feature Access Checks', () => {
    test('isFeatureEnabled correctly identifies feature access', () => {
      expect(isFeatureEnabled('multiAPRBuckets', 'free')).toBe(false);
      expect(isFeatureEnabled('multiAPRBuckets', 'pro')).toBe(true);
      expect(isFeatureEnabled('multiAPRBuckets', 'admin')).toBe(true);
    });

    test('defaults to free tier when no tier specified', () => {
      expect(isFeatureEnabled('multiAPRBuckets')).toBe(false);
      expect(isFeatureEnabled('prioritySupport')).toBe(false);
    });
  });

  describe('Development Overrides', () => {
    test('getDevFeatureFlags respects environment', () => {
      process.env.NODE_ENV = 'production';
      const features = getDevFeatureFlags();
      
      // In production, should return free tier features
      expect(features.multiAPRBuckets).toBe(false);
    });

    test('development allows feature overrides via environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.REACT_APP_ENABLE_MULTI_APR = 'true';
      
      const features = getDevFeatureFlags();
      expect(features.multiAPRBuckets).toBe(true);
      
      // Clean up
      delete process.env.REACT_APP_ENABLE_MULTI_APR;
    });

    test('development defaults to free tier without overrides', () => {
      process.env.NODE_ENV = 'development';
      
      const features = getDevFeatureFlags();
      expect(features.multiAPRBuckets).toBe(false);
      expect(features.advancedForecast).toBe(false);
    });
  });

  describe('User Tier Configuration', () => {
    test('USER_TIERS contains all expected tiers', () => {
      expect(USER_TIERS).toHaveProperty('free');
      expect(USER_TIERS).toHaveProperty('pro');
      expect(USER_TIERS).toHaveProperty('admin');
    });

    test('each tier has valid configuration', () => {
      Object.values(USER_TIERS).forEach(tier => {
        expect(tier).toHaveProperty('id');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('features');
        expect(tier.features).toHaveProperty('multiAPRBuckets');
        expect(tier.features).toHaveProperty('advancedForecast');
        expect(tier.features).toHaveProperty('debtOptimization');
        expect(tier.features).toHaveProperty('exportData');
        expect(tier.features).toHaveProperty('prioritySupport');
      });
    });

    test('tier progression makes sense', () => {
      const free = USER_TIERS.free.features;
      const pro = USER_TIERS.pro.features;
      const admin = USER_TIERS.admin.features;

      // Pro should have more features than free
      const freeFeatureCount = Object.values(free).filter(Boolean).length;
      const proFeatureCount = Object.values(pro).filter(Boolean).length;
      const adminFeatureCount = Object.values(admin).filter(Boolean).length;

      expect(proFeatureCount).toBeGreaterThan(freeFeatureCount);
      expect(adminFeatureCount).toBeGreaterThanOrEqual(proFeatureCount);
    });
  });

  describe('Multi-APR Feature Specific Tests', () => {
    test('multiAPRBuckets is experimental feature for pro users', () => {
      expect(isFeatureEnabled('multiAPRBuckets', 'free')).toBe(false);
      expect(isFeatureEnabled('multiAPRBuckets', 'pro')).toBe(true);
      expect(isFeatureEnabled('multiAPRBuckets', 'admin')).toBe(true);
    });

    test('feature flag correctly gates bucket functionality', () => {
      // This would be used in components to show/hide bucket features
      const canUseBuckets = (userTier: 'free' | 'pro' | 'admin') => {
        return isFeatureEnabled('multiAPRBuckets', userTier);
      };

      expect(canUseBuckets('free')).toBe(false);
      expect(canUseBuckets('pro')).toBe(true);
      expect(canUseBuckets('admin')).toBe(true);
    });
  });
});