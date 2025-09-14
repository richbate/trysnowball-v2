/**
 * User Plan Hook
 * Single source of truth for user's billing status
 * Simple implementation using useState and useEffect
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to get user's current plan status
 * @returns {Object} - { isPaid, source, loading, error, refresh }
 */
export function useUserPlan() {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const fetchPlan = useCallback(async () => {
  try {
   setError(null);
   setLoading(true);
   
   const response = await fetch('/auth/api/me/plan', {
    credentials: 'include', // Include cookies for auth
    headers: {
     'Content-Type': 'application/json'
    }
   });
   
   if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
   }
   
   const result = await response.json();
   setData(result);
  } catch (err) {
   setError(err);
   console.error('Failed to fetch user plan:', err);
   // Set default values on error
   setData({ is_paid: false, source: 'none' });
  } finally {
   setLoading(false);
  }
 }, []);

 // Fetch on mount
 useEffect(() => {
  fetchPlan();
 }, [fetchPlan]);

 // Refresh on window focus (user might have completed billing in another tab)
 useEffect(() => {
  const handleFocus = () => {
   fetchPlan();
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
 }, [fetchPlan]);

 return {
  isPaid: !!data?.is_paid,
  source: data?.source || 'none', // 'stripe' | 'beta' | 'none'
  loading,
  error,
  refresh: fetchPlan, // Call this to force refresh after billing actions
  
  // Convenience flags
  isStripeUser: data?.source === 'stripe',
  isBetaUser: data?.source === 'beta',
  isFreeUser: data?.source === 'none'
 };
}