/**
 * Entitlements Sync Test
 * Ensures entitlement config and golden fixtures never drift apart
 * Critical: If business rules change, both config and tests must update together
 */

import entitlementDefaults from '../config/entitlements';
import goldenFixtures from './fixtures/cp5-goals.fixtures.json';

describe('Entitlements Config Sync', () => {
  describe('Free Tier Limits', () => {
    test('free tier max_active matches fixture expectations', () => {
      // Get config value for free tier
      const freeMaxActive = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'free'
      )?.value;

      // Get expected value from entitlement block fixture
      const blockFixture = goldenFixtures.entitlement_block_max_active;
      const expectedLimit = blockFixture.expected.analytics_event.properties.limit_value;

      expect(freeMaxActive).toBe(expectedLimit);
      expect(freeMaxActive).toBe(1); // Explicit assertion for business rule
    });

    test('free tier allowed_types matches fixture expectations', () => {
      // Get config value for free tier
      const freeAllowedTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'free'
      )?.value;

      // Get expected value from entitlement block fixture
      const blockFixture = goldenFixtures.entitlement_block_goal_type;
      const expectedTypes = blockFixture.expected.analytics_event.properties.limit_value;

      expect(freeAllowedTypes).toEqual(expectedTypes);
      expect(freeAllowedTypes).toEqual(['DEBT_CLEAR']); // Explicit assertion
    });
  });

  describe('Pro Tier Limits', () => {
    test('pro tier max_active matches business rules', () => {
      const proMaxActive = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'pro'
      )?.value;

      expect(proMaxActive).toBe(10); // Business rule: Pro gets 10 active goals
    });

    test('pro tier allowed_types includes all goal types', () => {
      const proAllowedTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'pro'  
      )?.value as string[];

      const expectedAllTypes = ['DEBT_CLEAR', 'AMOUNT_PAID', 'INTEREST_SAVED', 'TIMEBOUND'];
      
      expect(proAllowedTypes).toEqual(expect.arrayContaining(expectedAllTypes));
      expect(proAllowedTypes).toHaveLength(expectedAllTypes.length);
    });
  });

  describe('Fixture Consistency', () => {
    test('all entitlement block fixtures reference valid config features', () => {
      const configFeatures = entitlementDefaults.map(e => e.feature);
      
      // Check max_active fixture
      const maxActiveFixture = goldenFixtures.entitlement_block_max_active;
      const maxActiveFeature = maxActiveFixture.expected.analytics_event.properties.feature;
      expect(configFeatures).toContain(maxActiveFeature);

      // Check goal_type fixture  
      const goalTypeFixture = goldenFixtures.entitlement_block_goal_type;
      const goalTypeFeature = goalTypeFixture.expected.analytics_event.properties.feature;
      expect(configFeatures).toContain(goalTypeFeature);
    });

    test('all entitlement block fixtures reference valid tiers', () => {
      const configTiers = [...new Set(entitlementDefaults.map(e => e.tier))];
      
      const fixtures = [
        goldenFixtures.entitlement_block_max_active,
        goldenFixtures.entitlement_block_goal_type
      ];

      fixtures.forEach(fixture => {
        const tier = fixture.input.user_tier;
        expect(configTiers).toContain(tier);
      });
    });
  });

  describe('Business Rule Validation', () => {
    test('free tier is more restrictive than pro tier', () => {
      // Max active goals
      const freeMax = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'free'
      )?.value as number;
      
      const proMax = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'pro'
      )?.value as number;

      expect(freeMax).toBeLessThan(proMax);

      // Allowed types
      const freeTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'free'
      )?.value as string[];
      
      const proTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'pro'
      )?.value as string[];

      expect(freeTypes.length).toBeLessThan(proTypes.length);
      
      // Free types should be subset of pro types
      freeTypes.forEach(type => {
        expect(proTypes).toContain(type);
      });
    });

    test('entitlement config is complete for both tiers', () => {
      const requiredFeatures = ['goals.max_active', 'goals.allowed_types'];
      const requiredTiers = ['free', 'pro'];

      requiredFeatures.forEach(feature => {
        requiredTiers.forEach(tier => {
          const config = entitlementDefaults.find(
            e => e.feature === feature && e.tier === tier
          );
          
          expect(config).toBeDefined();
          expect(config?.value).toBeDefined();
        });
      });
    });
  });

  describe('Drift Detection', () => {
    test('config changes trigger test failure', () => {
      // This test will fail if entitlement defaults change
      // without corresponding fixture updates
      
      const snapshot = {
        free: {
          max_active: 1,
          allowed_types: ['DEBT_CLEAR']
        },
        pro: {
          max_active: 10, 
          allowed_types: ['DEBT_CLEAR', 'AMOUNT_PAID', 'INTEREST_SAVED', 'TIMEBOUND']
        }
      };

      // Verify free tier hasn't changed
      const freeMaxActive = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'free'
      )?.value;
      const freeTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'free'  
      )?.value;

      expect(freeMaxActive).toBe(snapshot.free.max_active);
      expect(freeTypes).toEqual(snapshot.free.allowed_types);

      // Verify pro tier hasn't changed
      const proMaxActive = entitlementDefaults.find(
        e => e.feature === 'goals.max_active' && e.tier === 'pro'
      )?.value;
      const proTypes = entitlementDefaults.find(
        e => e.feature === 'goals.allowed_types' && e.tier === 'pro'
      )?.value;

      expect(proMaxActive).toBe(snapshot.pro.max_active);
      expect(proTypes).toEqual(snapshot.pro.allowed_types);
    });
  });
});