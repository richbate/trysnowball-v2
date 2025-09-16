/**
 * React hook for managing user commitments
 * Handles generating, storing, and retrieving monthly commitment goals
 */

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useDebts } from './useDebts';
import { generateUserCommitments } from '../utils/generateUserCommitments';

/**
 * Hook for managing user commitments
 * @returns {Object} Commitments state and management functions
 */
export const useCommitments = () => {
  const { user } = useUser();
  const { debts } = useDebts();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationHistory, setGenerationHistory] = useState([]);

  // Load commitments from localStorage on mount
  useEffect(() => {
    const loadCommitments = () => {
      try {
        const storageKey = user?.id ? `commitments_${user.id}` : 'commitments_guest';
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setCommitments(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('[useCommitments] Error loading commitments:', error);
        setCommitments([]);
      }
    };

    loadCommitments();
  }, [user?.id]);

  // Save commitments to localStorage whenever they change
  useEffect(() => {
    const saveCommitments = () => {
      try {
        const storageKey = user?.id ? `commitments_${user.id}` : 'commitments_guest';
        localStorage.setItem(storageKey, JSON.stringify(commitments));
      } catch (error) {
        console.error('[useCommitments] Error saving commitments:', error);
      }
    };

    if (commitments.length > 0) {
      saveCommitments();
    }
  }, [commitments, user?.id]);

  /**
   * Generate new commitments for the current month
   * @param {Object} options - Generation options
   * @param {string} options.month - Optional specific month
   * @param {Array} options.customExtras - Custom goals to include
   * @param {string} options.strategy - Debt payoff strategy override
   * @param {number} options.extraPayment - Extra payment amount override
   */
  const generateCommitments = useCallback(async (options = {}) => {
    if (!debts || debts.length === 0) {
      setError('No debt data available for commitment generation');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare user data for generation
      const userData = {
        firstName: user?.firstName || user?.name || 'there',
        goalDate: user?.goalDate || null
      };

      // Get debt metrics for strategy detection
      const { totalDebt, totalMinPayments, extraPayment: currentExtraPayment } = debts.reduce((acc, debt) => ({
        totalDebt: acc.totalDebt + (debt.balance || debt.amount || 0),
        totalMinPayments: acc.totalMinPayments + (debt.minPayment || debt.regularPayment || 0),
        extraPayment: acc.extraPayment
      }), { totalDebt: 0, totalMinPayments: 0, extraPayment: 0 });

      // Detect strategy (could be enhanced with user preference)
      const strategy = options.strategy || 'snowball'; // Default to snowball

      const generationParams = {
        user: userData,
        debts: debts,
        strategy,
        extraPayment: options.extraPayment || currentExtraPayment || 0,
        month: options.month,
        customExtras: options.customExtras || []
      };

      // Generate the commitments
      const newCommitment = await generateUserCommitments(generationParams);
      
      if (!newCommitment) {
        throw new Error('Failed to generate commitments');
      }

      // Add to commitments list (replace if same month exists)
      setCommitments(prevCommitments => {
        const filtered = prevCommitments.filter(c => c.month !== newCommitment.month);
        return [newCommitment, ...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      // Track generation in history
      setGenerationHistory(prevHistory => [
        {
          timestamp: new Date().toISOString(),
          params: generationParams,
          success: true
        },
        ...prevHistory.slice(0, 9) // Keep last 10 generations
      ]);

      return newCommitment;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate commitments';
      setError(errorMessage);
      
      // Track failed generation
      setGenerationHistory(prevHistory => [
        {
          timestamp: new Date().toISOString(),
          params: options,
          success: false,
          error: errorMessage
        },
        ...prevHistory.slice(0, 9)
      ]);

      console.error('[useCommitments] Generation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [debts, user]);

  /**
   * Get commitments for a specific month
   * @param {string} monthKey - Month in YYYY-MM format
   * @returns {Object|null} Commitment for the specified month
   */
  const getCommitmentsForMonth = useCallback((monthKey) => {
    return commitments.find(c => c.month === monthKey) || null;
  }, [commitments]);

  /**
   * Get current month's commitments
   * @returns {Object|null} Current month's commitment
   */
  const getCurrentMonthCommitments = useCallback(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return getCommitmentsForMonth(currentMonth);
  }, [getCommitmentsForMonth]);

  /**
   * Delete a commitment
   * @param {string} monthKey - Month to delete
   */
  const deleteCommitment = useCallback((monthKey) => {
    setCommitments(prevCommitments => 
      prevCommitments.filter(c => c.month !== monthKey)
    );
  }, []);

  /**
   * Clear all commitments
   */
  const clearAllCommitments = useCallback(() => {
    setCommitments([]);
    const storageKey = user?.id ? `commitments_${user.id}` : 'commitments_guest';
    localStorage.removeItem(storageKey);
  }, [user?.id]);

  /**
   * Check if commitments can be generated (has required data)
   */
  const canGenerateCommitments = useCallback(() => {
    return debts && debts.length > 0;
  }, [debts]);

  /**
   * Get generation statistics
   */
  const getGenerationStats = useCallback(() => {
    const successful = generationHistory.filter(h => h.success).length;
    const failed = generationHistory.filter(h => !h.success).length;
    const lastGeneration = generationHistory[0] || null;

    return {
      totalGenerations: generationHistory.length,
      successfulGenerations: successful,
      failedGenerations: failed,
      successRate: generationHistory.length > 0 ? successful / generationHistory.length : 0,
      lastGeneration
    };
  }, [generationHistory]);

  return {
    // State
    commitments,
    loading,
    error,
    generationHistory,

    // Actions
    generateCommitments,
    deleteCommitment,
    clearAllCommitments,

    // Getters
    getCommitmentsForMonth,
    getCurrentMonthCommitments,
    canGenerateCommitments,
    getGenerationStats,

    // Computed values
    hasCommitments: commitments.length > 0,
    currentMonthCommitments: getCurrentMonthCommitments()
  };
};

export default useCommitments;