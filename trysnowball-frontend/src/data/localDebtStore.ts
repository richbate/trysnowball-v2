/**
 * CP-1: Single Source of Truth - IndexedDB Store
 * 
 * This is the ONLY place where debt data should be read/written.
 * Replaces: debtsManager (localStorage), localDebtManager, and context stores.
 */

import Dexie, { Table } from 'dexie';
import { 
  Debt, 
  DebtPayment, 
  DebtSnapshot, 
  MigrationMeta,
  normalizeAmount 
} from '../types/debt.ts';
import { generateDemoDebts, DemoLocale } from './demoDebts.ts';
import { AppSettings, SettingsRow, DEFAULT_SETTINGS } from '../types/settings.ts';

// Database version - increment when schema changes
const DB_VERSION = 3;

/**
 * Main database class extending Dexie
 */
class DebtDatabase extends Dexie {
  // Tables with TypeScript types
  debts!: Table<Debt>;
  payments!: Table<DebtPayment>;
  snapshots!: Table<DebtSnapshot>;
  meta!: Table<MigrationMeta>;
  settings!: Table<SettingsRow>;

  constructor() {
    super('SnowballDebtsDB');
    
    this.version(DB_VERSION).stores({
      // Primary keys and indexes
      debts: 'id, name, type, order, createdAt, updatedAt',
      payments: 'id, debtId, month, date, createdAt',
      snapshots: 'id, debtId, timestamp',
      meta: 'key, updatedAt',
      settings: '&key'  // & means unique key
    });
  }
}

// Single database instance
const db = new DebtDatabase();

/**
 * Main LocalDebtStore API
 * All debt operations go through this interface
 */
export class LocalDebtStore {
  private static instance: LocalDebtStore;
  
  private constructor() {}
  
  static getInstance(): LocalDebtStore {
    if (!LocalDebtStore.instance) {
      LocalDebtStore.instance = new LocalDebtStore();
    }
    return LocalDebtStore.instance;
  }

  // ========== Core CRUD Operations ==========

  /**
   * List all debts, optionally filtered
   */
  async listDebts(includeDemo = true): Promise<Debt[]> {
    try {
      let debts = await db.debts.toArray();
      
      if (!includeDemo) {
        debts = debts.filter(d => !d.isDemo);
      }
      
      // Sort by order, then by creation date
      return debts.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } catch (error) {
      console.error('[LocalDebtStore] Error listing debts:', error);
      return [];
    }
  }

  /**
   * Get a single debt by ID
   */
  async getDebt(id: string): Promise<Debt | null> {
    try {
      const debt = await db.debts.get(id);
      return debt || null;
    } catch (error) {
      console.error('[LocalDebtStore] Error getting debt:', error);
      return null;
    }
  }

  /**
   * Insert or update a debt
   */
  async upsertDebt(debt: Partial<Debt>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // Generate ID if not provided
      const id = debt.id || `debt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      
      // Get existing debt if updating
      const existing = debt.id ? await db.debts.get(debt.id) : null;
      
      // Prepare the complete debt object
      const completeDebt: Debt = {
        // Defaults
        id,
        name: 'Unnamed Debt',
        type: 'Other',
        balance: 0,
        originalAmount: 0,
        interestRate: 0,
        minPayment: 0,
        order: 999,
        createdAt: now,
        updatedAt: now,
        
        // Merge existing data
        ...existing,
        
        // Apply updates (with normalization)
        ...debt,
        id,
        balance: normalizeAmount(debt.balance ?? existing?.balance ?? 0),
        originalAmount: normalizeAmount(debt.originalAmount ?? existing?.originalAmount ?? (debt.balance ?? 0)),
        interestRate: normalizeAmount(debt.interestRate ?? existing?.interestRate ?? 0),
        minPayment: normalizeAmount(debt.minPayment ?? existing?.minPayment ?? 0),
        updatedAt: now
      };
      
      // Save to database
      await db.debts.put(completeDebt);
      
      // Track analytics
      this.trackAnalytics('debt_upserted', {
        id,
        isNew: !existing,
        type: completeDebt.type
      });
      
      return id;
    } catch (error) {
      console.error('[LocalDebtStore] Error upserting debt:', error);
      throw error;
    }
  }

  /**
   * Bulk insert/update debts
   */
  async upsertMany(debts: Partial<Debt>[]): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const completeDebts = await Promise.all(
        debts.map(async (debt, index) => {
          const id = debt.id || `debt_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 11)}`;
          const existing = debt.id ? await db.debts.get(debt.id) : null;
          
          return {
            id,
            name: debt.name || 'Unnamed Debt',
            type: debt.type || 'Other',
            balance: normalizeAmount(debt.balance ?? 0),
            originalAmount: normalizeAmount(debt.originalAmount ?? debt.balance ?? 0),
            interestRate: normalizeAmount(debt.interestRate ?? 0),
            minPayment: normalizeAmount(debt.minPayment ?? 0),
            order: debt.order ?? index,
            createdAt: debt.createdAt || existing?.createdAt || now,
            updatedAt: now,
            isDemo: debt.isDemo,
            notes: debt.notes,
            accountNumber: debt.accountNumber,
            dueDate: debt.dueDate,
            creditLimit: debt.creditLimit
          } as Debt;
        })
      );
      
      await db.debts.bulkPut(completeDebts);
      
      this.trackAnalytics('debts_bulk_upserted', {
        count: completeDebts.length
      });
    } catch (error) {
      console.error('[LocalDebtStore] Error upserting many debts:', error);
      throw error;
    }
  }

  /**
   * Delete a debt
   */
  async deleteDebt(id: string): Promise<void> {
    try {
      await db.transaction('rw', db.debts, db.payments, db.snapshots, async () => {
        // Delete the debt
        await db.debts.delete(id);
        
        // Delete related payments
        await db.payments.where('debtId').equals(id).delete();
        
        // Delete related snapshots
        await db.snapshots.where('debtId').equals(id).delete();
      });
      
      this.trackAnalytics('debt_deleted', { id });
    } catch (error) {
      console.error('[LocalDebtStore] Error deleting debt:', error);
      throw error;
    }
  }

  /**
   * Clear all debts (dangerous!)
   */
  async clearAll(): Promise<void> {
    try {
      await db.transaction('rw', db.debts, db.payments, db.snapshots, async () => {
        await db.debts.clear();
        await db.payments.clear();
        await db.snapshots.clear();
      });
      
      this.trackAnalytics('all_debts_cleared', {});
    } catch (error) {
      console.error('[LocalDebtStore] Error clearing all debts:', error);
      throw error;
    }
  }

  // ========== Payment Operations ==========

  /**
   * Record a payment
   */
  async recordPayment(payment: Omit<DebtPayment, 'id' | 'createdAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const completePayment: DebtPayment = {
        id: `payment_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        createdAt: now,
        ...payment
      };
      
      await db.payments.add(completePayment);
      
      // Update debt balance
      const debt = await db.debts.get(payment.debtId);
      if (debt) {
        await this.upsertDebt({
          ...debt,
          balance: Math.max(0, debt.balance - payment.amount)
        });
        
        // Record snapshot
        await this.recordSnapshot({
          debtId: payment.debtId,
          balance: debt.balance - payment.amount,
          timestamp: now,
          eventType: 'payment'
        });
      }
      
      this.trackAnalytics('payment_recorded', {
        debtId: payment.debtId,
        amount: payment.amount,
        type: payment.type
      });
    } catch (error) {
      console.error('[LocalDebtStore] Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a debt or month
   */
  async getPayments(filters?: { debtId?: string; month?: string }): Promise<DebtPayment[]> {
    try {
      let query = db.payments.toCollection();
      
      if (filters?.debtId) {
        query = db.payments.where('debtId').equals(filters.debtId);
      }
      
      let payments = await query.toArray();
      
      if (filters?.month) {
        payments = payments.filter(p => p.month === filters.month);
      }
      
      return payments.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('[LocalDebtStore] Error getting payments:', error);
      return [];
    }
  }

  // ========== Snapshot Operations ==========

  /**
   * Record a debt balance snapshot
   */
  private async recordSnapshot(snapshot: DebtSnapshot): Promise<void> {
    try {
      await db.snapshots.add({
        ...snapshot,
        id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      } as any);
    } catch (error) {
      console.error('[LocalDebtStore] Error recording snapshot:', error);
    }
  }

  /**
   * Get debt history snapshots
   */
  async getSnapshots(debtId: string, limit = 100): Promise<DebtSnapshot[]> {
    try {
      return await db.snapshots
        .where('debtId')
        .equals(debtId)
        .limit(limit)
        .reverse()
        .sortBy('timestamp');
    } catch (error) {
      console.error('[LocalDebtStore] Error getting snapshots:', error);
      return [];
    }
  }

  // ========== Metadata Operations ==========

  /**
   * Get metadata value
   */
  async getMeta(key: string): Promise<any> {
    try {
      const meta = await db.meta.get(key);
      return meta?.value;
    } catch (error) {
      console.error('[LocalDebtStore] Error getting meta:', error);
      return null;
    }
  }

  /**
   * Set metadata value
   */
  async setMeta(key: string, value: any): Promise<void> {
    try {
      await db.meta.put({
        key,
        value,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[LocalDebtStore] Error setting meta:', error);
    }
  }

  // ========== Demo Data ==========

  /**
   * Load demo data
   */
  async loadDemoData(locale: DemoLocale = 'uk'): Promise<Partial<Debt>[]> {
    try {
      const demoDebts = generateDemoDebts(locale);
      
      await this.clearAll();
      await this.upsertMany(demoDebts);
      await this.setMeta('demo_loaded', true);
      
      this.trackAnalytics('demo_data_loaded', {
        count: demoDebts.length,
        locale
      });
      
      return demoDebts;
    } catch (error) {
      console.error('[LocalDebtStore] Error loading demo data:', error);
      throw error;
    }
  }

  /**
   * Clear demo data only
   */
  async clearDemoData(): Promise<void> {
    try {
      const demoDebts = await db.debts.where('isDemo').equals(true).toArray();
      const demoIds = demoDebts.map(d => d.id);
      
      await db.transaction('rw', db.debts, db.payments, db.snapshots, async () => {
        // Delete demo debts
        await db.debts.bulkDelete(demoIds);
        
        // Delete related payments
        for (const id of demoIds) {
          await db.payments.where('debtId').equals(id).delete();
          await db.snapshots.where('debtId').equals(id).delete();
        }
      });
      
      await this.setMeta('demo_loaded', false);
      
      this.trackAnalytics('demo_data_cleared', {
        count: demoIds.length
      });
    } catch (error) {
      console.error('[LocalDebtStore] Error clearing demo data:', error);
      throw error;
    }
  }

  // ========== Settings Operations (CP-1) ==========

  /**
   * Get app settings with defaults
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const row = await db.settings.get('app');
      return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
    } catch (error) {
      console.error('[LocalDebtStore] Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update app settings (partial update)
   */
  async setSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const current = await this.getSettings();
      const next = { ...current, ...patch };
      await db.settings.put({ key: 'app', value: next });
      
      // Track setting changes (non-blocking)
      try {
        const changedKeys = Object.keys(patch);
        this.trackAnalytics('settings_updated', { keys: changedKeys });
      } catch {}
      
      return next;
    } catch (error) {
      console.error('[LocalDebtStore] Error updating settings:', error);
      throw error;
    }
  }

  // ========== Analytics ==========

  private trackAnalytics(event: string, properties: Record<string, any>): void {
    // Analytics tracking (to be integrated with PostHog or similar)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties);
    }
    
    // Send to analytics service
    try {
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event, {
          ...properties,
          source: 'localDebtStore'
        });
      }
    } catch (error) {
      // Silently fail analytics
    }
  }

  // ========== Migration Status ==========

  /**
   * Check if migration is needed
   */
  async needsMigration(): Promise<boolean> {
    const migrationComplete = await this.getMeta('migration_completed_v2');
    return !migrationComplete;
  }

  /**
   * Mark migration as complete
   */
  async markMigrationComplete(): Promise<void> {
    await this.setMeta('migration_completed_v2', true);
    await this.setMeta('migration_date', new Date().toISOString());
  }
}

// Export singleton instance
export const localDebtStore = LocalDebtStore.getInstance();

// Export for testing
export { DebtDatabase };