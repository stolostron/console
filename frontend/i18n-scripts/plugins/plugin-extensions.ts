/* Copyright Contributors to the Open Cluster Management project */
import type { Plugin, ExtractedKeysMap } from 'i18next-cli'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * i18next-cli plugin that extracts translation keys from console-extensions.ts files.
 *
 * These files use a custom `%namespace~key%` pattern to reference translation keys
 * in OpenShift Console dynamic plugin extension definitions.
 *
 * Example pattern: `%plugin__acm~Some translatable string%`
 * Extracted key: `Some translatable string` in namespace `translation`
 */

function findConsoleExtensionsFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findConsoleExtensionsFiles(fullPath))
    } else if (entry.name === 'console-extensions.ts') {
      results.push(fullPath)
    }
  }
  return results
}

export const pluginExtensionsPlugin = (): Plugin => ({
  name: 'plugin-extensions',

  onEnd: async (keys: ExtractedKeysMap) => {
    const files = findConsoleExtensionsFiles('plugins')
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const matches = line.matchAll(/%[^~%]+~([^~%]+)%/g)
        for (const match of matches) {
          const key = match[1]
          keys.set(`translation:${key}`, { key, ns: 'translation', defaultValue: key })
        }
      }
    }
  },
})
