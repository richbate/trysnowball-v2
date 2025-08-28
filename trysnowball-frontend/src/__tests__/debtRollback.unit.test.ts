/**
 * Unit tests for debt rollback functionality (CP-5)
 * Tests rollbackDebt method, field-level change detection, and error handling
 */

import { DebtsManager } from '../lib/debtsManager';

// Mock console methods
const mockConsole = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};
Object.defineProperty(global, 'console', { value: mockConsole });

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid-' + Date.now() }
});

function freshManager() {
  // Create a new instance for each test
  const manager = new DebtsManager();
  manager.clearAllData();
  return manager;
}

// Mock the debtSync module to avoid D1 calls
jest.mock('../lib/debtSync', () => ({
  debtSyncClient: {
    _getCurrentUserId: () => 'test-user-123'
  }
}));

// Mock the debtChangeLog module to capture log entries
const mockLogEntries: any[] = [];

jest.mock('../lib/debtChangeLog.ts', () => {
  const actual = jest.requireActual('../lib/debtChangeLog.ts');
  return {
    ...actual,
    logDebtChange: jest.fn(async (event) => {
      // Create a log entry similar to what the real function would do
      const logEntry = {
        id: `hist_${Date.now()}_test123`,
        userId: 'test-user-123',
        debtId: event.debtId,
        action: event.type === 'rollback' ? 'update' : 'update',
        type: event.type === 'rollback' ? 'system' : 'adjustment',
        eventDate: new Date().toISOString(),
        deltaAmount: event.change,
        prev: event.previousBalance !== undefined ? { balance: event.previousBalance } : null,
        next: event.newBalance !== undefined ? { balance: event.newBalance } : null,
        metadata: {
          source: event.source,
          note: event.note || null,
          field: event.field || null,
          oldValue: event.oldValue !== undefined ? event.oldValue : null,
          newValue: event.newValue !== undefined ? event.newValue : null,
          batchId: event.batchId || null
        },
        createdAt: new Date().toISOString()
      };
      
      mockLogEntries.push(logEntry);
      return Promise.resolve();
    })
  };
});

