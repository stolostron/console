/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from 'eslint/config'
import stolostronConfig from '@stolostron/eslint-config'

export default defineConfig([
  {
    extends: [stolostronConfig],
  },
  {
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
