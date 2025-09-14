/**
 * Shared payment preferences hook
 * Single source of truth for payment strategy, extra budget, and custom focus
 */

import { useState, useEffect, useCallback } from 'react';

const PREFS_KEY = 'ts:payment_prefs:v1';

const defaultPrefs = {
 extraPounds: 0,
 strategy: 'snowball',
 customFocusId: null
};

function readPrefs() {
 try {
  const stored = localStorage.getItem(PREFS_KEY);
  if (!stored) return defaultPrefs;
  
  const parsed = JSON.parse(stored);
  return {
   extraPounds: Number(parsed.extraPounds || 0),
   strategy: parsed.strategy || 'snowball',
   customFocusId: parsed.customFocusId || null
  };
 } catch (error) {
  console.warn('[usePaymentPrefs] Error reading preferences:', error);
  return defaultPrefs;
 }
}

function writePrefs(prefs) {
 try {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  // Notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent('payments:prefs_changed', { detail: prefs }));
 } catch (error) {
  console.error('[usePaymentPrefs] Error writing preferences:', error);
 }
}

export function usePaymentPrefs() {
 const [prefs, setPrefsState] = useState(() => readPrefs());

 // Sync when another part of the app (or another tab) updates preferences
 useEffect(() => {
  const onStorageChange = (event) => {
   if (event.key === PREFS_KEY) {
    setPrefsState(readPrefs());
   }
  };

  const onCustomEvent = () => {
   setPrefsState(readPrefs());
  };

  window.addEventListener('storage', onStorageChange);
  window.addEventListener('payments:prefs_changed', onCustomEvent);

  return () => {
   window.removeEventListener('storage', onStorageChange);
   window.removeEventListener('payments:prefs_changed', onCustomEvent);
  };
 }, []);

 const updatePrefs = useCallback((patch) => {
  const currentPrefs = readPrefs(); // Always read fresh from localStorage
  const nextPrefs = { ...currentPrefs, ...patch };
  
  // Validate and sanitize
  if (typeof nextPrefs.extraPounds !== 'number' || isNaN(nextPrefs.extraPounds) || nextPrefs.extraPounds < 0) {
   nextPrefs.extraPounds = 0;
  }
  
  if (!['snowball', 'avalanche', 'custom'].includes(nextPrefs.strategy)) {
   nextPrefs.strategy = 'snowball';
  }
  
  setPrefsState(nextPrefs);
  writePrefs(nextPrefs);
 }, []);

 // Helper to reset to defaults
 const resetPrefs = useCallback(() => {
  setPrefsState(defaultPrefs);
  writePrefs(defaultPrefs);
 }, []);

 return {
  prefs,
  updatePrefs,
  resetPrefs
 };
}