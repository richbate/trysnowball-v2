/**
 * Tests for withNoDataGuard development guardrails
 * Ensures .data access throws clear errors in development
 */

const { withNoDataGuard } = require('../withNoDataGuard');

describe('withNoDataGuard', () => {
  // Mock NODE_ENV to test both environments
  const originalEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should throw clear error when accessing .data in development', () => {
    process.env.NODE_ENV = 'development';
    
    const mockManager = {
      getData: () => Promise.resolve({ debts: [] }),
      data: { legacy: 'should not be accessed' }
    };
    
    const guardedManager = withNoDataGuard(mockManager, 'testManager');
    
    expect(() => {
      const _ = guardedManager.data;
    }).toThrow('[testManager] .data is private and causes crashes!');
  });

  it('should allow normal method access in development', () => {
    process.env.NODE_ENV = 'development';
    
    const mockManager = {
      getData: () => Promise.resolve({ debts: [] }),
      data: { legacy: 'should not be accessed' }
    };
    
    const guardedManager = withNoDataGuard(mockManager, 'testManager');
    
    expect(() => {
      guardedManager.getData();
    }).not.toThrow();
  });

  it('should pass through unchanged in production', () => {
    process.env.NODE_ENV = 'production';
    
    const mockManager = {
      getData: () => Promise.resolve({ debts: [] }),
      data: { legacy: 'production allows this' }
    };
    
    const guardedManager = withNoDataGuard(mockManager, 'testManager');
    
    // In production, should not throw (for performance)
    expect(() => {
      const _ = guardedManager.data;
    }).not.toThrow();
    
    // Should be the same object
    expect(guardedManager).toBe(mockManager);
  });

  it('should provide helpful error message with facade method guidance', () => {
    process.env.NODE_ENV = 'development';
    
    const mockManager = { getData: jest.fn() };
    const guardedManager = withNoDataGuard(mockManager, 'debtsManager');
    
    expect(() => {
      const _ = guardedManager.data;
    }).toThrow(/Use facade methods like getData\(\), getMetrics\(\)/);
  });
});