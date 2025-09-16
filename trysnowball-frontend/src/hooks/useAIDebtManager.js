/**
 * AI Debt Manager Hook
 * Enables AI to directly read/write debt data with user permission
 */

import { useCallback, useState, useEffect } from 'react';
import { useDebts } from './useDebts';
import { useGPTAgent } from './useGPTAgent';

export const useAIDebtManager = (options = {}) => {
  const { 
    debts, 
    addDebt, 
    updateDebt, 
    deleteDebt, 
    setDebts 
  } = useDebts();

  const { requireConfirmation = true, debugMode = false } = options;
  
  // Track AI update timestamps for sync alerts
  const [lastAIUpdate, setLastAIUpdate] = useState(null);
  const [aiUpdateSummary, setAIUpdateSummary] = useState('');

  // Load last AI update from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_update_history');
      if (stored) {
        const { timestamp, summary } = JSON.parse(stored);
        setLastAIUpdate(new Date(timestamp));
        setAIUpdateSummary(summary || '');
      }
    } catch (error) {
      console.warn('Failed to load AI update history:', error);
    }
  }, []);

  // GPT agent configured for debt management
  const { callGPT, loading, error } = useGPTAgent('ingest', {
    debugMode
  });

  /**
   * Allow AI to read current debt data
   */
  const getDebtsForAI = useCallback(() => {
    return debts.map(debt => ({
      id: debt.id,
      name: debt.name,
      balance: debt.balance || debt.amount || 0,
      minPayment: debt.minPayment || debt.regularPayment || 0,
      interestRate: debt.interestRate || debt.apr || 0,
      order: debt.order || 999
    }));
  }, [debts]);

  /**
   * Process AI debt updates with optional confirmation
   */
  const processAIDebtUpdate = useCallback(async (aiResponse, userInstruction) => {
    if (!aiResponse.success || !aiResponse.debts) {
      throw new Error('Invalid AI response format');
    }

    const { debts: newDebts, action = 'replace' } = aiResponse;

    // Require user confirmation for destructive operations
    if (requireConfirmation && action === 'replace') {
      const confirmed = window.confirm(
        `AI wants to ${action} ${newDebts.length} debts. Proceed?`
      );
      if (!confirmed) return null;
    }

    try {
      let result;
      switch (action) {
        case 'add':
          const addedDebts = [];
          for (const debtData of newDebts) {
            const added = await addDebt(debtData);
            addedDebts.push(added);
          }
          result = { success: true, action: 'added', debts: addedDebts };
          break;

        case 'update':
          const updatedDebts = [];
          for (const debtData of newDebts) {
            if (debtData.id) {
              const updated = await updateDebt(debtData.id, debtData);
              updatedDebts.push(updated);
            }
          }
          result = { success: true, action: 'updated', debts: updatedDebts };
          break;

        case 'replace':
        default:
          await setDebts(newDebts);
          result = { success: true, action: 'replaced', debts: newDebts };
          break;
      }

      // Record AI update for sync alerts
      const updateRecord = {
        timestamp: new Date().toISOString(),
        summary: aiResponse.summary || `${action} ${newDebts.length} debt(s)`,
        action,
        debtCount: newDebts.length
      };
      
      // TODO: Replace with localDebtStore.setMeta('ai_update_history', updateRecord)
      localStorage.setItem('ai_update_history', JSON.stringify(updateRecord));
      setLastAIUpdate(new Date(updateRecord.timestamp));
      setAIUpdateSummary(updateRecord.summary);

      return result;
    } catch (error) {
      console.error('AI debt update failed:', error);
      throw error;
    }
  }, [addDebt, updateDebt, setDebts, requireConfirmation]);

  /**
   * Send debt data to AI and process response
   */
  const updateDebtsViaAI = useCallback(async (userInstruction) => {
    const currentDebts = getDebtsForAI();
    
    const context = {
      instruction: userInstruction,
      currentDebts,
      timestamp: new Date().toISOString()
    };

    // Enhanced prompt for debt management
    const systemPrompt = `You can now read and write debt data.

CURRENT DEBT DATA:
${JSON.stringify(currentDebts, null, 2)}

USER INSTRUCTION: "${userInstruction}"

CAPABILITIES:
- Read current debt balances and details
- Update debt balances 
- Add new debts
- Remove paid-off debts
- Reorder debt priorities

RESPONSE FORMAT:
{
  "success": true,
  "action": "update|add|replace|remove",
  "debts": [...],
  "summary": "Brief description of changes made",
  "confidence": 95
}

Make the requested changes and return the updated debt structure.`;

    try {
      const aiResponse = await callGPT([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInstruction }
      ]);

      if (aiResponse) {
        const result = await processAIDebtUpdate(aiResponse, userInstruction);
        return result;
      }
    } catch (error) {
      console.error('AI debt update error:', error);
      throw error;
    }
  }, [callGPT, getDebtsForAI, processAIDebtUpdate]);

  /**
   * Get relative time string for AI update alerts
   */
  const getAIUpdateTimeString = useCallback(() => {
    if (!lastAIUpdate) return null;
    
    const now = new Date();
    const diffMs = now - lastAIUpdate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    return lastAIUpdate.toLocaleDateString();
  }, [lastAIUpdate]);

  return {
    // Data access
    getDebtsForAI,
    
    // AI-powered operations
    updateDebtsViaAI,
    
    // Status
    loading,
    error,
    
    // Manual control
    processAIDebtUpdate,
    
    // AI sync alerts
    lastAIUpdate,
    aiUpdateSummary,
    getAIUpdateTimeString
  };
};

export default useAIDebtManager;