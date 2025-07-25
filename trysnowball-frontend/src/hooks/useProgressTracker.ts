/**
 * Progress Tracker Hook
 * React hook for managing debt tracking and progress monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { progressTracker } from '../services/progressTracker';
import {
  User, Debt, DebtSnapshot, UserProgress, Milestone,
  DebtType, FocusArea, getMonthKey
} from '../types/database';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useProgressTracker = (userId: string) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [snapshots, setSnapshots] = useState<DebtSnapshot[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadUserData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [
        userData,
        debtsData,
        snapshotsData,
        progressData,
        milestonesData
      ] = await Promise.all([
        progressTracker.getUser(userId),
        progressTracker.getDebts(userId),
        progressTracker.getSnapshots(userId),
        progressTracker.getUserProgress(userId),
        progressTracker.getMilestones(userId)
      ]);

      setUser(userData);
      setDebts(debtsData);
      setSnapshots(snapshotsData);
      setUserProgress(progressData);
      setMilestones(milestonesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ============================================================================
  // DEBT OPERATIONS
  // ============================================================================

  const createDebt = useCallback(async (debtData: Omit<Debt, 'debtId' | 'createdAt' | 'userId'>) => {
    try {
      setError(null);
      const newDebt = await progressTracker.createDebt({
        ...debtData,
        userId
      });
      
      setDebts(prev => [...prev, newDebt]);
      return newDebt;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create debt';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [userId]);

  const updateDebt = useCallback(async (debtId: string, updates: Partial<Debt>) => {
    try {
      setError(null);
      const updatedDebt = await progressTracker.updateDebt(debtId, updates);
      
      if (updatedDebt) {
        setDebts(prev => prev.map(debt => 
          debt.debtId === debtId ? updatedDebt : debt
        ));
      }
      
      return updatedDebt;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update debt';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const deleteDebt = useCallback(async (debtId: string) => {
    try {
      setError(null);
      const success = await progressTracker.deleteDebt(debtId);
      
      if (success) {
        setDebts(prev => prev.map(debt => 
          debt.debtId === debtId ? { ...debt, isActive: false } : debt
        ));
      }
      
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete debt';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // ============================================================================
  // SNAPSHOT OPERATIONS
  // ============================================================================

  const recordPayment = useCallback(async (
    debtId: string,
    amount: number,
    extraPayment: number = 0,
    month?: string
  ) => {
    try {
      setError(null);
      const targetMonth = month || getMonthKey();
      const debt = debts.find(d => d.debtId === debtId);
      
      if (!debt) {
        throw new Error('Debt not found');
      }

      // Get previous snapshot to calculate new balance
      const previousSnapshots = await progressTracker.getSnapshots(userId, debtId);
      const previousSnapshot = previousSnapshots
        .sort((a, b) => a.month.localeCompare(b.month))
        .pop();

      const previousBalance = previousSnapshot?.balance || debt.limit;
      const interestCharged = (previousBalance * debt.interestRate / 100) / 12;
      const newBalance = Math.max(0, previousBalance + interestCharged - amount);

      const snapshot = await progressTracker.createSnapshot({
        userId,
        debtId,
        month: targetMonth,
        balance: newBalance,
        extraPayment,
        autoMinPayment: amount >= debt.minPayment,
        actualPayment: amount,
        interestCharged
      });

      setSnapshots(prev => [...prev.filter(s => 
        !(s.debtId === debtId && s.month === targetMonth)
      ), snapshot]);

      // Check for milestones
      const newMilestones = await progressTracker.checkForNewMilestones(userId, debtId);
      if (newMilestones.length > 0) {
        setMilestones(prev => [...prev, ...newMilestones]);
      }

      // Update progress summary
      await updateProgressSummary(targetMonth);

      return snapshot;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record payment';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [userId, debts]);

  const updateProgressSummary = useCallback(async (month?: string) => {
    try {
      const targetMonth = month || getMonthKey();
      const progressSummary = await progressTracker.createProgressSnapshot(userId, targetMonth);
      
      setUserProgress(prev => [...prev.filter(p => p.month !== targetMonth), progressSummary]);
      
      return progressSummary;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [userId]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const activeDebts = debts.filter(debt => debt.isActive);
  
  const currentBalance = snapshots
    .filter(s => s.month === getMonthKey())
    .reduce((sum, s) => sum + s.balance, 0);

  const totalMinPayments = activeDebts
    .reduce((sum, debt) => sum + debt.minPayment, 0);

  const latestProgress = userProgress
    .sort((a, b) => b.month.localeCompare(a.month))[0];

  const recentMilestones = milestones
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, 5);

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  const getDebtSummary = useCallback(async () => {
    return await progressTracker.getDebtSummary(userId);
  }, [userId]);

  const getProgressTrend = useCallback(async (months: number = 6) => {
    return await progressTracker.getProgressTrend(userId, months);
  }, [userId]);

  const getSnapshotHistory = useCallback(async (debtId: string, months: number = 12) => {
    return await progressTracker.getSnapshotHistory(userId, debtId, months);
  }, [userId]);

  // ============================================================================
  // RETURN OBJECT
  // ============================================================================

  return {
    // State
    user,
    debts,
    activeDebts,
    snapshots,
    userProgress,
    milestones,
    loading,
    error,

    // Computed values
    currentBalance,
    totalMinPayments,
    latestProgress,
    recentMilestones,

    // Debt operations
    createDebt,
    updateDebt,
    deleteDebt,

    // Snapshot operations
    recordPayment,
    updateProgressSummary,

    // Analytics
    getDebtSummary,
    getProgressTrend,
    getSnapshotHistory,

    // Utilities
    refresh: loadUserData,
    clearError: () => setError(null)
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for tracking a specific debt
 */
export const useDebtTracker = (userId: string, debtId: string) => {
  const { debts, snapshots, recordPayment, getSnapshotHistory } = useProgressTracker(userId);
  
  const debt = debts.find(d => d.debtId === debtId);
  const debtSnapshots = snapshots.filter(s => s.debtId === debtId);
  const latestSnapshot = debtSnapshots
    .sort((a, b) => a.month.localeCompare(b.month))
    .pop();

  const currentBalance = latestSnapshot?.balance || debt?.limit || 0;
  const lastPayment = latestSnapshot?.actualPayment || 0;
  const isPayingMinimum = lastPayment >= (debt?.minPayment || 0);

  return {
    debt,
    currentBalance,
    lastPayment,
    isPayingMinimum,
    snapshots: debtSnapshots,
    latestSnapshot,
    recordPayment: (amount: number, extraPayment?: number, month?: string) => 
      recordPayment(debtId, amount, extraPayment, month),
    getHistory: (months?: number) => getSnapshotHistory(debtId, months)
  };
};

/**
 * Hook for milestone tracking
 */
export const useMilestones = (userId: string) => {
  const { milestones, loading, error } = useProgressTracker(userId);

  const milestonesByType = milestones.reduce((acc, milestone) => {
    acc[milestone.type] = acc[milestone.type] || [];
    acc[milestone.type].push(milestone);
    return acc;
  }, {} as Record<string, Milestone[]>);

  const totalValue = milestones.reduce((sum, m) => sum + (m.value || 0), 0);
  
  const thisMonthMilestones = milestones.filter(m => 
    m.achievedAt.startsWith(getMonthKey())
  );

  return {
    milestones,
    milestonesByType,
    totalValue,
    thisMonthMilestones,
    loading,
    error
  };
};