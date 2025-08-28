/**
 * CSV Export Data Mappers
 * Transform TrySnowball data structures to CSV-friendly formats
 */

import { formatCurrency, formatDate } from './exportCsv';

/**
 * Map payment history to CSV format
 */
export function mapPaymentHistoryToCsv(paymentHistory = [], debts = []) {
  if (!paymentHistory || paymentHistory.length === 0) {
    return [];
  }

  // Create debt lookup for names
  const debtLookup = debts.reduce((acc, debt) => {
    acc[debt.id] = debt.name || `Debt ${debt.id.substring(0, 8)}`;
    return acc;
  }, {});

  return paymentHistory.map(payment => ({
    'Date Recorded': formatDate(payment.recordedAt || payment.createdAt),
    'Month': payment.month || 'Unknown',
    'Debt Name': debtLookup[payment.debtId] || 'Unknown Debt',
    'Payment Amount': formatCurrency(payment.amount),
    'Principal Payment': formatCurrency(payment.principal || 0),
    'Interest Payment': formatCurrency(payment.interest || 0),
    'Balance After Payment': formatCurrency(payment.balanceAfter),
    'Payment Method': payment.method || 'Manual Entry',
    'Notes': payment.notes || '',
    'Payment ID': payment.id
  }));
}

/**
 * Map projections/timeline to CSV format
 */
export function mapProjectionsToCsv(projections = {}) {
  if (!projections.months || projections.months.length === 0) {
    return [];
  }

  const csvData = [];

  projections.months.forEach((month, monthIndex) => {
    // If month has per-debt breakdown
    if (month.debts && Array.isArray(month.debts)) {
      month.debts.forEach(debt => {
        csvData.push({
          'Month': monthIndex + 1,
          'Month Key': month.monthKey || `Month ${monthIndex + 1}`,
          'Date': formatDate(month.date),
          'Debt Name': debt.name || 'Unknown Debt',
          'Balance Start': formatCurrency(debt.balanceStart || debt.startBalance || debt.balance),
          'Interest Charged': formatCurrency(debt.interest || 0),
          'Principal Payment': formatCurrency(debt.principal || 0),
          'Total Payment': formatCurrency((debt.principal || 0) + (debt.interest || 0)),
          'Balance End': formatCurrency(debt.balanceEnd || debt.endBalance || (debt.balanceStart - (debt.principal || 0))),
          'Is Paid Off': debt.balanceEnd <= 0 ? 'Yes' : 'No',
          'Debt Type': debt.type || 'Unknown'
        });
      });
    } else {
      // If month has aggregate data only
      csvData.push({
        'Month': monthIndex + 1,
        'Month Key': month.monthKey || `Month ${monthIndex + 1}`,
        'Date': formatDate(month.date),
        'Debt Name': 'All Debts (Summary)',
        'Balance Start': formatCurrency(month.totalBalance || 0),
        'Interest Charged': formatCurrency(month.totalInterest || 0),
        'Principal Payment': formatCurrency(month.principalPayment || 0),
        'Total Payment': formatCurrency(month.totalPayment || 0),
        'Balance End': formatCurrency((month.totalBalance || 0) - (month.principalPayment || 0)),
        'Is Paid Off': (month.totalBalance || 0) <= 0 ? 'Yes' : 'No',
        'Debt Type': 'Summary'
      });
    }
  });

  return csvData;
}

/**
 * Map current debts snapshot to CSV format  
 */
export function mapDebtsToCsv(debts = []) {
  if (!debts || debts.length === 0) {
    return [];
  }

  return debts.map(debt => ({
    'Debt Name': debt.name || 'Unnamed Debt',
    'Current Balance': formatCurrency(debt.balance || debt.amount || 0),
    'Original Amount': formatCurrency(debt.originalAmount || debt.balance || debt.amount || 0),
    'Interest Rate': `${(debt.rate || debt.interestRate || 0).toFixed(2)}%`,
    'Minimum Payment': formatCurrency(debt.minPayment || debt.regularPayment || 0),
    'Debt Type': debt.type || 'Unknown',
    'Created Date': formatDate(debt.createdAt),
    'Last Updated': formatDate(debt.updatedAt),
    'Status': (debt.balance || debt.amount || 0) <= 0 ? 'Paid Off' : 'Active',
    'Order': debt.order || 0,
    'Debt ID': debt.id
  }));
}

/**
 * Map debt history (balance changes over time) to CSV format
 */
export function mapDebtHistoryToCsv(debts = []) {
  const csvData = [];

  debts.forEach(debt => {
    if (debt.history && Array.isArray(debt.history)) {
      debt.history.forEach(entry => {
        csvData.push({
          'Debt Name': debt.name || 'Unnamed Debt',
          'Date': formatDate(entry.date || entry.timestamp),
          'Balance': formatCurrency(entry.balance || entry.amount || 0),
          'Change Amount': formatCurrency(entry.change || 0),
          'Change Type': entry.type || 'Balance Update',
          'Notes': entry.notes || '',
          'Month': entry.month || '',
          'Debt ID': debt.id
        });
      });
    }
  });

  return csvData.length > 0 ? csvData : [{ 
    'Message': 'No debt history available. History tracking may not be enabled.' 
  }];
}

/**
 * Get suggested filename based on data type and current date
 */
export function getSuggestedFilename(dataType) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const baseNames = {
    payments: 'trysnowball_payment_history',
    projections: 'trysnowball_debt_projections', 
    debts: 'trysnowball_current_debts',
    history: 'trysnowball_debt_history'
  };

  const baseName = baseNames[dataType] || 'trysnowball_export';
  return `${baseName}_${dateStr}.csv`;
}