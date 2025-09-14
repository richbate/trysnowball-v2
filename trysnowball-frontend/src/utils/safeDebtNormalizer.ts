/**
 * Safe debt normalizer - idempotent conversion with heuristic unit detection
 * Fixes the double-conversion bug by trusting normalized fields when present
 */

// Types kept minimal for brevity
type In = any;
export type Debt = {
 id: string;
 name: string;
 amount: number;          // pounds (1234.56)
 min_payment: number;     // pounds (45.00)
 apr: number;            // percentage (19.9)
 debt_type?: string;
 limit?: number | null;   // pounds (5000.00)
 order_index?: number;
 created_at?: string;
 updated_at?: string;
 original_amount?: number; // pounds (5000.00)
};

// --- Heuristics for UK Format (pounds and percentages) ---
const asPounds = (v: number): number => {
 if (!Number.isFinite(v)) return 0;
 
 // If it's already a decimal, it's likely in pounds
 if (!Number.isInteger(v)) {
  return Number(v.toFixed(2));
 }
 
 // For integers, large values are likely in pence, convert to pounds
 if (v >= 1000) {
  return Number((v / 100).toFixed(2)); // Convert from pence to pounds
 }
 
 // Small integers are likely already in pounds
 return Number(v.toFixed(2));
};

const asPercentage = (v: number): number => {
 if (!Number.isFinite(v)) return 0;
 
 // If > 100, it's likely in basis points, convert to percentage
 if (v > 100) {
  return Number((v / 100).toFixed(2)); // Convert from bps to percentage
 }
 
 // Otherwise it's likely already a percentage
 return Number(v.toFixed(2));
};

export function normalizeDebt(input: In): Debt {
 // Handle null/undefined input
 if (!input || typeof input !== 'object') {
  throw new Error('Invalid debt input: expected object');
 }

 const now = new Date().toISOString();
 const inputVersion = input._norm_v || 0;

 // 1) If normalized fields exist, trust them
 const hasNormalized =
  input.amount_pennies != null ||
  input.min_payment_pennies != null ||
  input.apr != null;

 // Convert to UK format (pounds and percentages)
 const amount = input.amount != null
  ? Number(Number(input.amount).toFixed(2))
  : input.balance != null
  ? asPounds(Number(input.balance))
  : input.amount_pennies != null
  ? asPounds(Number(input.amount_pennies))
  : 0;

 const min_payment = input.min_payment != null
  ? Number(Number(input.min_payment).toFixed(2))
  : input.minPayment != null
  ? asPounds(Number(input.minPayment))
  : input.min_payment_pennies != null
  ? asPounds(Number(input.min_payment_pennies))
  : 0;

 const apr = input.apr != null
  ? Number(Number(input.apr).toFixed(2))
  : input.interestRate != null
  ? asPercentage(Number(input.interestRate))
  : input.apr_bps != null
  ? asPercentage(Number(input.apr_bps))
  : 0;

 // Handle limit in pounds
 const limit = input.limit != null
  ? Number(Number(input.limit).toFixed(2))
  : input.limit_pennies != null
  ? asPounds(Number(input.limit_pennies))
  : input.credit_limit_pennies != null
  ? asPounds(Number(input.credit_limit_pennies))
  : null;

 // Handle original_amount for progress tracking
 const original_amount = input.original_amount != null
  ? Number(Number(input.original_amount).toFixed(2))
  : input.original_amount_pennies != null
  ? asPounds(Number(input.original_amount_pennies))
  : null;

 // Track normalization patterns for telemetry
 const telemetryData = {
  input_version: inputVersion,
  output_version: 2,
  version_upgraded: inputVersion < 2,
  had_normalized_fields: hasNormalized,
  had_legacy_fields: !!(input.balance != null || input.interestRate != null || input.minPayment != null),
  mixed_format: hasNormalized && !!(input.balance != null || input.interestRate != null || input.minPayment != null),
  heuristics_used: {
   balance_heuristic: !hasNormalized && input.balance != null,
   interest_heuristic: !hasNormalized && input.interestRate != null,
   payment_heuristic: !hasNormalized && input.minPayment != null,
  },
  conversions_applied: {
   balance_converted: !hasNormalized && input.balance != null && !Number.isInteger(input.balance),
   balance_kept_as_cents: !hasNormalized && input.balance != null && Number.isInteger(input.balance) && input.balance >= 1000,
   interest_converted: !hasNormalized && input.interestRate != null && input.interestRate <= 100,
   interest_kept_as_bps: !hasNormalized && input.interestRate != null && input.interestRate > 100,
  }
 };

 const result = {
  id: String(input.id ?? crypto.randomUUID()),
  name: String(input.name ?? input.debtName ?? 'Untitled'),
  amount: Math.max(0, amount),
  min_payment: Math.max(0, min_payment),
  apr: Math.max(0, Math.min(100, apr)), // Cap at 100%
  debt_type: input.debt_type || input.type || 'credit_card',
  limit: limit && limit > 0 ? limit : null,
  order_index: Number.isFinite(input.order_index) ? input.order_index : 
         Number.isFinite(input.order) ? input.order : 0,
  created_at: input.created_at ?? now,
  updated_at: now,
  original_amount: original_amount || amount,
 };

 // Send telemetry (non-blocking)
 try {
  captureNormalizationTelemetry(telemetryData);
 } catch (telemetryError) {
  // Never block normalization for telemetry failures
  if (process.env.NODE_ENV === 'development') {
   console.debug('[Normalize] Telemetry failed:', telemetryError);
  }
 }

 return result;
}

