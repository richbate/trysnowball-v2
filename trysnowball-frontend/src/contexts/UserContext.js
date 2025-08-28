// src/contexts/UserContext.js
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getToken } from '../utils/tokenStorage';
import { dbg } from '../lib/debug';
import { FEATURE } from '../utils/env';
import { fetchJSON } from '../utils/fetchJSON';

const UserContext = createContext(null);

// Where the auth API lives. Works for prod (/auth/*) or a worker URL via env.
const AUTH_BASE =
  (process.env.REACT_APP_AUTH_API_URL?.replace(/\/+$/, '') || '/auth');

export function UserProvider({ children }) {
  const [loading, setLoading] = useState(!FEATURE.previewBypassAuth);
  const [user, setUser] = useState(null);
  const [entitlement, setEntitlement] = useState({ betaAccess: false, dailyQuota: 40 });

  // minimal shape helpers expected across the app
  const isAuthenticated = !!user;
  const isPro = !!user?.isPro || !!user?.user_metadata?.isPro;
  const hasBetaAccess = !!entitlement?.betaAccess;

  // Fetch user data - simplified to avoid server calls
  const fetchUser = useCallback(async () => {
    dbg('🔍 UserContext: fetchUser called (using local token check)');
    // Use AuthContext for user state - no server calls
    setUser(null); // Let AuthContext handle auth
    setEntitlement({ betaAccess: false, dailyQuota: 40 }); // Default to free tier
    
    setLoading(false);
  }, []);

  // Fetch entitlement data - removed server calls
  const fetchEntitlement = useCallback(async () => {
    dbg('🔍 UserContext: fetchEntitlement called (using local defaults)');
    // Default to free tier - no server calls needed
    setEntitlement({ betaAccess: false, dailyQuota: 40 });
  }, []);

  // Boot: ask backend who we are (JWT-based)
  useEffect(() => {
    (async () => {
      // Dev shortcut: don't block the UI while backend is flaky
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_AUTH_BYPASS === 'true') {
        dbg('🔧 UserContext: Auth bypassed in development mode');
        // Lightweight dev user so pages don't explode
        setUser({ email: 'dev@local', isPro: true });
        setLoading(false);
        return;
      }

      if (FEATURE.previewBypassAuth) {
        console.info('🟩 Preview: UserContext short‑circuit enabled');
        setUser({ id: 'preview', email: null, isPro: true, mode: 'preview' });
        setLoading(false);
        return;
      }
      
      // Use AuthContext for user state - no server calls
      setUser(null);
      setLoading(false);
    })();
  }, []);

  // Listen for auth success events (from LoginSuccess component) 
  useEffect(() => {
    if (FEATURE.previewBypassAuth) return;
    
    const handleAuthSuccess = async () => {
      // Use AuthContext for user state - no server calls
      setUser(null);
    };

    window.addEventListener('auth-success', handleAuthSuccess);
    return () => {
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []);

  const logout = useCallback(async () => {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_AUTH_BYPASS === 'true') {
      dbg('🔧 UserContext: Logout bypassed in development mode');
      setUser(null);
      return;
    }
    await fetchJSON(`${AUTH_BASE}/logout`, { method: 'POST' });
    setUser(null);
  }, []);

  // Some places use referralLink, etc. Keep harmless fallbacks.
  const referralLink = user?.referralLink || null;
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isPro,
    hasBetaAccess,
    entitlement,
    referralLink,
    setUser,         // allow pages to update after verify/login-success
    fetchEntitlement, // allow manual entitlement refresh after payment
    logout,
  }), [user, loading, isAuthenticated, isPro, hasBetaAccess, entitlement, referralLink, fetchEntitlement, logout]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    // Make it noisy in dev, quiet in prod
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('useUser() used outside <UserProvider>. Wrap your app root.');
    }
    // Return safe fallbacks to avoid hard crashes
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      isPro: false,
      hasBetaAccess: false,
      entitlement: { betaAccess: false, dailyQuota: 40 },
      referralLink: null,
      setUser: () => {},
      fetchEntitlement: () => {},
      logout: () => {},
    };
  }
  return ctx;
}