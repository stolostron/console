/* Copyright Contributors to the Open Cluster Management project */

import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import viteCompression from 'vite-plugin-compression'
import { mergeLocalesPlugin } from './vite-plugins/merge-locales'
import { jsxInJsPlugin } from './vite-plugins/jsx-in-js'
import { rawAssetsPlugin } from './vite-plugins/raw-assets'
import { consoleStubPlugin } from './vite-plugins/console-stub'

const BACKEND_PROXY_PATHS = [
  '/multicloud/ansibletower',
  '/multicloud/api',
  '/multicloud/apis',
  '/multicloud/authenticated',
  '/multicloud/common',
  '/multicloud/configure',
  '/multicloud/console-links',
  '/multicloud/events',
  '/multicloud/hub',
  '/multicloud/upgrade-risks-prediction',
  '/multicloud/login',
  '/multicloud/logout',
  '/multicloud/observability',
  '/multicloud/operatorCheck',
  '/multicloud/prometheus',
  '/multicloud/proxy/search',
  '/multicloud/aggregate',
  '/multicloud/username',
  '/multicloud/userpreference',
  '/multicloud/version',
  '/multicloud/virtualmachines',
  '/multicloud/virtualmachineinstances',
  '/multicloud/virtualmachinesnapshots',
  '/multicloud/virtualmachinerestores',
  '/multicloud/multiclusterhub/components',
  '/multicloud/vmResourceUsage',
  '/multicloud/managedclusterproxy',
]

const backendPort = process.env.BACKEND_PORT ?? '4000'
const frontendPort = process.env.FRONTEND_PORT ?? '3000'
const dummyAI = process.env.DUMMY_AI === 'true' || process.env.DUMMY_AI === '1' || process.env.DUMMY_AI === 'yes'

function buildProxy(): Record<string, { target: string; secure: boolean }> {
  const target = `https://localhost:${backendPort}`
  const entries = BACKEND_PROXY_PATHS.map((p) => [p, { target, secure: false }])
  return Object.fromEntries(entries)
}

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  return {
    base: '/multicloud/',
    root: __dirname,
    publicDir: 'public',
    build: {
      outDir: 'build',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        handlebars: 'handlebars/dist/handlebars.js',
        ...(dummyAI && {
          '@openshift-assisted/ui-lib/cim': path.resolve(__dirname, '__mocks__/@openshift-assisted/dummy.ts'),
        }),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
      'process.env.TRANSLATION_NAMESPACE': JSON.stringify('translation'),
    },
    plugins: [
      consoleStubPlugin(),
      rawAssetsPlugin(),
      jsxInJsPlugin(),
      nodePolyfills({
        include: ['path', 'buffer', 'stream', 'util', 'process', 'vm'],
        globals: { Buffer: true, process: true },
      }),
      react({
        include: /\.(jsx?|tsx?)$/,
      }),
      svgr({
        include: '**/*.svg',
        exclude: '**/*.svg?url',
      }),
      monacoEditorPlugin({ languageWorkers: ['editorWorkerService'] }),
      mergeLocalesPlugin(),
      isProduction && viteCompression({ algorithm: 'gzip', ext: '.gz' }),
      isProduction && viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    ].filter(Boolean),
    server: {
      port: Number(frontendPort),
      strictPort: true,
      https: {
        key: fs.readFileSync(path.resolve(__dirname, '..', 'backend', 'certs', 'tls.key')),
        cert: fs.readFileSync(path.resolve(__dirname, '..', 'backend', 'certs', 'tls.crt')),
      },
      open: process.env.LAUNCH ? false : '/multicloud/',
      proxy: buildProxy(),
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
    },
    css: {
      devSourcemap: true,
    },
  }
})
