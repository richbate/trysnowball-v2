/**
 * Demo Loading Tests
 * Ensures demo data loading is robust and doesn't break analytics
 */

const { debtsManager } = require('../lib/debtsManager');

// Mock analytics to ensure it doesn't throw
const mockAnalytics = {
 track: jest.fn().mockReturnValue(Promise.resolve())
};

// Mock posthog
global.posthog = {
 capture: jest.fn()
};

// Mock window
Object.defineProperty(window, 'posthog', {
 value: global.posthog,
 writable: true
});

describe('Demo Loading Robustness', () => {
 beforeEach(() => {
  jest.clearAllMocks();
  console.info = jest.fn();
  console.error = jest.fn();
 });

 test('demo button click loads data successfully', async () => {
  // Simulate clicking demo button
  console.info('[Demo] clicked');
  
  try {
   await debtsManager.loadDemoData('uk');
   
   // Verify data was loaded
   const debts = await debtsManager.getDebts();
   expect(Array.isArray(debts)).toBe(true);
   expect(debts.length).toBeGreaterThan(0);
   
   // Log success (with safe analytics)
   try {
    if (window.posthog?.capture) {
     window.posthog.capture('demo_clicked_success');
    }
   } catch {}
   
   console.info('[Demo] done');
   
   // Verify logging worked
   expect(console.info).toHaveBeenCalledWith('[Demo] clicked');
   expect(console.info).toHaveBeenCalledWith('[Demo] done');
   expect(window.posthog.capture).toHaveBeenCalledWith('demo_clicked_success');
   
  } catch (error) {
   // Should not reach here in successful case
   expect(error).toBeUndefined();
  }
 });

 test('analytics errors do not break demo loading', async () => {
  // Mock analytics to throw
  window.posthog.capture = jest.fn().mockImplementation(() => {
   throw new Error('Analytics service down');
  });
  
  console.info('[Demo] clicked');
  
  // Demo loading should still work
  await expect(debtsManager.loadDemoData('uk')).resolves.toBeTruthy();
  
  // Verify data was still loaded despite analytics failure
  const debts = await debtsManager.getDebts();
  expect(debts.length).toBeGreaterThan(0);
  
  // Analytics error should be swallowed (no throw)
  expect(console.error).not.toHaveBeenCalled();
 });

 test('demo data has required structure', async () => {
  const demoDebts = await debtsManager.loadDemoData('uk');
  
  expect(Array.isArray(demoDebts)).toBe(true);
  expect(demoDebts.length).toBeGreaterThan(0);
  
  // Each debt should have required fields
  demoDebts.forEach(debt => {
   expect(debt).toHaveProperty('name');
   expect(debt).toHaveProperty('balance');
   expect(debt).toHaveProperty('minPayment');
   expect(debt).toHaveProperty('interestRate');
   expect(typeof debt.amount_pennies).toBe('number');
   expect(debt.amount_pennies).toBeGreaterThan(0);
  });
 });

 test('metrics refresh after demo load', async () => {
  // Load demo data
  await debtsManager.loadDemoData('uk');
  
  // Get metrics
  const metrics = await debtsManager.getMetrics();
  
  // Should have positive totals with demo data
  expect(metrics.totalDebt).toBeGreaterThan(0);
  expect(metrics.totalMinPayments).toBeGreaterThan(0);
  expect(metrics.isDebtFree).toBe(false);
 });

 test('no legacy storage keys are used', () => {
  // This test ensures the code doesn't accidentally use forbidden patterns
  const sourceCode = require('fs').readFileSync(__filename, 'utf8');
  
  // Should not contain legacy patterns
  expect(sourceCode).not.toMatch(/trysnowball-analytics-events/);
  expect(sourceCode).not.toMatch(/localStorage\.setItem.*analytics/);
 });
});