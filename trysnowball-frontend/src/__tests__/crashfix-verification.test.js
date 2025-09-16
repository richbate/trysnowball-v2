/**
 * Critical crash fix verification tests
 * Tests the specific scenarios that were causing "reduce is not a function" and undefined crashes
 */

import { toDebtArray } from '../utils/debts';

describe('Crash Fix Verification', () => {
  describe('toDebtArray prevents "reduce is not a function" crashes', () => {
    // These are the exact scenarios that were causing crashes in production
    const crashScenarios = [
      { name: 'null from API', input: null },
      { name: 'undefined from storage', input: undefined },
      { name: 'object instead of array', input: { debt1: { balance: 100 }, debt2: { balance: 200 } } },
      { name: 'string response', input: 'error' },
      { name: 'number response', input: 404 },
      { name: 'boolean response', input: false },
      { name: 'nested object with items', input: { items: [{ id: 1, balance: 100 }] } },
      { name: 'nested object with debts', input: { debts: [{ id: 1, balance: 100 }] } },
      { name: 'empty object', input: {} },
      { name: 'single debt object', input: { id: 1, balance: 100, name: 'Test' } },
    ];

    crashScenarios.forEach(({ name, input }) => {
      it(`handles ${name} without crashing`, () => {
        const result = toDebtArray(input);
        
        // Most critical: result is ALWAYS an array
        expect(Array.isArray(result)).toBe(true);
        
        // Should never crash when calling array methods
        expect(() => {
          result.reduce((sum, debt) => sum + (debt.balance || 0), 0);
        }).not.toThrow();
        
        expect(() => {
          result.filter(debt => debt.balance > 0);
        }).not.toThrow();
        
        expect(() => {
          result.map(debt => debt.name);
        }).not.toThrow();
        
        expect(() => {
          const length = result.length; // The original crash: "Cannot read properties of undefined (reading 'length')"
          expect(typeof length).toBe('number');
        }).not.toThrow();
      });
    });
  });

  describe('Array method safety after normalization', () => {
    it('supports chaining array methods safely', () => {
      const corruptedInputs = [null, undefined, { debt1: { balance: 100 } }];
      
      corruptedInputs.forEach(input => {
        expect(() => {
          const result = toDebtArray(input)
            .filter(debt => debt.balance > 50)
            .map(debt => ({ ...debt, formatted: `$${debt.balance}` }))
            .reduce((sum, debt) => sum + debt.balance, 0);
            
          // Should return a number, not crash
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });
    
    it('prevents the exact crash that was happening', () => {
      // This was the exact line that was crashing:
      // "Cannot read properties of undefined (reading 'length')"
      const problematicData = [null, undefined, false, 'error', 404];
      
      problematicData.forEach(data => {
        expect(() => {
          const normalized = toDebtArray(data);
          const length = normalized.length; // This was crashing
          const filtered = normalized.filter(d => d.balance > 0); // This was crashing
          const reduced = normalized.reduce((sum, d) => sum + (d.balance || 0), 0); // This was crashing
          
          expect(typeof length).toBe('number');
          expect(Array.isArray(filtered)).toBe(true);
          expect(typeof reduced).toBe('number');
        }).not.toThrow();
      });
    });
  });

  describe('Production-like scenarios', () => {
    it('handles empty state after clearing demo data', () => {
      // Simulates the exact scenario: user clears demo data, gets empty response
      const emptyResponses = [null, undefined, [], {}];
      
      emptyResponses.forEach(response => {
        const debts = toDebtArray(response);
        expect(debts.length).toBe(0);
        
        // These operations should work without crashing (used in MyPlan component)
        const totalBalance = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
        const totalMinPayments = debts.reduce((sum, debt) => sum + (debt.minPayment || 0), 0);
        const hasActiveDebts = debts.filter(debt => (debt.balance || 0) > 0).length > 0;
        
        expect(totalBalance).toBe(0);
        expect(totalMinPayments).toBe(0);
        expect(hasActiveDebts).toBe(false);
      });
    });
    
    it('handles malformed API responses gracefully', () => {
      // Simulates various API error conditions
      const malformedResponses = [
        { error: 'Database connection failed' },
        { items: null },
        { debts: 'loading...' },
        { data: { items: false } },
        'Internal Server Error',
        404,
        { items: [null, undefined, { balance: 'invalid' }] }
      ];
      
      malformedResponses.forEach(response => {
        expect(() => {
          const debts = toDebtArray(response);
          
          // Should handle all the operations that were crashing
          // Filter out null/undefined first (real production scenario)
          const validDebts = debts.filter(debt => debt && typeof debt === 'object');
          
          const metrics = validDebts.reduce((acc, debt) => ({
            total: acc.total + (Number(debt.balance) || 0),
            count: acc.count + 1,
            avgBalance: 0
          }), { total: 0, count: 0, avgBalance: 0 });
          
          metrics.avgBalance = metrics.count > 0 ? metrics.total / metrics.count : 0;
          
          expect(typeof metrics.total).toBe('number');
          expect(typeof metrics.count).toBe('number');
          expect(typeof metrics.avgBalance).toBe('number');
        }).not.toThrow();
      });
    });
  });
});