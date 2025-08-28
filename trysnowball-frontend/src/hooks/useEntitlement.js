// src/hooks/useEntitlement.js
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import posthog from 'posthog-js';
import { dbg } from '../lib/debug';
import { FEATURE } from '../utils/env';
import { fetchJSON } from '../utils/fetchJSON';

// ---- Config ----
const FLAG_KEY = 'beta_access_enabled';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// simple module-level cache to avoid extra network calls
let _entitlementCache = null; // { data: { betaAccess:boolean, lifetime?:boolean, dailyQuota?:number }, ts:number }

function isEnvBetaEnabled() {
  return String(process.env.REACT_APP_BETA_ACCESS_ENABLED).toLowerCase() === 'true';
}

/**
 * Returns boolean when PostHog flags are ready; null while loading.
 * Updates reactively as flags change.
 */
function usePosthogFlag(key) {
  const [flag, setFlag] = useState(null);

  useEffect(() => {
    let mounted = true;

    // if PostHog initialized and flags already available:
    try {
      const immediate = posthog?.isFeatureEnabled?.(key);
      if (typeof immediate === 'boolean') setFlag(immediate);
    } catch (_) {
      // ignore
    }

    // subscribe to feature flag updates
    const unsub = posthog?.onFeatureFlags?.(() => {
      if (!mounted) return;
      try {
        const val = posthog.isFeatureEnabled(key);
        setFlag(typeof val === 'boolean' ? val : false);
      } catch {
        setFlag(false);
      }
    });

    return () => {
      mounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [key]);

  return flag; // boolean | null
}

/**
 * Centralized hook for gating & checkout for Pro Access.
 * - isPro: whether user has pro access
 * - entitlement: { betaAccess, lifetime?, dailyQuota? }
 * - startCheckout: creates Stripe session and redirects
 * - refresh: busts cache and refetches entitlement
 */
export function useEntitlement() {
  const [loading, setLoading] = useState(!FEATURE.previewBypassAuth);
  const [entitlement, setEntitlement] = useState({ 
    betaAccess: FEATURE.previewBypassAuth, 
    lifetime: FEATURE.previewBypassAuth, 
    dailyQuota: FEATURE.previewBypassAuth ? 999 : 40 
  });
  const [error, setError] = useState(null);
  const posthogFlag = usePosthogFlag(FLAG_KEY);

  // Resolve pro status
  const isPro = useMemo(() => {
    // Check entitlement for pro/lifetime access
    return entitlement.lifetime || entitlement.betaAccess;
  }, [entitlement]);

  const fetchEntitlement = useCallback(async ({ force = false } = {}) => {
    setError(null);
    const now = Date.now();
    if (!force && _entitlementCache && now - _entitlementCache.ts < CACHE_TTL_MS) {
      setEntitlement(_entitlementCache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Use local defaults - no server calls needed
      const defaultEntitlement = {
        betaAccess: false,
        lifetime: false,
        dailyQuota: 40,
      };
      
      _entitlementCache = { data: defaultEntitlement, ts: now };
      setEntitlement(defaultEntitlement);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (FEATURE.previewBypassAuth) return;
    
    Promise.resolve({ betaAccess: false, dailyQuota: 40 })
      .then(d => setEntitlement({ 
        betaAccess: !!d?.betaAccess, 
        lifetime: !!d?.lifetime, 
        dailyQuota: d?.dailyQuota || 40 
      }))
      .catch(() => setEntitlement({ betaAccess: false, lifetime: false, dailyQuota: 40 }))
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    if (FEATURE.previewBypassAuth) return;
    
    Promise.resolve({ betaAccess: false, dailyQuota: 40 })
      .then(d => setEntitlement({ 
        betaAccess: !!d?.betaAccess, 
        lifetime: !!d?.lifetime, 
        dailyQuota: d?.dailyQuota || 40 
      }))
      .catch(() => setEntitlement({ betaAccess: false, lifetime: false, dailyQuota: 40 }));
  }, []);

  const startCheckout = useCallback(async () => {
    try {
      setError(null);
      // success/cancel URLs can be customized; keep it simple
      const payload = {
        productType: 'beta_access',
        success_url: `${window.location.origin}/account/upgrade?success=1`,
        cancel_url: window.location.href,
      };
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`checkout ${r.status}`);
      const { url } = await r.json();
      if (!url) throw new Error('No checkout URL returned');
      window.location.assign(url);
    } catch (e) {
      setError(e);
      // optional analytics
      try { window.posthog?.capture?.('upgrade_beta_error', { message: String(e?.message || e) }); } catch {}
    }
  }, []);

  // optional: expose a tiny helper to gate UI quickly
  const canUsePremium = entitlement.betaAccess === true;

  return {
    isPro: isPro,      // boolean - true if user has pro access
    entitlement,        // { betaAccess, lifetime?, dailyQuota? }
    canUsePremium,      // convenience boolean
    loading, error,
    startCheckout,
    refresh,

    // Legacy compatibility for existing code
    betaAccess: entitlement.betaAccess,
    isPremium: entitlement.betaAccess,
    createCheckoutSession: startCheckout,
    refreshEntitlement: refresh,
  };
}