/* Copyright Contributors to the Open Cluster Management project */

import type { Plugin } from 'vite'
import { transformWithEsbuild } from 'vite'

/**
 * Transforms .js files that contain JSX so that Vite/Rollup can parse them.
 * The React plugin skips Babel transform in production for non-JSX extensions,
 * so .js files with JSX need to be transformed by this plugin.
 */
export function jsxInJsPlugin(): Plugin {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.js') || id.includes('node_modules')) return null
      if (!/<[A-Za-z][\w.]*[\s/>]/.test(code) && !/<\/[A-Za-z]/.test(code)) return null
      const result = await transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'react',
      })
      return { code: result.code, map: result.map }
    },
  }
}
