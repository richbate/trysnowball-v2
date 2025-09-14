/**
 * Unit tests for getPlan() function
 * Tests all billing state combinations
 */

import { getPlan } from './plan';

// Mock D1 database responses
const createMockContext = (dbResult) => ({
  env: {
    DB: {
      prepare: (sql) => ({
        bind: (userId) => ({
          first: () => Promise.resolve(dbResult)
        })
      })
    }
  }
});

describe('getPlan()', () => {
  test('beta access user (is_pro=0, beta_access=1)', async () => {
    const mockContext = createMockContext({
      is_pro: 0,
      beta_access: 1
    });
    
    const result = await getPlan(mockContext, 'user123');
    
    expect(result).toEqual({
      is_paid: true,
      source: 'beta'
    });
  });

  test('stripe user (is_pro=1, beta_access=0)', async () => {
    const mockContext = createMockContext({
      is_pro: 1,
      beta_access: 0
    });
    
    const result = await getPlan(mockContext, 'user123');
    
    expect(result).toEqual({
      is_paid: true,
      source: 'stripe'
    });
  });

  test('stripe user with beta access (both flags)', async () => {
    const mockContext = createMockContext({
      is_pro: 1,
      beta_access: 1
    });
    
    const result = await getPlan(mockContext, 'user123');
    
    expect(result).toEqual({
      is_paid: true,
      source: 'beta' // beta takes precedence
    });
  });

  test('free user (is_pro=0, beta_access=0)', async () => {
    const mockContext = createMockContext({
      is_pro: 0,
      beta_access: 0
    });
    
    const result = await getPlan(mockContext, 'user123');
    
    expect(result).toEqual({
      is_paid: false,
      source: 'none'
    });
  });

  test('user not found (null result)', async () => {
    const mockContext = createMockContext(null);
    
    const result = await getPlan(mockContext, 'user123');
    
    expect(result).toEqual({
      is_paid: false,
      source: 'none'
    });
  });

  test('database error handling', async () => {
    const mockContext = {
      env: {
        DB: {
          prepare: () => ({
            bind: () => ({
              first: () => Promise.reject(new Error('DB connection failed'))
            })
          })
        }
      }
    };
    
    await expect(getPlan(mockContext, 'user123')).rejects.toThrow('DB connection failed');
  });
});

// Contract verification
describe('getPlan() contract', () => {
  test('always returns is_paid boolean and source string', async () => {
    const testCases = [
      { is_pro: 1, beta_access: 0 },
      { is_pro: 0, beta_access: 1 },
      { is_pro: 0, beta_access: 0 },
      null
    ];

    for (const dbResult of testCases) {
      const mockContext = createMockContext(dbResult);
      const result = await getPlan(mockContext, 'user123');
      
      expect(typeof result.is_paid).toBe('boolean');
      expect(typeof result.source).toBe('string');
      expect(['beta', 'stripe', 'none']).toContain(result.source);
      
      // No PII should be returned
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('user_id');
    }
  });
});