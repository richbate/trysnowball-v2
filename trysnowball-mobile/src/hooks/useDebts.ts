import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  minimumPayment: number;
  interestRate: number;
  order?: number;
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  createdAt?: string;
  updatedAt?: string;
}

interface DebtsStore {
  debts: Debt[];
  loading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  syncing: boolean;
  
  // Local state management
  setDebts: (debts: Debt[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSyncing: (syncing: boolean) => void;
  
  // Cloud sync operations
  syncWithCloud: (force?: boolean) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Demo data fallback
  loadDemoData: () => void;
}

// Create persistent store with AsyncStorage
const useDebtsStore = create<DebtsStore>()(
  persist(
    (set, get) => ({
      debts: [],
      loading: false,
      error: null,
      lastSyncAt: null,
      syncing: false,

      setDebts: (debts) => set({ debts }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSyncing: (syncing) => set({ syncing }),

      syncWithCloud: async (force = false) => {
        const { lastSyncAt } = get();
        const now = new Date().toISOString();
        
        // Skip if synced recently (unless forced)
        if (!force && lastSyncAt) {
          const lastSync = new Date(lastSyncAt);
          const timeDiff = Date.now() - lastSync.getTime();
          if (timeDiff < 30000) { // 30 seconds
            return;
          }
        }

        set({ syncing: true, error: null });
        try {
          console.log('[Debts] Syncing with cloud...');
          const cloudDebts = await apiClient.getDebts();
          set({ 
            debts: cloudDebts, 
            lastSyncAt: now,
            syncing: false 
          });
        } catch (error) {
          console.error('[Debts] Sync failed:', error);
          set({ 
            error: 'Failed to sync with cloud', 
            syncing: false 
          });
        }
      },

      addDebt: async (debtData) => {
        const optimisticDebt: Debt = {
          ...debtData,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({ 
          debts: [...state.debts, optimisticDebt] 
        }));

        try {
          const savedDebt = await apiClient.createDebt(debtData);
          
          // Replace optimistic debt with real one
          set((state) => ({
            debts: state.debts.map(d => 
              d.id === optimisticDebt.id ? savedDebt : d
            )
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            debts: state.debts.filter(d => d.id !== optimisticDebt.id),
            error: 'Failed to add debt'
          }));
          throw error;
        }
      },

      updateDebt: async (id, updates) => {
        const { debts } = get();
        const originalDebt = debts.find(d => d.id === id);
        
        if (!originalDebt) {
          throw new Error('Debt not found');
        }

        // Optimistic update
        const updatedDebt = { 
          ...originalDebt, 
          ...updates, 
          updatedAt: new Date().toISOString() 
        };
        
        set((state) => ({
          debts: state.debts.map(d => d.id === id ? updatedDebt : d)
        }));

        try {
          const savedDebt = await apiClient.updateDebt(id, updates);
          
          // Update with server response
          set((state) => ({
            debts: state.debts.map(d => d.id === id ? savedDebt : d)
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            debts: state.debts.map(d => d.id === id ? originalDebt : d),
            error: 'Failed to update debt'
          }));
          throw error;
        }
      },

      deleteDebt: async (id) => {
        const { debts } = get();
        const deletedDebt = debts.find(d => d.id === id);
        
        // Optimistic delete
        set((state) => ({
          debts: state.debts.filter(d => d.id !== id)
        }));

        try {
          await apiClient.deleteDebt(id);
        } catch (error) {
          // Rollback on error
          if (deletedDebt) {
            set((state) => ({
              debts: [...state.debts, deletedDebt],
              error: 'Failed to delete debt'
            }));
          }
          throw error;
        }
      },

      loadDemoData: () => {
        const demoDebts: Debt[] = [
          {
            id: 'demo-1',
            name: 'Credit Card 1',
            balance: 3500,
            minimumPayment: 85,
            interestRate: 19.99,
            type: 'credit_card',
            order: 1,
          },
          {
            id: 'demo-2', 
            name: 'Personal Loan',
            balance: 8200,
            minimumPayment: 245,
            interestRate: 12.5,
            type: 'loan',
            order: 2,
          },
          {
            id: 'demo-3',
            name: 'Car Loan',
            balance: 12500,
            minimumPayment: 420,
            interestRate: 6.8,
            type: 'loan',
            order: 3,
          },
        ];
        
        set({ debts: demoDebts });
      },
    }),
    {
      name: 'snowball-debts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        debts: state.debts,
        lastSyncAt: state.lastSyncAt 
      }),
    }
  )
);

export const useDebts = () => {
  const { isAuthenticated } = useAuth();
  const store = useDebtsStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Sync with cloud if authenticated
      store.syncWithCloud();
    } else {
      // Load demo data if not authenticated
      if (store.debts.length === 0) {
        store.loadDemoData();
      }
    }
  }, [isAuthenticated]);

  const totalDebt = store.debts.reduce((sum, debt) => sum + debt.balance, 0);
  const monthlyPayment = store.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  return {
    ...store,
    totalDebt,
    monthlyPayment,
    // Computed values
    debtCount: store.debts.length,
    hasDebts: store.debts.length > 0,
  };
};