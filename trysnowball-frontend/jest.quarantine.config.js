/**
 * Jest Configuration for Quarantined Tests
 * Runs flaky tests separately so they don't block CI
 */

module.exports = {
  // Base configuration (inherit from main)
  ...require('./package.json').jest,
  
  // Override settings for quarantine
  displayName: {
    name: 'QUARANTINE',
    color: 'yellow'
  },
  
  // Only run quarantined tests
  testMatch: [
    '<rootDir>/tests/quarantine/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/*.quarantine.test.{js,ts,tsx}'
  ],
  
  // More lenient settings for flaky tests
  testTimeout: 30000, // 30 seconds vs 20 seconds
  maxWorkers: 1, // Run sequentially to avoid race conditions
  
  // Different reporters for quarantine
  reporters: [
    'default',
    ['jest-junit', { 
      outputDirectory: 'reports', 
      outputName: 'junit-quarantine.xml',
      suiteName: 'Quarantine Tests'
    }]
  ],
  
  // Disable coverage for quarantine tests
  collectCoverage: false,
  
  // Allow more retries for flaky tests
  setupFilesAfterEnv: ['<rootDir>/tests/quarantine/setup.ts'],
  
  // Separate cache for quarantine
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-quarantine'
};