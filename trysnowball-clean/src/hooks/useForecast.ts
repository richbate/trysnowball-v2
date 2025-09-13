/**
 * CP-4 Forecast Hook
 * Integrates snowball simulation with React Query debt data
 */

import { useMemo } from 'react';
import { useDebts } from './useDebts';
import { simulateSnowballPlan, generateForecastSummary } from '../utils/snowballSimulator';
import { simulateBucketAwareSnowballPlan } from '../utils/bucketSimulator';
import { simulateCompositePlan, compositeResultsToPlanResults, generateCompositeForecastSummary } from '../utils/compositeBucketEngine';
import { hasMultiAPRBuckets } from '../types/UKDebt';
import { PlanResult, ForecastSummary } from '../types/Forecast';
import { useMultiAPRFeature } from './useFeatureFlags';
import { analytics, FORECAST_ERROR_CODES } from '../services/analytics';

interface UseForecastOptions {
  extraPerMonth: number;
  startDate?: Date;
}

interface UseForecastResult {
  results: PlanResult[];
  summary: ForecastSummary;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook to generate debt payoff forecast using current user debts
 */
export function useForecast(options: UseForecastOptions): UseForecastResult {
  const { extraPerMonth, startDate = new Date() } = options;
  const { data: debts = [], isLoading, isError, error } = useDebts();
  const { isEnabled: multiAPREnabled } = useMultiAPRFeature();

  const forecast = useMemo(() => {
    const userId = 'user-' + Math.random().toString(36).substr(2, 9); // Simple user ID for demo

    if (!debts.length) {
      return {
        results: [] as PlanResult[],
        summary: {
          totalMonths: 0,
          debtFreeDate: 'No debts',
          totalInterestPaid: 0,
          interestSavedVsMinimum: 0,
          firstDebtClearedMonth: 0,
          milestoneDates: []
        } as ForecastSummary
      };
    }

    try {
      // Check if any debt uses multi-APR buckets
      const hasMultiAPRDebts = debts.some(debt => hasMultiAPRBuckets(debt));
      const totalBuckets = debts.reduce((count, debt) => 
        count + (debt.buckets ? debt.buckets.length : 0), 0);
      
      let results: PlanResult[];
      let summary: ForecastSummary;
      let forecastMode: 'composite' | 'flat' = 'flat';
      
      if (hasMultiAPRDebts && multiAPREnabled) {
        forecastMode = 'composite';
        
        // Use new composite engine for multi-APR debts when feature is enabled
        const compositeResults = simulateCompositePlan(debts, extraPerMonth, startDate);
        
        if (compositeResults.length > 0) {
          // Convert composite results to standard format for UI compatibility
          results = compositeResultsToPlanResults(compositeResults);
          // Use enhanced summary that includes bucket details
          summary = generateCompositeForecastSummary(compositeResults, startDate);
          
          // Track bucket clearance milestones
          if (summary.bucketDetails) {
            summary.bucketDetails.bucketMilestones.forEach(milestone => {
              // Track when bucket is cleared
              analytics.trackBucketCleared({
                bucketLabel: milestone.bucketName,
                debtName: milestone.debtName,
                apr: milestone.apr,
                clearedMonth: milestone.monthCleared,
                totalInterestPaid: milestone.totalInterestPaid,
                userId
              });
            });
            
            // Track ONE aggregated interest breakdown per forecast run
            // Volume guardrail: aggregate all buckets to prevent event spam
            const totalInterestBreakdown = summary.bucketDetails.bucketMilestones.reduce(
              (sum, milestone) => sum + milestone.totalInterestPaid, 0
            );
            
            analytics.trackInterestBreakdown({
              bucketLabel: 'All Buckets',
              debtName: 'Forecast Summary',
              apr: 0, // Aggregated - no single APR
              interestTotal: totalInterestBreakdown,
              userId
            });
          }
        } else {
          // No multi-APR debts found, fall back to standard simulation
          forecastMode = 'flat';
          results = simulateSnowballPlan({
            debts,
            extraPerMonth,
            startDate
          });
          summary = { ...generateForecastSummary(results, startDate), simulationEngine: 'standard' as const };
        }
      } else if (hasMultiAPRDebts) {
        // Feature not enabled but has multi-APR debts - use old bucket simulator
        results = simulateBucketAwareSnowballPlan({
          debts,
          extraPerMonth,
          startDate
        });
        summary = { ...generateForecastSummary(results, startDate), simulationEngine: 'standard' as const };
      } else {
        // Use standard simulator for single APR debts
        results = simulateSnowballPlan({
          debts,
          extraPerMonth,
          startDate
        });
        summary = { ...generateForecastSummary(results, startDate), simulationEngine: 'standard' as const };
      }
      
      // Track forecast run - Golden Analytics Event Suite — CP-4.x
      analytics.trackForecastRun({
        mode: forecastMode,
        userId,
        debtCount: debts.length,
        bucketCount: totalBuckets,
        extraPerMonth
      });
      
      return { results, summary };
    } catch (err) {
      console.error('Forecast simulation error:', err);
      
      // Track forecast failure
      analytics.trackForecastFailed({
        errorCode: FORECAST_ERROR_CODES.SIMULATION_ERROR,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        debtCount: debts.length,
        hasBuckets: debts.some(debt => hasMultiAPRBuckets(debt)),
        userId
      });
      
      return {
        results: [] as PlanResult[],
        summary: {
          totalMonths: 0,
          debtFreeDate: 'Calculation error',
          totalInterestPaid: 0,
          interestSavedVsMinimum: 0,
          firstDebtClearedMonth: 0,
          milestoneDates: []
        } as ForecastSummary
      };
    }
  }, [debts, extraPerMonth, startDate, multiAPREnabled]);

  return {
    results: forecast.results,
    summary: forecast.summary,
    isLoading,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook to compare forecast scenarios (minimum vs snowball)
 */
export function useCompareForecast(extraPerMonth: number) {
  const minimumOnlyForecast = useForecast({ extraPerMonth: 0 });
  const snowballForecast = useForecast({ extraPerMonth });

  const comparison = useMemo(() => {
    if (!minimumOnlyForecast.results.length || !snowballForecast.results.length) {
      return {
        monthsSaved: 0,
        interestSaved: 0,
        percentageReduction: 0
      };
    }

    const monthsSaved = minimumOnlyForecast.summary.totalMonths - snowballForecast.summary.totalMonths;
    const interestSaved = minimumOnlyForecast.summary.totalInterestPaid - snowballForecast.summary.totalInterestPaid;
    const percentageReduction = Math.round((monthsSaved / minimumOnlyForecast.summary.totalMonths) * 100);

    // Track forecast comparison - Golden Analytics Event Suite — CP-4.x
    if (monthsSaved > 0 || interestSaved > 0) {
      const totalBuckets = snowballForecast.results.length > 0 ?
        snowballForecast.results[0]?.debts?.reduce((count, debt: any) =>
          count + (debt.buckets ? debt.buckets.length : 0), 0) || 0 : 0;

      const userId = 'user-' + Math.random().toString(36).substr(2, 9); // Simple user ID for demo
      analytics.trackForecastComparison({
        monthsSaved,
        interestDifference: interestSaved,
        percentageReduction,
        compositeMonths: snowballForecast.summary.totalMonths,
        flatMonths: minimumOnlyForecast.summary.totalMonths,
        debtCount: snowballForecast.results.length > 0 ? snowballForecast.results[0]?.debts?.length || 0 : 0,
        bucketCount: totalBuckets,
        extraPerMonth,
        userId
      });
    }

    return {
      monthsSaved,
      interestSaved,
      percentageReduction
    };
  }, [minimumOnlyForecast, snowballForecast]);

  return {
    minimumOnlyForecast,
    snowballForecast,
    comparison,
    isLoading: minimumOnlyForecast.isLoading || snowballForecast.isLoading
  };
}