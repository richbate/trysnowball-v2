/**
 * CP-3 Analytics Metadata Generator
 * Implements privacy-preserving bucketed analytics per CP-3_ANALYTICS_PRIVACY.md
 * Only safe, aggregated metadata - never raw debt values
 */

/**
 * Generate safe analytics metadata from debt data
 * All buckets are defined in CP-3_ANALYTICS_PRIVACY.md
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
    payoff_quarter: payoffQuarter
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
 * Validate that analytics payload complies with privacy rules
 * Throws error if forbidden fields are detected
 */
export function validateAnalyticsPayload(payload) {
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
 * Generate frontend-safe analytics event
 * This ensures consistent bucketing between Worker and frontend
 */
export function generateFrontendAnalyticsEvent(eventType, debt) {
  const metadata = calculateAnalyticsMetadata(debt);
  
  const event = {
    event: eventType,
    properties: {
      amount_range: metadata.amount_range,
      apr_range: metadata.apr_range,
      payment_burden: metadata.payment_burden,
      category: metadata.category,
      created_month: metadata.created_month,
      // Add computed metrics that are safe
      estimated_payoff_months: Math.ceil(debt.amount / debt.min_payment),
      has_buckets: Boolean(debt.buckets?.length),
      // Add goal-related flags when available
      has_goals: false, // Will be updated by Goals system
      user_tier: 'free' // Will be updated by auth system
    }
  };
  
  // Validate before returning
  validateAnalyticsPayload(event);
  
  return event;
}

export default {
  calculateAnalyticsMetadata,
  validateAnalyticsPayload,
  generateFrontendAnalyticsEvent
};