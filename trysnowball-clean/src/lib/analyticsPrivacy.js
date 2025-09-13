/**
 * Frontend Analytics Privacy Layer
 * Ensures consistent bucketing with Worker and prevents raw data leaks
 * Implements CP-3_ANALYTICS_PRIVACY.md rules on frontend
 */

/**
 * Calculate privacy-safe analytics metadata (mirrors worker/src/metadata.js)
 * Must stay in sync with Worker implementation
 */
export function calculateAnalyticsMetadata(debt) {
  // Amount range buckets (exact ranges locked in privacy spec)
  const amountRange = 
    debt.amount < 1000 ? 'under_1k' :
    debt.amount < 5000 ? '1k_5k' :
    debt.amount < 10000 ? '5k_10k' : '10k_plus';
  
  // APR range buckets
  const aprRange = 
    debt.apr < 10 ? 'low_0_10' :
    debt.apr < 20 ? 'medium_10_20' : 'high_20_plus';
  
  // Payment burden calculation (min_payment ÷ amount)
  const burdenRatio = debt.min_payment / debt.amount;
  const paymentBurden = 
    burdenRatio < 0.02 ? 'light' :    // <2%
    burdenRatio < 0.04 ? 'moderate' : // 2-4%
    'heavy';                          // >4%
  
  // Debt category (from debt type or default)
  const category = normalizeDebtCategory(debt.debt_type || 'credit_card');
  
  // Time-based buckets for cohort analysis
  const now = new Date();
  const createdMonth = now.toISOString().slice(0, 7); // YYYY-MM
  
  // Estimated payoff quarter (simplified calculation)
  const estimatedPayoffMonths = Math.ceil(debt.amount / debt.min_payment);
  const payoffDate = new Date(now.getTime() + (estimatedPayoffMonths * 30 * 24 * 60 * 60 * 1000));
  const payoffQuarter = `${payoffDate.getFullYear()}-Q${Math.ceil((payoffDate.getMonth() + 1) / 3)}`;
  
  return {
    amount_range: amountRange,
    apr_range: aprRange,
    payment_burden: paymentBurden,
    category,
    created_month: createdMonth,
    payoff_quarter: payoffQuarter,
    // Safe computed metrics
    estimated_payoff_months: estimatedPayoffMonths,
    has_buckets: Boolean(debt.buckets?.length),
    bucket_count: debt.buckets?.length || 0
  };
}

/**
 * Normalize debt type to safe categories
 */
function normalizeDebtCategory(debtType) {
  const normalized = debtType.toLowerCase().replace(/[^a-z_]/g, '');
  
  // Map to allowed categories from privacy spec
  if (normalized.includes('credit') || normalized.includes('card')) {
    return 'credit_card';
  }
  if (normalized.includes('loan') || normalized.includes('personal')) {
    return 'loan';
  }
  if (normalized.includes('mortgage') || normalized.includes('home')) {
    return 'mortgage';
  }
  
  return 'other';
}

/**
 * Safe analytics event for debt creation
 */
export function trackDebtCreated(debt, userTier = 'free') {
  const metadata = calculateAnalyticsMetadata(debt);
  
  const event = {
    event: 'debt_created',
    properties: {
      ...metadata,
      user_tier: userTier,
      has_goals: false, // Will be updated by Goals system
      timestamp: new Date().toISOString().slice(0, 19) + 'Z'
    }
  };
  
  // Validate before sending
  validateAnalyticsPayload(event);
  
  return event;
}

/**
 * Safe analytics event for debt updates
 */
export function trackDebtUpdated(debt, changes, userTier = 'free') {
  const metadata = calculateAnalyticsMetadata(debt);
  
  // Only track what fields were changed, not their values
  const changedFields = Object.keys(changes);
  const hasAmountChange = changedFields.includes('amount');
  const hasAprChange = changedFields.includes('apr');
  const hasPaymentChange = changedFields.includes('min_payment');
  
  const event = {
    event: 'debt_updated',
    properties: {
      ...metadata,
      user_tier: userTier,
      fields_changed: changedFields.length,
      amount_changed: hasAmountChange,
      apr_changed: hasAprChange,
      payment_changed: hasPaymentChange,
      timestamp: new Date().toISOString().slice(0, 19) + 'Z'
    }
  };
  
  validateAnalyticsPayload(event);
  return event;
}

