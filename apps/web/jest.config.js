module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/actions/(.*)$': '<rootDir>/actions/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
