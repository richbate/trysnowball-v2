/**
 * Clean UK Debts Gateway - No transformations, no legacy baggage
 * Direct communication with clean UK API
 */

import { UKDebt } from '../types/ukDebt';
import { getToken } from '../utils/tokenStorage';

// Clean API error handling
class CleanAPIError extends Error {
 constructor(message: string, public status?: number) {
  super(message);
  this.name = 'CleanAPIError';
 }
}

// GET /api/debts - Fetch all debts
export async function fetchAllDebts(): Promise<UKDebt[]> {
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] Fetching all debts');
 
 const token = getToken();
 if (!token) {
  throw new CleanAPIError('No auth token available', 401);
 }

 const response = await fetch('/api/clean/debts', {
  method: 'GET',
  headers: {
   'Authorization': `Bearer ${token}`,
   'Content-Type': 'application/json'
  }
 });

 if (!response.ok) {
  throw new CleanAPIError(`Failed to fetch debts: ${response.status}`, response.status);
 }

 const data = await response.json();
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] Fetched', data.debts.length, 'clean debts');
 
 return data.debts;
}

// POST /api/debts - Create new debt
export async function createDebt(debt: UKDebt): Promise<UKDebt> {
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] Creating debt:', debt.name);
 
 const token = getToken();
 if (!token) {
  throw new CleanAPIError('No auth token available', 401);
 }

 const response = await fetch('/api/clean/debts', {
  method: 'POST',
  headers: {
   'Authorization': `Bearer ${token}`,
   'Content-Type': 'application/json'
  },
  body: JSON.stringify(debt)
 });

 if (!response.ok) {
  const error = await response.json();
  throw new CleanAPIError(error.error || `Failed to create debt: ${response.status}`, response.status);
 }

 const data = await response.json();
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] ✅ Debt created:', data.debt.id);
 
 return data.debt;
}

// PUT /api/debts/:id - Update existing debt
export async function updateDebt(debtId: string, updates: Partial<UKDebt>): Promise<void> {
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] Updating debt:', debtId);
 
 const token = getToken();
 if (!token) {
  throw new CleanAPIError('No auth token available', 401);
 }

 const response = await fetch(`/api/clean/debts/${debtId}`, {
  method: 'PUT',
  headers: {
   'Authorization': `Bearer ${token}`,
   'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
 });

 if (!response.ok) {
  const error = await response.json();
  throw new CleanAPIError(error.error || `Failed to update debt: ${response.status}`, response.status);
 }

 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] ✅ Debt updated:', debtId);
}

// DELETE /api/debts/:id - Delete debt
export async function deleteDebt(debtId: string): Promise<void> {
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] Deleting debt:', debtId);
 
 const token = getToken();
 if (!token) {
  throw new CleanAPIError('No auth token available', 401);
 }

 const response = await fetch(`/api/clean/debts/${debtId}`, {
  method: 'DELETE',
  headers: {
   'Authorization': `Bearer ${token}`,
   'Content-Type': 'application/json'
  }
 });

 if (!response.ok) {
  const error = await response.json();
  throw new CleanAPIError(error.error || `Failed to delete debt: ${response.status}`, response.status);
 }

 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [CLEAN_GATEWAY] ✅ Debt deleted:', debtId);
}

// Helper: Upsert debt (create or update based on ID presence)
export async function upsertDebt(debt: UKDebt): Promise<UKDebt> {
 if (debt.id && debt.id.length > 0) {
  // Update existing debt
  await updateDebt(debt.id, debt);
  return debt;
 } else {
  // Create new debt
  return await createDebt(debt);
 }
}