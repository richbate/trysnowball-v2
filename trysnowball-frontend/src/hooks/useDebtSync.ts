/**
 * CP-1: Debt Sync Hook (Stub)
 * 
 * Prepares the path for cloud sync but initially operates as no-op.
 * This will be expanded in a future CP for full cloud sync.
 */

import { useState, useCallback, useEffect } from 'react';
import { localDebtStore } from '../data/localDebtStore';

export type SyncStatus = 
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'offline';

export interface SyncResult {
  success: boolean;
  timestamp?: string;
  error?: string;
  itemsSynced?: number;
}

/**
 * Hook for managing debt data synchronization
 * Currently a stub - will be expanded for cloud sync
 */
export function useDebtSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load last sync time on mount
  useEffect(() => {
    localDebtStore.getMeta('last_sync_time').then(time => {
      if (time) {
        setLastSync(time);
      }
    });
  }, []);

  /**
   * Trigger manual sync
   * Currently no-op, will connect to cloud API later
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    console.log('[DebtSync] Manual sync triggered (currently no-op)');
    
    setStatus('syncing');
    setError(null);

    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Future: This will actually sync with cloud
      // const debts = await localDebtStore.listDebts();
      // const response = await api.syncDebts(debts);
      
      const timestamp = new Date().toISOString();
      
      // Store sync metadata
      await localDebtStore.setMeta('last_sync_time', timestamp);
      
      setStatus('success');
      setLastSync(timestamp);

      // Track analytics
      trackSyncEvent('manual_sync_success', {
        timestamp,
        status: 'stub'
      });

      return {
        success: true,
        timestamp,
        itemsSynced: 0 // Will be actual count when implemented
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      
      setStatus('error');
      setError(errorMessage);

      trackSyncEvent('manual_sync_error', {
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Enable auto-sync
   * Currently no-op, will set up periodic sync later
   */
  const enableAutoSync = useCallback(async (intervalMinutes = 5): Promise<void> => {
    console.log(`[DebtSync] Auto-sync requested every ${intervalMinutes} minutes (currently no-op)`);
    
    await localDebtStore.setMeta('auto_sync_enabled', true);
    await localDebtStore.setMeta('auto_sync_interval', intervalMinutes);

    trackSyncEvent('auto_sync_enabled', {
      interval_minutes: intervalMinutes
    });

    // Future: Set up actual interval
    // if (syncInterval) clearInterval(syncInterval);
    // syncInterval = setInterval(() => syncNow(), intervalMinutes * 60 * 1000);
  }, []);

  /**
   * Disable auto-sync
   */
  const disableAutoSync = useCallback(async (): Promise<void> => {
    console.log('[DebtSync] Auto-sync disabled');
    
    await localDebtStore.setMeta('auto_sync_enabled', false);

    trackSyncEvent('auto_sync_disabled', {});

    // Future: Clear interval
    // if (syncInterval) clearInterval(syncInterval);
  }, []);

  /**
   * Check if we're online
   */
  const isOnline = useCallback((): boolean => {
    return navigator.onLine;
  }, []);

  /**
   * Get sync metadata
   */
  const getSyncInfo = useCallback(async () => {
    const [
      lastSyncTime,
      autoSyncEnabled,
      autoSyncInterval,
      syncCount
    ] = await Promise.all([
      localDebtStore.getMeta('last_sync_time'),
      localDebtStore.getMeta('auto_sync_enabled'),
      localDebtStore.getMeta('auto_sync_interval'),
      localDebtStore.getMeta('sync_count')
    ]);

    return {
      lastSyncTime,
      autoSyncEnabled: autoSyncEnabled || false,
      autoSyncInterval: autoSyncInterval || 5,
      syncCount: syncCount || 0,
      isOnline: isOnline()
    };
  }, [isOnline]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[DebtSync] Back online');
      setStatus('idle');
      
      // Future: Trigger sync when coming back online
      // if (autoSyncEnabled) syncNow();
    };

    const handleOffline = () => {
      console.log('[DebtSync] Gone offline');
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    if (!navigator.onLine) {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // State
    status,
    lastSync,
    error,
    isOnline: isOnline(),

    // Actions
    syncNow,
    enableAutoSync,
    disableAutoSync,
    getSyncInfo
  };
}

/**
 * Track sync events for analytics
 */
function trackSyncEvent(event: string, properties: Record<string, any>): void {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties);
    }

    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, {
        ...properties,
        source: 'useDebtSync'
      });
    }
  } catch {
    // Silently fail analytics
  }
}