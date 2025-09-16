/**
 * Universal GPT Agent Hook for TrySnowball
 * Routes all GPT interactions through Pages Functions
 */

import { useState, useCallback, useRef } from 'react';
import { getToken } from '../utils/tokenStorage';
import { API_CONFIG } from '../config/api';

export const useGPTAgent = (agentType = 'general', options = {}) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [lastCall, setLastCall] = useState(null);
  
  const abortControllerRef = useRef(null);

  const {
    fallbackEnabled = true,
    onSuccess = null,
    onError = null
  } = options;

  const callGPT = useCallback(async (userInput, context = {}) => {
    if (!userInput?.trim()) {
      const inputError = new Error('User input cannot be empty');
      setError(inputError);
      onError?.(inputError);
      return null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();
    
    try {
      const baseUrl = window.location.origin;
      let result;
      
      if (agentType === 'ingest') {
        result = await callPagesIngest(baseUrl, userInput, context, abortControllerRef.current.signal);
      } else {
        result = await callPagesChat(baseUrl, agentType, userInput, context, abortControllerRef.current.signal);
      }

      const duration = Date.now() - startTime;

      setResponse(result);
      setLastCall({
        agentType,
        userInput,
        context,
        response: result,
        duration,
        timestamp: new Date().toISOString()
      });

      onSuccess?.(result);
      return result;

    } catch (requestError) {
      setError(requestError);
      setLastCall({
        agentType,
        userInput,
        context,
        error: requestError.message,
        timestamp: new Date().toISOString()
      });

      onError?.(requestError);

      if (fallbackEnabled) {
        return getFallbackResponse(userInput, context);
      }

      return null;

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [agentType, fallbackEnabled, onSuccess, onError]);

  /**
   * Cancel any ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setResponse(null);
    setError(null);
    setLastCall(null);
    cancelRequest();
  }, [cancelRequest]);

  /**
   * Get fallback response for when AI is unavailable
   */
  const getFallbackResponse = useCallback((userInput, context = {}) => {
    if (!fallbackEnabled) return null;

    switch (agentType.toLowerCase()) {
      case 'ingest':
        return getFallbackIngestion(userInput);
      case 'coach':
        return getFallbackCoaching(context);
      case 'share':
        return getFallbackShareMessage(context);
      default:
        return getFallbackGeneral();
    }
  }, [agentType, fallbackEnabled]);

  return {
    callGPT,
    loading,
    response,
    error,
    lastCall,
    cancelRequest,
    reset,
    getFallbackResponse,
    agentType
  };
};

async function callPagesChat(baseUrl, agentType, userInput, context, signal) {
  // For AI Coach, use the new server-side quota enforcement endpoint
  if (agentType === 'coach') {
    return await callAICoachWorker(userInput, context, signal);
  }

  // For other agent types, use the legacy endpoint
  const systemPrompts = {
    share: `Generate an inspiring social media message about debt elimination progress. Keep it positive, motivational, and UK-focused. Use emojis sparingly. Maximum 280 characters.`,
    general: `You are a helpful UK debt elimination assistant. Provide practical, actionable advice about paying off debt using proven methods like the debt snowball approach.`
  };

  const systemPrompt = systemPrompts[agentType] || systemPrompts.general;

  const response = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include auth cookies
    body: JSON.stringify({
      systemPrompt,
      userMessage: userInput,
      context,
      agentType, // Pass agent type for hardened prompt selection
      maxTokens: agentType === 'share' ? 100 : 512,
      temperature: agentType === 'share' ? 0.8 : 0.2
    }),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `AI request failed: ${response.status}`);
  }

  const result = await response.json();
  
  // Format response based on agent type
  if (agentType === 'share') {
    return {
      message: result.text,
      type: 'share',
      usage: result.usage,
      timestamp: new Date().toISOString()
    };
  }

  return {
    message: result.text,
    type: agentType,
    usage: result.usage,
    finishReason: result.finishReason,
    timestamp: new Date().toISOString()
  };
}

