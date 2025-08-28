/**
 * Debt Management System - Pure Facade over CP-1 IndexedDB Store
 * All operations delegate to localDebtStore.ts - no local state, no legacy storage
 */

import { DebtEngine } from '../utils/DebtEngine';
import { localDebtStore } from '../data/localDebtStore.ts';
import { toDebtArray, normalizeMetrics, safeNumber } from '../utils/debts';
import { withNoDataGuard } from '../managers/withNoDataGuard.js';

const EMPTY = { debts: [] };


// Facade class - all data operations delegate to localDebtStore
// No local state maintained here

export class DebtsManager {
  constructor() {
    // Pure facade - all operations delegate to localDebtStore
    // No local state, no storage keys, no data loading
    this.listeners = new Set();
  }

  // REMOVED: loadData() - data loading handled by localDebtStore

  // REMOVED: migrateDebtFields() - migrations handled by localDebtStore

  // REMOVED: migrateLegacyData() - migrations handled by localDebtStore

  // REMOVED: saveData() - saving handled by localDebtStore

  // REMOVED: storage key methods - no storage managed here

  // REMOVED: reloadData() - data reloading handled by localDebtStore

  /**
   * Subscribe to data changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of data changes
   */
  notifyListeners() {
    if (!this.listeners) return; // extra guard
    this.listeners.forEach(cb => {
      try {
        cb({}); // Facade: listeners get empty object, real data from localDebtStore
      } catch (e) {
        console.error('[DebtsManager] listener error:', e);
      }
    });
  }

  // SNAPSHOT & METRICS (safe facades)

  /**
   * Get snapshot of all data needed by UI - never returns undefined
   */
  async getData() {
    try {
      const debts = await localDebtStore.listDebts();
      return { debts: toDebtArray(debts) };
    } catch (error) {
      console.error('[debtsManager] Error getting data:', error);
      return EMPTY;
    }
  }

  /**
   * Get metrics - never throws, never returns undefined
   */
  async getMetrics() {
    try {
      const debts = await localDebtStore.listDebts();
      const safeDebts = toDebtArray(debts);
      const totalDebt = safeDebts.reduce((sum, debt) => sum + safeNumber(debt.balance), 0);
      const totalMinPayments = safeDebts.reduce((sum, debt) => sum + safeNumber(debt.minPayment), 0);
      const count = safeDebts.length;
      
      return normalizeMetrics({
        totalDebt,
        totalMinPayments,
        count,
        byType: {}
      });
    } catch (error) {
      console.error('[debtsManager] Error getting metrics:', error);
      return normalizeMetrics(null);
    }
  }

  // DEBT OPERATIONS

  /**
   * CENTRALIZED DEBT ACCESSOR - delegates to localDebtStore
   */
  async getDebts({ includeDemo = true, sorted = true } = {}) {
    const rawDebts = await localDebtStore.listDebts();
    
    // Return existing debts if available
    if (rawDebts.length > 0) {
      // Normalize field names for consistency
      const normalizedDebts = rawDebts.map(debt => ({
        ...debt,
        balance: debt.balance ?? debt.amount ?? 0,
        amount: debt.balance ?? debt.amount ?? 0,
        interest: debt.interest ?? debt.interestRate ?? 0,
        minPayment: debt.minPayment ?? debt.regularPayment ?? 0
      }));

      return sorted ? this._getSortedDebts(normalizedDebts) : normalizedDebts;
    }

    // Load demo data if no debts exist and demo is enabled
    if (includeDemo) {
      console.log('[DebtsManager] No user debts found, loading demo data');
      return this.loadDemoData();
    }

    return [];
  }

  /**
   * Internal helper for sorting debts by user-defined order
   * @private
   */
  _getSortedDebts(debts) {
    return debts.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Validate debt data before saving
   * @private
   */
  _validateDebt(debt) {
    if (!debt) throw new Error('Debt object is required');

    if (!debt.name || typeof debt.name !== 'string' || debt.name.trim().length === 0) {
      throw new Error('Debt name is required and must be a non-empty string');
    }

    const balance = debt.balance ?? debt.amount ?? 0;
    if (typeof balance !== 'number' || balance < 0) {
      throw new Error('Debt balance must be a non-negative number');
    }

    const interest = debt.interest ?? debt.interestRate ?? 0;
    if (typeof interest !== 'number' || interest < 0 || interest > 100) {
      throw new Error('Interest rate must be a number between 0 and 100');
    }

    const minPayment = debt.minPayment ?? debt.regularPayment ?? 0;
    if (typeof minPayment !== 'number' || minPayment < 0) {
      throw new Error('Minimum payment must be a non-negative number');
    }
  }

  /**
   * Normalize debt fields and apply business rules
   * @private
   */
  async _normalizeDebt(debt, { source, note, timestamp }) {
    const balance = debt.balance ?? debt.amount ?? 0;
    const interest = debt.interest ?? debt.interestRate ?? 0;
    const minPayment = debt.minPayment ?? debt.regularPayment ?? this._calculateMinPayment(balance);

    return {
      ...debt,
      name: debt.name.trim(),
      balance,
      amount: balance,
      interest,
      interestRate: interest,
      minPayment,
      regularPayment: minPayment,
      id: debt.id || this._generateDebtId(),
      order: debt.order ?? await this._getNextOrder(),
      lastModified: { timestamp, source, note }
    };
  }

  /**
   * Calculate minimum payment using canonical rules
   * @private
   */
  _calculateMinPayment(balance) {
    return Math.max(25, Math.round(balance * 0.02));
  }

  /**
   * Generate unique debt ID
   * @private
   */
  _generateDebtId() {
    return `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get next order number for new debts
   * @private
   */
  async _getNextOrder() {
    const debts = await localDebtStore.listDebts();
    const maxOrder = debts.length > 0 ? Math.max(...debts.map(d => d.order || 0)) : 0;
    return maxOrder + 1;
  }

  /**
   * @deprecated Use getDebts() instead.
   */
  getDebtsInOrder() {
    console.warn('[DebtsManager] getDebtsInOrder() is deprecated. Use getDebts({ sorted: true }) instead.');
    return this.getDebts({ sorted: true });
  }

  /**
   * CENTRALIZED DEBT WRITER - delegates to localDebtStore
   */
  async saveDebt(debt, { source = 'user_edit', note = null } = {}) {
    this._validateDebt(debt);
    
    const timestamp = new Date().toISOString();
    const normalizedDebt = await this._normalizeDebt(debt, { source, note, timestamp });
    
    // Delegate to localDebtStore for actual saving
    const savedDebt = await localDebtStore.upsert(normalizedDebt);
    
    // Notify listeners after save
    this.notifyListeners();
    
    return savedDebt;
  }

  /**
   * CENTRALIZED BULK DEBT WRITER - delegates to localDebtStore
   */
  async saveDebts(debts, { source = 'bulk_import', note = null } = {}) {
    if (!Array.isArray(debts)) {
      throw new Error('saveDebts requires an array of debt objects');
    }

    console.log(`[DebtsManager] Bulk saving ${debts.length} debts [${source}]`);
    const results = [];

    for (const debt of debts) {
      try {
        const result = await this.saveDebt(debt, { source, note });
        results.push(result);
      } catch (error) {
        console.error(`[DebtsManager] Failed to save debt ${debt.name || 'unnamed'}:`, error);
      }
    }

    return results;
  }

  /**
   * Get debt balance history for debugging/analysis - delegates to localDebtStore
   */
  async getDebtHistory(debtId) {
    const debts = await localDebtStore.listDebts();
    const debt = debts.find(d => d.id === debtId);
    return debt?.history || [];
  }

  /**
   * Get all debts with their latest balance changes - delegates to localDebtStore
   */
  async getDebtsWithLatestChanges() {
    const debts = await localDebtStore.listDebts();
    return debts.map(debt => {
      const history = debt.history || [];
      const latestChange =
        history.length > 1 ? history[history.length - 1].balance - history[history.length - 2].balance : 0;

      return {
        ...debt,
        latestChange,
        totalChanges: history.length,
        firstRecorded: history[0]?.changedAt,
        lastChanged: history[history.length - 1]?.changedAt
      };
    });
  }

  /**
   * Debug helper: Export debt history as CSV-like data - delegates to localDebtStore
   */
  async exportDebtHistory(debtId = null) {
    const debts = await localDebtStore.listDebts();
    
    if (debtId) {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) return null;

      return {
        debtName: debt.name,
        history: debt.history || []
      };
    }

    return debts.map(debt => ({
      debtName: debt.name,
      id: debt.id,
      currentBalance: debt.balance ?? debt.amount ?? 0,
      originalAmount: debt.originalAmount || 0,
      totalReduction: (debt.originalAmount || 0) - (debt.balance ?? debt.amount ?? 0),
      history: debt.history || []
    }));
  }

  /**
   * Debug payment scenarios - delegates to localDebtStore
   */
  async analyzePayments(payment1 = 1941, payment2 = 2191, maxMonths = 60) {
    console.log(`🔍 ANALYZING PAYMENTS: £${payment1} vs £${payment2}`);
    console.log('='.repeat(50));

    const debts = await this.getDebts();
    if (debts.length === 0) {
      console.log('❌ No debts found for analysis');
      return null;
    }

    const totalMinimums = debts.reduce((sum, debt) => {
      const minPayment =
        debt.minPayment || debt.min || debt.regularPayment || Math.max(25, Math.floor((debt.balance || debt.amount || 0) * 0.02));
      return sum + minPayment;
    }, 0);

    console.log(`💰 Current Debts:`, debts.map(d => `${d.name}: £${d.balance || d.amount || 0}`));
    console.log(`📊 Total Debt: £${debts.reduce((s, d) => s + (d.balance || d.amount || 0), 0)}`);
    console.log(`💳 Total Minimums: £${totalMinimums}/month`);
    console.log(`🎯 Extra Payment 1: £${payment1 - totalMinimums}`);
    console.log(`🎯 Extra Payment 2: £${payment2 - totalMinimums}`);
    console.log('');

    const scenario1 = this.simulatePayoffScenario(debts, payment1, maxMonths);
    const scenario2 = this.simulatePayoffScenario(debts, payment2, maxMonths);

    console.log(`📅 RESULTS:`);
    console.log(
      `   Payment £${payment1}: ${scenario1.payoffMonth > 0 ? scenario1.payoffMonth + ' months' : 'Not paid off in ' + maxMonths + ' months'}`
    );
    console.log(
      `   Payment £${payment2}: ${scenario2.payoffMonth > 0 ? scenario2.payoffMonth + ' months' : 'Not paid off in ' + maxMonths + ' months'}`
    );

    if (scenario1.payoffMonth > 0 && scenario2.payoffMonth > 0) {
      const timeSaved = scenario1.payoffMonth - scenario2.payoffMonth;
      console.log(`   ⏰ Time difference: ${timeSaved} months ${timeSaved > 0 ? 'faster with higher payment' : 'no difference'}`);
      console.log(`   💰 Interest saved: £${Math.round(scenario1.totalInterest - scenario2.totalInterest)}`);
    }

    console.log('');
    console.log(`📈 MONTH-BY-MONTH COMPARISON (first 12 months):`);
    console.log('Month | Payment1 | Payment2 | Difference');
    console.log('------|----------|----------|----------');

    for (let i = 0; i < Math.min(12, maxMonths); i++) {
      const bal1 = scenario1.monthlyBalances[i] || 0;
      const bal2 = scenario2.monthlyBalances[i] || 0;
      const diff = bal1 - bal2;
      console.log(`  ${String(i + 1).padStart(2)}  |  £${String(bal1).padStart(6)} |  £${String(bal2).padStart(6)} |   £${diff >= 0 ? '+' : ''}${diff}`);
    }

    return {
      scenario1: { payment: payment1, months: scenario1.payoffMonth, interest: scenario1.totalInterest },
      scenario2: { payment: payment2, months: scenario2.payoffMonth, interest: scenario2.totalInterest },
      timeDifference: scenario1.payoffMonth > 0 && scenario2.payoffMonth > 0 ? scenario1.payoffMonth - scenario2.payoffMonth : null,
      interestSaved: scenario1.totalInterest - scenario2.totalInterest,
      monthlyBalances: { scenario1: scenario1.monthlyBalances, scenario2: scenario2.monthlyBalances }
    };
  }

  /**
   * Simulate debt payoff with snowball method
   */
  simulatePayoffScenario(debts, totalPayment, maxMonths) {
    const workingDebts = JSON.parse(JSON.stringify(debts))
      .map(debt => ({
        name: debt.name,
        balance: debt.balance || debt.amount || 0,
        rate: debt.interest || debt.rate || 20,
        minPayment:
          debt.minPayment || debt.min || debt.regularPayment || Math.max(25, Math.floor((debt.balance || debt.amount || 0) * 0.02)),
        order: debt.order || 999
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.balance - b.balance;
      });

    const monthlyBalances = [];
    let totalInterest = 0;
    let payoffMonth = -1;

    for (let month = 0; month < maxMonths; month++) {
      const totalBalance = workingDebts.reduce((sum, debt) => sum + debt.balance, 0);
      monthlyBalances.push(Math.round(totalBalance));

      if (totalBalance <= 1) {
        payoffMonth = month;
        break;
      }

      let availablePayment = totalPayment;

      // Minimums first
      for (const debt of workingDebts) {
        if (debt.balance <= 0) continue;

        const monthlyInterest = debt.balance * (debt.rate / 12 / 100);
        totalInterest += monthlyInterest;
        const principal = Math.max(0, debt.minPayment - monthlyInterest);

        debt.balance = Math.max(0, debt.balance - principal);
        availablePayment -= debt.minPayment;
      }

      // Snowball extra to smallest
      if (availablePayment > 0) {
        for (const debt of workingDebts) {
          if (debt.balance > 0) {
            const extra = Math.min(availablePayment, debt.balance);
            debt.balance -= extra;
            break;
          }
        }
      }
    }

    return {
      payoffMonth,
      totalInterest: Math.round(totalInterest),
      monthlyBalances
    };
  }

  /**
   * Delete a debt - delegates to localDebtStore
   */
  async deleteDebt(debtId) {
    await localDebtStore.delete(debtId);
    // Also remove from payment history if we ever add that to localDebtStore
    this.notifyListeners();
  }

  /**
   * Reorder debts - delegates to localDebtStore
   */
  async reorderDebts(orderUpdates) {
    // Get current debts and apply order updates
    const debts = await localDebtStore.listDebts();
    
    const updates = orderUpdates.map(({ id, order }) => {
      const debt = debts.find(d => d.id === id);
      if (debt) {
        return { ...debt, order, updatedAt: new Date().toISOString() };
      }
      return null;
    }).filter(Boolean);
    
    // Batch update all reordered debts
    await localDebtStore.upsertMany(updates);
    this.notifyListeners();
  }

  /**
   * Set all debts (bulk, resets metadata as needed) - delegates to localDebtStore
   */
  async setDebts(debts) {
    const normalizedDebts = debts.map(debt => ({
      ...debt,
      id: debt.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalAmount: debt.originalAmount || debt.amount || debt.balance || 0,
      createdAt: debt.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    await localDebtStore.upsertMany(normalizedDebts);
    this.notifyListeners();
  }

  // PAYMENT HISTORY

  async recordPayment(payment) {
    // TODO: Implement payment history in localDebtStore
    // For now, just update the debt balance
    const debts = await localDebtStore.listDebts();
    const debt = debts.find(d => d.id === payment.debtId);
    
    if (debt) {
      const prevBalance = debt.balance ?? debt.amount ?? 0;
      const newBalance = Math.max(0, prevBalance - payment.amount);

      await this.saveDebt(
        { ...debt, balance: newBalance },
        { source: 'payment_recorded', note: `Payment of £${payment.amount} recorded for ${payment.month}` }
      );
    }
    
    const paymentRecord = {
      ...payment,
      id: payment.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      recordedAt: new Date().toISOString()
    };
    
    return paymentRecord;
  }

  async getPaymentHistory(month = null) {
    // TODO: Implement payment history in localDebtStore
    // For now, return empty array
    return [];
  }

  async getPayment(debtId, month) {
    // TODO: Implement payment history in localDebtStore
    return null;
  }

  // PROJECTIONS & CALCULATIONS

  async calculateProjections() {
    const debts = await this.getDebts();
    const settings = await this.getSettings() || { extraPayment: 0 };
    const extraPayment = settings.extraPayment || 0;

    if (debts.length === 0) {
      return { months: [], totalMonths: 0, totalInterest: 0 };
    }

    try {
      const engine = new DebtEngine(debts);
      const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0);
      const projections = engine.generateTimeline(totalMinPayments + extraPayment);

      const result = {
        months: projections,
        totalMonths: projections.length,
        totalInterest: projections.reduce((sum, m) => sum + (m.totalInterest || 0), 0),
        calculatedAt: new Date().toISOString()
      };

      // Save projections to localDebtStore if needed
      // await localDebtStore.saveProjections(result);
      return result;
    } catch (error) {
      console.error('[DebtsManager] Error calculating projections:', error);
      return { months: [], totalMonths: 0, totalInterest: 0 };
    }
  }

  async getProjections() {
    // Could delegate to localDebtStore.getProjections() if implemented
    return this.calculateProjections();
  }

  async recalculateProjections() {
    return this.calculateProjections();
  }

  // SETTINGS - delegates to localDebtStore

  async updateSettings(newSettings) {
    await localDebtStore.updateSettings(newSettings);
    
    if (newSettings.extraPayment !== undefined) {
      await this.recalculateProjections();
    }
    
    this.notifyListeners();
  }


  // UTILITIES

  getMonthKey(monthOffset = 0) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  async clearAllData() {
    // Clear from IndexedDB CP-1 store
    await localDebtStore.clearAll();
    // Notify listeners
    this.notifyListeners();
    // Return empty array for consistency
    return [];
  }

  async exportData() {
    const debts = await localDebtStore.listDebts();
    const settings = await localDebtStore.getSettings();
    
    return {
      debts,
      settings,
      exportedAt: new Date().toISOString(),
      version: '3.0.0' // CP-1 version
    };
  }

  async importData(importedData) {
    if (importedData.debts) {
      await localDebtStore.upsertMany(importedData.debts);
    }
    
    if (importedData.settings) {
      await localDebtStore.updateSettings(importedData.settings);
    }
    
    this.notifyListeners();
  }

  /**
   * Load demo data (delegates to IndexedDB store)
   */
  async loadDemoData(locale = 'uk') {
    // Demo data is enabled by default unless explicitly disabled
    const disableDemo = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_DISABLE_DEMO === '1');
    if (disableDemo) { 
      console.warn('[DebtsManager] Demo data loading disabled (REACT_APP_DISABLE_DEMO=1)'); 
      return []; 
    }

    // Delegate to the single source of truth
    const demoDebts = await localDebtStore.loadDemoData(locale);
    
    // Notify listeners after demo data loaded to IndexedDB
    this.notifyListeners();
    
    console.log('Demo data loaded to IndexedDB:', demoDebts.map(d => `${d.name}: £${d.balance}`));
    return demoDebts;
  }

  /**
   * Get app settings - delegates to localDebtStore
   */
  async getSettings() {
    return localDebtStore.getSettings();
  }

  /**
   * Update app settings - delegates to localDebtStore
   */
  async setSettings(patch) {
    return localDebtStore.setSettings(patch);
  }

  /**
   * Get computed metrics using centralized debt accessor - delegates to localDebtStore
   * PROD-SAFE: Always returns normalized safe object, never throws
   */
  async getMetrics() {
    try {
      const debts = await this.getDebts();
      const settings = await this.getSettings();
      
      const totalDebt = debts.reduce((sum, debt) => sum + safeNumber(debt.balance), 0);
      const totalMinPayments = debts.reduce((sum, debt) => sum + safeNumber(debt.minPayment), 0);
      const extraPayment = safeNumber(settings?.extraPayment) || 0;

      const result = {
        totalDebt,
        totalMinPayments,
        extraPayment,
        totalPayment: totalMinPayments + extraPayment,
        isDebtFree: debts.length === 0 || totalDebt === 0,
        hasProjections: false // Could implement projections in localDebtStore
      };
      const normalized = normalizeMetrics(result);
      
      // Dev-only invariants to catch regressions
      if (process.env.NODE_ENV === 'development') {
        // Type invariants
        console.assert(Number.isFinite(normalized.totalDebt), '[DebtsManager] metrics.totalDebt not finite:', normalized.totalDebt);
        console.assert(Number.isFinite(normalized.totalMinPayments), '[DebtsManager] metrics.totalMinPayments not finite:', normalized.totalMinPayments);
        console.assert(typeof normalized.isDebtFree === 'boolean', '[DebtsManager] metrics.isDebtFree not boolean:', normalized.isDebtFree);
        console.assert(Number.isFinite(normalized.extraPayment), '[DebtsManager] metrics.extraPayment not finite:', normalized.extraPayment);
        console.assert(Number.isFinite(normalized.totalPayment), '[DebtsManager] metrics.totalPayment not finite:', normalized.totalPayment);
        console.assert(typeof normalized.hasProjections === 'boolean', '[DebtsManager] metrics.hasProjections not boolean:', normalized.hasProjections);
        
        // Value invariants for regression detection
        console.assert(normalized.totalDebt >= 0, '[DebtsManager] REGRESSION: negative totalDebt detected:', normalized.totalDebt);
        console.assert(normalized.totalMinPayments >= 0, '[DebtsManager] REGRESSION: negative totalMinPayments detected:', normalized.totalMinPayments);
        console.assert(normalized.extraPayment >= 0, '[DebtsManager] REGRESSION: negative extraPayment detected:', normalized.extraPayment);
        console.assert(normalized.totalPayment >= normalized.totalMinPayments, '[DebtsManager] REGRESSION: totalPayment < minPayments:', { totalPayment: normalized.totalPayment, totalMinPayments: normalized.totalMinPayments });
        
        // Legacy pattern detection
        console.assert(!('paymentHistory' in normalized), '[DebtsManager] REGRESSION: paymentHistory leaked into metrics:', normalized);
        console.assert(!('debts' in normalized), '[DebtsManager] REGRESSION: debts array leaked into metrics:', normalized);
      }
      
      return normalized;
    } catch (e) {
      console.warn('[DebtsManager] getMetrics failed, returning safe defaults:', e);
      return normalizeMetrics(null);
    }
  }
}

// Create singleton instance with development guardrails
const _debtsManager = new DebtsManager();
const debtsManager = withNoDataGuard(_debtsManager, 'debtsManager');

// Export for ES6 modules
export { debtsManager };
export default debtsManager;