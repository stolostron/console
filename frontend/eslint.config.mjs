import { defineConfig } from 'eslint/config'
import stolostronConfig from '@stolostron/eslint-config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig([
  {
    extends: [stolostronConfig],
  },
  {
    // Project-specific TypeScript configuration
    files: ['src/**/*.{ts,tsx}'],

    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
])
