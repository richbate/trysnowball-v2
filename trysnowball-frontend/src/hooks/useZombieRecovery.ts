/**
 * useZombieRecovery - Auto-resync after zombie session recovery
 * Handles data synchronization when user re-authenticates after zombie state
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserDebts } from './useUserDebts';

export function useZombieRecovery() {
 const { isAuthenticated, user } = useAuth();
 const { debts, refreshDebts } = useUserDebts();
 
 const wasZombieRef = useRef(false);
 const resyncInProgressRef = useRef(false);

 // Listen for zombie recovery completion
 useEffect(() => {
  const handleZombieRecovery = async () => {
   if (resyncInProgressRef.current) return;
   
   console.log('🔄 Starting zombie recovery resync...');
   resyncInProgressRef.current = true;
   
   try {
    // Track recovery initiation
    if (typeof window !== 'undefined' && (window as any).posthog) {
     (window as any).posthog.capture('zombie_recovery_resync_started', {
      local_debt_count: debts.length,
      user_id: user?.id,
     });
    }

    // Force refresh from server to restore cloud sync
    await refreshDebts();
    
    console.log('✅ Zombie recovery resync complete');
    
    // Track successful recovery
    if (typeof window !== 'undefined' && (window as any).posthog) {
     (window as any).posthog.capture('zombie_recovery_resync_success', {
      debt_count_after: debts.length,
      user_id: user?.id,
     });
    }
    
    // Show success notification
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('sync-restored'));
    }
    
   } catch (error) {
    console.error('❌ Zombie recovery resync failed:', error);
    
    if (typeof window !== 'undefined' && (window as any).posthog) {
     (window as any).posthog.capture('zombie_recovery_resync_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: user?.id,
     });
    }
   } finally {
    resyncInProgressRef.current = false;
   }
  };

  window.addEventListener('zombie-recovery-complete', handleZombieRecovery);
  return () => window.removeEventListener('zombie-recovery-complete', handleZombieRecovery);
 }, [debts.length, user?.id, refreshDebts]);

 // Detect transition from unauthenticated to authenticated (potential recovery)
 useEffect(() => {
  if (!isAuthenticated) {
   wasZombieRef.current = true;
  } else if (wasZombieRef.current && isAuthenticated && user) {
   // User just re-authenticated after being logged out
   console.log('👤 User re-authenticated - checking for zombie recovery...');
   
   // Check if we have local data that needs to be resynced
   const hasLocalData = debts.length > 0;
   const wasOffline = sessionStorage.getItem('offline-mode') === 'true';
   
   if (hasLocalData || wasOffline) {
    console.log('🔄 Triggering automatic resync after re-authentication');
    window.dispatchEvent(new CustomEvent('zombie-recovery-complete'));
   }
   
   // Clear offline mode flag
   sessionStorage.removeItem('offline-mode');
   wasZombieRef.current = false;
  }
 }, [isAuthenticated, user, debts.length]);

 return {
  isRecovering: resyncInProgressRef.current,
 };
}