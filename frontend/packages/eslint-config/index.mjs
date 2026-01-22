/* Copyright Contributors to the Open Cluster Management project */
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'
import jsxA11Y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import i18nJson from 'eslint-plugin-i18n-json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

/**
 * Shared ESLint configuration for stolostron projects.
 * This exports a flat config array that can be used with ESLint's `extends`.
 */
export default [
  {
    ignores: ['**/*.json'],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:jest/recommended',
      'plugin:react-hooks/recommended',
      'prettier',
      'plugin:jsx-a11y/recommended'
    )
  ),
  {
    plugins: {
      react,
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      jest: fixupPluginRules(jest),
      'react-hooks': fixupPluginRules(reactHooks),
      prettier,
      'jsx-a11y': fixupPluginRules(jsxA11Y),
      'i18n-json': fixupPluginRules(i18nJson),
    },

    languageOptions: {
      globals: {
        console: false,
        Buffer: false,
        document: false,
        localStorage: false,
        navigator: false,
        sessionStorage: false,
        setTimeout: false,
        clearTimeout: false,
        window: false,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        projectService: true,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
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

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
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
  },
  {
    files: ['**/*.test.ts?'],

    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
]
