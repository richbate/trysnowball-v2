/**
 * Goal Selectors Hook
 * Read-only derived selectors for goals data
 */

import { useMemo } from 'react';
import { useDebts } from '../useDebts';

export const useGoalSelectors = () => {
  const { debts, totalDebt, projections, extraPayment } = useDebts();
  
  return useMemo(() => {
    // Get goals from localStorage or use smart defaults
    const getGoals = () => {
      try {
        const stored = localStorage.getItem('trysnowball_goals');
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.warn('Error loading goals:', error);
      }
      
      // Create smart default goals based on current situation
      if (!debts || debts.length === 0 || !totalDebt) return [];
      
      const defaults = [];
      
      // Goal 1: Pay off smallest debt (next 3-6 months)
      const smallestDebt = debts
        .filter(d => (d.amount || d.balance || 0) > 0)
        .sort((a, b) => (a.amount || a.balance || 0) - (b.amount || b.balance || 0))[0];
      
      if (smallestDebt) {
        defaults.push({
          id: 'payoff_smallest',
          title: `Pay off ${smallestDebt.name}`,
          target: smallestDebt.amount || smallestDebt.balance,
          type: 'debt_payoff',
          debtId: smallestDebt.id,
          priority: 1
        });
      }
      
      // Goal 2: Reduce total debt by 25% (milestone goal)
      defaults.push({
        id: 'reduce_25_percent',
        title: '25% debt reduction',
        target: totalDebt * 0.25,
        type: 'debt_reduction',
        priority: 2
      });
      
      // Goal 3: Add £50 monthly boost (if not already boosting)
      if (extraPayment < 50) {
        defaults.push({
          id: 'monthly_boost',
          title: '£50 monthly boost',
          target: 50,
          type: 'payment_boost',
          priority: 3
        });
      }
      
      return defaults;
    };
    
    const goals = getGoals();
    
    // Calculate progress for each goal
    const calculateProgress = (goal) => {
      switch (goal.type) {
        case 'debt_payoff':
          if (goal.debtId) {
            const targetDebt = debts?.find(d => d.id === goal.debtId);
            if (targetDebt) {
              const originalBalance = goal.target;
              const currentBalance = targetDebt.amount || targetDebt.balance || 0;
              const paidOff = Math.max(0, originalBalance - currentBalance);
              return {
                current: paidOff,
                percentage: Math.round((paidOff / originalBalance) * 100)
              };
            }
          }
          return { current: 0, percentage: 0 };
          
        case 'debt_reduction':
          const originalTotal = totalDebt + (goal.startingTotal || 0);
          const currentTotal = totalDebt || 0;
          const reduced = Math.max(0, originalTotal - currentTotal);
          return {
            current: reduced,
            percentage: Math.round((reduced / goal.target) * 100)
          };
          
        case 'payment_boost':
          return {
            current: extraPayment,
            percentage: Math.round((extraPayment / goal.target) * 100)
          };
          
        default:
          return { current: 0, percentage: 0 };
      }
    };
    
    // Process goals with progress
    const processedGoals = goals.map(goal => {
      const progress = calculateProgress(goal);
      const isComplete = progress.percentage >= 100;
      
      return {
        ...goal,
        progress: progress.current,
        progressPct: Math.min(100, progress.percentage),
        isComplete,
        status: isComplete ? 'complete' : progress.percentage > 0 ? 'in_progress' : 'not_started'
      };
    });
    
    // Get active (not completed) goals
    const activeGoals = processedGoals.filter(g => !g.isComplete);
    const completedGoals = processedGoals.filter(g => g.isComplete);
    
    // Get next milestone
    const getNextMilestone = () => {
      const nextGoal = activeGoals.sort((a, b) => a.priority - b.priority)[0];
      if (!nextGoal) return null;
      
      let timeframe = '';
      if (nextGoal.type === 'debt_payoff' && projections?.debtPayoffMonths) {
        const months = projections.debtPayoffMonths[nextGoal.debtId];
        if (months) {
          timeframe = months === 1 ? '1 month' : `${months} months`;
        }
      }
      
      return {
        title: nextGoal.title,
        progress: nextGoal.progressPct,
        timeframe
      };
    };
    
    return {
      goals: processedGoals,
      activeGoals,
      completedGoals,
      hasGoals: goals.length > 0,
      hasActiveGoals: activeGoals.length > 0,
      completedCount: completedGoals.length,
      nextMilestone: getNextMilestone(),
      overallProgress: goals.length > 0 
        ? Math.round(processedGoals.reduce((sum, g) => sum + g.progressPct, 0) / goals.length)
        : 0
    };
  }, [debts, totalDebt, projections, extraPayment]);
};