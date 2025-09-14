/**
 * Unit tests for debtContext - GPT context builder
 */

import { 
 buildDebtContext, 
 buildFallbackContext, 
 formatContextForPrompt,
 validateDebtContext
} from '../debtContext';
import type { NormalizedDebt } from '../../adapters/debts';

describe('debtContext selectors', () => {
 const mockNormalizedDebts: NormalizedDebt[] = [
  {
   id: '1',
   name: 'MBNA Card',
   issuer: 'MBNA',
   debt_type: 'Credit Card',
   amount_pennies: 250000, // £2,500
   apr: 1995, // 19.95%
   min_payment_pennies: 5000, // £50
   order_index: 1,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: false
  },
  {
   id: '2',
   name: 'Overdraft',
   issuer: 'Barclays',
   debt_type: 'Overdraft',
   amount_pennies: 85000, // £850
   apr: 3900, // 39%
   min_payment_pennies: 2500, // £25
   order_index: 2,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: false
  },
  {
   id: '3',
   name: 'Paid Off Card',
   issuer: 'Santander',
   debt_type: 'Credit Card',
   amount_pennies: 0, // £0 - should be filtered out
   apr: 2200,
   min_payment_pennies: 0,
   order_index: 3,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: false
  },
  {
   id: '4',
   name: 'Deleted Debt',
   issuer: 'Halifax',
   debt_type: 'Credit Card',
   amount_pennies: 100000,
   apr: 2500,
   min_payment_pennies: 3000,
   order_index: 4,
   created_at: Date.now(),
   updated_at: Date.now(),
   deleted: true // Should be filtered out
  }
 ];

 describe('buildDebtContext', () => {
  it('converts normalized debts to clean display context', () => {
   const context = buildDebtContext(mockNormalizedDebts);

   expect(context).toEqual({
    schema_version: 2,
    total_debt_gbp: 3350, // £2500 + £850
    total_min_gbp: 75,  // £50 + £25 
    debt_count: 2,    // Only active debts
    debts: [
     {
      id: '1',
      name: 'MBNA Card',
      issuer: 'MBNA', 
      balance_gbp: 2500,
      apr_pct: 19.95,
      min_payment_gbp: 50
     },
     {
      id: '2',
      name: 'Overdraft',
      issuer: 'Barclays',
      balance_gbp: 850,
      apr_pct: 39,
      min_payment_gbp: 25
     }
    ]
   });
  });

  it('filters out deleted and zero-balance debts', () => {
   const context = buildDebtContext(mockNormalizedDebts);
   
   // Should only include the 2 active debts (not the deleted or zero-balance ones)
   expect(context.debt_count).toBe(2);
   expect(context.debts).toHaveLength(2);
   expect(context.debts.some(d => d.id === '3')).toBe(false); // Zero balance filtered
   expect(context.debts.some(d => d.id === '4')).toBe(false); // Deleted filtered
  });

  it('handles empty debt array', () => {
   const context = buildDebtContext([]);

   expect(context).toEqual({
    schema_version: 2,
    total_debt_gbp: 0,
    total_min_gbp: 0,
    debt_count: 0,
    debts: []
   });
  });

  it('handles debts with missing name/issuer gracefully', () => {
   const incompleteDebt: NormalizedDebt = {
    id: '5',
    name: '',
    issuer: '',
    debt_type: 'Credit Card',
    amount_pennies: 100000,
    apr: 2000,
    min_payment_pennies: 2500,
    order_index: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted: false
   };

   const context = buildDebtContext([incompleteDebt]);

   expect(context.debts[0]).toEqual({
    id: '5',
    name: 'Unnamed Debt',
    issuer: 'Unknown Issuer',
    balance_gbp: 1000,
    apr_pct: 20,
    min_payment_gbp: 25
   });
  });
 });

 describe('buildFallbackContext', () => {
  it('returns empty but valid context structure', () => {
   const context = buildFallbackContext();

   expect(context).toEqual({
    schema_version: 2,
    total_debt_gbp: 0,
    total_min_gbp: 0,
    debt_count: 0,
    debts: []
   });
  });
 });

 describe('formatContextForPrompt', () => {
  it('returns properly formatted JSON string', () => {
   const context = buildDebtContext(mockNormalizedDebts.slice(0, 1));
   const formatted = formatContextForPrompt(context);

   expect(typeof formatted).toBe('string');
   expect(formatted).toContain('"schema_version": 2');
   expect(formatted).toContain('"balance_gbp": 2500');
   expect(formatted).toContain('"apr_pct": 19.95');
   
   // Should be valid JSON
   expect(() => JSON.parse(formatted)).not.toThrow();
  });
 });

 describe('validateDebtContext', () => {
  it('validates correct context structure', () => {
   const context = buildDebtContext(mockNormalizedDebts);
   expect(validateDebtContext(context)).toBe(true);
  });

  it('rejects context with missing required fields', () => {
   const invalidContext = {
    schema_version: 2,
    // Missing total_debt_gbp
    total_min_gbp: 100,
    debt_count: 1,
    debts: []
   } as any;

   expect(validateDebtContext(invalidContext)).toBe(false);
  });

  it('detects legacy field contamination', () => {
   const contaminatedContext = {
    schema_version: 2,
    total_debt_gbp: 1000,
    total_min_gbp: 50,
    debt_count: 1,
    debts: [{
     id: '1',
     name: 'Test',
     issuer: 'Test',
     balance_gbp: 1000,
     apr_pct: 20,
     min_payment_gbp: 50,
     balance: 1000 // ❌ Legacy field - should be rejected
    }]
   };

   expect(validateDebtContext(contaminatedContext)).toBe(false);
  });

  it('rejects null or invalid input', () => {
   expect(validateDebtContext(null as any)).toBe(false);
   expect(validateDebtContext('string' as any)).toBe(false);
   expect(validateDebtContext({} as any)).toBe(false);
  });
 });

 describe('integration with computeDebtTotals', () => {
  it('uses consistent totals calculation', () => {
   // This ensures buildDebtContext uses the same selector as other components
   const context = buildDebtContext(mockNormalizedDebts);
   
   // Should match manual calculation of active debts
   const activeDebts = mockNormalizedDebts.filter(d => !d.deleted && d.amount_pennies > 0);
   const expectedTotal = activeDebts.reduce((sum, d) => sum + d.amount_pennies, 0) / 100;
   const expectedMinTotal = activeDebts.reduce((sum, d) => sum + d.min_payment_pennies, 0) / 100;
   
   expect(context.total_debt_gbp).toBe(expectedTotal);
   expect(context.total_min_gbp).toBe(expectedMinTotal);
  });
 });
});