/**
 * Quarantine Test Setup
 * More lenient configuration for flaky tests
 */

// Extend global timeout for flaky tests
jest.setTimeout(30000);

// Add test retry capability
const originalIt = global.it;
global.it = (name, fn, timeout) => {
  return originalIt(name, async () => {
    let lastError;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        if (fn) await fn();
        return; // Success
      } catch (error) {
        lastError = error;
        if (attempts < maxAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`Retrying test "${name}" (attempt ${attempts + 1}/${maxAttempts})`);
        }
      }
    }
    
    // All retries failed
    throw lastError;
  }, timeout);
};

// More lenient console suppression
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress expected errors in quarantine tests
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') || 
       message.includes('React does not recognize') ||
       message.includes('findDOMNode is deprecated'))
    ) {
      return; // Suppress
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps') ||
       message.includes('componentWillMount'))
    ) {
      return; // Suppress
    }
    originalConsoleWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});