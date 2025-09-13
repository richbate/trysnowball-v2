/**
 * Feature Flags Hook for Clean UK Debt App
 * Provides reactive access to user's feature flags
 */

import { useMemo } from 'react';
import {
  getFeatureFlags,
  getDevFeatureFlags,
  isFeatureEnabled,
  type FeatureFlags,
  type UserTier,
  type UseFeatureFlagsResult,
} from '../config/featureFlags';

/**
 * Mock user context - in real app this would come from auth context
 * For now, we'll simulate a free user and allow dev overrides
 */
function getCurrentUserTier(): UserTier['name'] {
  // In development, allow tier override via localStorage for testing
  if (process.env.NODE_ENV === 'development') {
    const devTier = localStorage.getItem('dev_user_tier') as UserTier['name'];
    if (devTier && ['free', 'pro', 'admin'].includes(devTier)) {
      return devTier;
    }
  }

  // TODO: Replace with actual auth context when user accounts are implemented
  // For now, default to free tier
  return 'free';
}

/**
 * Hook to access feature flags for the current user
 */
export function useFeatureFlags(): UseFeatureFlagsResult {
  const userTier = getCurrentUserTier();

  const result = useMemo(() => {
    // Get base features for user tier
    let features: FeatureFlags;
    
    if (process.env.NODE_ENV === 'development') {
      // In development, apply dev overrides
      features = getDevFeatureFlags();
      
      // Apply tier-specific features if tier is overridden
      if (userTier !== 'free') {
        features = { ...features, ...getFeatureFlags(userTier) };
      }
    } else {
      // In production, use standard tier-based features
      features = getFeatureFlags(userTier);
    }

    const isProUser = userTier === 'pro' || userTier === 'admin';

    const hasFeature = (feature: keyof FeatureFlags): boolean => {
      return features[feature];
    };

    const upgradeRequired = (feature: keyof FeatureFlags): boolean => {
      return !features[feature] && isFeatureEnabled(feature, 'pro');
    };

    return {
      features,
      userTier,
      isProUser,
      hasFeature,
      upgradeRequired,
    };
  }, [userTier]);

  return result;
}

/**
 * Development helper to set user tier for testing
 */
export function setDevUserTier(tier: UserTier['name']): void {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('dev_user_tier', tier);
    // Force a page reload to apply the new tier
    window.location.reload();
  }
}

/**
 * Development helper to enable specific features for testing
 */
export function enableDevFeature(feature: keyof FeatureFlags): void {
  if (process.env.NODE_ENV === 'development') {
    const key = `REACT_APP_ENABLE_${feature.toUpperCase()}`;
    // This would require a restart in a real app, but for testing we'll use localStorage
    localStorage.setItem(`dev_feature_${feature}`, 'true');
    console.log(`Dev feature enabled: ${feature}. Restart the app to apply.`);
  }
}

/**
 * Hook specifically for multi-APR bucket feature
 * Provides convenient access to this experimental feature
 */
export function useMultiAPRFeature() {
  const { hasFeature, upgradeRequired, userTier } = useFeatureFlags();
  
  return {
    isEnabled: hasFeature('multiAPRBuckets'),
    requiresUpgrade: upgradeRequired('multiAPRBuckets'),
    userTier,
    isExperimental: true, // This feature is experimental even for pro users
  };
}