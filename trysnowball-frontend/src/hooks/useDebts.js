/**
 * React hook for debt management - CP-1 Safe Version with Demo Mode Support
 * Uses async facade methods, never touches internal state
 */

import { useEffect, useState, useCallback } from 'react';
import { debtsManager } from '../lib/debtsManager';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useDebtMigration } from '../migrations/useDebtMigration';
import { toDebtArray, normalizeMetrics } from '../utils/debts';
import { useDemoMode } from '../providers/DemoModeProvider';
import { useDemoDebts } from './demo/useDemoDebts';

const INIT_METRICS = normalizeMetrics(null);

export const useDebts = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const demoData = useDemoDebts();
  
  const [list, setList] = useState([]);
  const [metrics, setMetrics] = useState(INIT_METRICS);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [error, setError] = useState(null);

  // Always call custom hooks unconditionally
  useDebtMigration();

  const refresh = useCallback(() => setRefreshNonce(n => n + 1), []);

  // Load data effect - triggers on auth changes and refresh
  useEffect(() => {
    // Skip loading real data if in demo mode
    if (isDemo) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get data and metrics via safe facade methods
        const data = await debtsManager.getData();
        if (cancelled) return;

        setList(toDebtArray(data?.debts));
        
        const m = await debtsManager.getMetrics();
        if (cancelled) return;

        setMetrics(normalizeMetrics(m));
      } catch (err) {
        if (!cancelled) {
          console.error('[useDebts] Load error:', err);
          setError(err);
          setList([]);
          setMetrics(INIT_METRICS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    
    return () => { cancelled = true; };
  }, [refreshNonce, user?.id, isDemo]);

  // Async operation wrapper
  const handleAsync = useCallback(async (operation) => {
    try {
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      console.error('[useDebts] Operation error:', err);
      setError(err);
      throw err;
    }
  }, []);

  // Data operations - all trigger refresh after completion
  const loadDemoData = useCallback(async (locale = 'uk') => {
    return handleAsync(async () => {
      const result = await debtsManager.loadDemoData(locale);
      refresh(); // UI decides when to refresh
      return result;
    });
  }, [handleAsync, refresh]);

  const clearAllData = useCallback(async () => {
    return handleAsync(async () => {
      const result = await debtsManager.clearAllData();
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  const addDebt = useCallback(async (debt) => {
    return handleAsync(async () => {
      const result = await debtsManager.saveDebt(debt);
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  const updateDebt = useCallback(async (debt) => {
    return handleAsync(async () => {
      const result = await debtsManager.saveDebt(debt);
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  const deleteDebt = useCallback(async (id) => {
    return handleAsync(async () => {
      const result = await debtsManager.deleteDebt(id);
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  const saveDebt = useCallback(async (debt) => {
    return handleAsync(async () => {
      const result = await debtsManager.saveDebt(debt);
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  const reorderDebts = useCallback(async (reorderedDebts) => {
    return handleAsync(async () => {
      const result = await debtsManager.reorderDebts(reorderedDebts);
      refresh();
      return result;
    });
  }, [handleAsync, refresh]);

  // Computed values from metrics
  const totalDebt = metrics?.totalDebt || 0;
  const totalMinPayments = metrics?.totalMinPayments || 0;
  const debtCount = metrics?.count || 0;

  // Return demo data if in demo mode
  if (isDemo) {
    return demoData;
  }

  // Return real data if not in demo mode
  return {
    // Data
    debts: list,
    metrics,
    
    // Computed
    totalDebt,
    totalMinPayments,
    debtCount,

    // State
    loading,
    error,

    // Operations
    addDebt,
    updateDebt,
    deleteDebt,
    saveDebt,
    reorderDebts,
    loadDemoData,
    clearAllData,
    refresh,

    // Utilities  
    handleAsync,
  };
};