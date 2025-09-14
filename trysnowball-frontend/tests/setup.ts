/**
 * Deterministic Test Setup
 * Ensures reproducible test results with pinned seeds and controlled environment
 */

// Pin fast-check random seed for reproducible property tests
try {
  const fc = require('fast-check');
  fc.configureGlobal({ 
    numRuns: 200, 
    seed: 12345,
    verbose: false,
    asyncReporter: undefined
  });
} catch {
  // eslint-disable-next-line no-console
  console.log('fast-check not available for global configuration');
}

// Provide minimal browser shims if not in jsdom
if (typeof (globalThis as any).navigator === 'undefined') {
  (globalThis as any).navigator = { language: 'en-US' };
} else {
  try {
    Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true });
  } catch { /* ignore if already defined/readonly */ }
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {} as any;
}

// Set deterministic timezone for all tests
process.env.TZ = 'UTC';

// Mock Date consistently
const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');
jest.useFakeTimers();
jest.setSystemTime(FIXED_DATE);

// Mock random for deterministic test outcomes
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.123456789); // Fixed seed
global.Math = mockMath;

// Console cleanup for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress known React warnings in tests
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  jest.useRealTimers();
});