// Batch normalizer
export function normalizeDebts(inputs: In[]): Debt[] {
 if (!Array.isArray(inputs)) {
  console.warn('[normalize] Expected array, got:', typeof inputs);
  return [];
 }

 return inputs
  .filter(input => input && typeof input === 'object')
  .map(normalizeDebt);
}

// Legacy compatibility exports
export const safeNormalizeDebt = normalizeDebt;
export const safeNormalizeDebts = normalizeDebts;

// --- Telemetry ---
interface NormalizationTelemetry {
 input_version: number;
 output_version: number; 
 version_upgraded: boolean;
 had_normalized_fields: boolean;
 had_legacy_fields: boolean;
 mixed_format: boolean;
 heuristics_used: {
  balance_heuristic: boolean;
  interest_heuristic: boolean;
  payment_heuristic: boolean;
 };
 conversions_applied: {
  balance_converted: boolean;
  balance_kept_as_cents: boolean;
  interest_converted: boolean;
  interest_kept_as_bps: boolean;
 };
}

// Session-level counters to batch telemetry events
let sessionTelemetry = {
 normalizations: 0,
 version_upgrades: 0,
 mixed_format_fixes: 0,
 heuristic_usage: 0,
 last_sent: Date.now(),
 session_started: Date.now()
};

// Track unique patterns per session to avoid spam
const sessionPatterns = new Set<string>();

function captureNormalizationTelemetry(data: NormalizationTelemetry): void {
 // Update session counters
 sessionTelemetry.normalizations++;
 if (data.version_upgraded) sessionTelemetry.version_upgrades++;
 if (data.mixed_format) sessionTelemetry.mixed_format_fixes++;
 if (Object.values(data.heuristics_used).some(Boolean)) sessionTelemetry.heuristic_usage++;

 // Send individual event for significant patterns (mixed format, version upgrade)
 // But only once per unique pattern per session to avoid spam
 if (data.mixed_format || data.version_upgraded) {
  const patternKey = `${data.mixed_format ? 'mixed' : ''}${data.version_upgraded ? 'upgrade' : ''}`;
  
  if (!sessionPatterns.has(patternKey)) {
   sessionPatterns.add(patternKey);
   
   // Async to avoid blocking
   setTimeout(() => {
    try {
     if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('debt_normalization_pattern', {
       ...data,
       session_count: sessionTelemetry.normalizations,
       pattern_key: patternKey,
       first_occurrence_in_session: true,
       timestamp: new Date().toISOString()
      });
     }
    } catch (error) {
     // Swallow telemetry errors
    }
   }, 0);
  }
 }

 // Send batched session summary every 10 normalizations or after 30 seconds
 const timeSinceLastSent = Date.now() - sessionTelemetry.last_sent;
 if (sessionTelemetry.normalizations % 10 === 0 || timeSinceLastSent > 30000) {
  setTimeout(() => {
   try {
    if (typeof window !== 'undefined' && window.posthog) {
     window.posthog.capture('debt_normalization_session', {
      total_normalizations: sessionTelemetry.normalizations,
      version_upgrades: sessionTelemetry.version_upgrades,
      mixed_format_fixes: sessionTelemetry.mixed_format_fixes,
      heuristic_usage: sessionTelemetry.heuristic_usage,
      upgrade_rate: sessionTelemetry.version_upgrades / sessionTelemetry.normalizations,
      mixed_format_rate: sessionTelemetry.mixed_format_fixes / sessionTelemetry.normalizations,
      session_duration_ms: timeSinceLastSent,
      timestamp: new Date().toISOString()
     });

     sessionTelemetry.last_sent = Date.now();
    }
   } catch (error) {
    // Swallow telemetry errors
   }
  }, 0);
 }
}

// UI helpers that never return NaN
export const safeFromCents = (cents: number | string): number => {
 const num = Number(cents) || 0;
 return Math.max(0, Math.round(num)) / 100;
};

export const safeBpsToPercent = (bps: number | string): number => {
 const num = Number(bps) || 0;
 return Math.max(0, Math.min(10000, Math.round(num))) / 100;
};

// Debug helper to view telemetry stats
export const getNormalizationStats = () => {
 return {
  ...sessionTelemetry,
  session_duration_ms: Date.now() - sessionTelemetry.session_started,
  patterns_seen: Array.from(sessionPatterns),
  rates: {
   upgrade_rate: sessionTelemetry.version_upgrades / Math.max(1, sessionTelemetry.normalizations),
   mixed_format_rate: sessionTelemetry.mixed_format_fixes / Math.max(1, sessionTelemetry.normalizations),
   heuristic_usage_rate: sessionTelemetry.heuristic_usage / Math.max(1, sessionTelemetry.normalizations)
  }
 };
};

// Expose to window for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
 (window as any).__NORMALIZATION_STATS__ = getNormalizationStats;
}