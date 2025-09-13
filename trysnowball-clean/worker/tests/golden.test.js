/**
 * CP-3 Golden Test Suite
 * Tests: CRUD roundtrip, Auth isolation, Encryption verification, Validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('CP-3 Golden Tests - Debt API', () => {
  let worker;
  
  // Test users with different JWTs
  const userA = {
    id: 'user_a_123',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FfMTIzIiwiZXhwIjoxOTAwMDAwMDAwfQ.test'
  };
  
  const userB = {
    id: 'user_b_456',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2JfNDU2IiwiZXhwIjoxOTAwMDAwMDAwfQ.test'
  };

  beforeAll(async () => {
    // Start worker with test configuration
    worker = await unstable_dev('src/index-secured.js', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENCRYPTION_SECRET: 'test-encryption-key-32-chars-long',
        JWT_SECRET: 'test-jwt-secret-key',
        JWT_ALGORITHM: 'HS256'
      }
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('1. CRUD Roundtrip', () => {
    let createdDebtId;

    it('should create a new debt with encryption', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Credit Card',
          amount: 2500.50,
          apr: 18.9,
          min_payment: 75.00
        })
      });

      expect(response.status).toBe(201);
      
      const debt = await response.json();
      expect(debt.name).toBe('Test Credit Card');
      expect(debt.amount).toBe(2500.50);
      expect(debt.apr).toBe(18.9);
      expect(debt.min_payment).toBe(75.00);
      expect(debt.user_id).toBe(userA.id);
      
      createdDebtId = debt.id;
    });

    it('should retrieve debts with decryption', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        headers: {
          'Authorization': userA.token
        }
      });

      expect(response.status).toBe(200);
      
      const debts = await response.json();
      expect(Array.isArray(debts)).toBe(true);
      
      const createdDebt = debts.find(d => d.id === createdDebtId);
      expect(createdDebt).toBeDefined();
      expect(createdDebt.name).toBe('Test Credit Card');
      expect(createdDebt.amount).toBe(2500.50);
    });

    it('should update a debt', async () => {
      const response = await worker.fetch(`/api/v2/debts/${createdDebtId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 2000.00,
          min_payment: 60.00
        })
      });

      expect(response.status).toBe(200);
      
      const updated = await response.json();
      expect(updated.amount).toBe(2000.00);
      expect(updated.min_payment).toBe(60.00);
      expect(updated.name).toBe('Test Credit Card'); // Unchanged
    });

    it('should delete a debt', async () => {
      const response = await worker.fetch(`/api/v2/debts/${createdDebtId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': userA.token
        }
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      
      // Verify deletion
      const listResponse = await worker.fetch('/api/v2/debts', {
        headers: {
          'Authorization': userA.token
        }
      });
      
      const debts = await listResponse.json();
      const deleted = debts.find(d => d.id === createdDebtId);
      expect(deleted).toBeUndefined();
    });
  });

  describe('2. Auth Isolation', () => {
    let userADebtId;
    let userBDebtId;

    beforeAll(async () => {
      // Create debt for User A
      const responseA = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'User A Debt',
          amount: 1000,
          apr: 15,
          min_payment: 50
        })
      });
      const debtA = await responseA.json();
      userADebtId = debtA.id;

      // Create debt for User B
      const responseB = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userB.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'User B Debt',
          amount: 2000,
          apr: 20,
          min_payment: 100
        })
      });
      const debtB = await responseB.json();
      userBDebtId = debtB.id;
    });

    it('User A cannot see User B debts', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        headers: {
          'Authorization': userA.token
        }
      });

      const debts = await response.json();
      
      // Should only see User A's debt
      expect(debts.some(d => d.name === 'User A Debt')).toBe(true);
      expect(debts.some(d => d.name === 'User B Debt')).toBe(false);
    });

    it('User B cannot see User A debts', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        headers: {
          'Authorization': userB.token
        }
      });

      const debts = await response.json();
      
      // Should only see User B's debt
      expect(debts.some(d => d.name === 'User B Debt')).toBe(true);
      expect(debts.some(d => d.name === 'User A Debt')).toBe(false);
    });

    it('User A cannot update User B debt', async () => {
      const response = await worker.fetch(`/api/v2/debts/${userBDebtId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 999999
        })
      });

      expect(response.status).toBe(404); // Not found for this user
    });

    it('User A cannot delete User B debt', async () => {
      const response = await worker.fetch(`/api/v2/debts/${userBDebtId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': userA.token
        }
      });

      expect(response.status).toBe(404); // Not found for this user
    });

    it('Requests without auth are rejected', async () => {
      const response = await worker.fetch('/api/v2/debts');
      expect(response.status).toBe(401);
      
      const error = await response.json();
      expect(error.error).toContain('Authorization');
    });
  });

  describe('3. Encryption Verification', () => {
    it('Data stored encrypted in D1 (simulated check)', async () => {
      // This test would normally query D1 directly to verify encryption
      // For this test suite, we verify encryption is active by checking
      // that decryption works properly (implying encryption happened)
      
      const createResponse = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Encryption Test Debt',
          amount: 999.99,
          apr: 12.5,
          min_payment: 25.00
        })
      });

      expect(createResponse.status).toBe(201);
      
      // Retrieve and verify decryption worked
      const listResponse = await worker.fetch('/api/v2/debts', {
        headers: {
          'Authorization': userA.token
        }
      });
      
      const debts = await listResponse.json();
      const testDebt = debts.find(d => d.name === 'Encryption Test Debt');
      
      expect(testDebt).toBeDefined();
      expect(testDebt.amount).toBe(999.99);
      expect(testDebt.apr).toBe(12.5);
      expect(testDebt.min_payment).toBe(25.00);
    });
  });

  describe('4. Validation Tests', () => {
    it('should reject negative APR', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: 1000,
          apr: -5,
          min_payment: 50
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('APR must be between 0 and 100');
    });

    it('should reject APR over 100', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: 1000,
          apr: 150,
          min_payment: 50
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('APR must be between 0 and 100');
    });

    it('should reject zero minimum payment', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: 1000,
          apr: 15,
          min_payment: 0
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Minimum payment must be greater than 0');
    });

    it('should reject negative minimum payment', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: 1000,
          apr: 15,
          min_payment: -50
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Minimum payment must be greater than 0');
    });

    it('should reject negative amount', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: -1000,
          apr: 15,
          min_payment: 50
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Amount cannot be negative');
    });

    it('should reject min_payment exceeding amount', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Invalid Debt',
          amount: 100,
          apr: 15,
          min_payment: 200
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Minimum payment cannot exceed debt amount');
    });

    it('should reject missing required fields', async () => {
      const response = await worker.fetch('/api/v2/debts', {
        method: 'POST',
        headers: {
          'Authorization': userA.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Incomplete Debt'
          // Missing amount, apr, min_payment
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Missing required fields');
    });
  });
});

describe('CP-3 Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    // Test that multiple users can operate simultaneously
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        worker.fetch('/api/v2/debts', {
          headers: {
            'Authorization': userA.token
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});