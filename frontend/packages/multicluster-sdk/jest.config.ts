/* Copyright Contributors to the Open Cluster Management project */

import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  testResultsProcessor: 'jest-sonar-reporter',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/file.mock.js',
    '@console/*': '<rootDir>/__mocks__/sdk-dummy.ts',
  },
  watchAll: false,
  slowTestThreshold: 30,
  watchPathIgnorePatterns: ['<rootDir>/../node_modules', '<rootDir>/../.eslintcache', '<rootDir>/../coverage'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx', 'css'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.dev.json',
      },
    ],
    '^.+\\.yaml?$': '<rootDir>/jest-raw-loader.js',
    // '^.+\\.hbs$': 'jest-raw-loader',
    '^.+\\.hbs$': '<rootDir>/jest-raw-loader.js',
    // '\\.(css|less)$': 'jest-raw-loader',
    '\\.(css|less|scss)$': '<rootDir>/jest-raw-loader.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!d3*|internmap|robust-predicates|react-monaco-editor|@openshift-assisted|lodash-es|@patternfly/react-tokens|@patternfly/react-icons|@patternfly/react-user-feedback|@patternfly/react-icons|@patternfly-labs/react-form-wizard|@juggle/resize-observer|@react-hook/*|uuid|@openshift-console/dynamic-plugin-sdk*|screenfull)',
  ],
  ci: true,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text-summary', 'html', ['lcov', { projectRoot: '../' }]],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{tsx,ts,jsx,js}',
    '<rootDir>/src/*.{tsx,ts,jsx,js}',
    '!<rootDir>/src/**/*.test.{tsx,ts,jsx,js}',
    '!<rootDir>/src/*.test.{tsx,ts,jsx,js}',
    '!<rootDir>/node_modules/**',
  ],
  reporters: ['default'],
  verbose: true,
  bail: false,
}

export default config
