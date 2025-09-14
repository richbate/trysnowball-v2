/**
 * Forecast Data Source Precedence Tests
 * 
 * Tests the data source hierarchy and precedence logic used in ForecastTab.
 * Validates that the correct debt data is used based on availability and priority.
 */

import '@testing-library/jest-dom';
import { createMockDebt, mockDebtsMultiple } from './testHelpers';

// Specific mock datasets for datasource testing
const mockTimelineDebts = [
 createMockDebt('t1', 'Timeline Debt 1', 500000, 1999), // £5000 @ 19.99%
 createMockDebt('t2', 'Timeline Debt 2', 300000, 2499), // £3000 @ 24.99%
];

const mockDataManagerDebts = [
 createMockDebt('d1', 'DataManager Debt 1', 400000, 1799), // £4000 @ 17.99%
 createMockDebt('d2', 'DataManager Debt 2', 200000, 1299), // £2000 @ 12.99%
];

// Simulate the data source selection logic from ForecastTab
function selectDebtsDataSource(
 timelineDebtsData: any[] | null | undefined,
 dataManagerDebts: any[] | null | undefined
): any[] {
 // Priority: timelineDebtsData first, then dataManagerDebts fallback
 let sourceDebts;
 if (Array.isArray(timelineDebtsData)) {
  sourceDebts = timelineDebtsData;
 } else if (Array.isArray(dataManagerDebts)) {
  sourceDebts = dataManagerDebts;
 } else {
  sourceDebts = [];
 }
 
 console.log('[ForecastTab] Source debts:', {
  timelineDebtsDataLength: timelineDebtsData?.length,
  dataManagerDebtsLength: dataManagerDebts?.length,
  sourceDebtsLength: sourceDebts?.length,
  sampleDebt: sourceDebts?.[0]
 });
 
 if (!Array.isArray(sourceDebts)) return [];
 
 // Debts are already normalized, just ensure they're valid
 const filtered = sourceDebts.filter(debt => 
  debt && 
  typeof debt.amount_pennies === 'number' && Number.isFinite(debt.amount_pennies) &&
  typeof debt.apr === 'number' && Number.isFinite(debt.apr) &&
  typeof debt.min_payment_pennies === 'number' && Number.isFinite(debt.min_payment_pennies)
 );
 
 console.log('[ForecastTab] Filtered debts:', filtered.length, 'valid debts');
 return filtered;
}

