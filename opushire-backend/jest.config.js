/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  silent: false,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Disable type-checking diagnostics in test files only.
        // Production code is still fully type-checked by `tsc --noEmit`.
        diagnostics: {
          ignoreCodes: ['TS2345', 'TS2322', 'TS2352', 'TS7006', 'TS7031']
        }
      }
    ]
  },
  setupFilesAfterEnv: ['./tests/setup.ts']
};
