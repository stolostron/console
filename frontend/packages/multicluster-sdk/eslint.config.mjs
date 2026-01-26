/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from 'eslint/config'
import stolostronConfig from '@stolostron/eslint-config'

export default defineConfig([
  {
    extends: [stolostronConfig],
  },
])
