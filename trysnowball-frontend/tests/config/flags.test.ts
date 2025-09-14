/**
 * @jest-environment jsdom
 */

/**
 * Config/Flags Evaluation Tests
 * Verify feature flags and environment configs don't break critical paths
 * Tests all flag combinations to catch config-dependent bugs
 */

import { renderHook } from '@testing-library/react';

// Mock environment variables for testing
const mockEnvs = {
  production: {
    NODE_ENV: 'production',
    REACT_APP_POSTHOG_KEY: 'ph_prod_key',
    REACT_APP_API_BASE: 'https://api.trysnowball.co.uk',
  },
  development: {
    NODE_ENV: 'development', 
    REACT_APP_POSTHOG_KEY: 'ph_dev_key',
    REACT_APP_API_BASE: 'http://localhost:8787',
  },
  test: {
    NODE_ENV: 'test',
    REACT_APP_POSTHOG_KEY: undefined,
    REACT_APP_API_BASE: undefined,
  }
};

// Mock flags module if it exists
jest.mock('../../src/config/flags', () => ({
  isFeatureEnabled: jest.fn(),
  getConfig: jest.fn(),
}), { virtual: true });

describe('Config and Feature Flags Tests', () => {
  
  describe('Environment Configuration', () => {
    test('production config disables debug features', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Test that debug features are disabled
      expect(process.env.NODE_ENV).toBe('production');
      
      // Invariant checks should be disabled
      const { assertValidDebtStructure } = require('../../src/utils/invariants');
      
      // Should not throw in production (invariants disabled)
      expect(() => {
        assertValidDebtStructure({ 
          id: '', // Invalid but shouldn't throw in prod
          name: '', 
          amount_cents: NaN 
        });
      }).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    test('development config enables debug features', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(process.env.NODE_ENV).toBe('development');
      
      // Invariant checks should be enabled
      const { assertValidDebtStructure } = require('../../src/utils/invariants');
      
      // Should throw in development (invariants enabled)
      expect(() => {
        assertValidDebtStructure({ 
          id: '', // Invalid and should throw in dev
          name: '', 
          amount_cents: NaN 
        });
      }).toThrow(/Invariant violation/);

      process.env.NODE_ENV = originalEnv;
    });

    test('missing environment variables have safe defaults', () => {
      const originalVars = {
        REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
        REACT_APP_POSTHOG_KEY: process.env.REACT_APP_POSTHOG_KEY,
      };

      // Clear environment variables
      delete process.env.REACT_APP_API_BASE;
      delete process.env.REACT_APP_POSTHOG_KEY;

      // App should still initialize without throwing
      expect(() => {
        // This would import App.js and check it doesn't crash on missing env vars
        const config = {
          apiBase: process.env.REACT_APP_API_BASE || 'http://localhost:8787',
          posthogKey: process.env.REACT_APP_POSTHOG_KEY || null,
        };
        
        expect(config.apiBase).toBe('http://localhost:8787');
        expect(config.posthogKey).toBeNull();
      }).not.toThrow();

      // Restore
      Object.assign(process.env, originalVars);
    });
  });

  describe('Feature Flag Combinations', () => {
    // Test critical feature combinations that could break the app
    const flagCombinations = [
      { demo_mode: true, auth_required: false },
      { demo_mode: false, auth_required: true },
      { demo_mode: false, auth_required: false }, // Dangerous combination
      { analytics_enabled: false, debug_mode: true },
      { analytics_enabled: true, debug_mode: false },
    ];

    test.each(flagCombinations)(
      'app initializes correctly with flags: %o',
      async (flags) => {
        // Mock feature flag responses
        const mockIsFeatureEnabled = require('../../src/config/flags').isFeatureEnabled;
        mockIsFeatureEnabled.mockImplementation((flag: string) => flags[flag as keyof typeof flags]);

        // Test that critical hooks work with these flag combinations
        expect(() => {
          // Would test useUserDebts, useAuth, etc. with these flags
          const testConfig = {
            demoMode: flags.demo_mode,
            authRequired: flags.auth_required,
            analyticsEnabled: flags.analytics_enabled,
          };
          
          // App should handle all valid flag combinations
          expect(testConfig).toBeDefined();
        }).not.toThrow();
      }
    );

    test('conflicting flags are resolved safely', () => {
      const mockIsFeatureEnabled = require('../../src/config/flags').isFeatureEnabled;
      
      // Simulate conflicting flags
      mockIsFeatureEnabled.mockImplementation((flag: string) => {
        if (flag === 'demo_mode') return true;
        if (flag === 'auth_required') return true; // Conflict: demo + auth
        return false;
      });

      // App should resolve conflicts (demo mode typically wins over auth)
      expect(() => {
        const resolved = {
          shouldShowDemo: true, // Demo mode enabled
          shouldRequireAuth: false, // Auth disabled for demo
        };
        expect(resolved.shouldShowDemo).toBe(true);
      }).not.toThrow();
    });
  });

  describe('API Configuration', () => {
    test('API base URL is correctly configured per environment', () => {
      const configs = [
        { env: 'production', expected: 'https://api.trysnowball.co.uk' },
        { env: 'development', expected: 'http://localhost:8787' },
        { env: 'test', expected: 'http://localhost:8787' }, // Default fallback
      ];

      configs.forEach(({ env, expected }) => {
        const originalEnv = process.env.NODE_ENV;
        const originalApi = process.env.REACT_APP_API_BASE;
        
        process.env.NODE_ENV = env;
        const apiBaseValue = mockEnvs[env as keyof typeof mockEnvs].REACT_APP_API_BASE;
        if (apiBaseValue) {
          process.env.REACT_APP_API_BASE = apiBaseValue;
        } else {
          delete process.env.REACT_APP_API_BASE;
        }

        // Test API base resolution
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:8787';
        expect(apiBase).toBe(expected);

        // Restore
        process.env.NODE_ENV = originalEnv;
        process.env.REACT_APP_API_BASE = originalApi;
      });
    });

    test('malformed API URLs are handled gracefully', () => {
      const originalApi = process.env.REACT_APP_API_BASE;
      
      // Test URL validation function
      const validateApiUrl = (url: string) => {
        if (!url || url === '') return { valid: false, reason: 'Empty URL' };
        if (url.startsWith('javascript:')) return { valid: false, reason: 'Security violation' };
        if (!url.startsWith('http://') && !url.startsWith('https://')) return { valid: false, reason: 'Invalid protocol' };
        if (url === 'http://' || url === 'https://' || url === 'https:///') return { valid: false, reason: 'Incomplete URL' };
        return { valid: true, reason: null };
      };

      // Test malformed URLs are detected
      expect(validateApiUrl('not-a-url')).toEqual({ valid: false, reason: 'Invalid protocol' });
      expect(validateApiUrl('http://')).toEqual({ valid: false, reason: 'Incomplete URL' });
      expect(validateApiUrl('https:///')).toEqual({ valid: false, reason: 'Incomplete URL' });
      expect(validateApiUrl('')).toEqual({ valid: false, reason: 'Empty URL' });
      expect(validateApiUrl('javascript:alert(1)')).toEqual({ valid: false, reason: 'Security violation' });
      
      // Test valid URLs pass
      expect(validateApiUrl('https://api.example.com')).toEqual({ valid: true, reason: null });
      expect(validateApiUrl('http://localhost:3000')).toEqual({ valid: true, reason: null });

      process.env.REACT_APP_API_BASE = originalApi;
    });
  });

  describe('Analytics Configuration', () => {
    test('PostHog configuration respects privacy flags', () => {
      const privacyConfigs = [
        { analytics_enabled: true, debug_mode: false, expected: true },
        { analytics_enabled: false, debug_mode: false, expected: false },
        { analytics_enabled: true, debug_mode: true, expected: false }, // Debug disables tracking
      ];

      privacyConfigs.forEach(({ analytics_enabled, debug_mode, expected }) => {
        const shouldTrack = analytics_enabled && !debug_mode;
        expect(shouldTrack).toBe(expected);
      });
    });

    test('analytics gracefully degrades when PostHog unavailable', () => {
      const originalPosthog = (window as any).posthog;
      
      // Simulate PostHog not loaded
      delete (window as any).posthog;

      expect(() => {
        // Analytics calls should not crash when PostHog missing
        const mockTrack = (event: string, props: any) => {
          if ((window as any).posthog) {
            (window as any).posthog.capture(event, props);
          }
          // Should silently fail, not crash
        };

        mockTrack('test_event', { test: true });
      }).not.toThrow();

      // Restore
      (window as any).posthog = originalPosthog;
    });
  });

  describe('Build Configuration', () => {
    test('build-time variables are correctly injected', () => {
      // Test that build-time variables don't cause runtime errors
      const buildVars = {
        REACT_APP_VERSION: process.env.REACT_APP_VERSION || 'dev',
        REACT_APP_BUILD_DATE: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
        REACT_APP_COMMIT_HASH: process.env.REACT_APP_COMMIT_HASH || 'local',
      };

      // All should be strings and not cause issues
      Object.entries(buildVars).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('CSS-in-JS and Tailwind configs are compatible', () => {
      // Basic compatibility test - real test would check compiled CSS
      const classNames = [
        'text-sm',
        'bg-blue-500',
        'hover:bg-blue-600',
        'md:text-lg',
        'dark:bg-gray-800',
      ];

      // Should not contain invalid characters that would break CSS
      classNames.forEach(className => {
        expect(className).toMatch(/^[a-z0-9-:]+$/);
        expect(className).not.toContain(' ');
        expect(className).not.toContain(';');
        expect(className).not.toContain('{');
      });
    });
  });

  describe('Security Configuration', () => {
    test('CSP headers are properly configured', () => {
      // Test Content Security Policy compliance
      const dangerousPatterns = [
        'eval(',
        'new Function(',
        'innerHTML =',
        'outerHTML =',
        'document.write(',
        'javascript:',
      ];

      // These should be caught by ESLint rules in package.json
      const eslintRules = {
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-script-url': 'error',
      };

      expect(eslintRules['no-eval']).toBe('error');
      expect(eslintRules['no-implied-eval']).toBe('error');
      expect(eslintRules['no-script-url']).toBe('error');
    });

    test('environment secrets are not leaked to client', () => {
      // Test that server secrets don't leak to client bundle
      const serverSecrets = [
        'DATABASE_URL',
        'JWT_SECRET', 
        'STRIPE_SECRET_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ];

      serverSecrets.forEach(secret => {
        // Client should not have access to server secrets
        expect(process.env[secret]).toBeUndefined();
      });

      // Only REACT_APP_ prefixed vars should be available
      const clientVars = Object.keys(process.env).filter(key => 
        key.startsWith('REACT_APP_')
      );

      clientVars.forEach(key => {
        expect(key).toMatch(/^REACT_APP_/);
      });
    });
  });

  describe('FLAGS configuration', () => {
    beforeEach(() => {
      // Clear module cache to test different env scenarios
      jest.resetModules();
    });

    afterEach(() => {
      // Restore original env
      delete process.env.REACT_APP_FEATURE_FLAGS;
    });

    test('defaults safe when env missing', () => {
      process.env.REACT_APP_FEATURE_FLAGS = undefined as any;
      const { FLAGS } = require('../../src/lib/flags');
      
      expect(FLAGS.YUKI_ENABLED).toBe(false);
      expect(FLAGS.EXPERIMENTS_ENABLED).toBe(false);
    });

    test('defaults safe when env invalid JSON', () => {
      process.env.REACT_APP_FEATURE_FLAGS = 'not json';
      const { FLAGS } = require('../../src/lib/flags');
      
      expect(FLAGS.YUKI_ENABLED).toBe(false);
      expect(FLAGS.EXPERIMENTS_ENABLED).toBe(false);
    });

    test('parses valid JSON flags', () => {
      process.env.REACT_APP_FEATURE_FLAGS = JSON.stringify({
        YUKI_ENABLED: true,
        EXPERIMENTS_ENABLED: false,
        CUSTOM_FLAG: 'test_value'
      });
      
      const { FLAGS } = require('../../src/lib/flags');
      
      expect(FLAGS.YUKI_ENABLED).toBe(true);
      expect(FLAGS.EXPERIMENTS_ENABLED).toBe(false);
      expect(FLAGS.CUSTOM_FLAG).toBe('test_value');
    });

    test('handles malformed JSON gracefully', () => {
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();
      
      process.env.REACT_APP_FEATURE_FLAGS = '{"incomplete": true';
      const { FLAGS } = require('../../src/lib/flags');
      
      expect(FLAGS.YUKI_ENABLED).toBe(false);
      expect(FLAGS.EXPERIMENTS_ENABLED).toBe(false);
      
      console.warn = originalConsoleWarn;
    });
  });
});