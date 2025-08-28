// src/index.js — dev-safe bootstrap with /auth/* stub on /dev/local-test
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import { DebtsProvider } from './store/debts';
import { DemoModeProvider } from './providers/DemoModeProvider';
import { deferredInit } from './utils/deferredInit';

// Production error tracking
if (process.env.NODE_ENV === 'production') {
  window.addEventListener('error', (e) => {
    // TODO: send to your endpoint/posthog/sentry-lite
    // fetch('/api/log', {method:'POST',body:JSON.stringify({msg:e.message,stack:e.error?.stack})})
    console.error('Global error captured:', e.message, e.error?.stack);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    // TODO: send to your endpoint/posthog/sentry-lite  
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent the rejection from crashing the app
  });
}

// --- Global dev guard: shadow legacy localStorage ---
if (typeof window !== 'undefined' && window.location.origin.includes('localhost:3000')) {
  const BAD = new Set([
    // Legacy keys blocked in dev to prevent accidents
    'debtBalances',
    'trysnowball_demo_debts',
  ]);
  const __origGetItem = localStorage.getItem.bind(localStorage);
  localStorage.getItem = (k) => (BAD.has(k) ? null : __origGetItem(k));
  console.log('🛡️ Dev: legacy localStorage keys shadowed');
}

// --- Early auth stub ONLY for the local test route -------------------------
// This must run BEFORE React renders, so any startup auth calls are silenced.
if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dev/local-test')) {
  // Flag for app code (e.g., AuthContext) to bypass network auth
  window.__DISABLE_AUTH__ = true;

  // Monkey-patch fetch to short-circuit any /auth/* requests
  const origFetch = window.fetch;
  window.fetch = (input, init) => {
    try {
      const url = typeof input === 'string'
        ? input
        : (input && input.url) || '';

      if (url.includes('/auth/')) {
        // Minimal OK response for any auth endpoint
        return Promise.resolve(new Response('{"ok":true}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return origFetch(input, init);
    } catch {
      // If something odd happens, fall back to original fetch
      return origFetch(input, init);
    }
  };

  // (Optional) nice console banner so you remember the stub is active
  // eslint-disable-next-line no-console
  console.log('🔧 Auth stub active for /dev/local-test — /auth/* calls are bypassed.');
}

// --- Clear any stale service workers ---------------------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}

// --- DEBUG: Hook eval to catch CSP violations in development -------------
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (function hookEval() {
    const oldEval = window.eval;
    const OldFn = window.Function;
    
    window.eval = function(str) { 
      console.warn('[EVAL DETECTED]', str.slice(0, 120), new Error().stack);
      return oldEval(str); 
    };
    
    window.Function = function(...args) {
      console.warn('[NEW FUNCTION DETECTED]', args[args.length-1]?.slice?.(0, 120), new Error().stack);
      return OldFn.apply(this, args);
    };
  })();
}

// --- Initialize deferred analytics ------------------------------------------
// Start analytics loading after first interaction or idle
const initOnInteraction = () => {
  deferredInit.initAnalytics();
  ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
    document.removeEventListener(event, initOnInteraction, { passive: true });
  });
};

['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
  document.addEventListener(event, initOnInteraction, { passive: true });
});

// --- Initialize CP-1 Data Layer Consolidation -------------------------------
// Initialize the data layer after app renders
setTimeout(async () => {
  try {
    console.log('[DataLayer] Initializing CP-1 Data Layer Consolidation...');
    
    // Try to import migration modules dynamically
    try {
      const { installDeprecationShims } = await import('./migrations/deprecationShims.ts');
      installDeprecationShims();
      console.log('✅ [DataLayer] Deprecation shims installed');
    } catch (shimsError) {
      console.warn('⚠️ [DataLayer] Could not load deprecation shims:', shimsError.message);
    }
    
    try {
      const { runMigrationOnStartup } = await import('./migrations/migrateLegacyData.ts');
      await runMigrationOnStartup();
      console.log('✅ [DataLayer] Migration completed');
    } catch (migrationError) {
      console.warn('⚠️ [DataLayer] Could not run migration:', migrationError.message);
    }
    
    // Set global flag to indicate new system is ready
    window.__DEBT_STORE_V2_READY__ = true;
    
    console.log('🚀 [DataLayer] CP-1 Data Layer Consolidation complete!');
  } catch (error) {
    console.error('❌ [DataLayer] Initialization failed:', error);
    window.__DEBT_STORE_V2_ERROR__ = error;
    
    // Don't prevent app startup - just log the error
    window.__DEBT_STORE_V2_READY__ = true;
  }
}, 100);

// --- Render app -------------------------------------------------------------
console.log('🎬 STARTING REACT APP - index.js executing');
const el = document.getElementById('root');
console.log('🎯 Root element found:', !!el, el);
const root = createRoot(el);
console.log('✅ React root created');

console.log('🚀 RENDERING APP...');
root.render(
  <React.StrictMode>
    <DebtsProvider>
      <UserProvider>
        <BrowserRouter>
          <DemoModeProvider>
            <App />
          </DemoModeProvider>
        </BrowserRouter>
      </UserProvider>
    </DebtsProvider>
  </React.StrictMode>
);
console.log('✅ REACT APP RENDER COMPLETED');