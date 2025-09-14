/**
 * Golden Master Test Setup
 * Ensures snapshot consistency by controlling dates, locale, and environment
 */

// Force UTC timezone to prevent locale-based snapshot churn
process.env.TZ = 'UTC';

// Pin date for consistent snapshots
const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');
jest.useFakeTimers();
jest.setSystemTime(FIXED_DATE);

// Override Date constructor for any direct Date() calls in code under test
const OriginalDate = Date;
const MockDate = class extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(FIXED_DATE.getTime());
    } else {
      super(...args);
    }
  }
  
  static now() {
    return FIXED_DATE.getTime();
  }
  
  static parse = OriginalDate.parse;
  static UTC = OriginalDate.UTC;
};

// Copy static methods and prototype safely
Object.setPrototypeOf(MockDate, OriginalDate);
Object.setPrototypeOf(MockDate.prototype, OriginalDate.prototype);
(global as any).Date = MockDate;

// Ensure consistent locale formatting
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US'
});

Object.defineProperty(navigator, 'languages', {
  writable: true,
  value: ['en-US', 'en']
});

// Mock Intl for consistent number/date formatting in snapshots
const mockNumberFormat = {
  format: (num: number) => num.toLocaleString('en-US'),
  formatToParts: (num: number) => [{ type: 'integer', value: num.toString() }],
};

const mockDateTimeFormat = {
  format: (date: Date) => date.toISOString().split('T')[0], // YYYY-MM-DD
  formatToParts: (date: Date) => [
    { type: 'year', value: date.getUTCFullYear().toString() },
    { type: 'literal', value: '-' },
    { type: 'month', value: (date.getUTCMonth() + 1).toString().padStart(2, '0') },
    { type: 'literal', value: '-' },
    { type: 'day', value: date.getUTCDate().toString().padStart(2, '0') }
  ]
};

(global as any).Intl = {
  NumberFormat: jest.fn().mockImplementation(() => mockNumberFormat),
  DateTimeFormat: jest.fn().mockImplementation(() => mockDateTimeFormat),
  supportedValuesOf: jest.fn().mockReturnValue([]),
  getCanonicalLocales: jest.fn().mockReturnValue(['en-US']),
};

// Mock performance.now for consistent timing in snapshots
Object.defineProperty(performance, 'now', {
  writable: true,
  value: jest.fn(() => 1000) // Fixed 1 second
});

// Clean up after tests
afterAll(() => {
  jest.useRealTimers();
  (global as any).Date = OriginalDate;
});