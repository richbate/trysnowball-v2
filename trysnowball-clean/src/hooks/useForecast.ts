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
import { 
  trackForecastRun, 
  trackBucketCleared, 
  trackForecastFailed, 
  trackBucketInterestBreakdown,
  trackForecastCompared,
  FORECAST_ERROR_CODES
} from '../lib/analytics';

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
              trackBucketCleared({
                bucket_label: milestone.bucketName,
                debt_name: milestone.debtName,
                apr: milestone.apr,
                cleared_month: milestone.monthCleared,
                total_interest_paid: milestone.totalInterestPaid,
                forecast_version: 'v2.0'
              });
            });
            
            // Track ONE aggregated interest breakdown per forecast run
            // Volume guardrail: aggregate all buckets to prevent event spam
            const totalInterestBreakdown = summary.bucketDetails.bucketMilestones.reduce(
              (sum, milestone) => sum + milestone.totalInterestPaid, 0
            );
            
            trackBucketInterestBreakdown({
              bucket_label: 'All Buckets',
              debt_name: 'Forecast Summary',
              apr: 0, // Aggregated - no single APR
              interest_total: totalInterestBreakdown,
              forecast_version: 'v2.0'
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
      trackForecastRun({
        mode: forecastMode,
        debt_count: debts.length,
        bucket_count: totalBuckets,
        extra_per_month: extraPerMonth,
        forecast_version: 'v2.0'
      });
      
      return { results, summary };
    } catch (err) {
      console.error('Forecast simulation error:', err);
      
      // Track forecast failure
      trackForecastFailed({
        error_code: FORECAST_ERROR_CODES.SIMULATION_ERROR,
        error_message: err instanceof Error ? err.message : 'Unknown error',
        debt_count: debts.length,
        has_buckets: debts.some(debt => hasMultiAPRBuckets(debt)),
        forecast_version: 'v2.0'
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
          
      trackForecastCompared({
        months_saved: monthsSaved,
        interest_difference: interestSaved,
        percentage_reduction: percentageReduction,
        composite_months: snowballForecast.summary.totalMonths,
        flat_months: minimumOnlyForecast.summary.totalMonths,
        debt_count: snowballForecast.results.length > 0 ? snowballForecast.results[0]?.debts?.length || 0 : 0,
        bucket_count: totalBuckets,
        extra_per_month: extraPerMonth,
        forecast_version: 'v2.0'
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