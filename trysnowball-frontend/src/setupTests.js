// src/setupTests.js
// Extend Testing Library matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Silence noisy console logs in CI
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore?.();
  console.warn.mockRestore?.();
});

// Quiet noisy React errors in tests (optional; keep if you already had similar)
const origError = console.error;
console.error = (...args) => {
  // Allow explicit test failures to still show up
  const msg = (args && args[0]) || '';
  if (
    typeof msg === 'string' &&
    (msg.includes('Warning: React') ||
     msg.includes('Warning: Failed') ||
     msg.includes('act(...)') )
  ) {
    return;
  }
  origError(...args);
};

// ---- Polyfills for Node/Jest environment ----

// structuredClone (used by fake-indexeddb on some versions)
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) =>
    obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
}

// crypto.randomUUID (used by localDebtManager)
if (!global.crypto || typeof global.crypto.randomUUID !== 'function') {
  try {
    // Node 14/16+: use crypto module if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomUUID } = require('crypto');
    global.crypto = { ...(global.crypto || {}), randomUUID };
  } catch {
    // Fallback UUID v4-ish
    const fallbackUUID = () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    global.crypto = { ...(global.crypto || {}), randomUUID: fallbackUUID };
  }
}

// (Optional) matchMedia mock (if any component queries it)
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}