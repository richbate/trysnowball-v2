/**
 * @jest-environment jsdom
 */
import { debtsManager } from '../debtsManager';

// Mock localDebtStore to simulate failures
jest.mock('../../data/localDebtStore.ts', () => ({
  localDebtStore: {
    listDebts: jest.fn(),
    getSettings: jest.fn(),
  },
}));

import { localDebtStore } from '../../data/localDebtStore.ts';

describe('DebtsManager - Production Safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMetrics returns safe zeros on localDebtStore failure', async () => {
    // Simulate localDebtStore throwing
    localDebtStore.listDebts.mockRejectedValue(new Error('IndexedDB unavailable'));
    localDebtStore.getSettings.mockRejectedValue(new Error('Settings corrupted'));

    const metrics = await debtsManager.getMetrics();
    
    expect(metrics).toEqual(expect.objectContaining({
      totalDebt: 0,
      totalMinPayments: 0,
      extraPayment: 0,
      totalPayment: 0,
      isDebtFree: true,
      hasProjections: false,
    }));
    
    // Should not throw
    expect(typeof metrics.totalDebt).toBe('number');
    expect(typeof metrics.totalMinPayments).toBe('number');
  });

  test('getMetrics handles partial data corruption gracefully', async () => {
    // Simulate corrupted debt data
    localDebtStore.listDebts.mockResolvedValue([
      { balance: null, minPayment: undefined },
      { balance: 'invalid', minPayment: NaN },
      { balance: 1000, minPayment: 50 }, // only this one is valid
    ]);
    localDebtStore.getSettings.mockResolvedValue({ extraPayment: 100 });

    const metrics = await debtsManager.getMetrics();
    
    expect(metrics.totalDebt).toBe(1000); // only valid debt counted
    expect(metrics.totalMinPayments).toBe(50); // only valid minPayment counted
    expect(metrics.extraPayment).toBe(100);
    expect(metrics.totalPayment).toBe(150);
    expect(typeof metrics.isDebtFree).toBe('boolean');
  });
});