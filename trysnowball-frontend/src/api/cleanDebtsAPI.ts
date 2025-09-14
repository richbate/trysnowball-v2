/**
 * Clean UK Debts API Client - Zero Conversion, Zero Bullshit
 * Follows GPT spec exactly - boring and bulletproof
 */

import { UKDebt, CreateUKDebt, UpdateUKDebt } from '../types/CleanUKDebt';
import { getToken } from '../utils/tokenStorage';

const API_BASE = '/api/debts';

class DebtAPIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'DebtAPIError';
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) {
    throw new DebtAPIError('No auth token', 401);
  }

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
      // Use default error message if response isn't JSON
    }
    throw new DebtAPIError(errorMessage, response.status);
  }

  return response;
}

/**
 * GET /api/debts - Fetch all debts for authenticated user
 */
export async function fetchAllDebts(): Promise<UKDebt[]> {
  console.log('[CleanAPI] Fetching all debts');
  
  const response = await apiRequest(API_BASE);
  const debts = await response.json();
  
  console.log('[CleanAPI] Fetched', debts.length, 'debts');
  return debts;
}

/**
 * POST /api/debts - Create new debt
 */
export async function createDebt(debtData: CreateUKDebt): Promise<UKDebt> {
  console.log('[CleanAPI] Creating debt:', debtData.name);
  console.log('[CleanAPI] Payload:', debtData);
  
  const response = await apiRequest(API_BASE, {
    method: 'POST',
    body: JSON.stringify(debtData),
  });
  
  const newDebt = await response.json();
  console.log('[CleanAPI] Created debt with ID:', newDebt.id);
  return newDebt;
}

/**
 * PATCH /api/debts/:id - Update existing debt
 */
export async function updateDebt(id: string, updates: UpdateUKDebt): Promise<UKDebt> {
  console.log('[CleanAPI] Updating debt:', id);
  console.log('[CleanAPI] Updates:', updates);
  
  const response = await apiRequest(`${API_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  
  const updatedDebt = await response.json();
  console.log('[CleanAPI] Updated debt:', id);
  return updatedDebt;
}

/**
 * DELETE /api/debts/:id - Delete debt
 */
export async function deleteDebt(id: string): Promise<void> {
  console.log('[CleanAPI] Deleting debt:', id);
  
  await apiRequest(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  
  console.log('[CleanAPI] Deleted debt:', id);
}

/**
 * Upsert helper - create or update based on ID presence
 */
export async function upsertDebt(debt: UKDebt | CreateUKDebt): Promise<UKDebt> {
  if ('id' in debt && debt.id) {
    // Update existing debt
    const { id, user_id, created_at, updated_at, ...updates } = debt as UKDebt;
    return await updateDebt(id, updates);
  } else {
    // Create new debt
    return await createDebt(debt as CreateUKDebt);
  }
}

export { DebtAPIError };