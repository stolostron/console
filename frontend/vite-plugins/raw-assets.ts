/* Copyright Contributors to the Open Cluster Management project */

import * as fs from 'fs'
import type { Plugin } from 'vite'

const RAW_EXT = /\.(hbs|yaml)$/

/**
 * Loads .hbs and .yaml files as raw string (default export).
 * Matches Webpack's type: 'asset/source' for these extensions.
 */
export function rawAssetsPlugin(): Plugin {
  return {
    name: 'raw-assets',
    load(id) {
      if (!RAW_EXT.test(id)) return null
      const code = fs.readFileSync(id, 'utf-8')
      return `export default ${JSON.stringify(code)}`
    },
  }
}
