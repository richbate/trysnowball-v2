import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useDataManager } from '../hooks/useDataManager';
import { supabase } from '../Supabase';
import dataManager from '../lib/dataManager';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { debts, totalMinPayments, paymentHistory } = useDataManager();
  const [activeTab, setActiveTab] = useState('overview');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Calculate progress metrics
  const calculateProgress = () => {
    if (!debts.length) return { totalDebt: 0, totalPaid: 0, progressPercent: 0, debtFreeDate: null };
    
    const currentDebt = debts.reduce((sum, debt) => sum + (debt.amount || debt.balance || 0), 0);
    const originalDebt = currentDebt; // This would ideally come from historical data
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const progressPercent = originalDebt > 0 ? Math.max(0, ((totalPaid) / (originalDebt + totalPaid)) * 100) : 0;
    
    // Simple debt-free date calculation (this could be enhanced with projections)
    const monthlyPayment = totalMinPayments;
    const monthsToPayOff = monthlyPayment > 0 ? Math.ceil(currentDebt / monthlyPayment) : 0;
    const debtFreeDate = monthsToPayOff > 0 ? new Date(Date.now() + monthsToPayOff * 30 * 24 * 60 * 60 * 1000) : null;
    
    return { totalDebt: currentDebt, totalPaid, progressPercent, debtFreeDate };
  };

  const progress = calculateProgress();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const exportData = () => {
    const exportData = {
      debts,
      paymentHistory,
      settings: JSON.parse(localStorage.getItem('snowballSettings') || '{}'),
      analytics: JSON.parse(localStorage.getItem('snowballAnalytics') || '{}'),
      exportDate: new Date().toISOString(),
      version: '1.0',
      source: 'TrySnowball'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `trysnowball-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetToDemo = () => {
    if (window.confirm('Are you sure you want to reset to demo data? This will delete all your current debt information.')) {
      localStorage.removeItem('debtBalances');
      localStorage.removeItem('paymentHistory');
      localStorage.removeItem('snowballSettings');
      window.location.reload();
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Security: Input validation and sanitization functions
  const sanitizeString = (str, maxLength = 100) => {
    if (typeof str !== 'string') return '';
    // Remove HTML tags, script tags, and suspicious patterns
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, maxLength);
  };

  const validateNumber = (value, min = 0, max = 999999999) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${value}. Must be between ${min} and ${max}.`);
    }
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  };

  const validateDebt = (debt, index) => {
    if (!debt || typeof debt !== 'object') {
      throw new Error(`Invalid debt object at position ${index + 1}`);
    }

    // Validate required fields
    if (!debt.name && !debt.balance && !debt.minPayment) {
      throw new Error(`Debt at position ${index + 1} is missing required fields`);
    }

    return {
      id: Date.now() + index + Math.random().toString(36).substr(2, 9),
      name: sanitizeString(debt.name || `Debt ${index + 1}`, 50),
      amount: validateNumber(debt.balance || debt.amount || 0, 0, 10000000),
      interest: validateNumber(debt.interestRate || debt.interest || 0, 0, 100),
      regularPayment: validateNumber(debt.minPayment || debt.regularPayment || 0, 0, 100000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Parse pipe-separated format
  const parsePipeFormat = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const debts = [];
    let extraPayment = 0;
    
    for (const line of lines) {
      // Parse debt lines: "Debt N: [Name] | £[Balance] | [Rate]% | £[MinPayment]"
      const debtMatch = line.match(/^Debt\s+\d+:\s*(.+?)\s*\|\s*£?([0-9,]+(?:\.\d{2})?)\s*\|\s*([0-9.]+)%\s*\|\s*£?([0-9,]+(?:\.\d{2})?)/i);
      if (debtMatch) {
        const [, name, balance, rate, minPayment] = debtMatch;
        debts.push({
          name: sanitizeString(name, 50),
          balance: parseFloat(balance.replace(/,/g, '')),
          interestRate: parseFloat(rate),
          minPayment: parseFloat(minPayment.replace(/,/g, ''))
        });
        continue;
      }
      
      // Parse extra payment: "Recommended Extra Payment: £[Amount]/month"
      const extraMatch = line.match(/Recommended Extra Payment:\s*£?([0-9,]+(?:\.\d{2})?)/i);
      if (extraMatch) {
        extraPayment = parseFloat(extraMatch[1].replace(/,/g, ''));
        continue;
      }
    }
    
    if (debts.length === 0) {
      throw new Error('No valid debt entries found in pipe format');
    }
    
    return { debts, extraPayment };
  };

  const handleImportData = () => {
    setImportError('');
    
    if (!importText.trim()) {
      setImportError('Please paste your data to import');
      return;
    }

    try {
      // Security: Check input size (max 1MB)
      const MAX_SIZE = 1024 * 1024; // 1MB
      if (importText.length > MAX_SIZE) {
        throw new Error('Import data is too large. Maximum size is 1MB.');
      }

      // Security: Check for suspicious patterns
      const suspiciousPatterns = [
        /__proto__/i,
        /constructor/i,
        /prototype/i,
        /function\s*\(/i,
        /eval\s*\(/i,
        /<script/i,
        /javascript:/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(importText)) {
          throw new Error('Import data contains potentially malicious content.');
        }
      }

      let importedData;
      
      // Auto-detect format
      const text = importText.trim();
      if (text.includes('TRYSNOWBALL IMPORT DATA') || text.includes('Debt 1:') || /Debt\s+\d+:/.test(text)) {
        // Pipe-separated format
        importedData = parsePipeFormat(text);
      } else {
        // JSON format
        let cleanedText = text;
        
        // If it doesn't start with {, add it
        if (!cleanedText.startsWith('{')) {
          cleanedText = '{' + cleanedText;
        }
        
        // If it doesn't end with }, add it
        if (!cleanedText.endsWith('}')) {
          cleanedText = cleanedText + '}';
        }

        // Security: Parse with reviver to prevent prototype pollution
        importedData = JSON.parse(cleanedText, (key, value) => {
          // Security: Block dangerous keys
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return undefined;
          }
          return value;
        });
      }

      // Security: Validate data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid data: must be a valid object');
      }

      // Handle different import formats
      let processedData = {};
      
      // TrySnowball format (current export format)
      if (importedData.debts && importedData.paymentHistory) {
        // Security: Validate and sanitize existing format
        if (!Array.isArray(importedData.debts)) {
          throw new Error('Invalid format: debts must be an array');
        }
        
        // Security: Limit number of debts
        if (importedData.debts.length > 50) {
          throw new Error('Too many debts. Maximum allowed is 50.');
        }

        processedData = {
          debts: importedData.debts.slice(0, 50).map(validateDebt),
          settings: {
            extraPayment: validateNumber(importedData.settings?.extraPayment || 0, 0, 100000),
            currency: 'GBP'
          },
          paymentHistory: [] // Don't import payment history for security
        };
      }
      // AI script format (simplified)
      else if (importedData.debts && Array.isArray(importedData.debts)) {
        // Security: Limit number of debts
        if (importedData.debts.length > 50) {
          throw new Error('Too many debts. Maximum allowed is 50.');
        }

        if (importedData.debts.length === 0) {
          throw new Error('No debts found in the imported data.');
        }

        // Convert AI script format to TrySnowball format with validation
        processedData = {
          debts: importedData.debts.slice(0, 50).map(validateDebt),
          settings: {
            extraPayment: validateNumber(importedData.extraPayment || 0, 0, 100000),
            currency: 'GBP'
          },
          paymentHistory: []
        };
      }
      else {
        throw new Error('Invalid data format. Expected "debts" array with debt objects.');
      }

      // Final validation
      if (!processedData.debts || processedData.debts.length === 0) {
        throw new Error('No valid debts found in the imported data.');
      }

      // Security: Log import attempt (in real app, this would go to security monitoring)
      console.log('Data import attempt:', {
        debtCount: processedData.debts.length,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
      });

      // Import the data
      dataManager.importData(processedData);
      
      // Refresh the page to show new data
      window.location.reload();
      
    } catch (error) {
      console.error('Import error:', error);
      
      // Security: Don't expose full error details to prevent information leakage
      if (error.message.includes('JSON')) {
        setImportError('Invalid JSON format. Please check your data structure.');
      } else if (error.message.includes('malicious')) {
        setImportError('Import blocked: potentially unsafe content detected.');
      } else if (error.message.includes('too large') || error.message.includes('Too many')) {
        setImportError(error.message);
      } else {
        setImportError('Import failed. Please check your data format and try again.');
      }
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Security: Validate file type
    if (!file.type || (file.type !== 'application/json' && !file.name.endsWith('.json'))) {
      setImportError('Invalid file type. Please upload a JSON file.');
      return;
    }

    // Security: Validate file size (max 1MB)
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_FILE_SIZE) {
      setImportError('File too large. Maximum size is 1MB.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Security: Validate file content
        const content = e.target.result;
        if (typeof content !== 'string') {
          setImportError('Invalid file content. Please upload a valid JSON file.');
          return;
        }
        
        setImportText(content);
        setImportError(''); // Clear any previous errors
      } catch (error) {
        setImportError('Failed to read file. Please try again.');
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and track your debt-free journey</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'data', label: 'Data Management' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Information</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Email: {user.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Member since {new Date(user.created_at).toLocaleDateString('en-GB', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Progress Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Debt</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  £{progress.totalDebt.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Amount Paid</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  £{progress.totalPaid.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Progress</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {progress.progressPercent.toFixed(1)}%
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Debt-Free Date</h3>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {progress.debtFreeDate ? progress.debtFreeDate.toLocaleDateString('en-GB', { 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Debts</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{debts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Minimum</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">£{totalMinPayments.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payments Recorded</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{paymentHistory.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Management</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Import Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Import debt data from AI scripts, other calculators, or exported TrySnowball files. Supports JSON and pipe-separated formats.
                  </p>
                  
                  {/* Security Notice */}
                  <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Security Protected</p>
                        <p className="text-blue-700 dark:text-blue-300">
                          All imports are validated and sanitized. Maximum 50 debts, 1MB file size. Malicious content is automatically blocked.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* File upload */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload JSON File
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                    />
                  </div>

                  {/* Text area for pasting JSON */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Or paste JSON data directly
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder='Paste your data here. Supports multiple formats:

JSON Format:
{
  "debts": [
    { "name": "Barclaycard", "balance": 2863, "interestRate": 20, "minPayment": 100 }
  ],
  "extraPayment": 200
}

Pipe Format:
Debt 1: Barclaycard | £2863 | 20% | £100
Debt 2: Virgin | £5583 | 20% | £110
Recommended Extra Payment: £200/month'
                      className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono"
                    />
                  </div>

                  {importError && (
                    <div className="text-red-600 dark:text-red-400 text-sm mb-3">
                      {importError}
                    </div>
                  )}

                  <button
                    onClick={handleImportData}
                    disabled={!importText.trim()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Import Data
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Your Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Download all your debt information, payment history, and settings as a JSON file.
                  </p>
                  <button
                    onClick={exportData}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Data
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Reset to Demo Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Replace your current data with demo data to test the app features.
                  </p>
                  <button
                    onClick={resetToDemo}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset to Demo
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Clear All Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Permanently delete all your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={clearAllData}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Your theme preference is automatically detected from your system settings.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>🌞 Light</span>
                    <span>🌙 Dark</span>
                    <span>🔄 System</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Privacy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    All your data is stored locally in your browser. We don't collect or store your financial information on our servers.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Your data stays private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;