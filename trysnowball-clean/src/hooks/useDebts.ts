/**
 * Canonical useDebts Hook - Server-First State Management
 * Replaces useState and useMockAPI anti-patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllDebts, createDebt, updateDebt, deleteDebt } from '../api/debtsAPI';
import type { UKDebt, UpdateUKDebt } from '../types/UKDebt';

export function useDebts() {
  return useQuery<UKDebt[]>({
    queryKey: ['debts'],
    queryFn: fetchAllDebts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      // Invalidate and refetch debts after successful creation
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateUKDebt }) => 
      updateDebt(id, updates),
    onSuccess: () => {
      // Invalidate and refetch debts after successful update
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      // Invalidate and refetch debts after successful deletion
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}