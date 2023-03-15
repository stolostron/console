/* Copyright Contributors to the Open Cluster Management project */

import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  automock: false,
  clearMocks: true,
  onlyChanged: false,
  testResultsProcessor: 'jest-sonar-reporter',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(svg)$': '<rootDir>/src/svg.mock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/file.mock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
    '@patternfly/react-topology': '<rootDir>/node_modules/@patternfly/react-topology',
    'monaco-editor': '<rootDir>/node_modules/react-monaco-editor',
    '@console/*': '<rootDir>/__mocks__/dummy.ts',
  },
  watchAll: false,
  slowTestThreshold: 30,
  watchPathIgnorePatterns: ['<rootDir>/../node_modules', '<rootDir>/../.eslintcache', '<rootDir>/../coverage'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.dev.json',
    },
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
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
    'node_modules/(?!d3-interpolate|d3-color|react-monaco-editor|openshift-assisted-ui-lib|@patternfly/react-tokens|@patternfly-labs/react-form-wizard|@juggle/resize-observer|@react-hook/*|uuid|@openshift-console/dynamic-plugin-sdk*|screenfull)',
  ],
  ci: true,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text-summary', 'html', ['lcov', { projectRoot: '../' }]],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{tsx,ts,jsx,js}',
    '<rootDir>/src/*.{tsx,ts,jsx,js}',
    '!<rootDir>/src/**/*.stories.tsx',
    '!<rootDir>/src/ui-components/**/index.ts',
    '!<rootDir>/src/**/*.test.{tsx,ts,jsx,js}',
    '!<rootDir>/src/*.test.{tsx,ts,jsx,js}',
    '!<rootDir>/node_modules/**',
  ],
  reporters: ['default'],
  verbose: true,
  bail: false,
}

export default config
