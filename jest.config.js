module.exports = {
  projects: [
    '<rootDir>/apps/web/jest.config.js',
    '<rootDir>/apps/socket/jest.config.js',
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
