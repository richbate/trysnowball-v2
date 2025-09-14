/**
 * useSnowballSettings Hook
 * 
 * Single source of truth for the Snowball Amount (£/month extra towards debts).
 * Provides global state management with persistence and optional remote sync.
 */

import { useState, useEffect, useCallback } from 'react';
import { track } from '../lib/analytics';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from '../utils/tokenStorage';

// Storage keys
const STORAGE_KEY = 'snowball_amount';
const STORAGE_VERSION_KEY = 'snowball_amount_version';
const CURRENT_VERSION = '1.0';

// Default snowball amount in £
const DEFAULT_SNOWBALL_AMOUNT = 0;

// Get client ID based on environment
const getClientId = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
      return 'dev-local';
    }
    if (window.location.hostname.includes('staging')) {
      return 'web-v1-staging';
    }
    return 'web-v1';
  }
  return 'dev-local';
};

export const useSnowballSettings = () => {
  const { user } = useAuth();
  const [snowballAmount, setSnowballAmountState] = useState(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(STORAGE_VERSION_KEY);
      
      if (stored !== null && version === CURRENT_VERSION) {
        const parsed = parseFloat(stored);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_SNOWBALL_AMOUNT;
      }
    } catch (error) {
      console.warn('[useSnowballSettings] Failed to load from localStorage:', error);
    }
    
    return DEFAULT_SNOWBALL_AMOUNT;
  });

  // Load from remote when user logs in
  useEffect(() => {
    if (user?.id && user?.token) {
      const loadFromRemote = async () => {
        try {
          const response = await fetch('/api/user_settings', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'x-client-id': getClientId()
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.snowball_amount_pennies !== undefined) {
              const remoteAmount = data.snowball_amount_pennies / 100;
              console.log('[useSnowballSettings] Loaded from remote:', remoteAmount);
              setSnowballAmountState(remoteAmount);
            }
          } else if (response.status !== 404) {
            console.warn('[useSnowballSettings] Failed to load from remote:', response.status);
          }
        } catch (error) {
          console.warn('[useSnowballSettings] Remote load error:', error);
        }
      };
      
      loadFromRemote();
    }
  }, [user?.id, user?.token]);
  
  // Sync to localStorage whenever amount changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, snowballAmount.toString());
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    } catch (error) {
      console.warn('[useSnowballSettings] Failed to save to localStorage:', error);
    }
  }, [snowballAmount]);

  // Sync to remote when logged in
  useEffect(() => {
    if (user?.id) {
      const syncToRemote = async () => {
        try {
          const payload = {
            snowball_amount_pennies: Math.round(snowballAmount * 100)
          };

          const clientId = getClientId();
          const token = getToken();
          console.log('[useSnowballSettings] Sending request with:', { clientId, hasToken: !!token });
          
          const response = await fetch('/api/user_settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-client-id': clientId
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            console.warn('[useSnowballSettings] Remote sync failed:', response.status);
          } else {
            console.log('[useSnowballSettings] Successfully synced to remote');
          }
        } catch (error) {
          console.warn('[useSnowballSettings] Remote sync error:', error);
          // Don't block user experience for sync failures
        }
      };
      
      // Debounce remote sync to avoid excessive requests
      const timeoutId = setTimeout(syncToRemote, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, snowballAmount]);

  const setSnowballAmount = useCallback((newAmount) => {
    const oldAmount = snowballAmount;
    const normalizedAmount = Math.max(0, parseFloat(newAmount) || 0);
    
    setSnowballAmountState(normalizedAmount);
    
    // Track analytics
    if (oldAmount !== normalizedAmount) {
      track('snowball_amount_changed', {
        from: oldAmount,
        to: normalizedAmount,
        source: 'useSnowballSettings',
        timestamp: Date.now()
      });
    }
  }, [snowballAmount]);

  // Utility methods
  const incrementSnowballAmount = useCallback((increment = 25) => {
    const newAmount = snowballAmount + increment;
    setSnowballAmount(newAmount);
    
    // Track increment action
    track('snowball_amount_incremented', {
      increment,
      from: snowballAmount,
      to: newAmount,
      source: 'increment_button'
    });
  }, [snowballAmount, setSnowballAmount]);

  const resetSnowballAmount = useCallback(() => {
    setSnowballAmount(DEFAULT_SNOWBALL_AMOUNT);
    
    track('snowball_amount_reset', {
      from: snowballAmount,
      source: 'reset_action'
    });
  }, [snowballAmount, setSnowballAmount]);

  return {
    snowballAmount,
    setSnowballAmount,
    incrementSnowballAmount,
    resetSnowballAmount,
    // Utility getters
    snowballAmountPennies: Math.round(snowballAmount * 100), // For backend sync
    isDefaultAmount: snowballAmount === DEFAULT_SNOWBALL_AMOUNT
  };
};

export default useSnowballSettings;