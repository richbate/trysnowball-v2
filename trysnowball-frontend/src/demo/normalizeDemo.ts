/**
 * Demo Data Normalizer
 * Ensures demo data ALWAYS uses normalized field names
 */

export interface LegacyDemoDebt {
 id: string;
 name: string;
 type?: string;
 balance?: number;
 originalAmount?: number;
 minPayment?: number;
 interestRate?: number;
 rate?: number;
 minimumPayment?: number;
 order?: number;
 isDemo?: boolean;
 source?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface NormalizedDebt {
 id: string;
 name: string;
 debt_type: string;
 amount_pennies: number;
 original_amount_pennies: number;
 min_payment_pennies: number;
 apr: number;
 order: number;
 isDemo: boolean;
 source?: string;
 createdAt: string;
 updatedAt: string;
}

/**
 * Convert any demo debt format to normalized format
 */
export function toNormalized(debt: LegacyDemoDebt | any): NormalizedDebt {
 // Extract values with fallbacks for different field names
 // eslint-disable-next-line no-restricted-syntax
 const balance = debt.balance ?? debt.amount ?? 0;
 // eslint-disable-next-line no-restricted-syntax
 const interestRate = debt.interestRate ?? debt.rate ?? debt.apr ?? 0;
 // eslint-disable-next-line no-restricted-syntax
 const minPayment = debt.minPayment ?? debt.minimumPayment ?? debt.minimum ?? 0;
 const originalAmount = debt.originalAmount ?? debt.original ?? balance;
 
 return {
  id: debt.id || `demo_${Date.now()}`,
  name: debt.name || 'Unknown Debt',
  debt_type: debt.debt_type || debt.type || 'Credit Card',
  amount_pennies: Math.round(balance * 100),
  original_amount_pennies: Math.round(originalAmount * 100),
  min_payment_pennies: Math.round(minPayment * 100),
  apr: Math.round(interestRate * 100),
  order: debt.order ?? 0,
  isDemo: true,
  source: debt.source || 'demo',
  createdAt: debt.createdAt || new Date().toISOString(),
  updatedAt: debt.updatedAt || new Date().toISOString()
 };
}

/**
 * Runtime assertion to ensure data is normalized
 */
export function assertNormalized(debt: any): void {
 if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-restricted-syntax
  const legacyFields = ['balance', 'interestRate', 'minPayment', 'type', 'originalAmount'];
  const foundLegacy = legacyFields.filter(field => field in debt);
  
  if (foundLegacy.length > 0) {
   console.error('❌ Demo debt contains legacy fields:', foundLegacy, debt);
   throw new Error(`Demo debt not normalized! Found legacy fields: ${foundLegacy.join(', ')}`);
  }
  
  if (!Number.isInteger(debt?.amount_pennies)) {
   throw new Error('Demo debt missing or invalid amount_pennies (must be integer)');
  }
  if (!Number.isInteger(debt?.apr)) {
   throw new Error('Demo debt missing or invalid apr_bps (must be integer)');
  }
  if (!Number.isInteger(debt?.min_payment_pennies)) {
   throw new Error('Demo debt missing or invalid min_payment_pennies (must be integer)');
  }
  if (!debt?.debt_type) {
   throw new Error('Demo debt missing debt_type');
  }
 }
}

/**
 * Normalize and validate an array of demo debts
 */
export function normalizeDemoDebts(rawDebts: any[]): NormalizedDebt[] {
 const normalized = rawDebts.map(toNormalized);
 
 if (process.env.NODE_ENV === 'development') {
  normalized.forEach(assertNormalized);
 }
 
 return normalized;
}