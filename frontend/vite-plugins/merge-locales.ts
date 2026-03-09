/* Copyright Contributors to the Open Cluster Management project */

import * as fs from 'fs'
import * as path from 'path'
import type { Plugin } from 'vite'

const SUPPORTED_LANGUAGES = ['en', 'ja', 'ko', 'zh', 'fr', 'es']

function loadJson(filePath: string): Record<string, unknown> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return {}
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const t = result[key]
    const s = source[key]
    if (
      t != null &&
      s != null &&
      typeof t === 'object' &&
      typeof s === 'object' &&
      !Array.isArray(t) &&
      !Array.isArray(s)
    ) {
      result[key] = deepMerge(
        t as Record<string, unknown>,
        s as Record<string, unknown>
      )
    } else {
      result[key] = s
    }
  }
  return result
}

function mergeLocaleFiles(
  rootDir: string,
  locale: string
): Record<string, unknown> {
  const projectPath = path.join(
    rootDir,
    'public',
    'locales',
    locale,
    'translation.json'
  )
  const assistedPath = path.join(
    rootDir,
    'node_modules',
    '@openshift-assisted',
    'locales',
    'lib',
    locale,
    'translation.json'
  )
  const project = loadJson(projectPath)
  const assisted = loadJson(assistedPath)
  return deepMerge(project, assisted)
}

export function mergeLocalesPlugin(): Plugin {
  let rootDir: string
  const merged = new Map<string, Record<string, unknown>>()

  return {
    name: 'merge-locales',
    configResolved(config) {
      rootDir = config.root
      for (const locale of SUPPORTED_LANGUAGES) {
        merged.set(locale, mergeLocaleFiles(rootDir, locale))
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/multicloud\/locales\/([^/]+)\/(.+)\.json$/)
        if (!match) {
          next()
          return
        }
        const [, lng, ns] = match
        if (ns !== 'translation' || !merged.has(lng)) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(merged.get(lng), null, 4))
      })
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir
      if (!outDir) return
      const localesDir = path.join(outDir, 'locales')
      for (const locale of SUPPORTED_LANGUAGES) {
        const localeDir = path.join(localesDir, locale)
        fs.mkdirSync(localeDir, { recursive: true })
        const data = merged.get(locale) ?? mergeLocaleFiles(rootDir, locale)
        fs.writeFileSync(
          path.join(localeDir, 'translation.json'),
          JSON.stringify(data, null, 4)
        )
      }
    },
  }
}
