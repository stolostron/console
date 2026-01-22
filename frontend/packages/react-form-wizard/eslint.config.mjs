/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from 'eslint/config'
import { fixupPluginRules } from '@eslint/compat'
import stolostronConfig from '@stolostron/eslint-config'
import i18nJson from 'eslint-plugin-i18n-json'

export default defineConfig([
  {
    extends: [stolostronConfig],
  },
  {
    // Add i18n-json plugin for this package
    plugins: {
      'i18n-json': fixupPluginRules(i18nJson),
    },

    rules: {
      // Package-specific rules
      'no-console': 'error',

      // i18n-json recommended rules
      'i18n-json/valid-message-syntax': 'error',
      'i18n-json/valid-json': 'error',
      'i18n-json/sorted-keys': 'off',
      'i18n-json/identical-keys': 'off',
    },
  },
])
