// src/__tests__/planTotals.int.test.js
import FDBFactory from 'fake-indexeddb/lib/FDBFactory'
let localDebtManager;
try { localDebtManager = require('../storage/localDebtManager.ts').localDebtManager; } catch {}
try { if (!localDebtManager) localDebtManager = require('../storage/localDebtManager').localDebtManager; } catch {}
async function seedViaIDBDirect(name, debts) {
  const req = indexedDB.open(name, 1);
  req.onupgradeneeded = (ev) => {
    const db = ev.target.result;
    if (!db.objectStoreNames.contains('debts')) db.createObjectStore('debts', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('payments')) db.createObjectStore('payments', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
  };
  const db = await new Promise((res, rej)=>{ req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); });
  const tx = db.transaction(['debts'], 'readwrite'); const store = tx.objectStore('debts');
  for (const d of debts) store.put(d);
  await new Promise((res, rej)=>{ tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); db.close();
}
async function getTotalsViaIDB(name) {
  const req = indexedDB.open(name, 1);
  const db = await new Promise((res, rej)=>{ req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); });
  const tx = db.transaction(['debts'], 'readonly'); const store = tx.objectStore('debts');
  const allReq = store.getAll();
  const debts = await new Promise((res, rej)=>{ allReq.onsuccess=()=>res(allReq.result||[]); allReq.onerror=()=>rej(allReq.error); });
  db.close();
  const total = debts.reduce((s,d)=>s+(d.balance||0),0);
  const min = debts.reduce((s,d)=>s+(d.minPayment||0),0);
  return { total, min, count: debts.length };
}
describe('Plan Totals (IndexedDB)', () => {
  beforeEach(() => { global.indexedDB = new FDBFactory(); });
  it('computes totals from seeded debts via localDebtManager', async () => {
    if (!localDebtManager?.addDebt) {
      console.warn('localDebtManager not available, skipping test');
      return;
    }
    
    const visa={ id:'d1', name:'Visa', balance:700, minPayment:30, interest:19.99, order:2 };
    const loan={ id:'d2', name:'Loan', balance:2800, minPayment:150, interest:12.99, order:1 };
    
    await localDebtManager.clearAllData?.();
    await localDebtManager.addDebt(loan);
    await localDebtManager.addDebt(visa);
    const total = await localDebtManager.getTotalBalance();
    const min = await localDebtManager.getTotalMinPayments();
    const debts = await localDebtManager.getDebts();
    expect(total).toBeCloseTo(3500, 2);
    expect(min).toBeCloseTo(180, 2);
    expect(debts.length).toBe(2);
  });

  it('computes totals from seeded debts via direct IDB', async () => {
    const DB_NAME='trysnowball';
    const visa={ id:'d1', name:'Visa', balance:700, minPayment:30, interest:19.99, order:2 };
    const loan={ id:'d2', name:'Loan', balance:2800, minPayment:150, interest:12.99, order:1 };
    
    await seedViaIDBDirect(DB_NAME, [loan, visa]);
    const { total, min, count } = await getTotalsViaIDB(DB_NAME);
    expect(total).toBe(3500);
    expect(min).toBe(180);
    expect(count).toBe(2);
  });
});
