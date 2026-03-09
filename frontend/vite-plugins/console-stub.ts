/* Copyright Contributors to the Open Cluster Management project */

import path from 'path'
import type { Plugin } from 'vite'

/**
 * Resolves @console/shared and @console/internal to a stub module for standalone build.
 * These packages are provided by the OpenShift Console when running as a plugin.
 */
export function consoleStubPlugin(): Plugin {
  let stubPath: string
  return {
    name: 'console-stub',
    enforce: 'pre',
    configResolved(config) {
      stubPath = path.resolve(config.root, 'src', 'stubs', 'console-shared.ts')
    },
    resolveId(id) {
      if (id.startsWith('@console/shared') || id.startsWith('@console/internal')) {
        return stubPath
      }
      return null
    },
  }
}
