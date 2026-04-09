/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // All tests live in src/tests/ — isolated from source code
    roots: ['<rootDir>/src/tests'],
    testMatch: ['**/*.test.ts'],

    moduleFileExtensions: ['ts', 'js', 'json'],

    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: './tsconfig.test.json',
        }],
    },

    // No real network/DB — all tests must mock external deps
    testTimeout: 10000,
    clearMocks: true,

    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/tests/**',
        '!src/cli.ts',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
