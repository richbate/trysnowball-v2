import { UKDebt } from "../types/ukDebt";
import { getToken } from "../utils/tokenStorage";

async function fetchJSON(input: RequestInfo, init?: RequestInit) {
 const r = await fetch(input, init);
 if (!r.ok) throw new Error(`HTTP ${r.status}`);
 return r.json();
}

function emitGatewayTelemetry(path: 'jwt' | 'cookie' | 'fail') {
 try {
  if (typeof window !== 'undefined' && window.posthog) {
   window.posthog.capture('auth_gateway_path', { used: path });
  }
 } catch (e) {
  // Ignore telemetry errors
 }
}

export async function fetchDebts(): Promise<ReadonlyArray<UKDebt>> {
 const token = getAuthToken();

 if (!token) {
  throw new Error('AUTH_REQUIRED');
 }

 try {
  const data = await fetchJSON('/api/debts', {
   method: 'GET',
   credentials: 'include',
   headers: { 
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
   },
  });
  emitGatewayTelemetry('jwt');
  const rows = Array.isArray(data) ? data : data.debts ?? [];
  
  // Check for old data format and warn user
  if (rows.length > 0 && rows[0]) {
   const firstDebt = rows[0];
   if ('amount_pennies' in firstDebt || 'apr_bps' in firstDebt || 'min_payment_pennies' in firstDebt) {
    console.error('⚠️ Old debt format detected! Please re-import or edit your debts.');
    // Show a toast if available
    if ((window as any).toast?.error) {
     (window as any).toast.error("We've updated how debts are stored. Please re-import or edit your debts to continue.");
    }
   }
  }
  
  return rows as UKDebt[];
 } catch (e) {
  emitGatewayTelemetry('fail');
  throw new Error('AUTH_REQUIRED');
 }
}

export async function upsertDebt(debt: Partial<UKDebt> & { id: string }, options?: { isUpdate?: boolean }): Promise<void> {
 console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_SYNC] Starting debt sync to server:', { id: debt.id, name: debt.name });
 
 const cleanPayload = Object.fromEntries(
  Object.entries(debt).filter(([, value]) => value !== undefined)
 );
 
 const token = getToken();
 console.log('🔐 [D1_SYNC] Auth token present:', !!token);
 
 // 🔧 Use explicit isUpdate flag from frontend, fallback to ID detection
 const isUpdate = options?.isUpdate ?? (debt.id && (debt.id.startsWith('debt-17') || debt.id.includes('-')));
 const method = isUpdate ? 'PUT' : 'POST';
 const url = isUpdate ? `/api/debts/${debt.id}` : '/api/debts';
 
 console.log(`📡 [D1_SYNC] Debt ID: "${debt.id}" | Options.isUpdate: ${options?.isUpdate} | Final isUpdate: ${isUpdate}`);
 console.log(`📡 [D1_SYNC] Operation: ${method} ${url} (${isUpdate ? 'UPDATE' : 'CREATE'})`);
 
 const body = JSON.stringify(cleanPayload);
 const common = {
  method: method as 'POST' | 'PUT',
  body,
  credentials: 'include' as const,
  headers: { 'Content-Type': 'application/json' as const },
 };

 // JWT first
 if (token) {
  try {
   console.log(`📡 [D1_SYNC] Attempting JWT auth: ${method} ${url}`);
   const r = await fetch(url, {
    ...common,
    headers: { ...common.headers, Authorization: `Bearer ${token}` },
   });
   if (!r.ok) {
    console.error(`❌ [D1_SYNC] JWT auth failed: ${method} ${url}`, r.status, r.statusText);
    throw new Error(String(r.status));
   }
   console.warn(`✅ [D1_SYNC] Debt successfully synced to D1 via JWT: ${method} ${url}`);
   return;
  } catch (error) {
   console.error(`❌ [D1_SYNC] JWT sync failed (${method} ${url}), trying fallback:`, error);
  }
 }

 // Legacy fallback
 console.warn(`📡 [D1_SYNC] Attempting legacy cookie auth: ${method} ${url}`);
 const r2 = await fetch(url, common);
 if (!r2.ok) {
  console.error('❌ [D1_SYNC] Legacy auth also failed:', r2.status, r2.statusText);
  throw new Error('AUTH_REQUIRED');
 }
 console.warn('✅ [D1_SYNC] Debt successfully synced to D1 via legacy auth');
}

export async function deleteDebt(debtId: string): Promise<void> {
 console.log('🗑️ [D1_SYNC] Starting debt deletion from server:', { id: debtId });
 
 const token = getAuthToken();
 console.log('🔐 [D1_SYNC] Auth token present:', !!token);
 
 const url = `/api/debts/${debtId}`;
 console.log(`📡 [D1_SYNC] Operation: DELETE ${url}`);
 
 const common = {
  method: 'DELETE' as const,
  credentials: 'include' as const,
  headers: { 'Content-Type': 'application/json' as const },
 };

 // JWT first
 if (token) {
  try {
   console.log(`📡 [D1_SYNC] Attempting JWT auth: DELETE ${url}`);
   const r = await fetch(url, {
    ...common,
    headers: { ...common.headers, Authorization: `Bearer ${token}` },
   });
   if (!r.ok) {
    console.error(`❌ [D1_SYNC] JWT auth failed: DELETE ${url}`, r.status, r.statusText);
    throw new Error(String(r.status));
   }
   console.warn(`✅ [D1_SYNC] Debt successfully deleted from D1 via JWT: DELETE ${url}`);
   return;
  } catch (error) {
   console.error(`❌ [D1_SYNC] JWT delete failed (DELETE ${url}), trying fallback:`, error);
  }
 }

 // Legacy fallback
 console.warn(`📡 [D1_SYNC] Attempting legacy cookie auth: DELETE ${url}`);
 const r2 = await fetch(url, common);
 if (!r2.ok) {
  console.error('❌ [D1_SYNC] Legacy auth also failed:', r2.status, r2.statusText);
  throw new Error('AUTH_REQUIRED');
 }
 console.warn('✅ [D1_SYNC] Debt successfully deleted from D1 via legacy auth');
}