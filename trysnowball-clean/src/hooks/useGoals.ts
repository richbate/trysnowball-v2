/**
 * CP-5 Goals Hook
 * Manages goal state with live API persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { goalsApi, Goal, CreateGoalRequest, UpdateGoalRequest } from '../api/goalsApi';
import { Goal as LocalGoal } from '../types/NewGoals';
import { authToken } from '../lib/authToken';
import { useUserTier } from './useUserTier';

// Convert API Goal to local Goal type
function apiToLocal(apiGoal: Goal): LocalGoal {
  return {
    id: apiGoal.id,
    type: apiGoal.type,
    targetValue: apiGoal.target_value,
    currentValue: apiGoal.current_value || 0,
    forecastDebtId: apiGoal.forecast_debt_id,
    createdAt: apiGoal.created_at,
    completedAt: apiGoal.completed_at,
    dismissed: apiGoal.dismissed === 1,
  };
}

// Convert local Goal to API format
function localToApi(localGoal: Partial<LocalGoal>): CreateGoalRequest {
  return {
    type: localGoal.type as 'debt_clear' | 'interest_saved' | 'time_saved',
    target_value: localGoal.targetValue || 0,
    forecast_debt_id: localGoal.forecastDebtId,
  };
}

interface UseGoalsReturn {
  goals: LocalGoal[];
  loading: boolean;
  error: string | null;
  createGoal: (goal: Partial<LocalGoal>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<LocalGoal>) => Promise<void>;
  dismissGoal: (id: string) => Promise<void>;
  syncProgress: (id: string, currentValue: number, completed?: boolean) => Promise<void>;
  refreshGoals: () => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<LocalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isPro, isAuthenticated } = useUserTier();

  // Check if user can use API persistence
  const canUseApi = useCallback(() => {
    return isAuthenticated && isPro;
  }, [isAuthenticated, isPro]);

  // Load goals from API
  const loadGoals = useCallback(async () => {
    if (!canUseApi()) {
      // Free users or unauthenticated - use localStorage
      const storageKey = isAuthenticated ? 'free_goals' : 'demo_goals';
      const stored = localStorage.getItem(storageKey);
      setGoals(stored ? JSON.parse(stored) : []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiGoals = await goalsApi.listGoals();
      setGoals(apiGoals.map(apiToLocal));
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      setError(err.message);
      // Fallback to localStorage on error
      const storageKey = isAuthenticated ? 'free_goals' : 'demo_goals';
      const stored = localStorage.getItem(storageKey);
      setGoals(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  }, [canUseApi, isAuthenticated]);

  // Create new goal
  const createGoal = useCallback(async (goal: Partial<LocalGoal>) => {
    if (!canUseApi()) {
      // Free/demo mode - save to localStorage with limits
      const storageKey = isAuthenticated ? 'free_goals' : 'demo_goals';
      const maxGoals = isAuthenticated ? 3 : 3; // Free users get 3 goals max
      
      if (goals.length >= maxGoals) {
        throw new Error(`Free users are limited to ${maxGoals} goals. Upgrade to Pro for unlimited goals.`);
      }
      
      const newGoal: LocalGoal = {
        id: crypto.randomUUID(),
        type: goal.type || 'debt_clear',
        targetValue: goal.targetValue || 0,
        currentValue: 0,
        forecastDebtId: goal.forecastDebtId,
        createdAt: new Date().toISOString(),
        dismissed: false,
      };
      const updated = [...goals, newGoal];
      setGoals(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return;
    }

    try {
      const apiRequest = localToApi(goal);
      const result = await goalsApi.createGoal(apiRequest);
      
      // Add new goal to state
      const newGoal: LocalGoal = {
        ...goal,
        id: result.id,
        type: goal.type || 'debt_clear',
        targetValue: goal.targetValue || 0,
        currentValue: 0,
        createdAt: result.created_at,
        dismissed: false,
      };
      setGoals(prev => [...prev, newGoal]);
      
      // Track analytics (pro users only)
      console.log('[PostHog] goal_created', { 
        goal_id: result.id, 
        type: goal.type,
        target_value: goal.targetValue,
        user_tier: 'pro'
      });
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      setError(err.message);
      throw err;
    }
  }, [goals, canUseApi, isAuthenticated]);

  // Update goal
  const updateGoal = useCallback(async (id: string, updates: Partial<LocalGoal>) => {
    if (!canUseApi()) {
      // Free/demo mode
      const storageKey = isAuthenticated ? 'free_goals' : 'demo_goals';
      const updated = goals.map(g => 
        g.id === id ? { ...g, ...updates } : g
      );
      setGoals(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return;
    }

    try {
      const apiUpdates: UpdateGoalRequest = {};
      
      if (updates.currentValue !== undefined) {
        apiUpdates.current_value = updates.currentValue;
      }
      if (updates.completedAt !== undefined) {
        apiUpdates.completed_at = updates.completedAt;
      }
      if (updates.dismissed !== undefined) {
        apiUpdates.dismissed = updates.dismissed;
      }
      
      await goalsApi.updateGoal(id, apiUpdates);
      
      // Update local state
      setGoals(prev => prev.map(g => 
        g.id === id ? { ...g, ...updates } : g
      ));
      
      // Track analytics (pro users only)
      if (updates.completedAt) {
        console.log('[PostHog] goal_completed', { goal_id: id, user_tier: 'pro' });
      }
    } catch (err: any) {
      console.error('Failed to update goal:', err);
      setError(err.message);
      throw err;
    }
  }, [goals, canUseApi, isAuthenticated]);

  // Dismiss goal
  const dismissGoal = useCallback(async (id: string) => {
    if (!canUseApi()) {
      // Free/demo mode
      const storageKey = isAuthenticated ? 'free_goals' : 'demo_goals';
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return;
    }

    try {
      await goalsApi.dismissGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      
      // Track analytics (pro users only)
      console.log('[PostHog] goal_dismissed', { goal_id: id, user_tier: 'pro' });
    } catch (err: any) {
      console.error('Failed to dismiss goal:', err);
      setError(err.message);
      throw err;
    }
  }, [goals, canUseApi, isAuthenticated]);

  // Sync progress from forecast
  const syncProgress = useCallback(async (
    id: string, 
    currentValue: number, 
    completed: boolean = false
  ) => {
    const updates: Partial<LocalGoal> = {
      currentValue,
      ...(completed && { completedAt: new Date().toISOString() })
    };
    
    await updateGoal(id, updates);
  }, [updateGoal]);

  // Refresh goals
  const refreshGoals = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  // Load goals on mount
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    dismissGoal,
    syncProgress,
    refreshGoals,
  };
}