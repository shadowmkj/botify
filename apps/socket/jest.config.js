module.exports = {
  displayName: 'socket',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@repo/types$': '<rootDir>/../../packages/types/types.ts',
    '^@repo/db$': '<rootDir>/../../packages/db/index.ts',
    '^@repo/redis$': '<rootDir>/../../packages/redis/redis.ts',
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
