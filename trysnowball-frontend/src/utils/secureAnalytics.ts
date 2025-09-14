/**
 * Secure Analytics Utilities
 * De-identifies PII before sending to analytics providers
 */

import { bandAmount, bandDelta, bandTotal, toPennies, type AmountBandId, type DeltaBandId } from '../shared/amountBands';

// Browser-side issuer hashing (HMAC not available, use simple hash)
async function hashIssuer(issuer: string): Promise<string> {
 if (!issuer) return 'unknown';
 
 // Normalize issuer name
 const normalized = issuer.toLowerCase().trim();
 
 // Use SubtleCrypto to hash
 const encoder = new TextEncoder();
 const data = encoder.encode(normalized);
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 
 // Convert to hex string
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 
 // Return first 8 chars for brevity
 return hashHex.substring(0, 8);
}

export interface DebtAnalytics {
 amount_band: AmountBandId;
 debt_type: string;
 issuer_hash: string;
 user_tier: 'free' | 'pro' | 'trial';
 country?: string;
}

export interface PortfolioAnalytics {
 total_band: AmountBandId;
 num_debts: number;
 mix: Record<string, number>;
 avg_apr_band?: string;
}

/**
 * Prepare debt data for analytics (de-identified)
 */
export async function prepareDebtAnalytics(debt: {
 balance: number;
 name?: string;
 type?: string;
}, userTier: 'free' | 'pro' | 'trial' = 'free'): Promise<DebtAnalytics> {
 const issuerHash = await hashIssuer(debt.name || 'unknown');
 const amountBand = bandAmount(toPennies(debt.balance));
 
 return {
  amount_band: amountBand,
  debt_type: debt.type || 'other',
  issuer_hash: issuerHash,
  user_tier: userTier,
  country: 'GB' // Default to GB for now
 };
}

/**
 * Prepare portfolio snapshot for analytics
 */
export async function preparePortfolioAnalytics(debts: Array<{
 balance: number;
 type?: string;
 interestRate?: number;
}>): Promise<PortfolioAnalytics> {
 const totalPennies = debts.reduce((sum, debt) => sum + toPennies(debt.balance), 0);
 const totalBand = bandTotal(totalPennies);
 
 // Count by type
 const mix: Record<string, number> = {};
 debts.forEach(debt => {
  const type = debt.type || 'other';
  mix[type] = (mix[type] || 0) + 1;
 });
 
 // Average APR band (optional)
 const validAPRs = debts.filter(d => d.interestRate && d.interestRate > 0);
 let avgAprBand: string | undefined;
 if (validAPRs.length > 0) {
  const avgAPR = validAPRs.reduce((sum, d) => sum + (d.interestRate || 0), 0) / validAPRs.length;
  if (avgAPR < 10) avgAprBand = '0-10%';
  else if (avgAPR < 20) avgAprBand = '10-20%';
  else if (avgAPR < 30) avgAprBand = '20-30%';
  else avgAprBand = '30%+';
 }
 
 return {
  total_band: totalBand,
  num_debts: debts.length,
  mix,
  avg_apr_band: avgAprBand
 };
}

/**
 * Prepare debt update event
 */
export function prepareDebtUpdateAnalytics(oldBalance: number, newBalance: number): {
 delta_band: DeltaBandId;
 direction: 'increase' | 'decrease' | 'unchanged';
} {
 const deltaPennies = toPennies(newBalance) - toPennies(oldBalance);
 const deltaBand = bandDelta(deltaPennies);
 
 let direction: 'increase' | 'decrease' | 'unchanged' = 'unchanged';
 if (deltaPennies > 0) direction = 'increase';
 else if (deltaPennies < 0) direction = 'decrease';
 
 return {
  delta_band: deltaBand,
  direction
 };
}

/**
 * Check if analytics is enabled (opt-in)
 */
export function isAnalyticsEnabled(): boolean {
 // Check localStorage for opt-in preference
 const preference = localStorage.getItem('analytics_opt_in');
 return preference === 'true';
}

/**
 * Set analytics opt-in preference
 */
export function setAnalyticsOptIn(enabled: boolean): void {
 localStorage.setItem('analytics_opt_in', enabled ? 'true' : 'false');
 
 // Also update PostHog if it's loaded
 if (typeof window !== 'undefined' && (window as any).posthog) {
  if (enabled) {
   (window as any).posthog.opt_in_capturing();
  } else {
   (window as any).posthog.opt_out_capturing();
  }
 }
}

/**
 * Capture debt added event (de-identified)
 */
export async function captureDebtAdded(debt: {
 balance: number;
 name?: string;
 type?: string;
}, userTier?: 'free' | 'pro' | 'trial'): Promise<void> {
 if (!isAnalyticsEnabled()) return;
 
 const analytics = await prepareDebtAnalytics(debt, userTier);
 
 if (typeof window !== 'undefined' && (window as any).posthog) {
  (window as any).posthog.capture('debt_added', analytics);
 }
}

/**
 * Capture debt updated event
 */
