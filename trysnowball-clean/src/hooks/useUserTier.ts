/**
 * User Tier Hook
 * Returns current user tier based on JWT entitlements
 */

import { useState, useEffect } from 'react';
import { authToken } from '../lib/authToken';

// Helper function matching the user's spec
export function isPro(entitlements: string[] = []): boolean {
  return entitlements.includes('beta') ||
         entitlements.includes('pro_monthly') ||
         entitlements.includes('pro_annual') ||
         entitlements.includes('founder');
}

interface UseUserTierReturn {
  isAuthenticated: boolean;
  isPro: boolean;
  isFree: boolean;
  entitlements: string[];
  userId: string | null;
  tierLabel: string; // for analytics
}

export function useUserTier(): UseUserTierReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const updateTier = () => {
      const authenticated = authToken.isAuthenticated();
      const user = authToken.getUser();
      
      setIsAuthenticated(authenticated);
      
      if (authenticated && user) {
        setEntitlements(user.entitlements || []);
        setUserId(user.id);
      } else {
        setEntitlements([]);
        setUserId(null);
      }
    };

    // Initial check
    updateTier();

    // Listen for storage changes (token updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_user') {
        updateTier();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab token changes
    const handleAuthChange = () => updateTier();
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const proAccess = isPro(entitlements);
  
  // Generate tier label for analytics
  const tierLabel = isAuthenticated 
    ? (proAccess ? entitlements[0] || 'pro' : 'free')
    : 'unknown';

  return {
    isAuthenticated,
    isPro: proAccess,
    isFree: !proAccess,
    entitlements,
    userId,
    tierLabel,
  };
}

// Helper to trigger auth change events
export function triggerAuthChange() {
  window.dispatchEvent(new CustomEvent('auth-change'));
}