describe('Debt Rollback (CP-5)', () => {
  beforeEach(() => {
    mockLogEntries.length = 0; // Clear captured log entries
    mockConsole.warn.mockClear();
    mockConsole.error.mockClear();
    mockConsole.log.mockClear();
    
    // Set environment variable to enable logging
    process.env.REACT_APP_USE_D1 = 'false'; // Use local queue for testing
    
    // Clear the mock calls
    const { logDebtChange } = require('../lib/debtChangeLog.ts');
    if (logDebtChange.mockClear) {
      logDebtChange.mockClear();
    }
  });

  describe('Field-level change detection', () => {
    test('_detectFieldChanges detects balance change', () => {
      const manager = freshManager();
      const oldDebt = { id: 'debt-1', name: 'Credit Card', balance: 1000, apr: 18.5, minPayment: 50 };
      const newDebt = { id: 'debt-1', name: 'Credit Card', balance: 900, apr: 18.5, minPayment: 50 };
      
      const changes = manager._detectFieldChanges(oldDebt, newDebt);
      
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: 'balance',
        oldValue: 1000,
        newValue: 900
      });
    });

    test('_detectFieldChanges detects multiple field changes', () => {
      const manager = freshManager();
      const oldDebt = { id: 'debt-1', name: 'Credit Card', balance: 1000, apr: 18.5, minPayment: 50 };
      const newDebt = { id: 'debt-1', name: 'Updated Card', balance: 900, apr: 20.0, minPayment: 50 };
      
      const changes = manager._detectFieldChanges(oldDebt, newDebt);
      
      expect(changes).toHaveLength(3);
      expect(changes.find(c => c.field === 'name')).toEqual({
        field: 'name',
        oldValue: 'Credit Card',
        newValue: 'Updated Card'
      });
      expect(changes.find(c => c.field === 'balance')).toEqual({
        field: 'balance',
        oldValue: 1000,
        newValue: 900
      });
      expect(changes.find(c => c.field === 'apr')).toEqual({
        field: 'apr',
        oldValue: 18.5,
        newValue: 20.0
      });
    });

    test('_detectFieldChanges returns empty array when no changes', () => {
      const manager = freshManager();
      const debt = { id: 'debt-1', name: 'Credit Card', balance: 1000, apr: 18.5, minPayment: 50 };
      
      const changes = manager._detectFieldChanges(debt, { ...debt });
      
      expect(changes).toHaveLength(0);
    });
  });

  describe('rollbackDebt method', () => {
    test('rollbackDebt reverts balance change successfully', async () => {
      const manager = freshManager();
      
      // Create initial debt
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      }, { source: 'test_setup' });

      // Capture the change log entry for the balance update
      const changeEventId = `hist_${Date.now()}_test123`;
      
      // Update balance (this should create a log entry)
      await manager.saveDebt({
        ...debt,
        balance: 800
      }, { source: 'balance_update_modal' });

      // Mock the event query to return our test event
      const mockEvent = {
        id: changeEventId,
        debtId: debt.id,
        metadata: {
          field: 'balance',
          oldValue: 1000,
          newValue: 800
        }
      };

      // Mock the event fetch (normally from D1)
      jest.spyOn(manager, '_fetchEventById').mockResolvedValue(mockEvent);

      // Perform rollback
      const result = await manager.rollbackDebt(debt.id, changeEventId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully rolled back');

      // Verify debt balance was reverted
      const rolledBackDebt = manager.getDebts().find(d => d.id === debt.id);
      expect(rolledBackDebt.balance).toBe(1000); // Back to original value
    });

    test('rollbackDebt reverts APR change successfully', async () => {
      const manager = freshManager();
      
      // Create initial debt
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      }, { source: 'test_setup' });

      const changeEventId = `hist_${Date.now()}_test124`;
      
      // Update APR
      await manager.saveDebt({
        ...debt,
        apr: 22.0
      }, { source: 'user_edit' });

      // Mock the event
      const mockEvent = {
        id: changeEventId,
        debtId: debt.id,
        metadata: {
          field: 'apr',
          oldValue: 18.5,
          newValue: 22.0
        }
      };

      jest.spyOn(manager, '_fetchEventById').mockResolvedValue(mockEvent);

      // Perform rollback
      const result = await manager.rollbackDebt(debt.id, changeEventId);

      expect(result.success).toBe(true);

      // Verify APR was reverted
      const rolledBackDebt = manager.getDebts().find(d => d.id === debt.id);
      expect(rolledBackDebt.apr).toBe(18.5); // Back to original value
    });

    test('rollbackDebt fails when debt not found', async () => {
      const manager = freshManager();
      
      const result = await manager.rollbackDebt('nonexistent-debt', 'some-event-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Debt not found');
    });

    test('rollbackDebt fails when event not found', async () => {
      const manager = freshManager();
      
      // Create a debt
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      });

      // Mock event fetch to return null
      jest.spyOn(manager, '_fetchEventById').mockResolvedValue(null);

      const result = await manager.rollbackDebt(debt.id, 'nonexistent-event');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    test('rollbackDebt fails when event has no field metadata', async () => {
      const manager = freshManager();
      
      // Create a debt
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      });

      // Mock event without field metadata
      const mockEvent = {
        id: 'test-event',
        debtId: debt.id,
        metadata: {} // No field information
      };

      jest.spyOn(manager, '_fetchEventById').mockResolvedValue(mockEvent);

      const result = await manager.rollbackDebt(debt.id, 'test-event');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event does not contain field-level change information');
    });

    test('rollbackDebt logs the rollback action', async () => {
      const manager = freshManager();
      
      // Create initial debt
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      });

      // Simulate that the debt was changed to 800, so we want to roll back to 1000
      await manager.saveDebt({
        ...debt,
        balance: 800
      }, { source: 'user_edit' });

      const mockEvent = {
        id: 'test-event',
        debtId: debt.id,
        metadata: {
          field: 'balance',
          oldValue: 1000, // Original value we want to roll back to
          newValue: 800   // Value it was changed to
        }
      };

      jest.spyOn(manager, '_fetchEventById').mockResolvedValue(mockEvent);

      // Get a reference to the mocked function and clear it
      const { logDebtChange } = require('../lib/debtChangeLog.ts');
      logDebtChange.mockClear();
      
      const result = await manager.rollbackDebt(debt.id, 'test-event');

      // Verify rollback was successful
      expect(result.success).toBe(true);

      // Verify that logDebtChange was called for the rollback
      expect(logDebtChange).toHaveBeenCalledWith(
        expect.objectContaining({
          debtId: debt.id,
          type: 'rollback',
          source: 'rollback',
          field: 'balance',
          oldValue: 800,  // Current debt balance (800)
          newValue: 1000  // Rolling back to old value (1000)
        })
      );
    });
  });

  describe('Error handling and edge cases', () => {
    test('rollbackDebt handles D1 fetch errors gracefully', async () => {
      const manager = freshManager();
      
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      });

      // Mock fetch to throw an error
      jest.spyOn(manager, '_fetchEventById').mockRejectedValue(new Error('D1 connection failed'));

      const result = await manager.rollbackDebt(debt.id, 'test-event');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch event');
    });

    test('field changes are logged with correct batchId', async () => {
      const manager = freshManager();
      const testBatchId = 'test-batch-123';
      
      const debt = await manager.saveDebt({
        name: 'Credit Card',
        balance: 1000,
        apr: 18.5,
        minPayment: 50
      }, { source: 'test_setup' });

      // Get a reference to the mocked function and clear it
      const { logDebtChange } = require('../lib/debtChangeLog.ts');
      logDebtChange.mockClear();
      
      // Update with batch ID - this should trigger field-level logging
      const result = await manager.saveDebt({
        ...debt,
        balance: 800,
        apr: 20.0
      }, { source: 'bulk_update', batchId: testBatchId });

      // Verify that logDebtChange was called for both field changes
      expect(logDebtChange).toHaveBeenCalledTimes(2);
      
      // Check balance change call
      expect(logDebtChange).toHaveBeenCalledWith(
        expect.objectContaining({
          debtId: debt.id,
          type: 'edited',
          source: 'bulk_update',
          field: 'balance',
          oldValue: 1000,
          newValue: 800,
          batchId: testBatchId
        })
      );
      
      // Check APR change call
      expect(logDebtChange).toHaveBeenCalledWith(
        expect.objectContaining({
          debtId: debt.id,
          type: 'edited', 
          source: 'bulk_update',
          field: 'apr',
          oldValue: 18.5,
          newValue: 20.0,
          batchId: testBatchId
        })
      );
    });
  });
});