export function captureDebtUpdated(
 oldBalance: number, 
 newBalance: number, 
 debtId?: string,
 userId?: string,
 source: string = 'unknown'
): void {
 if (!isAnalyticsEnabled()) return;
 
 const analytics = {
  ...prepareDebtUpdateAnalytics(oldBalance, newBalance),
  debt_id: debtId,
  user_id: userId,
  ts: Date.now(),
  source
 };
 
 if (process.env.NODE_ENV === 'development') {
  console.debug('[analytics] debt_updated:', analytics);
 }
 
 if (typeof window !== 'undefined' && (window as any).posthog) {
  (window as any).posthog.capture('debt_updated', analytics);
 }
}

/**
 * Capture portfolio snapshot
 */
export async function capturePortfolioSnapshot(
 debts: Array<{
  balance: number;
  type?: string;
  interestRate?: number;
 }>,
 userId?: string,
 source: string = 'unknown'
): Promise<void> {
 if (!isAnalyticsEnabled()) return;
 
 const analytics = {
  ...(await preparePortfolioAnalytics(debts)),
  user_id: userId,
  ts: Date.now(),
  source
 };
 
 if (process.env.NODE_ENV === 'development') {
  console.debug('[analytics] portfolio_snapshot:', analytics);
 }
 
 if (typeof window !== 'undefined' && (window as any).posthog) {
  (window as any).posthog.capture('portfolio_snapshot', analytics);
 }
}

/**
 * General secure analytics event tracking
 * Use this for events that don't need special PII handling
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
 if (!isAnalyticsEnabled()) return;
 
 if (process.env.NODE_ENV === 'development') {
  console.debug(`[analytics] ${eventName}:`, properties);
 }
 
 if (typeof window !== 'undefined' && (window as any).posthog) {
  (window as any).posthog.capture(eventName, properties);
 }
}

/**
 * Capture payment recorded event
 */
export async function capturePaymentRecorded(payment: {
 debt_id: string;
 amount_pennies: number;
 source: string;
}): Promise<void> {
 if (!isAnalyticsEnabled()) return;

 const properties = {
  debt_id: payment.debt_id, // Keep for debt-specific analysis
  amount_band: bandAmount(payment.amount_pennies),
  source: payment.source
 };

 trackEvent('payment_recorded', properties);
}

/**
 * Capture payment history viewed event
 */
export async function capturePaymentHistoryViewed(data: {
 debt_id: string;
 count: number;
}): Promise<void> {
 if (!isAnalyticsEnabled()) return;

 const properties = {
  debt_id: data.debt_id,
  count: data.count
 };

 trackEvent('payment_history_viewed', properties);
}

/**
 * Capture payments plan opened event
 */
export async function capturePaymentsPlanOpened(data: {
 debtCount: number;
 totalMin_cents: number;
 extraBudget_cents: number;
}): Promise<void> {
 if (!isAnalyticsEnabled()) return;

 const properties = {
  debtCount: data.debtCount,
  totalMin_band: bandAmount(data.totalMin_cents),
  extraBudget_band: bandAmount(data.extraBudget_cents)
 };

 trackEvent('payments_plan_opened', properties);
}

/**
 * Capture payments plan posted event
 */
export async function capturePaymentsPlanPosted(data: {
 lines: number;
 strategy: string;
 extraAllocated_cents: number;
 paymentsCreated: number;
}): Promise<void> {
 if (!isAnalyticsEnabled()) return;

 const properties = {
  lines: data.lines,
  strategy: data.strategy,
  extraAllocated_band: bandAmount(data.extraAllocated_cents),
  paymentsCreated: data.paymentsCreated
 };

 trackEvent('payments_plan_posted', properties);
}

/**
 * Capture hydration complete event for timing analysis
 */
export function captureHydrationComplete(data: {
 total_time_ms: number;
 auth_time_ms: number;
 local_time_ms: number;
 remote_time_ms: number;
 auth_status: string;
 debt_count: number;
 used_remote: boolean;
 had_error: boolean;
}): void {
 if (!isAnalyticsEnabled()) return;

 const properties = {
  total_time_ms: data.total_time_ms,
  auth_time_ms: data.auth_time_ms,
  local_time_ms: data.local_time_ms,
  remote_time_ms: data.remote_time_ms,
  auth_status: data.auth_status,
  debt_count: data.debt_count,
  used_remote: data.used_remote,
  had_error: data.had_error,
  performance_category: data.total_time_ms < 500 ? 'fast' : 
             data.total_time_ms < 2000 ? 'moderate' : 'slow'
 };

 trackEvent('hydration_complete', properties);
}

// Export as default object for easier importing
export const secureAnalytics = {
 trackEvent,
 prepareDebtAnalytics,
 preparePortfolioAnalytics,
 prepareDebtUpdateAnalytics,
 captureDebtAdded,
 captureDebtUpdated,
 capturePortfolioSnapshot,
 capturePaymentRecorded,
 capturePaymentHistoryViewed,
 capturePaymentsPlanOpened,
 capturePaymentsPlanPosted,
 captureHydrationComplete,
 isAnalyticsEnabled,
 setAnalyticsOptIn
};