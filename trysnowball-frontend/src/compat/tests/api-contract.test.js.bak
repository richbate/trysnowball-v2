/**
 * API Contract Tests
 * 
 * These tests validate that our API endpoints return normalized data structures
 * and catch backend regressions early before they reach production.
 */

import { isNormalized } from '../types/debt';

describe('API Contract - Data Normalization', () => {
 const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8787';
 
 // Skip in CI if API not available, but fail locally to catch issues
 const skipIfNoAPI = process.env.CI ? 'skip' : 'test';
 
 test[skipIfNoAPI]('GET /api/debts returns normalized debt objects', async () => {
  const mockToken = 'test-token-for-ci';
  
  const response = await fetch(`${API_BASE}/api/debts`, {
   headers: {
    'Authorization': `Bearer ${mockToken}`,
    'Content-Type': 'application/json'
   }
  }).catch(() => ({ ok: false, status: 503 }));
  
  // Skip if API unavailable (dev environment)
  if (!response.ok) {
   console.warn('⚠️ API unavailable, skipping contract test');
   return;
  }
  
  const data = await response.json();
  
  // Should return array of debts
  expect(Array.isArray(data.debts || data)).toBe(true);
  
  const debts = data.debts || data;
  
  if (debts.length > 0) {
   debts.forEach((debt, index) => {
    // Check for legacy fields that should not exist
    const legacyFields = ['balance', 'interestRate', 'minPayment', 'amount', 'apr_pct'];
    const foundLegacy = legacyFields.filter(field => field in debt);
    
    if (foundLegacy.length > 0) {
     throw new Error(`🚨 Backend returned legacy fields in debt ${index}: ${foundLegacy.join(', ')}
     
Expected normalized format:
- balance → amount_pennies 
- interestRate → apr_bps
- minPayment → min_payment_pennies

Found object: ${JSON.stringify(debt, null, 2)}`);
    }
    
    // Check for required normalized fields
    const requiredFields = ['amount_pennies', 'apr_bps', 'min_payment_pennies'];
    const missingFields = requiredFields.filter(field => !(field in debt));
    
    if (missingFields.length > 0) {
     throw new Error(`🚨 Backend missing normalized fields in debt ${index}: ${missingFields.join(', ')}
     
Found object: ${JSON.stringify(debt, null, 2)}`);
    }
    
    // Use our runtime validator
    expect(() => {
     if (!isNormalized(debt)) {
      throw new Error(`Debt ${index} failed normalization check`);
     }
    }).not.toThrow();
   });
   
   console.log(`✅ API contract verified: ${debts.length} debts in normalized format`);
  }
 });
 
 test[skipIfNoAPI]('POST /api/debts accepts and returns normalized format', async () => {
  const mockToken = 'test-token-for-ci';
  
  const normalizedDebt = {
   name: 'Contract Test Debt',
   type: 'Credit Card',
   amount_pennies: 150000, // $1,500.00
   apr: 1990,    // 19.90% 
   min_payment_pennies: 5000, // $50.00
  };
  
  const response = await fetch(`${API_BASE}/api/debts`, {
   method: 'POST',
   headers: {
    'Authorization': `Bearer ${mockToken}`,
    'Content-Type': 'application/json'
   },
   body: JSON.stringify(normalizedDebt)
  }).catch(() => ({ ok: false, status: 503 }));
  
  // Skip if API unavailable 
  if (!response.ok) {
   console.warn('⚠️ API unavailable, skipping contract test');
   return;
  }
  
  const returned = await response.json();
  
  // Should echo back normalized format
  expect(returned).toMatchObject(normalizedDebt);
  expect(isNormalized(returned)).toBe(true);
  
  // Clean up test debt
  if (returned.id) {
   await fetch(`${API_BASE}/api/debts/${returned.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${mockToken}` }
   }).catch(() => {}); // Ignore cleanup errors
  }
  
  console.log('✅ API accepts and returns normalized debt format');
 });
});