/**
 * Safe analytics event for debt deletion
 */
export function trackDebtDeleted(debt, userTier = 'free') {
  const metadata = calculateAnalyticsMetadata(debt);
  
  const event = {
    event: 'debt_deleted',
    properties: {
      ...metadata,
      user_tier: userTier,
      timestamp: new Date().toISOString().slice(0, 19) + 'Z'
    }
  };
  
  validateAnalyticsPayload(event);
  return event;
}

/**
 * Safe analytics event for forecast calculations
 */
export function trackForecastCalculated(debts, results, userTier = 'free') {
  // Aggregate metadata without exposing individual debt details
  const totalDebts = debts.length;
  const averagePayoffMonths = results.totalMonths || 0;
  
  // Distribution across amount ranges
  const amountDistribution = debts.reduce((dist, debt) => {
    const range = calculateAnalyticsMetadata(debt).amount_range;
    dist[range] = (dist[range] || 0) + 1;
    return dist;
  }, {});
  
  const event = {
    event: 'forecast_calculated',
    properties: {
      user_tier: userTier,
      total_debts: totalDebts,
      average_payoff_months: Math.round(averagePayoffMonths),
      amount_distribution: amountDistribution,
      has_multi_apr_debts: debts.some(d => d.buckets?.length > 0),
      timestamp: new Date().toISOString().slice(0, 19) + 'Z'
    }
  };
  
  validateAnalyticsPayload(event);
  return event;
}

/**
 * Validate that analytics payload complies with privacy rules
 * Same validation as Worker implementation
 */
function validateAnalyticsPayload(payload) {
  const forbiddenFields = [
    'name', 'debt_name', 'amount', 'balance', 'apr', 'interest_rate',
    'min_payment', 'payment', 'user_id', 'email', 'id'
  ];
  
  const forbiddenValues = [
    // Check for numeric values that might be raw amounts/APRs
    (value) => typeof value === 'number' && value > 100 && value < 1000000, // Likely amount
    (value) => typeof value === 'number' && value > 0 && value < 50,        // Likely APR
    // Check for string values that might contain PII
    (value) => typeof value === 'string' && value.includes('@'),            // Email
    (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !value.includes('Q') // Exact dates
  ];
  
  function checkObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      // Check forbidden field names
      if (forbiddenFields.includes(key.toLowerCase())) {
        throw new Error(`Privacy violation: Forbidden field '${key}' at ${fullPath}`);
      }
      
      // Check forbidden value patterns
      for (const validator of forbiddenValues) {
        if (validator(value)) {
          throw new Error(`Privacy violation: Suspicious value '${value}' at ${fullPath}`);
        }
      }
      
      // Recursively check nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkObject(value, fullPath);
      }
    }
  }
  
  checkObject(payload);
  return true;
}

/**
 * Integration with PostHog (or other analytics service)
 */
export function sendAnalyticsEvent(event) {
  // Validate before sending
  validateAnalyticsPayload(event);
  
  // Send to PostHog if available
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event.event, event.properties);
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event (Privacy-Safe):', event);
  }
}

/**
 * Main analytics interface - use these functions to track events
 */
export const analytics = {
  // Debt events
  debtCreated: (debt, userTier) => sendAnalyticsEvent(trackDebtCreated(debt, userTier)),
  debtUpdated: (debt, changes, userTier) => sendAnalyticsEvent(trackDebtUpdated(debt, changes, userTier)),
  debtDeleted: (debt, userTier) => sendAnalyticsEvent(trackDebtDeleted(debt, userTier)),
  
  // Forecast events
  forecastCalculated: (debts, results, userTier) => sendAnalyticsEvent(trackForecastCalculated(debts, results, userTier)),
  
  // Utility
  generateMetadata: calculateAnalyticsMetadata,
  validatePayload: validateAnalyticsPayload
};

export default analytics;