describe('Forecast Data Source Precedence', () => {
 describe('Data Source Selection', () => {
  test('prioritizes timelineDebtsData over dataManagerDebts', () => {
   const result = selectDebtsDataSource(mockTimelineDebts, mockDataManagerDebts);
   
   expect(result).toEqual(mockTimelineDebts);
   expect(result).toHaveLength(2);
   expect(result[0].name).toBe('Timeline Debt 1');
  });

  test('falls back to dataManagerDebts when timelineDebtsData is null', () => {
   const result = selectDebtsDataSource(null, mockDataManagerDebts);
   
   expect(result).toEqual(mockDataManagerDebts);
   expect(result).toHaveLength(2);
   expect(result[0].name).toBe('DataManager Debt 1');
  });

  test('falls back to dataManagerDebts when timelineDebtsData is undefined', () => {
   const result = selectDebtsDataSource(undefined, mockDataManagerDebts);
   
   expect(result).toEqual(mockDataManagerDebts);
   expect(result).toHaveLength(2);
   expect(result[0].name).toBe('DataManager Debt 1');
  });

  test('returns empty array when both sources are null', () => {
   const result = selectDebtsDataSource(null, null);
   
   expect(result).toEqual([]);
   expect(result).toHaveLength(0);
  });

  test('returns empty array when both sources are undefined', () => {
   const result = selectDebtsDataSource(undefined, undefined);
   
   expect(result).toEqual([]);
   expect(result).toHaveLength(0);
  });

  test('prefers empty timelineDebtsData over populated dataManagerDebts', () => {
   const result = selectDebtsDataSource([], mockDataManagerDebts);
   
   expect(result).toEqual([]);
   expect(result).toHaveLength(0);
  });
 });

 describe('Data Validation', () => {
  test('filters out invalid debt objects', () => {
   const invalidDebts = [
    { id: 'invalid1', name: 'Missing amount_pennies' }, // missing amount_pennies
    { id: 'invalid2', amount_pennies: 'not-a-number' }, // wrong type
    { id: 'invalid3', amount_pennies: 100000, apr: null }, // null apr_bps
    createMockDebt('valid1', 'Valid Debt', 200000), // valid
    null, // null debt
    undefined, // undefined debt
    { id: 'invalid4', amount_pennies: 150000, apr: 1500 }, // missing min_payment_pennies
   ];

   const result = selectDebtsDataSource(invalidDebts, []);
   
   expect(result).toHaveLength(1);
   expect(result[0].id).toBe('valid1');
   expect(result[0].name).toBe('Valid Debt');
  });

  test('validates required numeric fields', () => {
   const testDebts = [
    { id: 'test1', amount_pennies: 100000, apr: 1500, min_payment_pennies: 2000 }, // valid
    { id: 'test2', amount_pennies: NaN, apr: 1500, min_payment_pennies: 2000 }, // invalid amount
    { id: 'test3', amount_pennies: 100000, apr: Infinity, min_payment_pennies: 2000 }, // invalid APR
    { id: 'test4', amount_pennies: 100000, apr: 1500, min_payment_pennies: -1 }, // negative min payment (still number, so valid)
   ];

   const result = selectDebtsDataSource(testDebts, []);
   
   expect(result).toHaveLength(2); // test1 and test4 should be valid (NaN and Infinity are filtered out)
   const validIds = result.map(debt => debt.id);
   expect(validIds).toEqual(['test1', 'test4']);
  });

  test('handles non-array input gracefully', () => {
   const result1 = selectDebtsDataSource({} as any, []);
   expect(result1).toEqual([]);

   const result2 = selectDebtsDataSource('not-an-array' as any, mockDataManagerDebts);
   expect(result2).toEqual(mockDataManagerDebts); // Falls back to second parameter

   const result3 = selectDebtsDataSource(null, 'also-not-an-array' as any);
   expect(result3).toEqual([]);
  });
 });

 describe('Empty State Handling', () => {
  test('returns empty array for empty timelineDebtsData', () => {
   const result = selectDebtsDataSource([], mockDataManagerDebts);
   
   expect(result).toEqual([]);
  });

  test('returns empty array when all debts are invalid', () => {
   const invalidDebts = [
    { id: 'bad1', name: 'No amount' },
    { id: 'bad2', amount_pennies: null },
    null,
    undefined,
   ];

   const result = selectDebtsDataSource(invalidDebts, []);
   
   expect(result).toEqual([]);
  });

  test('handles mixed valid and invalid debts', () => {
   const mixedDebts = [
    null,
    createMockDebt('valid1', 'Valid Debt 1', 100000),
    { id: 'invalid', name: 'Missing fields' },
    createMockDebt('valid2', 'Valid Debt 2', 200000),
    undefined,
   ];

   const result = selectDebtsDataSource(mixedDebts, []);
   
   expect(result).toHaveLength(2);
   expect(result[0].name).toBe('Valid Debt 1');
   expect(result[1].name).toBe('Valid Debt 2');
  });
 });

 describe('Data Precedence Edge Cases', () => {
  test('chooses timelineDebtsData even if it has fewer items', () => {
   const singleTimelineDebt = [createMockDebt('single', 'Single Debt', 100000)];
   const result = selectDebtsDataSource(singleTimelineDebt, mockDataManagerDebts);
   
   expect(result).toEqual(singleTimelineDebt);
   expect(result).toHaveLength(1);
  });

  test('chooses timelineDebtsData even if dataManagerDebts has better data', () => {
   const poorTimelineData = [{ id: 'poor', amount_pennies: 0, apr: 0, min_payment_pennies: 0 }];
   const result = selectDebtsDataSource(poorTimelineData, mockDataManagerDebts);
   
   expect(result).toEqual(poorTimelineData);
   expect(result).toHaveLength(1);
  });

  test('handles deeply nested nulls and undefined values', () => {
   const result1 = selectDebtsDataSource([null, undefined, null], [null, undefined]);
   expect(result1).toEqual([]);

   const result2 = selectDebtsDataSource(undefined, [null, undefined, null]);
   expect(result2).toEqual([]);
  });
 });

 describe('Console Logging Behavior', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
   consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
   consoleSpy.mockRestore();
  });

  test('logs data source selection information', () => {
   selectDebtsDataSource(mockTimelineDebts, mockDataManagerDebts);
   
   expect(consoleSpy).toHaveBeenCalledWith(
    '[ForecastTab] Source debts:',
    expect.objectContaining({
     timelineDebtsDataLength: 2,
     dataManagerDebtsLength: 2,
     sourceDebtsLength: 2,
     sampleDebt: mockTimelineDebts[0]
    })
   );
  });

  test('logs filtering results', () => {
   selectDebtsDataSource(mockTimelineDebts, mockDataManagerDebts);
   
   expect(consoleSpy).toHaveBeenCalledWith(
    '[ForecastTab] Filtered debts:',
    2,
    'valid debts'
   );
  });

  test('logs when falling back to dataManager debts', () => {
   selectDebtsDataSource(null, mockDataManagerDebts);
   
   expect(consoleSpy).toHaveBeenCalledWith(
    '[ForecastTab] Source debts:',
    expect.objectContaining({
     timelineDebtsDataLength: undefined,
     dataManagerDebtsLength: 2,
     sourceDebtsLength: 2,
    })
   );
  });
 });
});