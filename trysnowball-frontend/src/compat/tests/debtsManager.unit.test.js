import { debtsManager } from '../lib/debtsManager';

function freshManager() {
 // Re-require to reset singleton for each test
 jest.resetModules();
 const { debtsManager } = require('../lib/debtsManager');
 debtsManager.clearAllData();
 return debtsManager;
}

describe('DebtsManager – core', () => {
 test('notifyListeners does not throw with 0 listeners', () => {
  const mgr = freshManager();
  // no subscribe calls → 0 listeners
  expect(() => mgr.saveData()).not.toThrow();
 });

 test('getDebts() returns [] when no data and includeDemo=false', () => {
  const mgr = freshManager();
  const out = mgr.getDebts({ includeDemo: false });
  expect(out).toEqual([]);
 });

 test('saveDebt normalizes fields and assigns order/minPayment', () => {
  const mgr = freshManager();
  const d = mgr.saveDebt({
   name: 'Visa',
   balance: 1200,
   interest: 19.99
  });
  expect(d.id).toBeTruthy();
  expect(d.minPayment).toBeGreaterThanOrEqual(25); // 2% rule
  expect(d.order).toBe(1);
  const [stored] = mgr.getDebts({ includeDemo: false });
  expect(stored.balance).toBe(1200);
  expect(stored.interest).toBe(19.99);
  expect(stored.minPayment).toBe(d.minPayment);
 });

 test('recordPayment reduces balance and writes history', () => {
  const mgr = freshManager();
  const d = mgr.saveDebt({ name: 'Loan', balance: 2000, interest: 8, minPayment: 50 });
  const before = mgr.getDebts()[0].balance;
  mgr.recordPayment({ debtId: d.id, month: mgr.getMonthKey(), amount: 300 });
  const after = mgr.getDebts()[0].balance;
  expect(after).toBeLessThan(before);
  const hist = mgr.getDebtHistory(d.id);
  expect(hist.length).toBeGreaterThan(0);
 });

 test('legacy localStorage data does NOT override manager data', () => {
  const mgr = freshManager();
  // Seed legacy key with the infamous 18,512 total
  localStorage.setItem('debtBalances', JSON.stringify([
   { id: 'ghost', name: 'GhostCard', balance: 18512, minPayment: 100, interest: 20, order: 1 }
  ]));

  // Now add real data in manager
  mgr.saveDebt({ name: 'Visa', balance: 1200, interest: 19.99, minPayment: 30 });
  mgr.saveDebt({ name: 'Loan', balance: 2300, interest: 12.9, minPayment: 120 });

  const debts = mgr.getDebts({ includeDemo: false });
  const total = debts.reduce((s, d) => s + d.balance, 0);
  expect(total).toBe(3500); // must NOT be 18512
  expect(debts.find(d => d.name === 'GhostCard')).toBeFalsy();
 });

 test('reorderDebts updates order field', () => {
  const mgr = freshManager();
  const a = mgr.saveDebt({ name: 'A', balance: 100, interest: 10, minPayment: 25 });
  const b = mgr.saveDebt({ name: 'B', balance: 200, interest: 10, minPayment: 25 });
  mgr.reorderDebts([{ id: b.id, order: 1 }, { id: a.id, order: 2 }]);
  const ids = mgr.getDebts().map(d => d.name);
  expect(ids).toEqual(['B', 'A']);
 });
});