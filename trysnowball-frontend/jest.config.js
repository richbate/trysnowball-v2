module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/test/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1'
  },
};