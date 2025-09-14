/**
 * useTokenRefresh Hook
 * Handles automatic token refresh to prevent expiry
 * Shows user-friendly warnings and manages refresh cycles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTokenExpiry, refreshToken, hasToken } from '../utils/tokenStorage';
import { useAuth } from '../contexts/AuthContext';

export const useTokenRefresh = () => {
 const [refreshState, setRefreshState] = useState({
  isRefreshing: false,
  lastRefresh: null,
  nextRefresh: null,
  warningShown: false,
  error: null
 });
 
 const { isAuthed } = useAuth();
 const refreshIntervalRef = useRef(null);
 const warningTimeoutRef = useRef(null);
 
 // Calculate next refresh time (1 day before expiry, but check every hour)
 const scheduleNextRefresh = useCallback(() => {
  if (!hasToken() || !isAuthed) {
   return;
  }
  
  const { isExpired, timeToExpiry } = getTokenExpiry(24 * 60); // 24 hours buffer
  
  if (isExpired) {
   console.log('[TokenRefresh] Token expired or expiring soon, attempting refresh...');
   handleRefresh();
   return;
  }
  
  // Schedule next check in 1 hour, or when token expires if sooner
  const nextCheckMinutes = Math.min(60, Math.max(1, timeToExpiry - 24 * 60));
  const nextRefresh = new Date(Date.now() + nextCheckMinutes * 60 * 1000);
  
  setRefreshState(prev => ({ ...prev, nextRefresh }));
  
  if (refreshIntervalRef.current) {
   clearTimeout(refreshIntervalRef.current);
  }
  
  refreshIntervalRef.current = setTimeout(() => {
   scheduleNextRefresh();
  }, nextCheckMinutes * 60 * 1000);
  
  console.log(`[TokenRefresh] Next check scheduled in ${nextCheckMinutes} minutes`);
 }, [isAuthed]);
 
 const handleRefresh = useCallback(async () => {
  if (refreshState.isRefreshing) {
   console.log('[TokenRefresh] Refresh already in progress');
   return;
  }
  
  setRefreshState(prev => ({ ...prev, isRefreshing: true, error: null }));
  
  try {
   const success = await refreshToken();
   const now = new Date();
   
   if (success) {
    setRefreshState(prev => ({
     ...prev,
     isRefreshing: false,
     lastRefresh: now,
     warningShown: false,
     error: null
    }));
    
    // Schedule next refresh cycle
    scheduleNextRefresh();
    
    console.log('[TokenRefresh] Token refresh successful');
   } else {
    setRefreshState(prev => ({
     ...prev,
     isRefreshing: false,
     error: 'Refresh failed - you may need to log in again'
    }));
    
    console.warn('[TokenRefresh] Token refresh failed');
   }
  } catch (error) {
   setRefreshState(prev => ({
    ...prev,
    isRefreshing: false,
    error: error.message || 'Refresh error'
   }));
   
   console.error('[TokenRefresh] Token refresh error:', error);
  }
 }, [refreshState.isRefreshing, scheduleNextRefresh]);
 
 const showExpiryWarning = useCallback(() => {
  if (refreshState.warningShown) return;
  
  const { timeToExpiry } = getTokenExpiry();
  
  if (timeToExpiry > 0 && timeToExpiry <= 24 * 60) { // Less than 24 hours
   setRefreshState(prev => ({ ...prev, warningShown: true }));
   
   // Dispatch event for UI components to show warning modal
   if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token-expiry-warning', {
     detail: { 
      timeToExpiry,
      expiryDate: new Date(Date.now() + timeToExpiry * 60 * 1000)
     }
    }));
   }
  }
 }, [refreshState.warningShown]);
 
 // Initialize refresh cycle when user is authenticated
 useEffect(() => {
  if (isAuthed && hasToken()) {
   console.log('[TokenRefresh] Initializing token refresh cycle');
   scheduleNextRefresh();
   
   // Check for expiry warning on first load
   setTimeout(showExpiryWarning, 1000);
  } else {
   // Clear any scheduled refreshes when not authenticated
   if (refreshIntervalRef.current) {
    clearTimeout(refreshIntervalRef.current);
    refreshIntervalRef.current = null;
   }
   if (warningTimeoutRef.current) {
    clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = null;
   }
  }
  
  return () => {
   if (refreshIntervalRef.current) {
    clearTimeout(refreshIntervalRef.current);
   }
   if (warningTimeoutRef.current) {
    clearTimeout(warningTimeoutRef.current);
   }
  };
 }, [isAuthed, scheduleNextRefresh, showExpiryWarning]);
 
 // Manual refresh function for UI components
 const manualRefresh = useCallback(async () => {
  console.log('[TokenRefresh] Manual refresh requested');
  await handleRefresh();
 }, [handleRefresh]);
 
 return {
  ...refreshState,
  manualRefresh,
  tokenExpiry: getTokenExpiry()
 };
};