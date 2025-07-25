import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataManager } from '../hooks/useDataManager';
import { useTheme } from '../contexts/ThemeContext';
import DebtSummaryCard from '../components/DebtSummaryCard';
import DebtProgressSummary from '../components/DebtProgressSummary';
import RecordPaymentForm from '../components/RecordPaymentForm';

// Generate realistic random debt data
const generateRandomDebts = () => {
  const debtTypes = [
    { name: 'Barclaycard', minRate: 18, maxRate: 29, minLimit: 1500, maxLimit: 5000 },
    { name: 'Halifax Credit Card', minRate: 16, maxRate: 25, minLimit: 2000, maxLimit: 8000 },
    { name: 'MBNA Card', minRate: 19, maxRate: 27, minLimit: 3000, maxLimit: 12000 },
    { name: 'Virgin Money', minRate: 17, maxRate: 24, minLimit: 2500, maxLimit: 6000 },
    { name: 'Tesco Clubcard', minRate: 22, maxRate: 35, minLimit: 1000, maxLimit: 3500 },
    { name: 'Personal Loan', minRate: 6, maxRate: 15, minLimit: 5000, maxLimit: 20000 },
    { name: 'Car Finance', minRate: 3, maxRate: 12, minLimit: 8000, maxLimit: 30000 },
    { name: 'Overdraft', minRate: 25, maxRate: 40, minLimit: 500, maxLimit: 2500 },
    { name: 'PayPal Credit', minRate: 0, maxRate: 23, minLimit: 1000, maxLimit: 4000 },
    { name: 'Store Card', minRate: 28, maxRate: 39, minLimit: 500, maxLimit: 2000 }
  ];

  const numDebts = Math.floor(Math.random() * 4) + 4;
  const selectedTypes = [...debtTypes].sort(() => 0.5 - Math.random()).slice(0, numDebts);
  
  return selectedTypes.map((type, index) => {
    const limit = Math.floor(Math.random() * (type.maxLimit - type.minLimit) + type.minLimit);
    const utilizationPercent = Math.random() * 85 + 5;
    const balance = Math.floor(limit * (utilizationPercent / 100));
    const rate = Math.floor(Math.random() * (type.maxRate - type.minRate) + type.minRate);
    const minPayment = Math.max(25, Math.floor(balance * (Math.random() * 0.02 + 0.02)));
    
    return {
      id: Date.now() + index + Math.random().toString(36).substr(2, 9),
      name: type.name,
      amount: Math.round(balance),
      interest: rate,
      regularPayment: Math.round(minPayment * 100) / 100,
      limit,
      isDemo: true // Mark as demo data
    };
  });
};

