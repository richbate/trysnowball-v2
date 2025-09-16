/**
 * Snowflake Selectors Hook
 * Read-only derived selectors for snowflake data
 */

import { useMemo } from 'react';
import { useDebts } from '../useDebts';

export const useSnowflakeSelectors = () => {
  const { debts, extraPayment } = useDebts();
  
  return useMemo(() => {
    // Get snowflakes from localStorage (they're stored as one-time payments)
    const getSnowflakes = () => {
      try {
        const stored = localStorage.getItem('trysnowball_snowflakes');
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('Error loading snowflakes:', error);
        return [];
      }
    };
    
    const snowflakes = getSnowflakes();
    
    // Calculate total snowflake amount in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSnowflakes = snowflakes.filter(s => 
      new Date(s.date || s.timestamp) >= thirtyDaysAgo
    );
    
    const totalAmount = recentSnowflakes.reduce((sum, s) => sum + (s.amount || 0), 0);
    const allTimeTotal = snowflakes.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    // Calculate impact on debt payoff
    const calculateImpact = () => {
      if (!debts || debts.length === 0 || totalAmount === 0) {
        return { monthsSaved: 0, interestSaved: 0 };
      }
      
      // Rough calculation: snowflakes reduce payoff time
      const avgMonthlyPayment = debts.reduce((sum, debt) => 
        sum + (debt.minimumPayment || 0), 0) + extraPayment;
      
      if (avgMonthlyPayment === 0) return { monthsSaved: 0, interestSaved: 0 };
      
      // Estimate months saved: snowflakes / monthly payment
      const monthsSaved = Math.round((totalAmount / avgMonthlyPayment) * 100) / 100;
      
      // Estimate interest saved based on average debt rate
      const avgRate = debts.reduce((sum, debt) => 
        sum + (debt.rate || debt.interest || 0), 0) / debts.length;
      
      const interestSaved = Math.round(totalAmount * (avgRate / 100) * 0.5); // Conservative estimate
      
      return { monthsSaved, interestSaved };
    };
    
    const impact = calculateImpact();
    
    // Get recent activity for display
    const getRecentActivity = () => {
      return snowflakes
        .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
        .slice(0, 3)
        .map(s => ({
          id: s.id,
          amount: s.amount,
          date: s.date || s.timestamp,
          source: s.source || s.description || 'Extra payment'
        }));
    };
    
    return {
      totalAmount: Math.round(totalAmount * 100), // Convert to pennies for display
      allTimeTotal: Math.round(allTimeTotal * 100),
      count: recentSnowflakes.length,
      allTimeCount: snowflakes.length,
      monthsSaved: impact.monthsSaved,
      interestSaved: impact.interestSaved,
      hasSnowflakes: snowflakes.length > 0,
      hasRecentSnowflakes: recentSnowflakes.length > 0,
      recentActivity: getRecentActivity(),
      avgAmount: recentSnowflakes.length > 0 
        ? Math.round((totalAmount / recentSnowflakes.length) * 100)
        : 0
    };
  }, [debts, extraPayment]);
};