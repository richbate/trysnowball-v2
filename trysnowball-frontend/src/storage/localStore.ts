/**
 * Local-first IndexedDB Storage
 * Fast, offline-capable debt management with history tracking
 */

const DB_NAME = 'trysnowball';
const DB_VERSION = 3;

// Type definitions for local storage
export type Debt = {
 id: string;
 user_id: string;
 name: string;
 balance_cents: number;
 apr: number;      // percentage (e.g., 1999 = 19.99%)
 min_payment_pennies: number;
 order_index: number;
 created_at: string;
 updated_at: string;
};

export type Payment = {
 id: string;
 user_id: string;
 debt_id: string;
 amount_pennies: number;   // positive
 interest_cents?: number;  // optional; 0 for now
 principal_cents?: number; // default = amount_pennies
 occurred_at: string;    // ISO date
 created_at: string;
};

export type Snapshot = {
 id: string;        // `${user_id}|monthly|YYYY-MM`
 user_id: string;
 period: 'monthly';
 as_of_date: string;    // 'YYYY-MM-01'
 total_balance_cents: number;
 created_at: string;
};

// Open IndexedDB connection
export async function openDB(): Promise<IDBDatabase> {
 return new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  
  req.onupgradeneeded = () => {
   const db = req.result;
   
   // Create or update debts store
   const debtsStore = db.objectStoreNames.contains('debts')
    ? req.transaction!.objectStore('debts')
    : db.createObjectStore('debts', { keyPath: 'id' });
   
   if (!debtsStore.indexNames.contains('user_id')) {
    debtsStore.createIndex('user_id', 'user_id', { unique: false });
   }
   if (!debtsStore.indexNames.contains('order_index')) {
    debtsStore.createIndex('order_index', 'order_index', { unique: false });
   }
   
   // Create or update payments store
   const paymentsStore = db.objectStoreNames.contains('payments')
    ? req.transaction!.objectStore('payments')
    : db.createObjectStore('payments', { keyPath: 'id' });
   
   if (!paymentsStore.indexNames.contains('user_id')) {
    paymentsStore.createIndex('user_id', 'user_id', { unique: false });
   }
   if (!paymentsStore.indexNames.contains('debt_id')) {
    paymentsStore.createIndex('debt_id', 'debt_id', { unique: false });
   }
   if (!paymentsStore.indexNames.contains('occurred_at')) {
    paymentsStore.createIndex('occurred_at', 'occurred_at', { unique: false });
   }
   
   // NEW: unique composite index to prevent duplicate payments
   if (!paymentsStore.indexNames.contains('uniqUserDebtDateAmt')) {
    paymentsStore.createIndex(
     'uniqUserDebtDateAmt',
     ['user_id', 'debt_id', 'occurred_at', 'amount_pennies'],
     { unique: true }
    );
   }
   
   // Create or update snapshots store
   const snapshotsStore = db.objectStoreNames.contains('snapshots')
    ? req.transaction!.objectStore('snapshots')
    : db.createObjectStore('snapshots', { keyPath: 'id' });
   
   if (!snapshotsStore.indexNames.contains('user_id')) {
    snapshotsStore.createIndex('user_id', 'user_id', { unique: false });
   }
   if (!snapshotsStore.indexNames.contains('as_of_date')) {
    snapshotsStore.createIndex('as_of_date', 'as_of_date', { unique: false });
   }
   
   // Unique constraint for one snapshot per user per month
   if (!snapshotsStore.indexNames.contains('byUserPeriodDate')) {
    snapshotsStore.createIndex('byUserPeriodDate', ['user_id', 'period', 'as_of_date'], { unique: true });
   }
  };
  
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
 });
}

// Generic store operations
async function withTransaction<T>(
 storeName: string,
 mode: IDBTransactionMode,
 operation: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
 const db = await openDB();
 const transaction = db.transaction(storeName, mode);
 const store = transaction.objectStore(storeName);
 const request = operation(store);
 
 return new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
 });
}

// Debt operations
export async function saveDebt(debt: Debt): Promise<void> {
 debt.updated_at = new Date().toISOString();
 await withTransaction('debts', 'readwrite', store => store.put(debt));
}

export async function getDebt(id: string): Promise<Debt | undefined> {
 return await withTransaction('debts', 'readonly', store => store.get(id));
}

export async function getDebts(userId: string): Promise<Debt[]> {
 const db = await openDB();
 const transaction = db.transaction('debts', 'readonly');
 const store = transaction.objectStore('debts');
 const index = store.index('user_id');
 
 return new Promise((resolve, reject) => {
  const request = index.getAll(userId);
  request.onsuccess = () => {
   const debts = request.result.sort((a, b) => a.order_index - b.order_index);
   resolve(debts);
  };
  request.onerror = () => reject(request.error);
 });
}

export async function deleteDebt(id: string): Promise<void> {
 await withTransaction('debts', 'readwrite', store => store.delete(id));
}

// Payment operations
export async function savePayment(payment: Payment): Promise<void> {
 // Default principal_cents to amount_pennies if not provided
 if (!payment.principal_cents) {
  payment.principal_cents = payment.amount_pennies;
 }
 payment.created_at = new Date().toISOString();
 
 await withTransaction('payments', 'readwrite', store => store.put(payment));
}

export async function getPayments(userId: string): Promise<Payment[]> {
 const db = await openDB();
 const transaction = db.transaction('payments', 'readonly');
 const store = transaction.objectStore('payments');
 const index = store.index('user_id');
 
 return new Promise((resolve, reject) => {
  const request = index.getAll(userId);
  request.onsuccess = () => {
   // Sort by occurred_at descending (newest first)
   const payments = request.result.sort((a, b) => 
    new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
   );
   resolve(payments);
  };
  request.onerror = () => reject(request.error);
 });
}

export async function getPaymentsForDebt(debtId: string): Promise<Payment[]> {
 const db = await openDB();
 const transaction = db.transaction('payments', 'readonly');
 const store = transaction.objectStore('payments');
 const index = store.index('debt_id');
 
 return new Promise((resolve, reject) => {
  const request = index.getAll(debtId);
  request.onsuccess = () => {
   const payments = request.result.sort((a, b) => 
    new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
   );
   resolve(payments);
  };
  request.onerror = () => reject(request.error);
 });
}

// Snapshot operations
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
 snapshot.created_at = new Date().toISOString();
 await withTransaction('snapshots', 'readwrite', store => store.put(snapshot));
}

export async function getSnapshots(userId: string): Promise<Snapshot[]> {
 const db = await openDB();
 const transaction = db.transaction('snapshots', 'readonly');
 const store = transaction.objectStore('snapshots');
 const index = store.index('user_id');
 
 return new Promise((resolve, reject) => {
  const request = index.getAll(userId);
  request.onsuccess = () => {
   // Sort by as_of_date ascending (oldest first)
   const snapshots = request.result.sort((a, b) => 
    a.as_of_date.localeCompare(b.as_of_date)
   );
   resolve(snapshots);
  };
  request.onerror = () => reject(request.error);
 });
}

// Utility functions
export function generateId(): string {
 return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function centsToPounds(cents: number): number {
 return cents / 100;
}

export function poundsToCents(pounds: number): number {
 return Math.round(pounds * 100);
}

export function bpsToPercent(bps: number): number {
 return bps / 100; // 1999 bps = 19.99%
}

export function percentToBps(percent: number): number {
 return Math.round(percent * 100); // 19.99% = 1999 bps
}

// Monthly snapshot creation helper
export async function createMonthlySnapshot(userId: string): Promise<void> {
 const debts = await getDebts(userId);
 const now = new Date();
 const asOfDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
 const snapshotId = `${userId}|monthly|${asOfDate.substr(0, 7)}`;
 
 const totalBalanceCents = debts.reduce((sum, debt) => sum + debt.amount_pennies_cents, 0);
 
 const snapshot: Snapshot = {
  id: snapshotId,
  user_id: userId,
  period: 'monthly',
  as_of_date: asOfDate,
  total_balance_cents: totalBalanceCents,
  created_at: new Date().toISOString()
 };
 
 await saveSnapshot(snapshot);
}

// Clear all stores (for testing)
export async function clearAllStores(): Promise<void> {
 const db = await openDB();
 
 return Promise.all(
  ['debts', 'payments', 'snapshots'].map(storeName => 
   new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
   })
  )
 ).then(() => undefined);
}