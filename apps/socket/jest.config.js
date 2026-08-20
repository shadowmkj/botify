module.exports = {
  displayName: 'socket',
  testEnvironment: 'node',
  transform: {
    '^.+\.ts?$': 'ts-jest',
  },
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
};
