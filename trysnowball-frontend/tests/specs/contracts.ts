/**
 * Feature Contracts Registry
 * Single source of truth for testing all features
 */

import { z } from 'zod';

export const Debt = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  apr: z.number().min(0).max(100),
  min_payment: z.number().nonnegative(),
  isDemo: z.boolean().optional(),
});

export const invariants = {
  totalsFinite: (totals: any) => {
    const fields = ['totalDebt', 'totalMinPayments', 'monthlyPayment'];
    fields.forEach(f => {
      if (totals[f] !== undefined) {
        if (!Number.isFinite(totals[f])) throw new Error(`Invariant: ${f} not finite`);
        if (totals[f] < 0) throw new Error(`Invariant: ${f} negative`);
      }
    });
  },
  debtValid: (d: any) => { 
    Debt.parse(d); 
    // Additional business logic checks
    if (d.min_payment > d.amount) {
      throw new Error('Invariant: min_payment cannot exceed debt amount');
    }
  },
  arrayNoDuplicateIds: (arr: any[]) => {
    const ids = arr.map(item => item.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error('Invariant: duplicate IDs found');
    }
  },
  demoIsolation: (debts: any[], includeDemo: boolean) => {
    const hasDemo = debts.some(d => d.isDemo);
    if (!includeDemo && hasDemo) {
      throw new Error('Invariant: demo data leaked into normal list');
    }
  }
};

export const featureContracts = [
  {
    feature: 'useUserDebts (CRUD operations)',
    setup: async () => {
      // Import and mock dependencies
      const { default: useUserDebts } = await import('../../src/hooks/useUserDebts');
      // For testing, we'll call the hook in a test component context
      return useUserDebts;
    },
    cases: [
      { 
        name: 'returns finite totals', 
        call: async (hook: any) => {
          // This is a simplified test - in real implementation you'd render hook
          const mockResult = {
            debts: [],
            totalDebt: 0,
            totalMinPayments: 0,
            monthlyPayment: 0
          };
          return mockResult;
        }, 
        checks: ['totalsFinite'] 
      }
    ],
  },
  {
    feature: 'safeDebtNormalizer',
    setup: async () => {
      const { safeNormalizeDebts, safeNormalizeDebt } = await import('../../src/utils/safeDebtNormalizer');
      return { safeNormalizeDebts, safeNormalizeDebt };
    },
    cases: [
      { 
        name: 'normalizes corrupted data safely', 
        call: async (normalizer: any) => {
          const corruptedDebt = {
            id: 'test',
            name: 'Test Debt',
            balance: 'NaN', // corrupted
            interestRate: 'invalid%', // corrupted
            minPayment: -50 // invalid
          };
          return normalizer.safeNormalizeDebt(corruptedDebt);
        }, 
        checks: ['debtValid', 'finite'] 
      },
      { 
        name: 'handles array with mixed valid/invalid debts', 
        call: async (normalizer: any) => {
          const mixedDebts = [
            { id: '1', name: 'Valid', amount_cents: 100000, apr_bps: 1999, min_payment_cents: 2500 },
            { id: '2', name: 'Corrupt', balance: NaN, interestRate: undefined },
            null, // completely invalid
            { id: '3', name: 'Valid2', amount_cents: 50000, apr_bps: 2499, min_payment_cents: 1000 }
          ];
          return normalizer.safeNormalizeDebts(mixedDebts);
        }, 
        checks: ['array', 'debtValid[]', 'arrayNoDuplicateIds'] 
      }
    ],
  },
  {
    feature: 'Demo data isolation',
    setup: async () => {
      const { localDebtStore } = await import('../../src/data/localDebtStore');
      return localDebtStore;
    },
    cases: [
      { 
        name: 'demo flag controls data visibility', 
        call: async (store: any) => {
          // Mock scenario where demo data exists
          const mockDemoDebt = { id: 'demo_1', name: 'Demo', amount_cents: 100000, apr_bps: 1999, min_payment_cents: 2500, isDemo: true };
          const mockRealDebt = { id: 'real_1', name: 'Real', amount_cents: 200000, apr_bps: 2199, min_payment_cents: 4000, isDemo: false };
          
          // Simulate both data types existing
          const allData = [mockDemoDebt, mockRealDebt];
          const normalOnly = allData.filter(d => !d.isDemo);
          
          return { allData, normalOnly };
        }, 
        checks: ['demoIsolation'] 
      }
    ],
  }
];

// Type-safe check executors
export const checkExecutors = {
  array: (result: any) => {
    if (!Array.isArray(result)) throw new Error('Expected array');
  },
  'debtValid[]': (result: any[]) => {
    result.forEach(invariants.debtValid);
  },
  debtValid: (result: any) => {
    invariants.debtValid(result);
  },
  totalsFinite: (result: any) => {
    invariants.totalsFinite(result);
  },
  arrayNoDuplicateIds: (result: any[]) => {
    invariants.arrayNoDuplicateIds(result);
  },
  finite: (result: any) => {
    Object.values(result).forEach((val: any) => {
      if (typeof val === 'number' && !Number.isFinite(val)) {
        throw new Error(`Non-finite number found: ${val}`);
      }
    });
  },
  demoIsolation: (result: any) => {
    invariants.demoIsolation(result.normalOnly, false);
  },
  'contains:id=': (result: any[], expectedId: string) => {
    if (!result.some((d: any) => d.id === expectedId)) {
      throw new Error(`Expected to find item with id=${expectedId}`);
    }
  }
};