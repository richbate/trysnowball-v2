import { useState, useEffect, useCallback } from 'react';
import dataManager from '../lib/dataManager';

/**
 * Custom hook for managing debt and payment data
 * This provides a React-friendly interface to the dataManager
 */
export const useDataManager = () => {
  const [data, setData] = useState(dataManager.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to data changes
    const unsubscribe = dataManager.subscribe((newData) => {
      setData(newData);
    });

    // Initial data load
    setData(dataManager.data);

    return unsubscribe;
  }, []);

  // Error handling wrapper
  const handleAsync = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Debt management
  const debts = data.debts || [];
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount || debt.balance || 0), 0);
  const totalMinPayments = debts.reduce((sum, debt) => sum + (debt.regularPayment || debt.minPayment || 0), 0);

  const saveDebt = useCallback((debt) => {
    return handleAsync(() => dataManager.saveDebt(debt));
  }, [handleAsync]);

  const deleteDebt = useCallback((debtId) => {
    return handleAsync(() => dataManager.deleteDebt(debtId));
  }, [handleAsync]);

  const setDebts = useCallback((debts) => {
    return handleAsync(() => dataManager.setDebts(debts));
  }, [handleAsync]);

  // Payment history management
  const paymentHistory = data.paymentHistory || [];

  const recordPayment = useCallback((payment) => {
    return handleAsync(() => dataManager.recordPayment(payment));
  }, [handleAsync]);

  const getPaymentHistory = useCallback((month = null) => {
    return dataManager.getPaymentHistory(month);
  }, []);

  const getPayment = useCallback((debtId, month) => {
    return dataManager.getPayment(debtId, month);
  }, []);

  // Projections
  const projections = data.projections;

  const calculateProjections = useCallback(() => {
    return handleAsync(() => dataManager.calculateProjections());
  }, [handleAsync]);

  const recalculateProjections = useCallback(() => {
    return handleAsync(() => dataManager.recalculateProjections());
  }, [handleAsync]);

  // Settings
  const settings = data.settings || {};
  const extraPayment = settings.extraPayment || 0;

  const updateSettings = useCallback((newSettings) => {
    return handleAsync(() => dataManager.updateSettings(newSettings));
  }, [handleAsync]);

  const setExtraPayment = useCallback((amount) => {
    return updateSettings({ extraPayment: amount });
  }, [updateSettings]);

  // Analytics
  const analytics = data.analytics || {};

  const updateAnalytics = useCallback(() => {
    return handleAsync(() => dataManager.updateAnalytics());
  }, [handleAsync]);

  // Utility functions
  const clearAllData = useCallback(() => {
    return handleAsync(() => dataManager.clearAllData());
  }, [handleAsync]);

  const exportData = useCallback(() => {
    return dataManager.exportData();
  }, []);

  const importData = useCallback((importedData) => {
    return handleAsync(() => dataManager.importData(importedData));
  }, [handleAsync]);

  // Current month utilities
  const getCurrentMonth = useCallback(() => {
    return dataManager.getMonthKey(0);
  }, []);

  const getMonthKey = useCallback((offset = 0) => {
    return dataManager.getMonthKey(offset);
  }, []);

  // Computed values
  const isDebtFree = debts.length === 0 || totalDebt === 0;
  const hasPaymentHistory = paymentHistory.length > 0;
  const hasProjections = projections && projections.months && projections.months.length > 0;

  return {
    // Data
    data,
    debts,
    paymentHistory,
    projections,
    settings,
    analytics,
    
    // Computed values
    totalDebt,
    totalMinPayments,
    extraPayment,
    isDebtFree,
    hasPaymentHistory,
    hasProjections,
    
    // State
    loading,
    error,
    
    // Debt management
    saveDebt,
    deleteDebt,
    setDebts,
    
    // Payment history
    recordPayment,
    getPaymentHistory,
    getPayment,
    
    // Projections
    calculateProjections,
    recalculateProjections,
    
    // Settings
    updateSettings,
    setExtraPayment,
    
    // Analytics
    updateAnalytics,
    
    // Utilities
    clearAllData,
    exportData,
    importData,
    getCurrentMonth,
    getMonthKey
  };
};

// Hook for debt-specific operations
export const useDebt = (debtId) => {
  const { debts, getPaymentHistory, recordPayment } = useDataManager();
  
  const debt = debts.find(d => d.id === debtId);
  const payments = getPaymentHistory().filter(p => p.debtId === debtId);
  
  const recordDebtPayment = useCallback((payment) => {
    return recordPayment({ ...payment, debtId });
  }, [recordPayment, debtId]);

  return {
    debt,
    payments,
    recordPayment: recordDebtPayment
  };
};

// Hook for monthly payment tracking
export const useMonthlyPayments = (month) => {
  const { 
    debts, 
    getPaymentHistory, 
    recordPayment, 
    projections 
  } = useDataManager();

  const monthKey = month || dataManager.getMonthKey(0);
  const monthlyPayments = getPaymentHistory(monthKey);
  const projectedData = projections?.months?.find(m => m.monthKey === monthKey);

  const recordMonthlyPayment = useCallback((debtId, payment) => {
    return recordPayment({
      ...payment,
      debtId,
      month: monthKey
    });
  }, [recordPayment, monthKey]);

  const getPaymentForDebt = useCallback((debtId) => {
    return monthlyPayments.find(p => p.debtId === debtId);
  }, [monthlyPayments]);

  return {
    monthKey,
    monthlyPayments,
    projectedData,
    recordMonthlyPayment,
    getPaymentForDebt,
    debts
  };
};

export default useDataManager;