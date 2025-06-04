/* Copyright Contributors to the Open Cluster Management project */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    projectService: true,
    tsconfigRootDir: '../..',
  },
  extends: [
    'eslint:recommended',
    "plugin:@typescript-eslint/recommended",
    'plugin:jest/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'jest', 'react-hooks', 'prettier', 'jsx-a11y'],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/no-floating-promises': [
      'off',
      {
        ignoreVoid: true,
      },
    ],
    "@typescript-eslint/no-misused-promises": [
        "error",
        {
          "checksVoidReturn": false
        }
      ],
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        paths: [
          {
            message:
              'Please use <Trans /> and useTranslation() from ./src/lib/acm-i18next and avoid other exports from react-i18next',
            name: 'react-i18next',
            importNames: ['Trans', 'useTranslation'],
          },
          {
            message: 'Please use hooks from ./src/shared-recoil for ACM/MCE dynamic plugins common RecoilRoot',
            name: 'recoil',
          },
          {
            message:
              'Please use hooks from ./src/hooks/shared-react-query for ACM/MCE dynamic plugins common QueryClientProvider',
            name: '@tanstack/react-query',
          },
          {
            message: 'Truncate component is not available on OpenShift 4.10; use src/components/Trucate instead',
            name: '@patternfly/react-core',
            importNames: ['Truncate'],
          },
        ],
        patterns: [
          {
            message:
              'Please use useSharedAtoms() or useSharedSelectors() from ./src/shared-recoil to access atoms/selectors for ACM/MCE dynamic plugins common RecoilRoot',
            group: ['**/atoms', '**/selectors'],
          },
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
      },
    ],
    'jest/expect-expect': 'off',
    'jest/no-disabled-tests': 'off',
    'jest/no-export': 'off',
    'jest/no-identical-title': 'off',
    'no-async-promise-executor': 'off',
    'no-constant-condition': 'off',
    'no-empty': 'off',
    'prettier/prettier': 'error',
    'react/jsx-key': 1,
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts?'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
}
