/**
 * Clean UK Debts API - GPT Spec Implementation
 * Zero conversion, zero bullshit, bulletproof and boring
 */

import { UKDebt, CreateUKDebt, UpdateUKDebt } from '../types/UKDebt';

const API_BASE = '/api/debts';

class DebtAPIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'DebtAPIError';
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // In a real app, get token from auth context
  const token = localStorage.getItem('auth_token') || 'demo-token';

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new DebtAPIError(errorMessage, response.status);
  }

  return response;
}

/**
 * GET /api/debts
 */
export async function fetchAllDebts(): Promise<UKDebt[]> {
  console.log('[API] Fetching all debts');
  
  const response = await apiRequest(API_BASE);
  const debts = await response.json();
  
  console.log('[API] Fetched', debts.length, 'debts');
  return debts;
}

/**
 * POST /api/debts
 */
export async function createDebt(debtData: CreateUKDebt): Promise<UKDebt> {
  console.log('[API] Creating debt:', debtData.name);
  console.log('[API] Payload:', debtData);
  
  const response = await apiRequest(API_BASE, {
    method: 'POST',
    body: JSON.stringify(debtData),
  });
  
  const newDebt = await response.json();
  console.log('[API] Created debt with ID:', newDebt.id);
  return newDebt;
}

/**
 * PATCH /api/debts/:id
 */
export async function updateDebt(id: string, updates: UpdateUKDebt): Promise<UKDebt> {
  console.log('[API] Updating debt:', id);
  console.log('[API] Updates:', updates);
  
  const response = await apiRequest(`${API_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  
  const updatedDebt = await response.json();
  console.log('[API] Updated debt:', id);
  return updatedDebt;
}

/**
 * DELETE /api/debts/:id
 */
export async function deleteDebt(id: string): Promise<void> {
  console.log('[API] Deleting debt:', id);
  
  await apiRequest(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  
  console.log('[API] Deleted debt:', id);
}

export { DebtAPIError };