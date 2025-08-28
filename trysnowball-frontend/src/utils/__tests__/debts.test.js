/**
 * Unit tests for debt utility functions
 */

import { toDebtArray, safeNumber } from '../debts';

describe('toDebtArray', () => {
  it('returns array as-is when input is already an array', () => {
    const input = [{ id: 1, balance: 100 }, { id: 2, balance: 200 }];
    expect(toDebtArray(input)).toBe(input);
  });

  it('extracts array from items property', () => {
    const input = { items: [{ id: 1 }, { id: 2 }] };
    expect(toDebtArray(input)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('extracts array from debts property', () => {
    const input = { debts: [{ id: 1 }, { id: 2 }] };
    expect(toDebtArray(input)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('converts single debt object to array', () => {
    const input = { id: 1, balance: 100, name: 'Test Debt' };
    expect(toDebtArray(input)).toEqual([input]);
  });

  it('converts single debt with amount property to array', () => {
    const input = { id: 1, amount: 100, name: 'Test Debt' };
    expect(toDebtArray(input)).toEqual([input]);
  });

  it('converts object map to array of values', () => {
    const input = {
      debt1: { id: 1, name: 'Debt 1' },
      debt2: { id: 2, name: 'Debt 2' }
    };
    expect(toDebtArray(input)).toEqual([
      { id: 1, name: 'Debt 1' },
      { id: 2, name: 'Debt 2' }
    ]);
  });

  it('returns empty array for null', () => {
    expect(toDebtArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(toDebtArray(undefined)).toEqual([]);
  });

  it('returns empty array for non-object primitives', () => {
    expect(toDebtArray('string')).toEqual([]);
    expect(toDebtArray(123)).toEqual([]);
    expect(toDebtArray(true)).toEqual([]);
  });

  it('returns empty array for empty object', () => {
    expect(toDebtArray({})).toEqual([]);
  });

  it('handles nested items property correctly', () => {
    const input = { data: { items: [{ id: 1 }] }, items: [{ id: 2 }] };
    // Should use the direct items property, not nested
    expect(toDebtArray(input)).toEqual([{ id: 2 }]);
  });
});

describe('safeNumber', () => {
  it('returns valid numbers as-is', () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(0)).toBe(0);
    expect(safeNumber(-10)).toBe(-10);
    expect(safeNumber(3.14)).toBe(3.14);
  });

  it('converts numeric strings to numbers', () => {
    expect(safeNumber('42')).toBe(42);
    expect(safeNumber('0')).toBe(0);
    expect(safeNumber('-10')).toBe(-10);
    expect(safeNumber('3.14')).toBe(3.14);
  });

  it('returns 0 for NaN values', () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber('not a number')).toBe(0);
    expect(safeNumber('abc123')).toBe(0);
  });

  it('returns 0 for null and undefined', () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
  });

  it('returns 0 for non-numeric types', () => {
    expect(safeNumber({})).toBe(0);
    expect(safeNumber([])).toBe(0);
    expect(safeNumber(true)).toBe(1); // Note: true converts to 1
    expect(safeNumber(false)).toBe(0);
  });

  it('handles edge cases', () => {
    expect(safeNumber(Infinity)).toBe(Infinity);
    expect(safeNumber(-Infinity)).toBe(-Infinity);
    expect(safeNumber('')).toBe(0);
    expect(safeNumber(' ')).toBe(0);
  });
});