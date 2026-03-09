/* Copyright Contributors to the Open Cluster Management project */

import path from 'path'
import type { Plugin } from 'vite'

const STUB_PATH = path.resolve(__dirname, '../src/stubs/console-shared.ts')

/**
 * Resolves @console/shared and @console/internal to a stub module for standalone build.
 * These packages are provided by the OpenShift Console when running as a plugin.
 */
export function consoleStubPlugin(): Plugin {
  return {
    name: 'console-stub',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('@console/shared') || id.startsWith('@console/internal')) {
        return STUB_PATH
      }
      return null
    },
  }
}
