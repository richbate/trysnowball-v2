/**
 * Data/UI Separation Tests
 * Ensures data layer never mutates UI state
 */

const { debtsManager } = require('../lib/debtsManager');

describe('Data/UI Separation Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loadDemoData only persists data, never calls UI updaters', async () => {
    // Spy on any potential UI state mutations (should not be called)
    const setState = jest.fn();
    const setData = jest.fn();
    const setRefreshNonce = jest.fn();
    const refresh = jest.fn();
    
    // Mock window to ensure no UI side effects
    global.setState = setState;
    global.setData = setData;
    global.setRefreshNonce = setRefreshNonce;
    global.refresh = refresh;
    
    // Load demo data
    const result = await debtsManager.loadDemoData('uk');
    
    // Verify data was returned
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify NO UI mutations were called
    expect(setState).not.toHaveBeenCalled();
    expect(setData).not.toHaveBeenCalled();
    expect(setRefreshNonce).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    
    // Clean up
    delete global.setState;
    delete global.setData;
    delete global.setRefreshNonce;
    delete global.refresh;
  });

  test('debtsManager delegates cleanly to localDebtStore', async () => {
    const result = await debtsManager.loadDemoData('uk');
    
    // Should return array of debts from generateDemoDebts
    expect(Array.isArray(result)).toBe(true);
    
    // Each item should have required debt structure
    result.forEach(debt => {
      expect(debt).toHaveProperty('name');
      expect(debt).toHaveProperty('balance');
      expect(debt).toHaveProperty('minPayment');
      expect(debt).toHaveProperty('interestRate');
    });
  });

  test('no inline demo arrays in data layer', () => {
    // This test ensures we're not defining demo data inline
    const debtsManagerSource = debtsManager.toString();
    
    // Should not contain hardcoded demo debt names
    expect(debtsManagerSource).not.toMatch(/Visa.*Credit.*Card/);
    expect(debtsManagerSource).not.toMatch(/PayPal.*Credit/);
    expect(debtsManagerSource).not.toMatch(/Mastercard/);
    expect(debtsManagerSource).not.toMatch(/Student.*Loan/);
  });

  test('UI refresh is controlled by hook, not data layer', async () => {
    // Import the source files as text to check for violations
    const fs = require('fs');
    const path = require('path');
    
    // Read data layer files
    const debtsManagerPath = path.join(__dirname, '../lib/debtsManager.js');
    const debtsManagerSource = fs.existsSync(debtsManagerPath) ? 
      fs.readFileSync(debtsManagerPath, 'utf8') : '';
    
    // Data layer should NOT contain UI state mutations
    expect(debtsManagerSource).not.toMatch(/setRefreshNonce/);
    expect(debtsManagerSource).not.toMatch(/setState\(/);
    expect(debtsManagerSource).not.toMatch(/setData\(/);
    
    // Data layer should NOT import React hooks
    expect(debtsManagerSource).not.toMatch(/import.*useState/);
    expect(debtsManagerSource).not.toMatch(/import.*useEffect/);
  });
});

describe('Demo Loading Flow', () => {
  test('Demo → Clear → Demo works without requiring reload', async () => {
    // Initial demo load
    const demo1 = await debtsManager.loadDemoData('uk');
    expect(demo1.length).toBeGreaterThan(0);
    
    // Clear all data
    await debtsManager.clearAllData();
    const afterClear = await debtsManager.getDebts();
    expect(afterClear.length).toBe(0);
    
    // Load demo again
    const demo2 = await debtsManager.loadDemoData('uk');
    expect(demo2.length).toBeGreaterThan(0);
    expect(demo2.length).toBe(demo1.length);
  });
});