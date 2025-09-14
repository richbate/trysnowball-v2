/**
 * Safe debt update helpers to prevent partial update validation errors
 * Ensures required fields are always preserved during updates
 */

export interface DebtUpdate {
 // Core identifiers
 id?: string;
 issuer?: string;
 debt_type?: string;
 
 // Financial data (normalized format)
 amount_pennies?: number;
 apr_bps?: number;
 min_payment_pennies?: number;
 
 // Metadata
 order_index?: number;
 updated_at?: number;
 
 // Legacy support (will be converted)
 balance?: number;
 interestRate?: number;
 minPayment?: number;
 name?: string; // maps to issuer
}

export interface Debt {
 // Core identifiers
 id: string;
 issuer: string;
 debt_type: string;
 
 // Financial data
 amount_pennies: number;
 apr: number;
 min_payment_pennies: number;
 
 // Metadata
 order_index: number;
 created_at: number;
 updated_at: number;
}

/**
 * Safe partial update helper - prevents validation errors by merging with existing debt
 */
export async function updateDebtPartial(
 id: string, 
 patch: DebtUpdate, 
 getExistingDebt: (id: string) => Promise<Debt | null>,
 upsertDebt: (debt: Debt) => Promise<void>
): Promise<void> {
 const existing = await getExistingDebt(id);
 if (!existing) {
  throw new Error(`Debt not found: ${id}`);
 }

 // Normalize legacy fields to canonical format
 const normalizedPatch: Partial<Debt> = { ...patch };
 
 // Convert legacy fields if present
 if (patch.balance !== undefined) {
  normalizedPatch.amount_pennies = Math.round(Number(patch.balance) * 100);
  delete normalizedPatch.balance;
 }
 
 if (patch.interestRate !== undefined) {
  normalizedPatch.apr = Math.round(Number(patch.interestRate) * 100);
  delete normalizedPatch.interestRate;
 }
 
 if (patch.minPayment !== undefined) {
  normalizedPatch.min_payment_pennies = Math.round(Number(patch.minPayment) * 100);
  delete normalizedPatch.minPayment;
 }
 
 if (patch.name !== undefined) {
  normalizedPatch.issuer = patch.name;
  delete normalizedPatch.name;
 }

 // Enforce canonical shape - reject legacy field names
 if ('amount' in normalizedPatch) throw new Error("Use amount_pennies instead of amount");
 if ('apr_pct' in normalizedPatch) throw new Error("Use apr_bps instead of apr_pct");
 if ('apr' in normalizedPatch) throw new Error("Use apr_bps instead of apr");

 // Canonical merge - preserves all required fields
 const merged: Debt = {
  ...existing,
  ...normalizedPatch,
  updated_at: Date.now(),
 };

 await upsertDebt(merged);
}

/**
 * Convert legacy debt data to canonical format
 */
export function normalizeDebtData(legacyDebt: any): DebtUpdate {
 const normalized: DebtUpdate = {
  id: legacyDebt.id,
  issuer: legacyDebt.name || legacyDebt.issuer,
  debt_type: legacyDebt.type || legacyDebt.debt_type || 'Credit Card',
 };

 // Convert financial data to cents/bps
 if (legacyDebt.balance !== undefined || legacyDebt.amount !== undefined) {
  const amount = legacyDebt.balance ?? legacyDebt.amount ?? 0;
  normalized.amount_pennies = Math.round(Number(amount) * 100);
 }

 if (legacyDebt.interestRate !== undefined || legacyDebt.apr !== undefined) {
  const apr = legacyDebt.interestRate ?? legacyDebt.apr ?? 0;
  normalized.apr = Math.round(Number(apr) * 100);
 }

 if (legacyDebt.minPayment !== undefined || legacyDebt.min_payment !== undefined) {
  const minPayment = legacyDebt.minPayment ?? legacyDebt.min_payment ?? 0;
  normalized.min_payment_pennies = Math.round(Number(minPayment) * 100);
 }

 if (legacyDebt.order !== undefined || legacyDebt.order_index !== undefined) {
  normalized.order_index = legacyDebt.order ?? legacyDebt.order_index;
 }

 return normalized;
}