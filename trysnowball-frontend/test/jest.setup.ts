import '@testing-library/jest-dom';

// Guard PostHog to avoid ReferenceErrors in jsdom
Object.defineProperty(window, 'posthog', {
  value: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
  writable: true
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});