async function callPagesIngest(baseUrl, text, context, signal) {
  const response = await fetch(`${baseUrl}/ai/ingest-debts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include auth cookies
    body: JSON.stringify({
      text,
      format: 'auto'
    }),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `AI ingestion failed: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'AI ingestion failed');
  }

  // Validate and format debt data
  const validatedDebts = result.debts.map(debt => ({
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: debt.name || 'Unknown Debt',
    balance: Math.max(0, parseFloat(debt.balance) || 0),
    interestRate: Math.max(0, Math.min(100, parseFloat(debt.interestRate) || 0)),
    minPayment: Math.max(0, parseFloat(debt.minPayment) || Math.max(25, (parseFloat(debt.balance) || 0) * 0.02)),
    type: debt.type || 'other',
    source: 'ai_ingestion',
    createdAt: new Date().toISOString()
  })).filter(debt => debt.balance > 0); // Only include debts with positive balance

  return {
    success: true,
    debts: validatedDebts,
    rawResponse: result.rawText,
    usage: result.usage,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackIngestion(userInput) {
  return {
    success: false,
    error: 'AI parsing temporarily unavailable',
    fallback: true,
    debts: [],
    suggestion: 'Please use the "Add Debt" button to enter your debts manually'
  };
}

function getFallbackCoaching(context) {
  const tips = [
    "Focus on your smallest debt first (debt snowball method) for quick psychological wins.",
    "Make minimum payments on all debts, then put any extra money toward your target debt.",
    "Consider the debt avalanche method if you prefer to tackle highest interest rates first.",
    "Look for ways to increase income or reduce expenses to find extra debt payment money.",
    "Celebrate small wins - every £10 extra payment gets you closer to freedom!"
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  return {
    message: `While AI coaching is temporarily unavailable, here's a proven strategy: ${randomTip}`,
    fallback: true,
    type: 'coach',
    timestamp: new Date().toISOString()
  };
}

function getFallbackShareMessage(context) {
  const templates = [
    "Making progress on my debt-free journey! 💪 Every payment counts! #DebtFreeUK",
    "Another step closer to financial freedom! 🎯 Consistency is key! #DebtSnowball", 
    "Debt elimination update: Still going strong! ✨ #DebtFreedom #UKMoney",
    "The debt snowball method really works! ⚡ Keep rolling! #FinancialFreedom"
  ];
  
  return {
    message: templates[Math.floor(Math.random() * templates.length)],
    fallback: true,
    type: 'share',
    timestamp: new Date().toISOString()
  };
}

function getFallbackGeneral() {
  return {
    message: "AI assistance is temporarily unavailable. Check out our Help section for common debt elimination questions and strategies.",
    fallback: true,
    type: 'general',
    timestamp: new Date().toISOString()
  };
}

/**
 * Call the AI Coach Worker with quota enforcement
 */
async function callAICoachWorker(userInput, context, signal) {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to use AI Coach');
  }
  
  // Build compact user context for our new API
  const userContext = {
    userId: context.user?.id,
    totals: {
      totalDebt: context.totalDebt || 0,
      totalMinPayments: context.totalMinPayments || 0,
      extraPayment: context.extraPayment || 0,
      monthsToDebtFree: context.projections?.totalMonths ?? null,
      totalInterestProjection: context.projections?.totalInterest ?? null
    },
    debts: (context.debts || []).map(d => ({
      id: d.id, 
      name: d.name,
      amount: d.amount ?? d.balance,
      apr: d.interest ?? d.apr ?? 0,
      minPayment: d.regularPayment ?? d.minPayment ?? 0,
      order: d.order
    })),
    // Optional, limit to last 5 payments
    recentPayments: (context.paymentHistory || []).slice(-5).map(p => ({
      debtId: p.debtId, 
      amount: p.amount, 
      date: p.paymentDate || p.recordedAt
    }))
  };
  
  const messages = [
    { role: 'user', content: userInput }
  ];
  
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      messages, 
      model: 'gpt-4o-mini',
      userContext 
    }),
    signal
  });

  if (!response.ok) {
    if (response.status === 402) {
      // Quota exceeded
      const quotaError = new Error(
        'You\'ve reached your daily AI Coach limit of 40 messages. Try again tomorrow or upgrade for unlimited access!'
      );
      quotaError.isQuotaError = true;
      throw quotaError;
    }

    if (response.status === 401) {
      throw new Error('Please log in to use AI Coach');
    }

    if (response.status === 503) {
      throw new Error('AI Coach is temporarily unavailable. Please try again later.');
    }

    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `AI request failed: ${response.status}`);
  }

  const result = await response.json();
  
  // Extract the AI response from our new API format
  const message = result.content || 'I apologize, but I had trouble generating a response.';
  
  return {
    message,
    type: 'coach',
    timestamp: new Date().toISOString()
  };
}

export default useGPTAgent;