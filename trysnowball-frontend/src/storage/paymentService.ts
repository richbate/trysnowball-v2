/**
 * Atomic Payment Service
 * Handles payment recording with debt balance updates in single transaction
 */

import { openDB } from './localStore.ts';

export async function applyPayment({
  user_id,
  debt_id,
  amount_cents,
  occurred_at,
  id,
}: {
  user_id: string;
  debt_id: string;
  amount_cents: number;
  occurred_at: string;
  id?: string;
}): Promise<string> {
  const db = await openDB();
  const now = new Date().toISOString();
  const paymentId = id ?? crypto.randomUUID();

  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(['debts', 'payments'], 'readwrite');
    const debtsStore = transaction.objectStore('debts');
    const paymentsStore = transaction.objectStore('payments');

    // 1) Fetch debt
    const getDebtRequest = debtsStore.get(debt_id);
    
    getDebtRequest.onsuccess = () => {
      const debt = getDebtRequest.result;
      if (!debt || debt.user_id !== user_id) {
        transaction.abort();
        return reject(new Error('Debt not found for user'));
      }

      // 2) Check for duplicate payment (same user, debt, date, amount)
      if (paymentsStore.indexNames.contains('uniqUserDebtDateAmt')) {
        const uniqueIndex = paymentsStore.index('uniqUserDebtDateAmt');
        const dupRequest = uniqueIndex.get([user_id, debt_id, occurred_at, amount_cents]);
        
        dupRequest.onsuccess = () => {
          if (dupRequest.result) {
            // Already recorded - return existing payment ID
            resolve(dupRequest.result.id);
            return;
          }

          // No duplicate - proceed with payment
          processPayment();
        };
        
        dupRequest.onerror = () => {
          // Index doesn't exist yet or error - proceed anyway
          processPayment();
        };
      } else {
        // No unique index - proceed with payment
        processPayment();
      }

      function processPayment() {
        // 3) Decrement balance (clamped at 0)
        debt.balance_cents = Math.max(0, (debt.balance_cents || 0) - (amount_cents || 0));
        debt.updated_at = now;
        
        const updateDebtRequest = debtsStore.put(debt);
        
        updateDebtRequest.onsuccess = () => {
          // 4) Insert payment (append-only)
          const payment = {
            id: paymentId,
            user_id,
            debt_id,
            amount_cents,
            principal_cents: amount_cents,
            interest_cents: 0,
            occurred_at,
            created_at: now,
          };
          
          const addPaymentRequest = paymentsStore.add(payment);
          
          addPaymentRequest.onsuccess = () => {
            // Transaction will complete automatically
          };
          
          addPaymentRequest.onerror = () => {
            transaction.abort();
            reject(new Error('Failed to record payment'));
          };
        };
        
        updateDebtRequest.onerror = () => {
          transaction.abort();
          reject(new Error('Failed to update debt balance'));
        };
      }
    };

    getDebtRequest.onerror = () => {
      transaction.abort();
      reject(new Error('Failed to fetch debt'));
    };

    transaction.oncomplete = () => {
      resolve(paymentId);
    };

    transaction.onerror = () => {
      reject(transaction.error || new Error('Transaction failed'));
    };
  });
}

// Helper to create monthly snapshot after payment
export async function createMonthlySnapshot(userId: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(['debts', 'snapshots'], 'readwrite');
  const debtsStore = transaction.objectStore('debts');
  const snapshotsStore = transaction.objectStore('snapshots');

  return new Promise((resolve, reject) => {
    // Get all debts for user
    const debtsIndex = debtsStore.index('user_id');
    const getDebtsRequest = debtsIndex.getAll(userId);

    getDebtsRequest.onsuccess = () => {
      const debts = getDebtsRequest.result || [];
      const totalBalanceCents = debts.reduce((sum, debt) => sum + (debt.balance_cents || 0), 0);

      // Generate snapshot ID for current month
      const now = new Date();
      const asOfDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const snapshotId = `${userId}|monthly|${asOfDate.substr(0, 7)}`;

      const snapshot = {
        id: snapshotId,
        user_id: userId,
        period: 'monthly' as const,
        as_of_date: asOfDate,
        total_balance_cents: totalBalanceCents,
        created_at: new Date().toISOString()
      };

      // Upsert snapshot (will update if exists, create if not)
      const putSnapshotRequest = snapshotsStore.put(snapshot);
      
      putSnapshotRequest.onsuccess = () => {
        // Transaction will complete automatically
      };
      
      putSnapshotRequest.onerror = () => {
        reject(new Error('Failed to create snapshot'));
      };
    };

    getDebtsRequest.onerror = () => {
      reject(new Error('Failed to fetch debts for snapshot'));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error || new Error('Snapshot transaction failed'));
    };
  });
}