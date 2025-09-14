/**
 * Runtime Invariant Assertions
 * Cheap guardrails that catch data corruption in development
 */

export function assertFiniteAndNonNegative(value: number, fieldName: string): void {
 if (process.env.NODE_ENV !== 'production') {
  if (!Number.isFinite(value)) {
   console.error(`[Invariant] ${fieldName} is not finite: ${value}`);
   throw new Error(`Invariant violation: ${fieldName} must be finite`);
  }
  if (value < 0) {
   console.error(`[Invariant] ${fieldName} is negative: ${value}`);
   throw new Error(`Invariant violation: ${fieldName} must be non-negative`);
  }
 }
}

export function assertValidDebtTotals(totals: any): void {
 if (process.env.NODE_ENV !== 'production') {
  const requiredFields = ['totalDebt', 'totalMinPayments'];
  
  for (const field of requiredFields) {
   if (totals[field] !== undefined) {
    assertFiniteAndNonNegative(totals[field], field);
   }
  }
  
  // Business logic invariants
  if (totals.totalMinPayments > totals.totalDebt) {
   console.warn(`[Invariant] Total minimum payments (${totals.totalMinPayments}) exceed total debt (${totals.totalDebt})`);
  }
 }
}

export function assertDebtOrderContiguous(debts: any[]): void {
 if (process.env.NODE_ENV !== 'production') {
  const orderedDebts = debts.filter(d => d.order !== undefined && Number.isFinite(d.order));
  
  if (orderedDebts.length === 0) return; // No ordered debts
  
  const orders = orderedDebts.map(d => d.order).sort((a, b) => a - b);
  
  for (let i = 0; i < orders.length - 1; i++) {
   if (orders[i + 1] - orders[i] !== 1) {
    console.error('[Invariant] Debt order not contiguous:', orders);
    throw new Error('Invariant violation: debt order must be contiguous');
   }
  }
  
  // Should start from 1 or 0
  if (orders[0] !== 0 && orders[0] !== 1) {
   console.warn(`[Invariant] Debt order starts from ${orders[0]}, expected 0 or 1`);
  }
 }
}

export function assertNoDuplicateDebtIds(debts: any[]): void {
 if (process.env.NODE_ENV !== 'production') {
  const ids = debts.map(d => d.id).filter(id => id !== undefined);
  const uniqueIds = new Set(ids);
  
  if (uniqueIds.size !== ids.length) {
   const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
   console.error('[Invariant] Duplicate debt IDs found:', duplicates);
   throw new Error('Invariant violation: debt IDs must be unique');
  }
 }
}

export function assertDemoDataIsolation(debts: any[], includeDemo: boolean): void {
 if (process.env.NODE_ENV !== 'production') {
  const demoDebts = debts.filter(d => d.isDemo === true);
  
  if (!includeDemo && demoDebts.length > 0) {
   console.error('[DemoLeak] Demo data leaked into normal debt list:', demoDebts);
   throw new Error('Invariant violation: demo data found in normal debt list');
  }
  
  if (includeDemo && demoDebts.length === 0 && debts.length > 0) {
   // This might be OK, but worth logging for debugging
   console.debug('[Demo] No demo data found despite includeDemo=true');
  }
 }
}

export function assertValidDebtStructure(debt: any): void {
 if (process.env.NODE_ENV !== 'production') {
  const requiredFields = ['id', 'name', 'amount_pennies', 'apr_bps', 'min_payment_pennies'];
  
  for (const field of requiredFields) {
   if (debt[field] === undefined || debt[field] === null) {
    console.error(`[Invariant] Debt missing required field '${field}':`, debt);
    throw new Error(`Invariant violation: debt must have ${field}`);
   }
  }
  
  // Type checks
  if (typeof debt.id !== 'string' || debt.id.length === 0) {
   throw new Error('Invariant violation: debt.id must be non-empty string');
  }
  
  if (typeof debt.name !== 'string' || debt.name.length === 0) {
   throw new Error('Invariant violation: debt.name must be non-empty string');
  }
  
  // Numeric field checks
  assertFiniteAndNonNegative(debt.amount_pennies, 'amount_pennies');
  assertFiniteAndNonNegative(debt.apr, 'apr_bps');
  assertFiniteAndNonNegative(debt.min_payment_pennies, 'min_payment_pennies');
  
  // Business logic checks
  if (debt.apr > 10000) { // > 100%
   console.warn(`[Invariant] Unusually high APR: ${debt.apr} bps (${debt.apr/100}%)`);
  }
  
  if (debt.min_payment_pennies > debt.amount_pennies * 2) { // Min payment > 200% of debt
   console.warn(`[Invariant] Unusually high minimum payment: ${debt.min_payment_pennies} vs debt ${debt.amount_pennies}`);
  }
 }
}

export function assertAnalyticsEventStructure(eventName: string, properties: any): void {
 if (process.env.NODE_ENV !== 'production') {
  if (typeof eventName !== 'string' || eventName.length === 0) {
   throw new Error('Invariant violation: analytics event name must be non-empty string');
  }
  
  if (properties && typeof properties !== 'object') {
   throw new Error('Invariant violation: analytics properties must be object');
  }
  
  // Check for common analytics issues
  if (properties) {
   for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
     console.error(`[Invariant] Non-finite number in analytics: ${key} = ${value}`);
     throw new Error(`Invariant violation: analytics property ${key} must be finite`);
    }
    
    if (value === undefined) {
     console.warn(`[Invariant] Undefined value in analytics property: ${key}`);
    }
   }
  }
 }
}

// Helper to wrap functions with invariant checks
export function withInvariantCheck<T extends (...args: any[]) => any>(
 fn: T,
 invariantCheck: (result: ReturnType<T>, ...args: Parameters<T>) => void
): T {
 return ((...args: Parameters<T>): ReturnType<T> => {
  const result = fn(...args);
  
  if (process.env.NODE_ENV !== 'production') {
   try {
    invariantCheck(result, ...args);
   } catch (error) {
    console.error('[Invariant] Check failed after function call:', error);
    // Re-throw to fail fast in development
    throw error;
   }
  }
  
  return result;
 }) as T;
}