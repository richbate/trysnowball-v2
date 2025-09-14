/**
 * useZombieSessionDetector
 * Detects and manages zombie session states where auth is lost but data persists
 * Provides recovery UI and tracking for session health
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserDebts } from './useUserDebts';
import { clearToken } from '../utils/tokenStorage';

interface ZombieSessionState {
 isZombie: boolean;
 showModal: boolean;
 dismissedThisSession: boolean;
 lastAuthTimestamp: number | null;
 localDataCount: number;
 recoveryInProgress: boolean;
}

interface ZombieSessionActions {
 dismissModal: () => void;
 continueOffline: () => void;
 initiateReauth: () => void;
 reset: () => void;
}

export function useZombieSessionDetector(): [ZombieSessionState, ZombieSessionActions] {
 const { isAuthenticated, user, refreshAuth } = useAuth();
 const { debts } = useUserDebts();
 
 // Session-persistent dismissal flag (survives component unmounts, not page reload)
 const dismissedRef = useRef(false);
 const lastAuthTimestampRef = useRef<number | null>(null);
 const hasTrackedRef = useRef(false);
 
 const [state, setState] = useState<ZombieSessionState>({
  isZombie: false,
  showModal: false,
  dismissedThisSession: dismissedRef.current,
  lastAuthTimestamp: null,
  localDataCount: 0,
  recoveryInProgress: false,
 });

 // Track successful auth timestamp
 useEffect(() => {
  if (isAuthenticated && user) {
   lastAuthTimestampRef.current = Date.now();
   setState(prev => ({ ...prev, lastAuthTimestamp: Date.now() }));
  }
 }, [isAuthenticated, user]);

 // Main zombie detection logic
 useEffect(() => {
  const hasLocalData = debts.length > 0;
  const isZombie = !isAuthenticated && hasLocalData && !dismissedRef.current;
  
  if (isZombie && !state.isZombie) {
   console.warn('🧟 Zombie session detected:', {
    authenticated: false,
    localDebts: debts.length,
    lastAuth: lastAuthTimestampRef.current 
     ? new Date(lastAuthTimestampRef.current).toISOString() 
     : 'never',
   });
   
   // Track detection event once per zombie state
   if (!hasTrackedRef.current && typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('zombie_session_detected', {
     debt_count: debts.length,
     last_auth_timestamp: lastAuthTimestampRef.current,
     time_since_auth: lastAuthTimestampRef.current 
      ? Date.now() - lastAuthTimestampRef.current 
      : null,
    });
    hasTrackedRef.current = true;
   }
   
   setState(prev => ({
    ...prev,
    isZombie: true,
    showModal: true,
    localDataCount: debts.length,
   }));
  } else if (!isZombie && state.isZombie) {
   // Recovery detected - user re-authenticated
   console.log('✅ Zombie session recovered - auth restored');
   
   if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('zombie_session_recovered', {
     recovery_method: 'reauth',
     debt_count: debts.length,
    });
   }
   
   // Reset zombie state
   setState(prev => ({
    ...prev,
    isZombie: false,
    showModal: false,
    recoveryInProgress: false,
   }));
   dismissedRef.current = false;
   hasTrackedRef.current = false;
   
   // Trigger data resync
   window.dispatchEvent(new CustomEvent('zombie-recovery-complete'));
  }
 }, [isAuthenticated, debts.length, state.isZombie]);

 // Listen for 401 errors from fetch operations
 useEffect(() => {
  const handle401 = (event: CustomEvent) => {
   if (!dismissedRef.current && !state.showModal) {
    console.warn('🧟 Zombie session triggered by 401 response');
    
    if (typeof window !== 'undefined' && (window as any).posthog) {
     (window as any).posthog.capture('zombie_session_backend_401', {
      endpoint: event.detail?.endpoint,
      authenticated_state: isAuthenticated,
     });
    }
    
    setState(prev => ({
     ...prev,
     isZombie: true,
     showModal: true,
     localDataCount: debts.length,
    }));
   }
  };

  window.addEventListener('auth-401-detected' as any, handle401);
  return () => window.removeEventListener('auth-401-detected' as any, handle401);
 }, [isAuthenticated, debts.length, state.showModal]);

 // Action handlers
 const actions: ZombieSessionActions = {
  dismissModal: () => {
   dismissedRef.current = true;
   setState(prev => ({ 
    ...prev, 
    showModal: false, 
    dismissedThisSession: true 
   }));
   
   if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('zombie_session_dismissed');
   }
  },
  
  continueOffline: () => {
   dismissedRef.current = true;
   setState(prev => ({ 
    ...prev, 
    showModal: false, 
    dismissedThisSession: true 
   }));
   
   if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('zombie_session_offline_chosen', {
     debt_count: debts.length,
    });
   }
   
   // Set offline mode flag
   sessionStorage.setItem('offline-mode', 'true');
  },
  
  initiateReauth: () => {
   setState(prev => ({ ...prev, recoveryInProgress: true }));
   
   if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('zombie_session_relogin_clicked', {
     debt_count: debts.length,
    });
   }
   
   // Clear all auth data and redirect to login
   clearToken();
   sessionStorage.clear();
   window.location.href = '/auth/login';
  },
  
  reset: () => {
   dismissedRef.current = false;
   hasTrackedRef.current = false;
   setState({
    isZombie: false,
    showModal: false,
    dismissedThisSession: false,
    lastAuthTimestamp: lastAuthTimestampRef.current,
    localDataCount: 0,
    recoveryInProgress: false,
   });
  },
 };

 return [state, actions];
}