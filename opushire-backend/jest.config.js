/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  projects: [
    // ── Unit Tests ──────────────────────────────────────────
    // Fast, no DB, no Redis, no network. Safe to run in CI always.
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      clearMocks: true,
      silent: false,
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            diagnostics: {
              ignoreCodes: ['TS2345', 'TS2322', 'TS2352', 'TS7006', 'TS7031']
            }
          }
        ]
      },
    },
    // ── Integration Tests ───────────────────────────────────
    // Requires TEST_MONGODB_URI pointing to a _test database.
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/workers/**/*.test.ts',
        '<rootDir>/tests/*.test.ts',
      ],
      clearMocks: true,
      silent: false,
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            diagnostics: {
              ignoreCodes: ['TS2345', 'TS2322', 'TS2352', 'TS7006', 'TS7031']
            }
          }
        ]
      },
      setupFilesAfterEnv: ['./tests/setup.ts'],
    },
  ],
};
