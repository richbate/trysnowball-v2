/**
 * Feature Flag System for Clean UK Debt App
 * Controls experimental and pro-only features
 */

export interface FeatureFlags {
  multiAPRBuckets: boolean;      // Experimental: Multi-APR bucket support
  advancedForecast: boolean;     // Pro: Advanced forecast scenarios
  debtOptimization: boolean;     // Pro: AI-powered debt optimization
  exportData: boolean;           // Pro: CSV/PDF data export
  prioritySupport: boolean;      // Pro: Priority customer support
}

export interface UserTier {
  id: string;
  name: 'free' | 'pro' | 'admin';
  features: FeatureFlags;
}

/**
 * Default feature flag configurations by user tier
 */
export const USER_TIERS: Record<UserTier['name'], UserTier> = {
  free: {
    id: 'free',
    name: 'free',
    features: {
      multiAPRBuckets: false,     // Not available to free users
      advancedForecast: false,
      debtOptimization: false,
      exportData: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'pro',
    features: {
      multiAPRBuckets: true,      // Experimental feature for pro users
      advancedForecast: true,
      debtOptimization: true,
      exportData: true,
      prioritySupport: true,
    },
  },
  admin: {
    id: 'admin',
    name: 'admin',
    features: {
      multiAPRBuckets: true,      // All features enabled for admin
      advancedForecast: true,
      debtOptimization: true,
      exportData: true,
      prioritySupport: true,
    },
  },
} as const;

/**
 * Get feature flags for a specific user tier
 */
export function getFeatureFlags(userTier: UserTier['name'] = 'free'): FeatureFlags {
  return USER_TIERS[userTier].features;
}

/**
 * Check if a specific feature is enabled for a user tier
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlags,
  userTier: UserTier['name'] = 'free'
): boolean {
  return getFeatureFlags(userTier)[feature];
}

/**
 * Development override for testing experimental features
 * Only works in development environment
 */
export function getDevFeatureFlags(): FeatureFlags {
  if (process.env.NODE_ENV !== 'development') {
    return getFeatureFlags('free');
  }

  // In development, allow enabling experimental features via environment variables
  const devOverrides: Partial<FeatureFlags> = {};

  if (process.env.REACT_APP_ENABLE_MULTI_APR === 'true') {
    devOverrides.multiAPRBuckets = true;
  }

  return {
    ...getFeatureFlags('free'),
    ...devOverrides,
  };
}

/**
 * Feature flag hook result interface
 */
export interface UseFeatureFlagsResult {
  features: FeatureFlags;
  userTier: UserTier['name'];
  isProUser: boolean;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
  upgradeRequired: (feature: keyof FeatureFlags) => boolean;
}