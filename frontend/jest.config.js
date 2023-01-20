/* Copyright Contributors to the Open Cluster Management project */

module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jsdom',
    automock: false,
    testResultsProcessor: 'jest-sonar-reporter',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(svg)$': '<rootDir>/src/svg.mock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/file.mock.js',
        '\\.(css|less)$': 'identity-obj-proxy',
        'monaco-editor': '<rootDir>/node_modules/react-monaco-editor',
    },
    watchPathIgnorePatterns: ['<rootDir>/../node_modules', '<rootDir>/../.eslintcache', '<rootDir>/../coverage'],
    moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.hbs$': 'jest-raw-loader',
        '\\.(css|less)$': 'jest-raw-loader',
    },
    transformIgnorePatterns: [
        'node_modules/(?!d3-interpolate|d3-color|react-monaco-editor|openshift-assisted-ui-lib|@patternfly-labs/react-form-wizard|@patternfly/react-tokens)',
    ],
    coverageDirectory: './coverage',
    coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
    collectCoverageFrom: [
        '<rootDir>/src/**/*.{tsx,ts,jsx,js}',
        '<rootDir>/src/*.{tsx,ts,jsx,js}',
        '!<rootDir>/src/**/*.test.{tsx,ts,jsx,js}',
        '!<rootDir>/src/*.test.{tsx,ts,jsx,js}',
        '!<rootDir>/node_modules/**',
    ],
    verbose: true,
    bail: false,
}
