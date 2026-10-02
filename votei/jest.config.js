/**
 * ts-jest over the App Router source. `jsdom` is the default environment so
 * component tests work out of the box; a pure-node suite can opt out with a
 * `@jest-environment node` docblock at the top of the file.
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      // rootDir pins the project root explicitly: ts-jest compiles files one at a
      // time, so TypeScript would otherwise infer it from the single file under
      // compilation and fail with TS5011.
      { tsconfig: { rootDir: '.', jsx: 'react-jsx' } },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
