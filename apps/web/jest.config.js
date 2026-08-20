module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@repo/types$': '<rootDir>/../../packages/types/types.ts',
    '^@repo/db$': '<rootDir>/../../packages/db/index.ts',
    '^@repo/redis$': '<rootDir>/../../packages/redis/redis.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'actions/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
