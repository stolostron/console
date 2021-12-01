/* Copyright Contributors to the Open Cluster Management project */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    automock: false,
    rootDir: './src',
    testResultsProcessor: 'jest-sonar-reporter',
    setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/file.mock.js',
        '\\.(css|less)$': 'identity-obj-proxy',
        'monaco-editor': '<rootDir>/../node_modules/react-monaco-editor',
    },
    watchPathIgnorePatterns: ['<rootDir>/../node_modules', '<rootDir>/../.eslintcache', '<rootDir>/../coverage'],
    moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.hbs$': 'jest-raw-loader',
        '\\.(css|less)$': 'jest-raw-loader',
    },
    transformIgnorePatterns: ['node_modules/(?!d3-interpolate|d3-color|react-monaco-editor|openshift-assisted-ui-lib)'],
    coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
    bail: true,
}
