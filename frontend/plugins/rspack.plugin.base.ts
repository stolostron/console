/* Copyright Contributors to the Open Cluster Management project */

import CompressionPlugin from 'compression-webpack-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import path from 'path'
import { rspack } from '@rspack/core'
import type { Configuration } from '@rspack/cli'
import { MergeJsonLocalesPlugin } from '../MergeJsonLocalesPlugin'
import { supportedLanguages } from '../src/lib/supportedLanguages'

module.exports = function (env: any, argv: { hot?: boolean; mode: string | undefined }) {
  const isProduction = argv.mode === 'production'
  const isDevelopment = !isProduction
  const locales = supportedLanguages
  const config: Configuration = {
    entry: {},
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('node-util'),
        process: require.resolve('process/browser'),
        vm: require.resolve('vm-browserify'),
      },
      alias: {
        '~': path.resolve(__dirname, '../src'),
        handlebars: 'handlebars/dist/handlebars.js',
        // Force all @patternfly/react-core imports to use the main frontend version
        // This prevents duplicate versions from linked workspace packages like multicluster-sdk
        '@patternfly/react-core': path.resolve(__dirname, '../node_modules/@patternfly/react-core'),
        '@patternfly/react-styles': path.resolve(__dirname, '../node_modules/@patternfly/react-styles'),
        '@patternfly/react-icons': path.resolve(__dirname, '../node_modules/@patternfly/react-icons'),
      },
    },
    module: {
      // Match webpack's leniency: a named import that a (CommonJS) dependency does not export
      // is a warning, not a hard error. Some app code imports symbols that are not part of a
      // dependency's public barrel (e.g. getClusterNameOfAgent from @openshift-assisted/ui-lib/cim);
      // webpack left these as `undefined` at runtime, while rspack otherwise fails the build and
      // blocks the dev overlay.
      parser: {
        javascript: {
          exportsPresence: 'warn',
        },
      },
      rules: [
        { test: /\.(hbs|yaml)$/, type: 'asset/source' },
        {
          test: /\.(svg)$/i,
          type: 'asset',
          resourceQuery: /url/, // *.svg?url  see https://react-svgr.com/docs/webpack/#use-svgr-and-asset-svg-in-the-same-project
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: [/url/] }, // exlcude react component if *.svg?url
          use: ['@svgr/webpack'],
        },
        { test: /\.(jpg|jpeg|png|gif|ttf|eot|woff|woff2)$/, type: 'asset/resource' },
        {
          test: /\.css$/,
          exclude: /node_modules\/@patternfly/,
          use: isDevelopment ? ['style-loader', 'css-loader'] : [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
          type: 'javascript/auto',
        },
        {
          test: /\.css$/,
          include: /node_modules\/@patternfly/,
          loader: 'null-loader',
          type: 'javascript/auto',
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: {
                  runtime: 'automatic',
                  // Always emit the production automatic runtime (react/jsx-runtime), never the
                  // dev runtime (react/jsx-dev-runtime). In a Console plugin, `react` is a shared
                  // host-provided module that exposes jsx/jsxs but not jsxDEV; builtin:swc-loader
                  // otherwise defaults `development` to true in dev mode, yielding
                  // "jsxDEV is not a function" at runtime. This matches the original ts-loader
                  // (tsconfig `jsx: react-jsx`) behavior.
                  development: false,
                },
              },
            },
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new rspack.NormalModuleReplacementPlugin(/media\/suggest\.css$/, path.resolve(__dirname, '../src/empty.css')),
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
        'process.env.MODE': JSON.stringify('plugin'),
        'process.env.PLUGIN_PROXY_PATH': JSON.stringify(`/api/proxy/plugin/${env.plugin}/console`),
        'process.env.TRANSLATION_NAMESPACE': JSON.stringify(`plugin__${env.plugin}`),
        'process.env.DEBUG_EVENT_STREAM_IDLE': JSON.stringify(process.env.DEBUG_EVENT_STREAM_IDLE ?? ''),
      }),
      new rspack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      new MonacoWebpackPlugin({
        languages: ['yaml'],
        customLanguages: [
          {
            label: 'yaml',
            entry: 'monaco-yaml',
            worker: {
              id: 'monaco-yaml/yamlWorker',
              entry: 'monaco-yaml/yaml.worker',
            },
          },
        ],
      }),
      new rspack.CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[id].[contenthash:8].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      new MergeJsonLocalesPlugin(
        locales.map((locale) => ({
          files: [
            path.resolve(__dirname, '../public/locales', locale, 'translation.json'),
            path.resolve(__dirname, '../node_modules/@openshift-assisted/locales/lib', locale, 'translation.json'),
          ],
          output: `locales/${locale}/plugin__${env.plugin}.json`,
        }))
      ),
      isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
      isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
    ].filter(Boolean),
    output: {
      devtoolModuleFilenameTemplate: (info: { absoluteResourcePath: string }) =>
        path.resolve(info.absoluteResourcePath).replaceAll('\\', '/'),
      assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      clean: true,
    },
    devServer: {
      static: './dist',
      port: env.port,
      // Allow bridge running in a container to connect to the plugin dev server.
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
      devMiddleware: {
        writeToDisk: true,
      },
      compress: true,
      hot: true,
      client: {
        overlay: {
          warnings: false,
          errors: true,
          // OpenShift console CSP dedupe does `new URL(blockedURI)`. Non-URL tokens
          // ("", "inline", "eval", …) throw TypeError and the webpack overlay hijacks the UI.
          // Hide that host-console bug so local plugin pages remain usable.
          runtimeErrors: (error: Error) => {
            const message = error?.message ?? ''
            if (message.includes("Failed to construct 'URL'")) {
              return false
            }
            return true
          },
        },
      },
    },
    devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
  }
  return config
}
