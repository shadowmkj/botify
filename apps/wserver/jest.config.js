const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  displayName: "wserver",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    '^@repo/types$': '<rootDir>/../../packages/types/types.ts',
    '^@repo/db$': '<rootDir>/../../packages/db/index.ts',
    '^@repo/redis$': '<rootDir>/../../packages/redis/redis.ts',
  },
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
};
