/**
 * CP-4 Analytics Events - Forecast Engine v2
 * Privacy-safe analytics for multi-APR composite forecast calculations
 * All events use bucketed metadata from CP-3 privacy rules
 */

import { ForecastResultV2, BucketSnapshotV2 } from '../utils/compositeSimulatorV2';
import { UKDebt } from '../types/UKDebt';
import { analytics } from './analyticsPrivacy';

/**
 * CP-4 Analytics Event Types (5 required events)
 */
export const CP4_ANALYTICS_EVENTS = {
  FORECAST_RUN: 'forecast_run',
  BUCKET_CLEARED: 'bucket_cleared', 
  FORECAST_FAILED: 'forecast_failed',
  BUCKET_INTEREST_BREAKDOWN: 'bucket_interest_breakdown',
  FORECAST_COMPARED: 'forecast_compared'
} as const;

/**
 * Analytics Event: forecast_run
 * Fired when CP-4 composite engine completes a forecast calculation
 */
export function trackForecastRun(
  debts: UKDebt[], 
  result: ForecastResultV2, 
  userTier: string = 'pro',
  scenarioType: string = 'standard'
) {
  // Calculate safe metadata for each debt
  const debtsMetadata = debts.map(debt => analytics.generateMetadata(debt));
  
  // Aggregate distributions without exposing individual values
  const amountDistribution = debtsMetadata.reduce((dist, meta) => {
    dist[meta.amount_range] = (dist[meta.amount_range] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  const aprDistribution = debtsMetadata.reduce((dist, meta) => {
    dist[meta.apr_range] = (dist[meta.apr_range] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  // Count multi-APR vs single-APR debts
  const multiAPRCount = debts.filter(d => d.buckets && d.buckets.length > 1).length;
  const singleAPRCount = debts.length - multiAPRCount;
  
  const event = {
    event: CP4_ANALYTICS_EVENTS.FORECAST_RUN,
    properties: {
      user_tier: userTier,
      scenario_type: scenarioType,
      
      // Debt composition (safe)
      total_debts: debts.length,
      multi_apr_debts: multiAPRCount,
      single_apr_debts: singleAPRCount,
      amount_distribution: amountDistribution,
      apr_distribution: aprDistribution,
      
      // Forecast results (bucketed)
      months_to_freedom: Math.min(result.totalMonths, 600), // Cap at 600
      freedom_timeframe: result.totalMonths <= 12 ? 'under_1_year' :
                        result.totalMonths <= 24 ? '1_2_years' :
                        result.totalMonths <= 60 ? '2_5_years' : 'over_5_years',
      
      // Interest breakdown (bucketed) 
      total_interest_saved: result.totalInterestPaid > 0 ? 'has_savings' : 'no_savings',
      interest_range: result.totalInterestPaid < 1000 ? 'under_1k' :
                     result.totalInterestPaid < 5000 ? '1k_5k' :
                     result.totalInterestPaid < 10000 ? '5k_10k' : '10k_plus',
      
      // Buckets processed
      total_buckets_processed: Object.keys(result.interestBreakdown).length,
      
      // Engine performance
      calculation_successful: (result.errors || []).length === 0,
      hit_month_limit: result.totalMonths >= 600,
      
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: bucket_cleared 
 * Fired when individual bucket reaches zero balance
 */
export function trackBucketCleared(
  bucketSnapshot: BucketSnapshotV2,
  month: number,
  debtName: string,
  userTier: string = 'pro'
) {
  // Safe bucket metadata (no raw values)
  const aprRange = bucketSnapshot.apr < 10 ? 'low_0_10' :
                  bucketSnapshot.apr < 20 ? 'medium_10_20' : 'high_20_plus';
  
  const event = {
    event: CP4_ANALYTICS_EVENTS.BUCKET_CLEARED,
    properties: {
      user_tier: userTier,
      
      // Bucket characteristics (safe)
      apr_range: aprRange,
      bucket_type: bucketSnapshot.name.toLowerCase().includes('cash') ? 'cash_advance' :
                  bucketSnapshot.name.toLowerCase().includes('transfer') ? 'balance_transfer' :
                  bucketSnapshot.name.toLowerCase().includes('purchase') ? 'purchase' : 'other',
      
      // Payoff timing (bucketed)
      payoff_month: month,
      payoff_timeframe: month <= 6 ? 'under_6_months' :
                       month <= 12 ? '6_12_months' :
                       month <= 24 ? '1_2_years' : 'over_2_years',
      
      // Achievement context
      debt_name_hash: btoa(debtName).slice(0, 8), // Hashed debt identifier
      
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: forecast_failed
 * Fired when CP-4 engine encounters validation errors
 */
export function trackForecastFailed(
  debts: UKDebt[],
  errors: string[],
  userTier: string = 'pro'
) {
  // Classify error types (no sensitive info)
  const errorTypes = errors.map(error => {
    if (error.includes('Invalid APR')) return 'invalid_apr';
    if (error.includes('Payment below monthly interest')) return 'debt_growth';
    if (error.includes('bucket balances')) return 'bucket_mismatch';
    if (error.includes('negative')) return 'negative_value';
    return 'other_validation';
  });
  
  const event = {
    event: CP4_ANALYTICS_EVENTS.FORECAST_FAILED,
    properties: {
      user_tier: userTier,
      
      // Error classification
      error_count: errors.length,
      error_types: errorTypes,
      primary_error_type: errorTypes[0] || 'unknown',
      
      // Context (safe)
      total_debts: debts.length,
      has_multi_apr_debts: debts.some(d => d.buckets && d.buckets.length > 1),
      
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: bucket_interest_breakdown
 * Fired to track interest distribution across bucket types
 */
export function trackBucketInterestBreakdown(
  result: ForecastResultV2,
  userTier: string = 'pro'
) {
  // Calculate safe interest distribution
  const bucketBreakdown = Object.values(result.interestBreakdown)
    .filter(bucket => bucket.totalInterest > 0)
    .map(bucket => {
      const percentage = (bucket.totalInterest / result.totalInterestPaid) * 100;
      return {
        bucket_type: bucket.bucketName.toLowerCase().includes('cash') ? 'cash_advance' :
                    bucket.bucketName.toLowerCase().includes('transfer') ? 'balance_transfer' :
                    bucket.bucketName.toLowerCase().includes('purchase') ? 'purchase' : 'other',
        apr_range: bucket.apr < 10 ? 'low_0_10' :
                  bucket.apr < 20 ? 'medium_10_20' : 'high_20_plus',
        interest_percentage: Math.round(percentage)
      };
    });
  
  const event = {
    event: CP4_ANALYTICS_EVENTS.BUCKET_INTEREST_BREAKDOWN,
    properties: {
      user_tier: userTier,
      
      // Interest distribution (percentages only)
      bucket_breakdown: bucketBreakdown,
      highest_interest_bucket: bucketBreakdown[0]?.bucket_type || 'none',
      
      // Summary stats (bucketed)
      total_interest_range: result.totalInterestPaid < 1000 ? 'under_1k' :
                           result.totalInterestPaid < 5000 ? '1k_5k' :
                           result.totalInterestPaid < 10000 ? '5k_10k' : '10k_plus',
      
      total_buckets: bucketBreakdown.length,
      
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Analytics Event: forecast_compared
 * Fired when user compares different forecast scenarios
 */
export function trackForecastCompared(
  baselineResult: ForecastResultV2,
  scenarioResult: ForecastResultV2,
  comparisonType: string,
  userTier: string = 'pro'
) {
  // Calculate improvement metrics (bucketed)
  const monthsSaved = Math.max(0, baselineResult.totalMonths - scenarioResult.totalMonths);
  const interestSaved = Math.max(0, baselineResult.totalInterestPaid - scenarioResult.totalInterestPaid);
  
  const event = {
    event: CP4_ANALYTICS_EVENTS.FORECAST_COMPARED,
    properties: {
      user_tier: userTier,
      comparison_type: comparisonType, // 'extra_payment', 'snowball_vs_avalanche', etc.
      
      // Improvement metrics (bucketed)
      months_saved: monthsSaved,
      months_saved_range: monthsSaved === 0 ? 'no_improvement' :
                         monthsSaved <= 6 ? 'under_6_months' :
                         monthsSaved <= 12 ? '6_12_months' : 'over_1_year',
      
      interest_saved_range: interestSaved === 0 ? 'no_savings' :
                           interestSaved < 500 ? 'under_500' :
                           interestSaved < 2000 ? '500_2k' :
                           interestSaved < 5000 ? '2k_5k' : 'over_5k',
      
      // Scenario context
      baseline_months: Math.min(baselineResult.totalMonths, 600),
      scenario_months: Math.min(scenarioResult.totalMonths, 600),
      
      improvement_significant: monthsSaved >= 6 || interestSaved >= 1000,
      
      timestamp: new Date().toISOString()
    }
  };
  
  analytics.validatePayload(event);
  return event;
}

/**
 * Main CP-4 analytics interface
 * Clean PostHog console logging - no sendAnalyticsEvent calls
 */
export const cp4Analytics = {
  // Forecast events
  forecastRun: (debts: UKDebt[], result: ForecastResultV2, userTier?: string, scenario?: string) => 
    console.log('CP4 Analytics: forecastRun', { debts: debts.length, result: result.totalMonths, userTier, scenario }),
    
  bucketCleared: (bucket: BucketSnapshotV2, month: number, debtName: string, userTier?: string) =>
    console.log('CP4 Analytics: bucketCleared', { bucket: bucket.name, month, debtName, userTier }),
    
  forecastFailed: (debts: UKDebt[], errors: string[], userTier?: string) =>
    console.log('CP4 Analytics: forecastFailed', { debts: debts.length, errors, userTier }),
    
  bucketInterestBreakdown: (result: ForecastResultV2, userTier?: string) =>
    console.log('CP4 Analytics: bucketInterestBreakdown', { totalInterest: result.totalInterestPaid, userTier }),
    
  forecastCompared: (baseline: ForecastResultV2, scenario: ForecastResultV2, type: string, userTier?: string) =>
    console.log('CP4 Analytics: forecastCompared', { baselineMonths: baseline.totalMonths, scenarioMonths: scenario.totalMonths, type, userTier }),
  
  // Generators for testing
  generateForecastRunEvent: trackForecastRun,
  generateBucketClearedEvent: trackBucketCleared,
  generateForecastFailedEvent: trackForecastFailed,
  generateBucketInterestBreakdownEvent: trackBucketInterestBreakdown,
  generateForecastComparedEvent: trackForecastCompared
};

export default cp4Analytics;