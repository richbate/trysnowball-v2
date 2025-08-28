// src/lib/authLocal.ts
export type LocalEntitlement = {
  isPro: boolean;
  plan: 'free' | 'pro' | 'founder';
  betaAccess?: boolean;
  dailyQuota?: number;
  reason?: string;
};

export async function fetchLocalUser(): Promise<null | { id?: string; email?: string; name?: string }> {
  // Optional: hydrate from local (keep null if unknown)
  try {
    const raw = localStorage.getItem('snowball:user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchLocalEntitlement(): Promise<LocalEntitlement> {
  // Safe defaults for CI / local mode
  return {
    isPro: false,
    plan: 'free',
    betaAccess: false,
    dailyQuota: 40,
    reason: 'Local auth (no server endpoints)',
  };
}