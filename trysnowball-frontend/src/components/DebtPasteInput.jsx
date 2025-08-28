/**
 * DebtPasteInput Component
 * Allows users to paste debt tables and uses GPT to parse them intelligently
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Copy, Edit3 } from 'lucide-react';
import { useGPTAgent } from '../hooks/useGPTAgent';
import { useDebts } from '../hooks/useDebts';
import { buildGPTIngestionContext } from '../utils/gptContextBuilders';
import FormField from './ui/FormField';
import Textarea from './ui/Textarea';
import Input from './ui/Input';

const DebtPasteInput = ({ onSuccess, onCancel, existingDebts = [] }) => {
  const [pastedData, setPastedData] = useState('');
  const [parsedDebts, setParsedDebts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const textareaRef = useRef(null);
  const { setDebts } = useDebts();
  
  // GPT agent for debt ingestion
  const { 
    callGPT, 
    loading: gptLoading, 
    error: gptError, 
    getFallbackResponse,
    isGPTAvailable 
  } = useGPTAgent('ingest', {
    onSuccess: handleGPTSuccess,
    onError: handleGPTError,
    debugMode: true
  });

  /**
   * Handle successful GPT parsing
   */
  function handleGPTSuccess(response) {
    if (response.success && response.debts) {
      setParsedDebts(response.debts);
      setQuestions(response.questions || []);
      setWarnings(response.warnings || []);
      setShowPreview(true);
    }
  }

  /**
   * Handle GPT parsing errors
   */
  function handleGPTError(error) {
    console.error('GPT parsing failed:', error);
    // Fallback to manual parsing will be triggered
  }

  /**
   * Parse pasted data using GPT or fallback
   */
  const handleParse = useCallback(async () => {
    if (!pastedData.trim()) {
      alert('Please paste some debt data first');
      return;
    }

    // Build context for debt ingestion
    const context = buildGPTIngestionContext(existingDebts);
    
    // Try GPT first
    const gptResult = await callGPT(pastedData, context);

    // If GPT failed, use fallback parsing
    if (!gptResult || !gptResult.success) {
      console.log('Using fallback parsing...');
      const fallbackResult = parseFallback(pastedData);
      setParsedDebts(fallbackResult.debts);
      setWarnings([
        'Used basic parsing - please verify all data is correct',
        ...fallbackResult.warnings
      ]);
      setQuestions(fallbackResult.questions);
      setShowPreview(true);
    }
  }, [pastedData, callGPT, existingDebts]);

  /**
   * Fallback parsing when GPT is unavailable
   */
  const parseFallback = (data) => {
    const lines = data.trim().split('\n').filter(line => line.trim());
    const debts = [];
    const warnings = [];
    const questions = [];

    for (const line of lines) {
      // Skip headers and separators
      if (line.includes('---') || 
          line.toLowerCase().includes('name') || 
          line.toLowerCase().includes('debt')) {
        continue;
      }

      const debt = extractDebtFromLine(line);
      if (debt) {
        debts.push(debt);
      }
    }

    if (debts.length === 0) {
      questions.push('No debts could be parsed. Could you check the format?');
    }

    return { debts, warnings, questions };
  };

  /**
   * Extract debt from a single line (fallback parsing)
   */
  const extractDebtFromLine = (line) => {
    // Remove table separators
    const cleanLine = line.replace(/\|/g, ' ').trim();
    
    // Find monetary amounts
    const amounts = cleanLine.match(/£?([0-9,]+\.?\d*)/g) || [];
    const words = cleanLine.replace(/£?[0-9,]+\.?\d*/g, '').trim().split(/\s+/);
    
    if (amounts.length === 0 || words.length === 0) {
      return null;
    }
    
    const name = words.join(' ').trim();
    const balance = parseFloat(amounts[0].replace(/[£,]/g, ''));
    const minPayment = amounts[1] ? parseFloat(amounts[1].replace(/[£,]/g, '')) : null;
    
    return {
      id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      balance,
      minPayment: minPayment || Math.max(25, Math.floor(balance * 0.02)),
      interestRate: 20,
      order: 999
    };
  };

  /**
   * Import parsed debts into the system
   */
  const handleImport = useCallback(async () => {
    try {
      // Add unique IDs and normalize data
      const normalizedDebts = parsedDebts.map((debt, index) => ({
        ...debt,
        id: debt.id || `imported_${Date.now()}_${index}`,
        originalAmount: debt.balance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: debt.order || (index + 1)
      }));

      // Import into debt manager
      await setDebts([...existingDebts, ...normalizedDebts]);
      
      setImportSuccess(true);
      setTimeout(() => {
        onSuccess?.(normalizedDebts);
      }, 1500);

    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import debts. Please try again.');
    }
  }, [parsedDebts, existingDebts, setDebts, onSuccess]);

  /**
   * Edit a parsed debt before import
   */
  const editDebt = useCallback((index, field, value) => {
    setParsedDebts(prev => prev.map((debt, i) => 
      i === index ? { ...debt, [field]: value } : debt
    ));
  }, []);

  /**
   * Remove a parsed debt
   */
  const removeDebt = useCallback((index) => {
    setParsedDebts(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Example data for guidance
   */
  const showExample = () => {
    const example = `| Debt Name | Balance | Min Payment |
|-----------|---------|-------------|
| MBNA Card | £2,500 | £50 |
| Overdraft | £850 | £25 |
| Store Card | £1,200 | £35 |`;
    
    setPastedData(example);
    textareaRef.current?.focus();
  };

  if (importSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Debts Imported Successfully!
        </h3>
        <p className="text-gray-600">
          {parsedDebts.length} debt{parsedDebts.length !== 1 ? 's' : ''} added to your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-3">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Import Your Debts</h2>
        </div>
        <p className="text-gray-600">
          Paste your debt information and we'll parse it automatically
          {isGPTAvailable ? ' using AI' : ''}
        </p>
      </div>

      {!showPreview ? (
        <>
          {/* Input Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <FormField
              label="Paste your debt data (table, CSV, or list format):"
            >
              <Textarea
                ref={textareaRef}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                className="font-mono text-sm resize-none"
                rows={10}
                placeholder="Paste your debt table here..."
                data-testid="paste-textarea"
              />
            </FormField>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={showExample}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                Show Example Format
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={!pastedData.trim() || gptLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
                  data-testid="parse-debts"
                >
                  {gptLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Parsing...
                    </>
                  ) : (
                    <>
                      Parse Debts
                      {isGPTAvailable && <span className="ml-1 text-blue-200">✨</span>}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* GPT Status */}
          {!isGPTAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  AI parsing is not available. We'll use basic pattern matching to parse your data.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {gptError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">
                  {gptError.message} - Using fallback parsing instead.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Preview Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Parsed Debts ({parsedDebts.length})
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Please Review:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions */}
            {questions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">❓ Clarification Needed:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {questions.map((question, index) => (
                    <li key={index}>• {question}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debt Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3">Debt Name</th>
                    <th className="text-right py-2 px-3">Balance</th>
                    <th className="text-right py-2 px-3">Min Payment</th>
                    <th className="text-right py-2 px-3">Interest Rate</th>
                    <th className="text-center py-2 px-3">Order</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedDebts.map((debt, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        <Input
                          type="text"
                          value={debt.name}
                          onChange={(e) => editDebt(index, 'name', e.target.value)}
                          className="text-sm"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          value={debt.balance}
                          onChange={(e) => editDebt(index, 'balance', parseFloat(e.target.value) || 0)}
                          className="w-20 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          value={debt.minPayment || 0}
                          onChange={(e) => editDebt(index, 'minPayment', parseFloat(e.target.value) || 0)}
                          className="w-16 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={debt.interestRate || 20}
                            onChange={(e) => editDebt(index, 'interestRate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-16 text-sm text-right"
                          />
                          <span className="text-gray-400 ml-1">%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Input
                          type="number"
                          value={debt.order || (index + 1)}
                          onChange={(e) => editDebt(index, 'order', parseInt(e.target.value) || 1)}
                          className="w-12 text-sm text-center"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => removeDebt(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedDebts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No debts were parsed. Please check your data format.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Edit
            </button>
            
            <div className="space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedDebts.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-testid="confirm-import"
              >
                Import {parsedDebts.length} Debt{parsedDebts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebtPasteInput;