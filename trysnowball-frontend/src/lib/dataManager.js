/**
 * Unified Data Management System
 * This will eventually be replaced with API calls to a real database
 */

// Data structure definitions
const DEFAULT_USER_DATA = {
  userId: null, // Will be set when user auth is implemented
  profile: {
    name: null,
    email: null,
    createdAt: null,
    lastActive: null
  },
  debts: [],
  paymentHistory: [],
  projections: null,
  settings: {
    extraPayment: 0,
    currency: 'GBP',
    notificationsEnabled: true,
    reminderDay: 1 // Day of month for payment reminders
  },
  analytics: {
    totalDebtPaid: 0,
    totalInterestSaved: 0,
    debtsFreeDate: null,
    monthsAhead: 0
  }
};

class DataManager {
  constructor() {
    this.storageKey = 'trysnowball-user-data';
    this.data = this.loadData();
    this.listeners = new Set();
  }

  // Load data from localStorage (later: API call)
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_USER_DATA, ...parsed };
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    return { ...DEFAULT_USER_DATA };
  }

  // Save data to localStorage (later: API call)
  saveData() {
    try {
      this.data.profile.lastActive = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of data changes
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.data));
  }

  // DEBT MANAGEMENT
  
  // Get all debts
  getDebts() {
    return this.data.debts || [];
  }

  // Add or update debt
  saveDebt(debt) {
    const debts = this.data.debts || [];
    const existingIndex = debts.findIndex(d => d.id === debt.id);
    
    if (existingIndex >= 0) {
      debts[existingIndex] = { ...debt, updatedAt: new Date().toISOString() };
    } else {
      debts.push({
        ...debt,
        id: debt.id || Date.now().toString(),
        originalAmount: debt.amount, // Store original amount for progress tracking
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    this.data.debts = debts;
    this.saveData();
    this.recalculateProjections();
    return debt;
  }

  // Delete debt
  deleteDebt(debtId) {
    this.data.debts = this.data.debts.filter(debt => debt.id !== debtId);
    // Also remove payment history for this debt
    this.data.paymentHistory = this.data.paymentHistory.filter(
      payment => payment.debtId !== debtId
    );
    this.saveData();
    this.recalculateProjections();
  }

  // Bulk update debts (for demo data loading)
  setDebts(debts) {
    this.data.debts = debts.map(debt => ({
      ...debt,
      id: debt.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalAmount: debt.originalAmount || debt.amount, // Store original amount for progress tracking
      createdAt: debt.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    this.saveData();
    this.recalculateProjections();
  }

  // PAYMENT HISTORY MANAGEMENT

  // Get payment history for a specific month or all history
  getPaymentHistory(month = null) {
    if (month) {
      return this.data.paymentHistory.filter(payment => payment.month === month);
    }
    return this.data.paymentHistory || [];
  }

  // Record a payment
  recordPayment(payment) {
    const payments = this.data.paymentHistory || [];
    const existingIndex = payments.findIndex(
      p => p.month === payment.month && p.debtId === payment.debtId
    );

    const paymentRecord = {
      ...payment,
      id: payment.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      recordedAt: new Date().toISOString()
    };

    // Calculate the difference if this is updating an existing payment
    let paymentDifference = paymentRecord.amount;
    if (existingIndex >= 0) {
      paymentDifference = paymentRecord.amount - payments[existingIndex].amount;
      payments[existingIndex] = paymentRecord;
    } else {
      payments.push(paymentRecord);
    }

    // Update the debt balance to reflect the payment
    const debt = this.data.debts.find(d => d.id === payment.debtId);
    
    if (debt) {
      // Reduce the debt balance by the payment amount (or difference if updating)
      debt.amount = Math.max(0, debt.amount - paymentDifference);
      debt.updatedAt = new Date().toISOString();
    }

    this.data.paymentHistory = payments;
    this.saveData();
    this.recalculateProjections();
    return paymentRecord;
  }

  // Get payment for specific debt and month
  getPayment(debtId, month) {
    return this.data.paymentHistory.find(
      payment => payment.debtId === debtId && payment.month === month
    );
  }

  // PROJECTIONS AND CALCULATIONS

  // Calculate snowball projections
  calculateProjections() {
    const debts = this.getDebts();
    const extraPayment = this.data.settings.extraPayment || 0;
    
    if (debts.length === 0) {
      return { months: [], totalMonths: 0, totalInterest: 0 };
    }

    // Sort debts by balance (snowball method)
    const sortedDebts = [...debts].sort((a, b) => (a.amount || a.balance) - (b.amount || b.balance));
    let remainingDebts = sortedDebts.map(debt => ({
      ...debt,
      balance: debt.amount || debt.balance,
      minPayment: debt.regularPayment || debt.minPayment
    }));

    const totalMinPayments = remainingDebts.reduce((sum, debt) => sum + debt.minPayment, 0);
    let availablePayment = totalMinPayments + extraPayment;
    let monthlyData = [];
    let month = 0;
    let totalInterest = 0;

    while (remainingDebts.length > 0 && month < 600) {
      month++;
      let monthlyPayments = {};
      let totalBalance = 0;
      let monthlyInterestTotal = 0;

      // Process each debt
      for (let i = 0; i < remainingDebts.length; i++) {
        const debt = remainingDebts[i];
        const monthlyInterest = (debt.interest / 100 / 12) * debt.balance;
        monthlyInterestTotal += monthlyInterest;
        totalInterest += monthlyInterest;

        let paymentToThisDebt = debt.minPayment;
        if (i === 0) {
          // First debt gets extra payment
          paymentToThisDebt += availablePayment - totalMinPayments;
        }

        const principalPayment = Math.max(0, paymentToThisDebt - monthlyInterest);
        debt.balance = Math.max(0, debt.balance - principalPayment);

        monthlyPayments[debt.id] = {
          balance: debt.balance,
          payment: paymentToThisDebt,
          interest: monthlyInterest,
          principal: principalPayment
        };

        totalBalance += debt.balance;
      }

      monthlyData.push({
        month,
        monthKey: this.getMonthKey(month),
        debts: monthlyPayments,
        totalBalance,
        totalInterest: monthlyInterestTotal,
        totalPayment: availablePayment
      });

      // Remove paid-off debts and redistribute their minimum payments
      const initialLength = remainingDebts.length;
      const previousRemainingDebts = [...remainingDebts];
      remainingDebts = remainingDebts.filter(debt => debt.balance > 0.01);

      if (remainingDebts.length < initialLength) {
        for (const originalDebt of sortedDebts) {
          const stillExists = remainingDebts.some(rd => rd.id === originalDebt.id);
          const previouslyExisted = previousRemainingDebts.some(rd => rd.id === originalDebt.id);

          if (previouslyExisted && !stillExists) {
            availablePayment += originalDebt.minPayment;
            break;
          }
        }
      }

      if (totalBalance < 0.01) break;
    }

    const projections = {
      months: monthlyData,
      totalMonths: month,
      totalInterest: Math.round(totalInterest * 100) / 100,
      calculatedAt: new Date().toISOString()
    };

    this.data.projections = projections;
    this.saveData();
    
    return projections;
  }

  // Get current projections (calculate if needed)
  getProjections() {
    if (!this.data.projections) {
      return this.calculateProjections();
    }
    return this.data.projections;
  }

  // Force recalculation of projections
  recalculateProjections() {
    return this.calculateProjections();
  }

  // SETTINGS MANAGEMENT

  // Get user settings
  getSettings() {
    return this.data.settings || DEFAULT_USER_DATA.settings;
  }

  // Update settings
  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    
    // Recalculate projections if extra payment changed
    if (newSettings.extraPayment !== undefined) {
      this.recalculateProjections();
    }
  }

  // ANALYTICS

  // Get analytics data
  getAnalytics() {
    return this.data.analytics || DEFAULT_USER_DATA.analytics;
  }

  // Calculate and update analytics
  updateAnalytics() {
    const paymentHistory = this.getPaymentHistory();
    const projections = this.getProjections();

    // Calculate total debt paid from payment history
    const totalDebtPaid = paymentHistory.reduce((sum, payment) => {
      return sum + (payment.principalPaid || 0);
    }, 0);

    // Calculate total interest saved (comparison with minimum payments only)
    const totalInterestSaved = 0; // TODO: Implement this calculation

    // Find projected debt-free date
    let debtsFreeDate = null;
    if (projections.totalMonths > 0) {
      const today = new Date();
      debtsFreeDate = new Date(today.getFullYear(), today.getMonth() + projections.totalMonths, today.getDate());
    }

    this.data.analytics = {
      totalDebtPaid,
      totalInterestSaved,
      debtsFreeDate: debtsFreeDate ? debtsFreeDate.toISOString() : null,
      monthsAhead: 0, // TODO: Calculate based on actual vs projected progress
      updatedAt: new Date().toISOString()
    };

    this.saveData();
    return this.data.analytics;
  }

  // UTILITY METHODS

  // Get month key for current month offset
  getMonthKey(monthOffset = 0) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Clear all data (for testing/reset)
  clearAllData() {
    this.data = { ...DEFAULT_USER_DATA };
    this.saveData();
  }

  // Export data (for backup/migration)
  exportData() {
    return {
      ...this.data,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // Import data (for restore/migration)
  importData(importedData) {
    this.data = {
      ...DEFAULT_USER_DATA,
      ...importedData,
      importedAt: new Date().toISOString()
    };
    this.saveData();
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager;