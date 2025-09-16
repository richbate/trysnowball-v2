/**
 * Forecast Selectors Hook
 * Read-only derived selectors for forecast data
 */

import { useMemo } from 'react';
import { useDebts } from '../useDebts';
// Import utilities as needed

export const useForecastSelectors = () => {
  const { debts, projections, extraPayment, totalDebt } = useDebts();
  
  return useMemo(() => {
    if (!debts || debts.length === 0) {
      return {
        debtFreeDate: null,
        monthsSaved: 0,
        interestSaved: 0,
        focusDebt: null,
        hasBoost: extraPayment > 0,
        totalDebt: 0,
        projectedTimeline: null
      };
    }

    // Calculate debt-free date with better fallback logic
    const getDebtFreeDate = () => {
      try {
        if (projections?.totalMonths) {
          const date = new Date();
          date.setMonth(date.getMonth() + projections.totalMonths);
          return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        }
        
        // Fallback: estimate based on total debt and minimum payments
        const totalMinimums = debts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
        if (totalMinimums > 0 && totalDebt > 0) {
          const estimatedMonths = Math.ceil(totalDebt / totalMinimums);
          const date = new Date();
          date.setMonth(date.getMonth() + estimatedMonths);
          return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        }
        
        // Final fallback for logged-in users with no debt data
        return 'Start tracking';
      } catch (error) {
        console.warn('Error calculating debt-free date:', error);
        return 'Start tracking';
      }
    };
    
    // Calculate months saved with current boost
    const getMonthsSaved = () => {
      if (projections?.withExtraMonths && projections?.totalMonths) {
        return Math.max(0, projections.totalMonths - projections.withExtraMonths);
      }
      
      // Fallback estimate based on extra payment ratio
      if (extraPayment > 0 && totalDebt > 0) {
        const totalMinimums = debts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
        const paymentRatio = extraPayment / Math.max(totalMinimums, 1);
        return Math.round(paymentRatio * 12); // Rough estimate
      }
      
      return 0;
    };
    
    // Calculate interest saved with threshold
    const getInterestSaved = () => {
      if (projections?.interestSaved) {
        const saved = Math.round(projections.interestSaved);
        // Hide trivial savings < £50
        return saved >= 50 ? saved : 0;
      }
      
      // Fallback estimate: extra payment * average interest rate * time
      if (extraPayment > 0) {
        const avgInterestRate = debts.reduce((sum, debt) => sum + (debt.rate || debt.interest || 0), 0) / debts.length;
        const monthsSaved = getMonthsSaved();
        const saved = Math.round(extraPayment * (avgInterestRate / 100) * (monthsSaved / 12));
        // Hide trivial savings < £50
        return saved >= 50 ? saved : 0;
      }
      
      return 0;
    };
    
    // Get focus debt (next to attack) with better strategy support
    const getFocusDebt = () => {
      const activeDebts = debts.filter(d => (d.amount || d.balance || 0) > 0);
      if (activeDebts.length === 0) return null;
      
      // Get strategy from user preferences (default to snowball)
      const strategy = localStorage.getItem('debt_strategy') || 'snowball';
      
      let sorted;
      if (strategy === 'avalanche') {
        // Sort by interest rate (highest first)
        sorted = [...activeDebts].sort((a, b) => 
          (b.rate || b.interest || 0) - (a.rate || a.interest || 0)
        );
      } else {
        // Snowball: sort by balance (smallest first)
        sorted = [...activeDebts].sort((a, b) => 
          (a.amount || a.balance || 0) - (b.amount || b.balance || 0)
        );
      }
      
      const focusDebt = sorted[0];
      if (!focusDebt) return null;
      
      // Calculate payoff month for focus debt
      const balance = focusDebt.amount || focusDebt.balance || 0;
      const minPayment = focusDebt.minimumPayment || 0;
      const totalPayment = minPayment + extraPayment;
      
      const monthsToPayoff = totalPayment > 0 
        ? Math.ceil(balance / totalPayment)
        : 12; // Fallback
      
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);
      
      return {
        id: focusDebt.id,
        name: focusDebt.name,
        balance: balance,
        strategy: strategy,
        payoffMonth: payoffDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        monthsToPayoff: monthsToPayoff
      };
    };
    
    return {
      debtFreeDate: getDebtFreeDate(),
      monthsSaved: getMonthsSaved(),
      interestSaved: getInterestSaved(),
      focusDebt: getFocusDebt(),
      hasBoost: extraPayment > 0,
      totalDebt: totalDebt || 0,
      projectedTimeline: projections
    };
  }, [debts, projections, extraPayment, totalDebt]);
};