const DebtTracker = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const {
    debts,
    totalDebt,
    totalMinPayments,
    extraPayment,
    projections,
    hasProjections,
    loading,
    error,
    saveDebt,
    deleteDebt,
    setDebts,
    setExtraPayment,
    clearAllData,
    recalculateProjections,
    recordPayment,
    getPaymentHistory,
    getCurrentMonth
  } = useDataManager();

  const [activeTab, setActiveTab] = useState('debts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    interest: 20,
    regularPayment: '',
    limit: ''
  });
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitAmount, setLimitAmount] = useState('');
  const [sortField, setSortField] = useState('amount');
  const [sortDirection, setSortDirection] = useState('desc');

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sorted debts
  const sortedDebts = [...debts].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'interest':
        aValue = a.interest;
        bValue = b.interest;
        break;
      case 'regularPayment':
        aValue = a.regularPayment;
        bValue = b.regularPayment;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        aValue = a.amount;
        bValue = b.amount;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Sortable header component
  const SortableHeader = ({ field, children, className = "" }) => (
    <th 
      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <svg 
            className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  );


  // Calculate projections when debts change
  useEffect(() => {
    if (debts.length > 0) {
      recalculateProjections();
    }
  }, [debts, extraPayment, recalculateProjections]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount || !formData.regularPayment) return;

    try {
      await saveDebt({
        name: formData.name,
        amount: parseFloat(formData.amount),
        interest: parseFloat(formData.interest),
        regularPayment: parseFloat(formData.regularPayment),
        limit: formData.limit ? parseFloat(formData.limit) : undefined,
        isDemo: false
      });
      
      setFormData({ name: '', amount: '', interest: 20, regularPayment: '', limit: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving debt:', err);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteDebt(debtId);
      } catch (err) {
        console.error('Error deleting debt:', err);
      }
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all your debt data? This cannot be undone.')) {
      try {
        await clearAllData();
        // Load demo data after clearing
        const demoDebts = generateRandomDebts();
        await setDebts(demoDebts);
      } catch (err) {
        console.error('Error clearing data:', err);
      }
    }
  };

  const handleUpdateLimit = async (debtId, newLimit) => {
    try {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) return;

      await saveDebt({
        ...debt,
        limit: newLimit ? parseFloat(newLimit) : undefined
      });
      
      setEditingLimit(null);
      setLimitAmount('');
    } catch (err) {
      console.error('Error updating limit:', err);
    }
  };

  const loadDemoData = async () => {
    try {
      const demoDebts = generateRandomDebts();
      await setDebts(demoDebts);
    } catch (err) {
      console.error('Error loading demo data:', err);
    }
  };

  const hasOnlyDemoData = debts.length > 0 && debts.every(debt => debt.isDemo);

  // ChatGPT Export Functions

  const downloadWorksheet = () => {
    if (debts.length === 0) {
      alert('Please add your debts first before downloading.');
      return;
    }

    // Create CSV headers
    const headers = [
      'Account Name',
      'Current Balance',
      'Interest Rate (%)',
      'Minimum Payment',
      'Credit Limit',
      'Available Credit',
      'Used Percentage',
      'Payment Made',
      'Interest Charged',
      'Purchases Made',
      'Notes'
    ];

    // Convert debts to CSV format
    const csvData = debts.map(debt => {
      const availableCredit = debt.limit ? debt.limit - debt.amount : 0;
      const usedPercentage = debt.limit ? Math.round((debt.amount / debt.limit) * 100) : 0;
      
      return [
        debt.name,
        debt.amount,
        debt.interest,
        debt.regularPayment,
        debt.limit || '',
        availableCredit > 0 ? availableCredit : '',
        debt.limit ? usedPercentage : '',
        '', // Payment Made - empty for user to fill
        '', // Interest Charged - empty for user to fill
        '', // Purchases Made - empty for user to fill
        ''  // Notes - empty for user to fill
      ];
    });

    // Add summary row
    csvData.push([
      'TOTAL',
      totalDebt,
      '',
      totalMinPayments,
      '',
      '',
      '',
      '',
      '',
      '',
      `Generated: ${new Date().toLocaleDateString()}`
    ]);

    // Convert to CSV string
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trysnowball-worksheet-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'debts', label: 'My Debts', count: debts.length },
    { id: 'payments', label: 'Payment History', count: 'New' },
    { id: 'progress', label: 'Progress', count: getPaymentHistory().length > 0 ? 'Active' : 'Setup' }
  ];

  const renderDebtsTab = () => (
    <div className="space-y-8">
      {/* Demo Data Warning */}
      {hasOnlyDemoData && (
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  You're viewing demo data
                </h3>
                <p className="text-sm text-yellow-700">
                  This is realistic sample data. Clear it out and add your real debts for accurate analysis.
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClearAllData}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Clear Demo Data
              </button>
              <button
                onClick={loadDemoData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                New Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Button */}
      <div className="text-center">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mr-4"
        >
          + Add Debt
        </button>
        {debts.length > 0 && !hasOnlyDemoData && (
          <button
            onClick={handleClearAllData}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* Add Debt Form */}
      {showAddForm && (
        <div className={`${colors.surface} rounded-lg shadow-sm p-6 border ${colors.border}`}>
          <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Add New Debt</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>
                Debt Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Credit Card, Car Loan"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.surface} ${colors.text.primary}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>
                Amount Owed (£)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="2500"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.surface} ${colors.text.primary}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>
                Interest Rate (%)
              </label>
              <input
                type="number"
                value={formData.interest}
                onChange={(e) => setFormData({...formData, interest: e.target.value})}
                placeholder="20"
                min="0"
                max="50"
                step="0.1"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.surface} ${colors.text.primary}`}
              />
              <p className={`text-xs ${colors.text.muted} mt-1`}>Default is 20% if unknown</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>
                Minimum Payment (£)
              </label>
              <input
                type="number"
                value={formData.regularPayment}
                onChange={(e) => setFormData({...formData, regularPayment: e.target.value})}
                placeholder="75"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.surface} ${colors.text.primary}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>
                Credit Limit (£)
              </label>
              <input
                type="number"
                value={formData.limit}
                onChange={(e) => setFormData({...formData, limit: e.target.value})}
                placeholder="5000"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.surface} ${colors.text.primary}`}
              />
              <p className={`text-xs ${colors.text.muted} mt-1`}>Optional - for credit cards and overdrafts</p>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Debt'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Debts List */}
      {debts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Debt Breakdown</h2>
              <div className="text-sm text-gray-600">
                Sorted by: <span className="font-semibold capitalize">
                  {sortField === 'regularPayment' ? 'Min Payment' : 
                   sortField === 'amount' ? 'Balance' : 
                   sortField === 'interest' ? 'Interest Rate' : 
                   sortField}
                </span>
                <span className="ml-1">
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="name" className="text-left">
                    Account
                  </SortableHeader>
                  <SortableHeader field="amount" className="text-right">
                    Balance
                  </SortableHeader>
                  <SortableHeader field="interest" className="text-right">
                    Interest Rate
                  </SortableHeader>
                  <SortableHeader field="regularPayment" className="text-right">
                    Min Payment
                  </SortableHeader>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDebts.map((debt, index) => {
                  const utilizationPercent = debt.limit ? (debt.amount / debt.limit) * 100 : 0;
                  const available = debt.limit ? debt.limit - debt.amount : 0;
                  
                  return (
                    <tr key={debt.id} className={`group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {debt.name}
                            {debt.isDemo && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Demo</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-600">£{debt.amount.toLocaleString()}</div>
                        {debt.limit && (
                          <div className={`text-xs font-medium ${
                            utilizationPercent < 75 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {utilizationPercent.toFixed(0)}% used
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          debt.interest === 0 ? 'bg-green-100 text-green-800' : 
                          debt.interest < 15 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {debt.interest}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        £{debt.regularPayment.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {editingLimit === debt.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-sm text-gray-500">£</span>
                            <input
                              type="number"
                              value={limitAmount}
                              onChange={(e) => setLimitAmount(e.target.value)}
                              placeholder={debt.limit ? debt.limit.toString() : '0'}
                              className={`w-20 px-2 py-1 border ${colors.border} rounded text-sm text-right ${colors.surface} ${colors.text.primary}`}
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateLimit(debt.id, limitAmount)}
                              className="text-green-600 hover:text-green-700 text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingLimit(null);
                                setLimitAmount('');
                              }}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <span>{debt.limit ? `£${debt.limit.toLocaleString()}` : 'N/A'}</span>
                            <button
                              onClick={() => {
                                setEditingLimit(debt.id);
                                setLimitAmount(debt.limit?.toString() || '');
                              }}
                              className="text-blue-600 hover:text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-green-600">
                          {debt.limit ? `£${available.toLocaleString()}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worksheet Download Section */}
      {debts.length > 0 && !hasOnlyDemoData && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            📊 Download Your Debt Worksheet
          </h3>
          <p className="text-sm text-green-800 mb-4">
            Get a comprehensive CSV workbook with all your debt information. Perfect for offline tracking, sharing with financial advisors, or your own record-keeping.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadWorksheet}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📥 Download Debt Worksheet (CSV)
            </button>
          </div>
          <div className="mt-4 text-xs text-green-600 bg-green-100 rounded p-3">
            <p><strong>What you'll get:</strong> A comprehensive CSV file with your debt balances, interest rates, credit utilization, and empty columns for tracking payments, interest charged, and personal notes. Perfect for spreadsheet apps like Excel or Google Sheets.</p>
          </div>
        </div>
      )}


      {/* Summary & Snowball */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DebtSummaryCard 
            debts={debts}
            totalDebt={totalDebt}
            totalMinPayments={totalMinPayments}
          />
          <DebtProgressSummary 
            extraPayment={extraPayment}
            setExtraPayment={setExtraPayment}
            hasProjections={hasProjections}
            projections={projections}
          />
        </div>
      )}
    </div>
  );

  const renderPaymentsTab = () => {
    return (
      <RecordPaymentForm 
        debts={debts}
        extraPayment={extraPayment}
        projections={projections}
        getPaymentHistory={getPaymentHistory}
        recordPayment={recordPayment}
        getCurrentMonth={getCurrentMonth}
      />
    );
  };

  const renderProgressTab = () => {
    const paymentHistory = getPaymentHistory();
    const totalActualPayments = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    // Get current month's payments and projections for comparison
    const currentMonthKey = getCurrentMonth();
    const currentMonthPayments = getPaymentHistory(currentMonthKey);
    const currentMonthActualPayments = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentMonthProjection = projections?.months?.find(month => month.monthKey === currentMonthKey);
    const totalProjectedPayments = currentMonthProjection ? 
      Object.values(currentMonthProjection.debts).reduce((sum, debt) => sum + debt.payment, 0) : 0;
    
    const currentBalance = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const totalPaymentsMade = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const originalBalance = debts.reduce((sum, debt) => sum + (debt.originalAmount || debt.amount), 0);
    const progressPercentage = originalBalance > 0 ? Math.max(0, Math.min(100, (totalPaymentsMade / originalBalance) * 100)) : 0;
    
    const monthsWithPayments = paymentHistory.length > 0 ? 
      [...new Set(paymentHistory.map(p => p.month))].length : 0;
    
    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Debt Payoff Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                £{currentBalance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Current Total Debt</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {progressPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Progress Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {hasProjections ? projections.totalMonths : 0}
              </div>
              <div className="text-sm text-gray-600">Months to Debt-Free</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {progressPercentage > 0 ? `${progressPercentage.toFixed(1)}% complete` : 'Get started by recording payments!'}
          </div>
        </div>
        
        {/* Payment History Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Total Payments Made</h5>
              <div className="text-2xl font-bold text-blue-600">
                £{totalActualPayments.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {paymentHistory.length} payments recorded
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">Vs Projected (This Month)</h5>
              <div className={`text-2xl font-bold ${
                currentMonthActualPayments >= totalProjectedPayments ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentMonthActualPayments >= totalProjectedPayments ? '+' : ''}£{(currentMonthActualPayments - totalProjectedPayments).toLocaleString()}
              </div>
              <div className="text-sm text-green-700 mt-1">
                {currentMonthActualPayments >= totalProjectedPayments ? 'Ahead of schedule!' : 'Behind schedule'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Debt Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Debt Breakdown</h4>
          <div className="space-y-4">
            {debts.map((debt, index) => {
              const debtPayments = paymentHistory.filter(p => p.debtId === debt.id);
              const totalPaid = debtPayments.reduce((sum, p) => sum + p.amount, 0);
              const originalAmount = debt.originalAmount || debt.amount; // Use stored original amount
              const progressPercent = originalAmount > 0 ? ((totalPaid / originalAmount) * 100) : 0;
              
              return (
                <div key={debt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{debt.name}</span>
                    <span className="text-sm text-gray-600">
                      £{debt.amount.toLocaleString()} remaining
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progressPercent)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>£{totalPaid.toLocaleString()} paid</span>
                    <span>{progressPercent.toFixed(1)}% complete</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Motivational Section */}
        {progressPercentage > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">🎉 Keep It Up!</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {monthsWithPayments}
                </div>
                <div className="text-sm text-gray-600">Months with payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  £{(totalActualPayments / Math.max(monthsWithPayments, 1)).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Average monthly payment</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Getting Started */}
        {paymentHistory.length === 0 && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Ready to Track Progress?</h4>
            <p className="text-blue-800 mb-4">
              Start recording your payments in the Payment History tab to see your progress visualized here.
            </p>
            <button
              onClick={() => setActiveTab('payments')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Record Your First Payment
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'debts': return renderDebtsTab();
      case 'payments': return renderPaymentsTab();
      case 'progress': return renderProgressTab();
      default: return renderDebtsTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Debt Tracker
          </h1>
          <p className="text-xl text-gray-600">
            {hasOnlyDemoData ? 'Using realistic demo data - clear it out and add your real debts!' : 'Track your debts and payments with the scientifically proven snowball method'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label} {count && <span className="text-xs">({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Getting Started Message */}
        {debts.length === 0 && (
          <div className="bg-blue-50 rounded-lg p-8 text-center border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Ready to Start Your Journey?</h3>
            <p className="text-blue-800 mb-6">
              Add your debts above to see how the snowball method can help you become debt-free faster.
            </p>
            <div className="text-sm text-blue-700 mb-4">
              <p><strong>Tip:</strong> The snowball method pays off your smallest debt first, building momentum and motivation!</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-4 text-sm text-blue-800">
              <p><strong>🔒 Privacy Note:</strong> All your financial data is stored locally on your device - we never see or store it on our servers.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtTracker;