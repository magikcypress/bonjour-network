module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.js',
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/client/'
    ],
    collectCoverageFrom: [
        'server/**/*.js',
        '!server/node_modules/**',
        '!server/tests/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: [],
    testTimeout: 30000,
    verbose: true
}; 