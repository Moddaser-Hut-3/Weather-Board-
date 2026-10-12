module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts'
    ],
    testTimeout: 15000,
    forceExit: true,
    maxWorkers: 1
};