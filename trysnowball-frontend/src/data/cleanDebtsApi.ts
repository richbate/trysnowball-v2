/**
 * Clean UK Debts API - Zero Conversions, Zero Bullshit
 * 
 * Simple UK format: £1234.56 = 1234.56, 19.9% = 19.9
 * No cents, no basis points, no conversion chaos
 */

import { UKDebt } from '../types/ukDebt';
import { getToken } from '../utils/tokenStorage';

// API base URL
const API_BASE = '/api/clean/debts';

// Simple error class
class DebtAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DebtAPIError';
  }
}

// Get auth headers
function getHeaders(): HeadersInit {
  const token = getToken();
  if (!token) {
    throw new DebtAPIError('No auth token', 401);
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Simple fetch wrapper with error handling
async function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
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
 * GET /api/clean/debts - Fetch all debts
 */
export async function fetchAllDebts(): Promise<UKDebt[]> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Fetching all debts...');
  
  const response = await apiCall(API_BASE);
  const data = await response.json();
  
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Received', data.debts.length, 'debts');
  return data.debts;
}

/**
 * POST /api/clean/debts - Create new debt
 */
export async function createDebt(debt: Omit<UKDebt, 'id'>): Promise<UKDebt> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Creating debt:', debt.name);
  console.log('📤 Payload:', debt);
  
  const response = await apiCall(API_BASE, {
    method: 'POST',
    body: JSON.stringify(debt)
  });
  
  const data = await response.json();
  console.log('✅ Created debt:', data.debt.id);
  return data.debt;
}

/**
 * PUT /api/clean/debts/:id - Update debt
 */
export async function updateDebt(id: string, updates: Partial<UKDebt>): Promise<void> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Updating debt:', id);
  console.log('📤 Updates:', updates);
  
  await apiCall(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  
  console.log('✅ Updated debt:', id);
}

/**
 * DELETE /api/clean/debts/:id - Delete debt
 */
export async function deleteDebt(id: string): Promise<void> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Deleting debt:', id);
  
  await apiCall(`${API_BASE}/${id}`, {
    method: 'DELETE'
  });
  
  console.log('✅ Deleted debt:', id);
}

/**
 * Upsert debt - create or update based on ID
 */
export async function upsertDebt(debt: UKDebt): Promise<UKDebt> {
  if (debt.id) {
    await updateDebt(debt.id, debt);
    return debt;
  } else {
    return await createDebt(debt);
  }
}

export { DebtAPIError };