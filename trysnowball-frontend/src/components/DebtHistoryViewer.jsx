/**
 * DebtHistoryViewer - Shows timeline of balance changes for a single debt
 * Displays last 50 changes with export to CSV functionality
 */

import React, { useMemo } from 'react';
import { X, Download, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import Button from './ui/Button';
import { formatCurrency, formatDate } from '../utils/exportCsv';
import { toCsv, downloadCsv } from '../utils/exportCsv';
import { useAnalytics } from '../hooks/useAnalytics';

const DebtHistoryViewer = ({ debt, isOpen, onClose }) => {
  const { trackEvent } = useAnalytics();

  // Process history data with calculated changes
  const processedHistory = useMemo(() => {
    if (!debt?.history || debt.history.length === 0) {
      return [];
    }

    // Sort by date (most recent first)
    const sortedHistory = [...debt.history].sort((a, b) => {
      const dateA = new Date(a.changedAt || a.date || a.timestamp);
      const dateB = new Date(b.changedAt || b.date || b.timestamp);
      return dateB - dateA;
    });

    // Calculate changes between entries
    const processedEntries = [];
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const current = sortedHistory[i];
      const previous = sortedHistory[i + 1];
      
      const currentBalance = current.balance || 0;
      const previousBalance = previous?.balance || debt.originalAmount || currentBalance;
      const change = currentBalance - previousBalance;
      
      processedEntries.push({
        date: current.changedAt || current.date || current.timestamp,
        balance: currentBalance,
        previousBalance: previousBalance,
        change: change,
        changeType: change < 0 ? 'decrease' : change > 0 ? 'increase' : 'no-change',
        notes: current.notes || current.source || '',
        id: current.id || `${current.date}_${i}`
      });
    }

    return processedEntries;
  }, [debt]);

  // Export history to CSV
  const exportHistory = () => {
    if (!debt || processedHistory.length === 0) {
      alert('No history available to export.');
      return;
    }

    const csvData = processedHistory.map(entry => ({
      'Date': formatDate(entry.date),
      'Previous Balance': formatCurrency(entry.previousBalance),
      'New Balance': formatCurrency(entry.balance),
      'Change Amount': formatCurrency(Math.abs(entry.change)),
      'Change Type': entry.changeType === 'decrease' ? 'Payment/Reduction' : entry.changeType === 'increase' ? 'Increase' : 'No Change',
      'Notes': entry.notes
    }));

    const csvContent = toCsv(csvData);
    const filename = `${debt.name.replace(/[^a-zA-Z0-9]/g, '_')}_history_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCsv(filename, csvContent);
    
    // Analytics
    trackEvent('debt_history_exported', {
      debtId: debt.id,
      changeCount: processedHistory.length
    });
  };

  // Track view event when modal opens
  React.useEffect(() => {
    if (isOpen && debt) {
      trackEvent('debt_history_viewed', {
        debtId: debt.id,
        changeCount: processedHistory.length
      });
    }
  }, [isOpen, debt, processedHistory.length, trackEvent]);

  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Payment History: {debt.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {processedHistory.length} {processedHistory.length === 1 ? 'change' : 'changes'} recorded
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {processedHistory.length > 0 && (
              <Button
                onClick={exportHistory}
                variant="ghost"
                size="sm"
                leftIcon={Download}
                className="text-blue-600 hover:text-blue-700"
              >
                Export CSV
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {processedHistory.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No History Available
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Balance changes will appear here once you start updating this debt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {processedHistory.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {/* Change indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {entry.changeType === 'decrease' ? (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    ) : entry.changeType === 'increase' ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Date */}
                    <div className="flex items-center justify-between mb-2">
                      <time className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(entry.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                      {entry.changeType !== 'no-change' && (
                        <span className={`text-sm font-medium ${
                          entry.changeType === 'decrease' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {entry.changeType === 'decrease' ? '-' : '+'}{formatCurrency(Math.abs(entry.change))}
                        </span>
                      )}
                    </div>

                    {/* Balance change */}
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(entry.previousBalance)} → {formatCurrency(entry.balance)}
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DebtHistoryViewer;