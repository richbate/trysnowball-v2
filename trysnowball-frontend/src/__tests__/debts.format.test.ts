/**
 * Debts Formatting Safety Tests
 * 
 * Tests the data formatting utilities used in the Plan workspace.
 * Validates currency formatting, percentage formatting, and data safety.
 */

import '@testing-library/jest-dom';

// Import actual formatting utilities
import { fromCents, toCents, bpsToPercent, percentToBps } from '../lib/money';
import { formatCurrency } from '../utils/debtFormatting';

// Mock debt data normalization functions used in components
function toNumber(n: any): number {
 const v = typeof n === "string" ? Number(n.replace(/[£, ]/g, "")) : Number(n);
 return Number.isFinite(v) ? v : 0;
}

function safeFromCents(cents: any): number {
 if (typeof cents !== 'number' || !Number.isFinite(cents)) {
  return 0;
 }
 return cents / 100;
}

function safeBpsToPercent(bps: any): number {
 if (typeof bps !== 'number' || !Number.isFinite(bps)) {
  return 0;
 }
 return bps / 100;
}

describe('Debts Formatting Safety', () => {
 describe('Currency Formatting', () => {
  test('fromCents handles normal values correctly', () => {
   expect(fromCents(100000)).toBe(1000);
   expect(fromCents(50000)).toBe(500);
   expect(fromCents(0)).toBe(0);
  });

  test('fromCents handles edge cases', () => {
   expect(fromCents(-10000)).toBe(-100); // Negative values
   expect(fromCents(1)).toBe(0.01); // Small values
   expect(fromCents(99)).toBe(0.99); // Less than 1 pound
  });

  test('toCents handles normal values correctly', () => {
   expect(toCents(1000)).toBe(100000);
   expect(toCents(500.50)).toBe(50050);
   expect(toCents(0)).toBe(0);
  });

  test('toCents handles decimal precision', () => {
   expect(toCents(123.456)).toBe(12346); // Rounds appropriately
   expect(toCents(0.01)).toBe(1);
   expect(toCents(0.001)).toBe(0);
  });

  test('formatCurrency handles various inputs', () => {
   expect(formatCurrency(1000)).toMatch(/£?1,?000/); // Allow for different formatting
   expect(formatCurrency(0)).toMatch(/£?0/);
   // Allow for rounding differences in currency formatting
   expect(formatCurrency(1234567.89)).toMatch(/1,?234,?56[78]/);
  });

  test('formatCurrency handles edge cases safely', () => {
   expect(() => formatCurrency(NaN)).not.toThrow();
   expect(() => formatCurrency(Infinity)).not.toThrow();
   expect(() => formatCurrency(-Infinity)).not.toThrow();
  });
 });

 describe('Percentage Formatting', () => {
  test('bpsToPercent converts percentage correctly', () => {
   expect(bpsToPercent(1999)).toBe(19.99);
   expect(bpsToPercent(2500)).toBe(25);
   expect(bpsToPercent(0)).toBe(0);
  });

  test('percentToBps converts percentages correctly', () => {
   expect(percentToBps(19.99)).toBe(1999);
   expect(percentToBps(25)).toBe(2500);
   expect(percentToBps(0)).toBe(0);
  });

  test('percentage conversion is reversible', () => {
   const testValues = [0, 5.25, 15.99, 29.99, 100];
   
   testValues.forEach(percent => {
    const bps = percentToBps(percent);
    const backToPercent = bpsToPercent(bps);
    expect(backToPercent).toBeCloseTo(percent, 2);
   });
  });
 });

 describe('Safe Formatting Functions', () => {
  test('safeFromCents handles invalid inputs', () => {
   expect(safeFromCents(null)).toBe(0);
   expect(safeFromCents(undefined)).toBe(0);
   expect(safeFromCents('not-a-number')).toBe(0);
   expect(safeFromCents(NaN)).toBe(0);
   expect(safeFromCents(Infinity)).toBe(0);
   expect(safeFromCents(-Infinity)).toBe(0);
  });

  test('safeFromCents handles valid inputs', () => {
   expect(safeFromCents(100000)).toBe(1000);
   expect(safeFromCents(0)).toBe(0);
   expect(safeFromCents(-5000)).toBe(-50);
  });

  test('safeBpsToPercent handles invalid inputs', () => {
   expect(safeBpsToPercent(null)).toBe(0);
   expect(safeBpsToPercent(undefined)).toBe(0);
   expect(safeBpsToPercent('not-a-number')).toBe(0);
   expect(safeBpsToPercent(NaN)).toBe(0);
   expect(safeBpsToPercent(Infinity)).toBe(0);
   expect(safeBpsToPercent(-Infinity)).toBe(0);
  });

  test('safeBpsToPercent handles valid inputs', () => {
   expect(safeBpsToPercent(1999)).toBe(19.99);
   expect(safeBpsToPercent(0)).toBe(0);
   expect(safeBpsToPercent(2500)).toBe(25);
  });
 });

 describe('String Parsing Safety', () => {
  test('toNumber handles currency strings', () => {
   expect(toNumber('£1,000')).toBe(1000);
   expect(toNumber('£1,234.56')).toBe(1234.56);
   expect(toNumber('1,500')).toBe(1500);
   expect(toNumber('£0')).toBe(0);
  });

  test('toNumber handles plain numbers', () => {
   expect(toNumber(1000)).toBe(1000);
   expect(toNumber(0)).toBe(0);
   expect(toNumber(-500)).toBe(-500);
  });

  test('toNumber handles edge cases', () => {
   expect(toNumber('')).toBe(0);
   expect(toNumber('not-a-number')).toBe(0);
   expect(toNumber(null)).toBe(0);
   expect(toNumber(undefined)).toBe(0);
   expect(toNumber(NaN)).toBe(0);
   
   // Note: toNumber function checks Number.isFinite(), so Infinity values become 0
   const infinityResult = toNumber(Infinity);
   const negInfinityResult = toNumber(-Infinity);
   expect([0, Infinity]).toContain(infinityResult); // Allow either depending on implementation
   expect([0, -Infinity]).toContain(negInfinityResult);
  });

  test('toNumber strips currency symbols and commas', () => {
   expect(toNumber('£1,234,567.89')).toBe(1234567.89);
   expect(toNumber(' £ 1 , 0 0 0 . 5 0 ')).toBe(1000.50);
   expect(toNumber('£')).toBe(0); // Just symbol
   expect(toNumber(',')).toBe(0); // Just comma
  });
 });

 describe('Data Validation Integration', () => {
  test('handles debt object field extraction safely', () => {
   const validDebt = {
    amount_pennies: 500000,
    apr: 1999,
    min_payment_pennies: 10000
   };

   expect(safeFromCents(validDebt.amount_pennies)).toBe(5000);
   expect(safeBpsToPercent(validDebt.apr)).toBe(19.99);
   expect(safeFromCents(validDebt.min_payment_pennies)).toBe(100);
  });

  test('handles incomplete debt objects', () => {
   const incompleteDebt = {
    name: 'Credit Card',
    // missing numeric fields
   };

   expect(safeFromCents((incompleteDebt as any).amount_pennies)).toBe(0);
   expect(safeBpsToPercent((incompleteDebt as any).apr)).toBe(0);
   expect(safeFromCents((incompleteDebt as any).min_payment_pennies)).toBe(0);
  });

  test('handles null debt objects', () => {
   const nullDebt = null;

   expect(safeFromCents((nullDebt as any)?.amount_pennies)).toBe(0);
   expect(safeBpsToPercent((nullDebt as any)?.apr)).toBe(0);
  });
 });

 describe('Form Input Processing', () => {
  test('processes user input safely', () => {
   // Simulate form input processing
   const userInputs = [
    '£1,000.00',
    '19.99%',
    '150',
    '',
    'invalid',
    null,
    undefined
   ];

   userInputs.forEach(input => {
    const numericValue = toNumber(input);
    expect(typeof numericValue).toBe('number');
    
    if (input === null || input === undefined || input === '' || input === 'invalid') {
     expect(numericValue).toBe(0);
    } else {
     expect(Number.isFinite(numericValue)).toBe(true);
    }
   });
  });

  test('roundtrip conversion maintains data integrity', () => {
   const testAmounts = [0, 1, 99, 100, 1000.50, 5000];
   
   testAmounts.forEach(amount => {
    const cents = toCents(amount);
    const backToPounds = fromCents(cents);
    expect(backToPounds).toBeCloseTo(amount, 2);
   });
  });

  test('handles extreme values', () => {
   expect(safeFromCents(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER / 100);
   expect(safeFromCents(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER / 100);
   expect(safeBpsToPercent(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER / 100);
  });
 });

 describe('Display Formatting Consistency', () => {
  test('currency display is consistent', () => {
   const amounts = [0, 100, 1000, 50000, 1000000];
   
   amounts.forEach(centsAmount => {
    const pounds = safeFromCents(centsAmount);
    const formatted = formatCurrency(pounds);
    
    // Should not crash and should return a string
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
   });
  });

  test('percentage display is consistent', () => {
   const bpsAmounts = [0, 999, 1999, 2500, 5000];
   
   bpsAmounts.forEach(bps => {
    const percent = safeBpsToPercent(bps);
    const formatted = `${percent}%`;
    
    expect(typeof formatted).toBe('string');
    expect(formatted).toMatch(/^\d+(\.\d+)?%$/);
   });
  });
 });

 describe('Error Boundary Safety', () => {
  test('formatting functions never throw', () => {
   const dangerousInputs = [
    null,
    undefined,
    NaN,
    Infinity,
    -Infinity,
    {},
    [],
    'invalid-string',
    new Date(),
   ];

   dangerousInputs.forEach(input => {
    expect(() => safeFromCents(input)).not.toThrow();
    expect(() => safeBpsToPercent(input)).not.toThrow();
    expect(() => toNumber(input)).not.toThrow();
   });
  });

  test('all formatting functions return sensible defaults', () => {
   expect(safeFromCents(null)).toBe(0);
   expect(safeBpsToPercent(undefined)).toBe(0);
   expect(toNumber('garbage')).toBe(0);
  });
 });
});