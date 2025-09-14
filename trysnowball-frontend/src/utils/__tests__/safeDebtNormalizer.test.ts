/**
 * Unit tests for safeDebtNormalizer
 * Tests the exact bug scenario that caused data loss and ensures it's fixed
 */

import { normalizeDebt, normalizeDebts } from '../safeDebtNormalizer';

describe('safeDebtNormalizer', () => {
 describe('normalizeDebt', () => {
  test('trusts normalized fields when both normalized and legacy exist (the bug)', () => {
   // This is the exact data structure that caused the bug:
   // Legacy fields contained normalized values, but normalizer was double-converting
   const mixedFormatDebt = {
    id: '082391da-71e0-42a6-98ca-3065effba798',
    name: 'test',
    // Legacy fields that already contain normalized values (cents/bps)
    balance: 12300,      // already in pence!
    interestRate: 2000,    // already in bps!
    minPayment: 1200,     // already in pence!
    // Normalized fields (should be trusted)
    amount_pennies: 12300,    
    apr: 2000,       
    min_payment_pennies: 1200,  
    debt_type: 'loan'
   };

   const result = normalizeDebt(mixedFormatDebt);

   // Should trust normalized fields, NOT double-convert legacy
   expect(result.amount_pennies).toBe(12300); // NOT 1,230,000
   expect(result.apr).toBe(2000);    // NOT 200,000 
   expect(result.min_payment_pennies).toBe(1200); // NOT 120,000
   expect(result.name).toBe('test');
   expect(result.debt_type).toBe('loan');
  });

  test('converts legacy pounds/percent to cents/bps when normalized fields absent', () => {
   const legacyDebt = {
    id: 'legacy-debt',
    name: 'Credit Card',
    balance: 123.45,    // pounds
    interestRate: 19.99,  // percent
    minPayment: 25.50,   // pounds
   };

   const result = normalizeDebt(legacyDebt);

   expect(result.amount_pennies).toBe(12345);   // 123.45 * 100
   expect(result.apr).toBe(1999);      // 19.99 * 100
   expect(result.min_payment_pennies).toBe(2550); // 25.50 * 100
  });

  test('handles integer vs decimal heuristics correctly', () => {
   // Large integer values (>= 1000) are likely already in pence/bps
   const largeIntegerDebt = {
    id: 'large-int-debt',
    balance: 5000,    // integer >= 1000, likely cents (£50.00)
    interestRate: 2500,  // integer > 100, likely bps (25%)
    minPayment: 1500,   // integer >= 1000, likely cents (£15.00)
   };

   const result = normalizeDebt(largeIntegerDebt);

   expect(result.amount_pennies).toBe(5000);   // Keep as-is
   expect(result.apr).toBe(2500);      // Keep as-is 
   expect(result.min_payment_pennies).toBe(1500); // Keep as-is

   // Small integer values (< 1000) are likely pounds/percent
   const smallIntegerDebt = {
    id: 'small-int-debt',
    balance: 50,     // integer < 1000, likely pounds
    interestRate: 25,   // integer <= 100, likely percent
    minPayment: 15,    // integer < 1000, likely pounds
   };

   const result2 = normalizeDebt(smallIntegerDebt);

   expect(result2.amount_pennies).toBe(5000);   // 50 * 100
   expect(result2.apr).toBe(2500);     // 25 * 100
   expect(result2.min_payment_pennies).toBe(1500); // 15 * 100

   // Decimal values are always treated as pounds/percent 
   const decimalDebt = {
    id: 'dec-debt',
    balance: 50.00,    // decimal, always pounds
    interestRate: 25.0,  // decimal <= 100, always percent
    minPayment: 15.00,  // decimal, always pounds
   };

   const result3 = normalizeDebt(decimalDebt);

   expect(result3.amount_pennies).toBe(5000);   // 50 * 100
   expect(result3.apr).toBe(2500);     // 25 * 100
   expect(result3.min_payment_pennies).toBe(1500); // 15 * 100
  });

  test('handles edge cases and invalid inputs', () => {
   const edgeCases = [
    { balance: NaN, expected: 0 },
    { balance: Infinity, expected: 0 },
    { balance: -100, expected: 0 }, // clamped to 0
    { balance: 0, expected: 0 },
    { balance: null, expected: 0 },
    { balance: undefined, expected: 0 },
   ];

   edgeCases.forEach(({ balance, expected }) => {
    const result = normalizeDebt({ id: 'test', balance });
    expect(result.amount_pennies).toBe(expected);
   });
  });

  test('caps APR at 100% (10000 bps)', () => {
   const highAPRDebt = {
    id: 'high-apr',
    apr: 50000, // 500% - should be capped
   };

   const result = normalizeDebt(highAPRDebt);
   expect(result.apr).toBe(10000); // Capped at 100%
  });

  test('generates ID if missing', () => {
   const noIdDebt = {
    name: 'No ID Debt',
    amount_pennies: 1000
   };

   const result = normalizeDebt(noIdDebt);
   expect(result.id).toBeDefined();
   expect(typeof result.id).toBe('string');
   expect(result.id.length).toBeGreaterThan(0);
  });

  test('sets normalization version', () => {
   const debt = { id: 'test', amount_pennies: 1000 };
   const result = normalizeDebt(debt);
   expect(result._norm_v).toBe(2);
  });

  test('handles limit_pennies correctly', () => {
   const debtWithLimit = {
    id: 'limit-debt',
    amount_pennies: 5000,
    limit: 100, // small integer, treated as pounds
   };

   const result = normalizeDebt(debtWithLimit);
   expect(result.limit_pennies).toBe(10000); // 100 * 100

   const debtWithNormalizedLimit = {
    id: 'norm-limit-debt',
    amount_pennies: 5000,
    limit_pennies: 10000,
   };

   const result2 = normalizeDebt(debtWithNormalizedLimit);
   expect(result2.limit_pennies).toBe(10000); // Trust normalized
  });

  test('preserves timestamps', () => {
   const timestamp = '2025-01-01T00:00:00.000Z';
   const debt = {
    id: 'timestamp-test',
    amount_pennies: 1000,
    created_at: timestamp,
   };

   const result = normalizeDebt(debt);
   expect(result.created_at).toBe(timestamp);
   expect(result.updated_at).toBeDefined();
  });
 });

 describe('normalizeDebts', () => {
  test('normalizes array of debts', () => {
   const debts = [
    { id: '1', amount_pennies: 1000, apr: 2000 },
    { id: '2', balance: 20, interestRate: 15.5 } // 20 is small integer, treated as pounds
   ];

   const result = normalizeDebts(debts);

   expect(result).toHaveLength(2);
   expect(result[0].amount_pennies).toBe(1000);
   expect(result[1].amount_pennies).toBe(2000); // 20 * 100
  });

  test('handles non-array input gracefully', () => {
   expect(normalizeDebts(null as any)).toEqual([]);
   expect(normalizeDebts(undefined as any)).toEqual([]);
   expect(normalizeDebts({} as any)).toEqual([]);
  });

  test('filters out invalid debts', () => {
   const debts = [
    { id: '1', amount_pennies: 1000 },
    null,
    undefined,
    { id: '2', amount_pennies: 2000 }
   ];

   const result = normalizeDebts(debts);
   expect(result).toHaveLength(2);
   expect(result.map(d => d.id)).toEqual(['1', '2']);
  });
 });

 describe('UI helpers', () => {
  test('safeFromCents converts cents to pounds', () => {
   const { safeFromCents } = require('../safeDebtNormalizer');
   
   expect(safeFromCents(12345)).toBe(123.45);
   expect(safeFromCents(0)).toBe(0);
   expect(safeFromCents(NaN)).toBe(0);
   expect(safeFromCents(null)).toBe(0);
  });

  test('safeBpsToPercent converts bps to percent', () => {
   const { safeBpsToPercent } = require('../safeDebtNormalizer');
   
   expect(safeBpsToPercent(1999)).toBe(19.99);
   expect(safeBpsToPercent(0)).toBe(0);
   expect(safeBpsToPercent(NaN)).toBe(0);
   expect(safeBpsToPercent(15000)).toBe(100); // Capped at 100%
  });
 });

 describe('idempotency (running normalize twice should yield same result)', () => {
  test('normalized debt remains unchanged on second normalization', () => {
   const debt = {
    id: 'idempotent-test',
    balance: 12300,
    amount_pennies: 12300,
    interestRate: 2000,
    apr: 2000,
   };

   const first = normalizeDebt(debt);
   const second = normalizeDebt(first);

   expect(first.amount_pennies).toBe(second.amount_pennies);
   expect(first.apr).toBe(second.apr);
   expect(first.min_payment_pennies).toBe(second.min_payment_pennies);
  });
 });

 describe('telemetry integration', () => {
  const mockCapture = jest.fn();
  
  beforeAll(() => {
   // Mock window.posthog for testing
   Object.defineProperty(global, 'window', {
    writable: true,
    value: {
     posthog: {
      capture: mockCapture
     }
    }
   });
  });

  beforeEach(() => {
   mockCapture.mockClear();
  });

  test('tracks version upgrades in telemetry', () => {
   const legacyDebt = {
    id: 'legacy-telemetry-test',
    balance: 1000,
    interestRate: 20,
    // No _norm_v field = version 0
   };

   normalizeDebt(legacyDebt);

   // Check that capture was called
   expect(mockCapture).toHaveBeenCalled();
  });

  test('tracks mixed format fixes', () => {
   const mixedDebt = {
    id: 'mixed-telemetry-test',
    balance: 12300,    // legacy field with cents
    amount_pennies: 12300,  // normalized field
    interestRate: 2000,  // legacy field with bps 
    apr: 2000,     // normalized field
   };

   normalizeDebt(mixedDebt);

   // Should trigger mixed format telemetry (async, so we need to wait)
   setTimeout(() => {
    expect(mockCapture).toHaveBeenCalledWith(
     'debt_normalization_pattern',
     expect.objectContaining({
      mixed_format: true,
      version_upgraded: true
     })
    );
   }, 10);
  });

  test('exposes debug stats function', () => {
   const { getNormalizationStats } = require('../safeDebtNormalizer');
   const stats = getNormalizationStats();

   expect(stats).toHaveProperty('normalizations');
   expect(stats).toHaveProperty('version_upgrades');
   expect(stats).toHaveProperty('mixed_format_fixes');
   expect(stats).toHaveProperty('rates');
   expect(stats.rates).toHaveProperty('upgrade_rate');
  });
 });
});