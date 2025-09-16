import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '../utils/tokenStorage';
import { IS_PREVIEW } from '../utils/env';
import { fetchLocalUser, fetchLocalEntitlement } from '../lib/authLocal.ts';

// Auth mode: 'cloudflare' for real auth, 'local' for bypass
type AuthMode = 'cloudflare' | 'local';
const MODE = process.env.REACT_APP_AUTH_MODE?.toLowerCase();
const AUTH_MODE: AuthMode =
  MODE === 'cloudflare' || MODE === 'local'
    ? MODE
    : (process.env.NODE_ENV === 'production' ? 'cloudflare' : 'local'); // default: prod→cloudflare, dev→local

interface User {
  id: string;
  email: string;
  isPro?: boolean;
}

interface Entitlement {
  isPro: boolean;
  plan?: 'pro' | 'free';
  betaAccess?: boolean;
  dailyQuota?: number;
}

interface AuthContextType {
  authReady: boolean;
  user: User | null;
  isAuthed: boolean;
  entitlement: Entitlement;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authReady: false,
  user: null,
  isAuthed: false,
  entitlement: { isPro: false, plan: 'free' },
  logout: async () => {},
  refreshAuth: async () => {},
});

// API base URL for dev proxy
const API_BASE = process.env.REACT_APP_API_BASE ?? '';
const api = (path: string, init?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { credentials: 'include', ...init });

// Fallback helper with prod logging
function fallbackToFree(reason: string, context: string) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[auth] falling back to free (${context}):`, reason);
    // TODO: track('auth_fallback_free', { reason, context });
  }
  return { isPro: false, plan: 'free' as const };
}

// Fetcher functions with safe fallbacks
async function fetchMe(): Promise<{ user: User | null }> {
  if (AUTH_MODE !== 'cloudflare') return { user: null };
  
  try {
    const user = await fetchLocalUser();
    return { user };
  } catch (e) {
    console.warn('[Auth] fetchMe error:', e);
    return { user: null };
  }
}

async function fetchEntitlement(): Promise<Entitlement> {
  if (AUTH_MODE !== 'cloudflare') return fallbackToFree('local mode', 'fetchEntitlement');
  
  try {
    const entitlement = await fetchLocalEntitlement();
    return {
      isPro: entitlement.isPro,
      plan: entitlement.plan as 'pro' | 'free',
      betaAccess: entitlement.betaAccess,
      dailyQuota: entitlement.dailyQuota,
    };
  } catch (e) {
    console.warn('[Auth] fetchEntitlement error:', e);
    return fallbackToFree(e instanceof Error ? e.message : 'fetch error', 'fetchEntitlement');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ 
    authReady: boolean; 
    user: User | null;
    entitlement: Entitlement;
  }>({
    authReady: false,
    user: null,
    entitlement: { isPro: false, plan: 'free' },
  });

  const refreshAuth = async () => {
    try {
      console.log(`[Auth] Refreshing auth (mode: ${AUTH_MODE})`);
      
      // Fetch user and entitlement in parallel
      const [userResponse, entitlement] = await Promise.all([
        fetchMe(),
        fetchEntitlement()
      ]);
      
      setState({
        authReady: true,
        user: userResponse.user,
        entitlement,
      });
    } catch (error) {
      console.warn('[Auth] Refresh error:', error);
      setState({
        authReady: true,
        user: null,
        entitlement: { isPro: false, plan: 'free' },
      });
    }
  };

  useEffect(() => {
    const isTestRoute = window.location.pathname.startsWith('/dev/local-test');
    const isBypassed = isTestRoute || (window as any).__DISABLE_AUTH__ || AUTH_MODE === 'local';

    // In these cases we don't hit the network at all
    if (isBypassed) {
      console.log('🔧 Auth bypass active (local mode or test route).');
      setState({ 
        authReady: true, 
        user: null,
        entitlement: { isPro: false, plan: 'free' }
      });
      return;
    }

    const initAuth = async () => {
      try {
        // Preview must not call cross-origin creds; treat as anon
        if (IS_PREVIEW) {
          console.log('🔧 AuthContext: Preview detected, skipping auth');
          setState({ 
            authReady: true, 
            user: null,
            entitlement: { isPro: false, plan: 'free' }
          });
          return;
        }

        await refreshAuth();
      } catch (error) {
        console.warn('Auth init error:', error);
        setState({ 
          authReady: true, 
          user: null,
          entitlement: { isPro: false, plan: 'free' }
        });
      }
    };

    // If we're on /auth/success with a token, wait for LoginSuccess to signal
    const isAuthSuccess =
      window.location.pathname === '/auth/success' && window.location.search.includes('token=');

    if (isAuthSuccess) {
      console.log('AuthContext: On /auth/success with token, waiting for LoginSuccess…');
      setState({ 
        authReady: true, 
        user: null,
        entitlement: { isPro: false, plan: 'free' }
      }); // Don't block UI

      const handleAuthSuccess = () => {
        console.log('AuthContext: Received auth-success event, refreshing auth…');
        refreshAuth().catch(err => console.warn('Auth refresh error:', err));
      };

      window.addEventListener('auth-success', handleAuthSuccess);
      return () => window.removeEventListener('auth-success', handleAuthSuccess);
    }

    initAuth().catch(err => console.warn('Auth init error:', err));
  }, []);

  const logout = async () => {
    const isTestRoute = window.location.pathname.startsWith('/dev/local-test');
    const isBypassed = isTestRoute || (window as any).__DISABLE_AUTH__ || AUTH_MODE === 'local';

    if (isBypassed) {
      console.log('🔧 Logout bypassed (local mode or test route).');
      setState((s) => ({ ...s, user: null, entitlement: { isPro: false, plan: 'free' } }));
      return;
    }

    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('Logout call failed (ignored in UI):', e);
    }
    setState((s) => ({ ...s, user: null, entitlement: { isPro: false, plan: 'free' } }));
  };

  const contextValue: AuthContextType = {
    ...state,
    isAuthed: !!state.user,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);