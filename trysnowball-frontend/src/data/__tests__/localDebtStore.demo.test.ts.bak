/**
 * Demo Data Isolation Tests
 * Ensures demo and real debt data remain properly isolated
 */

import { localDebtStore } from '../localDebtStore';

describe('LocalDebtStore Demo Isolation', () => {
 beforeEach(async () => {
  // Clean slate for each test
  await localDebtStore.clearDemo();
  await localDebtStore.clearAll();
 });

 afterEach(async () => {
  // Cleanup after each test
  await localDebtStore.clearDemo();
  await localDebtStore.clearAll();
 });

 test('seed + clear demo data lifecycle', async () => {
  const demoDebt = {
   id: 'demo-1',
   name: 'Demo Credit Card',
   amount_pennies: 100000, // $1000
   apr: 1999, // 19.99%
   min_payment_pennies: 2500, // $25
   isDemo: true
  };

  // Seed demo data
  await localDebtStore.replaceAllForDemo([demoDebt]);
  
  // Demo data should appear when included
  const allDebts = await localDebtStore.listDebts({ includeDemo: true });
  expect(allDebts.some(d => d.isDemo)).toBe(true);
  expect(allDebts.find(d => d.id === 'demo-1')?.name).toBe('Demo Credit Card');
  
  // Demo data should NOT appear in normal list (default excludes demo)
  const userDebts = await localDebtStore.listDebts();
  expect(userDebts.some(d => d.isDemo)).toBe(false);
  expect(userDebts.find(d => d.id === 'demo-1')).toBeUndefined();
  
  // Clear demo data
  await localDebtStore.clearDemo();
  
  // After clearing, no demo data should exist
  const afterClear = await localDebtStore.listDebts({ includeDemo: true });
  expect(afterClear.some(d => d.isDemo)).toBe(false);
 });

 test('real and demo data coexist without cross-contamination', async () => {
  const realDebt = {
   id: 'real-1',
   name: 'Real Credit Card',
   amount_pennies: 200000,
   apr: 2499,
   min_payment_pennies: 5000,
   isDemo: false
  };

  const demoDebt = {
   id: 'demo-1', 
   name: 'Demo Credit Card',
   amount_pennies: 100000,
   apr: 1999,
   min_payment_pennies: 2500,
   isDemo: true
  };

  // Add real debt via normal upsert
  await localDebtStore.upsert(realDebt);
  
  // Add demo debt via demo method
  await localDebtStore.replaceAllForDemo([demoDebt]);
  
  // Normal list should only show real debt
  const userDebts = await localDebtStore.listDebts();
  expect(userDebts).toHaveLength(1);
  expect(userDebts[0].id).toBe('real-1');
  expect(userDebts.some(d => d.isDemo)).toBe(false);
  
  // Include demo should show both
  const allDebts = await localDebtStore.listDebts({ includeDemo: true });
  expect(allDebts).toHaveLength(2);
  expect(allDebts.find(d => d.id === 'real-1')).toBeTruthy();
  expect(allDebts.find(d => d.id === 'demo-1')).toBeTruthy();
  
  // Clearing demo should only remove demo data
  await localDebtStore.clearDemo();
  
  const afterClear = await localDebtStore.listDebts();
  expect(afterClear).toHaveLength(1);
  expect(afterClear[0].id).toBe('real-1');
 });

 test('replaceAllForDemo clears existing demo before adding new', async () => {
  // Add first batch of demo data
  await localDebtStore.replaceAllForDemo([
   { id: 'demo-1', name: 'First Demo', amount_pennies: 100000, apr: 1999, min_payment_pennies: 2500, isDemo: true }
  ]);
  
  let allDebts = await localDebtStore.listDebts({ includeDemo: true });
  expect(allDebts.filter(d => d.isDemo)).toHaveLength(1);
  expect(allDebts.find(d => d.id === 'demo-1')).toBeTruthy();
  
  // Replace with second batch (should clear first batch)
  await localDebtStore.replaceAllForDemo([
   { id: 'demo-2', name: 'Second Demo', amount_pennies: 150000, apr: 2199, min_payment_pennies: 3000, isDemo: true },
   { id: 'demo-3', name: 'Third Demo', amount_pennies: 80000, apr: 1799, min_payment_pennies: 2000, isDemo: true }
  ]);
  
  allDebts = await localDebtStore.listDebts({ includeDemo: true });
  const demoDebts = allDebts.filter(d => d.isDemo);
  
  expect(demoDebts).toHaveLength(2);
  expect(demoDebts.find(d => d.id === 'demo-1')).toBeUndefined(); // Should be gone
  expect(demoDebts.find(d => d.id === 'demo-2')).toBeTruthy();
  expect(demoDebts.find(d => d.id === 'demo-3')).toBeTruthy();
 });

 test('demo data has correct structure and properties', async () => {
  const demoDebt = {
   id: 'demo-test',
   name: 'Test Demo Debt',
   amount_pennies: 50000,
   apr: 1500,
   min_payment_pennies: 1000,
   isDemo: true
  };

  await localDebtStore.replaceAllForDemo([demoDebt]);
  
  const allDebts = await localDebtStore.listDebts({ includeDemo: true });
  const retrievedDemo = allDebts.find(d => d.id === 'demo-test');
  
  expect(retrievedDemo).toBeTruthy();
  expect(retrievedDemo?.isDemo).toBe(true);
  expect(retrievedDemo?.name).toBe('Test Demo Debt');
  expect(retrievedDemo?.amount_pennies).toBe(50000);
  expect(retrievedDemo?.apr).toBe(1500);
  expect(retrievedDemo?.min_payment_pennies).toBe(1000);
 });
});