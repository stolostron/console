/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import CompressionPlugin from 'compression-webpack-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import * as path from 'path'
import { rspack } from '@rspack/core'
import type { Configuration } from '@rspack/cli'
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin'
import { MergeJsonLocalesPlugin } from './MergeJsonLocalesPlugin'
import { supportedLanguages } from './src/lib/supportedLanguages'

module.exports = function (env: any, argv: { hot?: boolean; mode: string | undefined }) {
  const isProduction = argv.mode === 'production' || argv.mode === undefined
  const isDevelopment = !isProduction
  const locales = supportedLanguages
  const openBrowser = !env.LAUNCH
  const dummyAI = env.DUMMY_AI
  if (dummyAI) {
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
    console.log('%%%%%%%%% Assisted Installer CANNOT BE USED in Standalone mode  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
    console.log('mock%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
  }
  const useTsChecker = argv.hot || !openBrowser
  const config: Configuration = {
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
        '~': path.resolve(__dirname, 'src'),
        handlebars: 'handlebars/dist/handlebars.js',
        ...(dummyAI && {
          '@openshift-assisted/ui-lib/cim$': path.resolve(__dirname, '__mocks__/@openshift-assisted/dummy.ts'),
        }),
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
          type: 'asset',
          resourceQuery: /url/,
        },
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
          use: isDevelopment ? ['style-loader', 'css-loader'] : [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
          type: 'javascript/auto',
        },
        {
          // Host-console (`@console/*`) components pulled in transitively via the
          // dynamic-plugin-sdk barrel ship SCSS. Standalone stubs the host modules (see the
          // `@console/*` replacement below) but still compiles their style imports.
          test: /\.scss$/,
          use: isDevelopment
            ? ['style-loader', 'css-loader', 'sass-loader']
            : [rspack.CssExtractRspackPlugin.loader, 'css-loader', 'sass-loader'],
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
                  development: isDevelopment,
                  refresh: isDevelopment,
                },
              },
            },
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      // Standalone mode has no OpenShift Console host, so the host-only modules that the
      // dynamic-plugin-sdk barrel reaches (via `useResolvedExtensions` et al.) cannot be
      // resolved. Redirect them to the shared dummy stub — the same module Jest maps
      // `@console/*` to — since standalone never exercises those host features.
      new rspack.NormalModuleReplacementPlugin(/^@console\//, path.resolve(__dirname, '__mocks__/dummy.ts')),
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
        'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
        'process.env.TRANSLATION_NAMESPACE': JSON.stringify('translation'),
        'process.env.DEBUG_EVENT_STREAM_IDLE': JSON.stringify(process.env.DEBUG_EVENT_STREAM_IDLE ?? ''),
      }),
      new MergeJsonLocalesPlugin(
        locales.map((locale) => ({
          files: [
            path.resolve(__dirname, 'public/locales', locale, 'translation.json'),
            path.resolve(__dirname, 'node_modules/@openshift-assisted/locales/lib', locale, 'translation.json'),
          ],
          output: `${isDevelopment ? 'multicloud/' : ''}locales/${locale}/translation.json`,
        }))
      ),
      new rspack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      useTsChecker &&
        new TsCheckerRspackPlugin({
          async: true,
          typescript: {
            // Always use the app tsconfig (`module: esnext`). tsconfig.dev.json is for Jest
            // (`module: commonjs`) and rejects `import.meta` in worker factories.
            configFile: 'tsconfig.json',
            memoryLimit: 8192,
            // tsconfig.json has no `exclude`, so the checker's file watcher would otherwise
            // watch every node_modules .d.ts individually and exhaust file descriptors
            // (EMFILE) on this large tree. The checker still reads node_modules for type
            // resolution — this only keeps those (unchanging) files out of the watch set.
            configOverwrite: {
              exclude: ['node_modules', 'build', 'coverage'],
            },
          },
        }),
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
      isProduction &&
        new rspack.CopyRspackPlugin({
          patterns: [{ from: 'public', globOptions: { ignore: ['**/*.html', '**/translation.json'] } }],
        }),
      isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
      isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
      isDevelopment && new ReactRefreshRspackPlugin(),
      new rspack.HtmlRspackPlugin({ template: './public/index.html' }),
      new rspack.CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[id].[contenthash:8].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
    ].filter(Boolean),
    output: {
      devtoolModuleFilenameTemplate: (info: { absoluteResourcePath: string }) =>
        path.resolve(info.absoluteResourcePath).replaceAll('\\', '/'),
      assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      publicPath: isProduction ? '/multicloud/' : '/',
      path: path.resolve(__dirname, 'build'),
      clean: true,
    },
    devServer: {
      port: process.env.FRONTEND_PORT,
      proxy: [
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
        '/multicloud/multiclusterengine/components',
        '/multicloud/hypershift-status',
        '/multicloud/vmResourceUsage',
        '/multicloud/managedclusterproxy',
        '/multicloud/aws-account-ids',
        '/multicloud/aws-billing-accounts',
        '/multicloud/oidc-configs',
        '/multicloud/regions',
        '/multicloud/cluster-name-check',
        '/multicloud/sts-ocm-role',
        '/multicloud/sts-role-arns',
        '/multicloud/sts-user-role',
        '/multicloud/openshift-versions',
        '/multicloud/vpcs',
        '/multicloud/machine-types',
      ].map((backendPath) => ({
        // `context` is the path matcher for @rspack/dev-server (it maps to http-proxy-middleware
        // v3's `pathFilter`). Using `path` here leaves the filter undefined, which makes the entry
        // match every request — including the HMR `/ws` socket — and the `ws: true` upgrade
        // handler then hijacks live-reload, blanking the page.
        context: backendPath,
        target: `https://localhost:${process.env.BACKEND_PORT}`,
        secure: false,
        // Allow browser WebSocket upgrades (Search graphql-ws, K8s watches) through the proxy.
        ws: true,
      })),
      open: openBrowser,
      historyApiFallback: true,
      compress: true,
      server: {
        type: 'https',
      },
      hot: true,
      static: {
        publicPath: '/multicloud',
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      client: {},
    },
    // devtool: isDevelopment && 'inline-source-map',
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
    // The type-checker (launch / start:hot) feeds the whole TypeScript program — including
    // every node_modules .d.ts — into its file watcher. On this large tree that opens a
    // watch handle per file and exhausts file descriptors (EMFILE). Ignoring node_modules
    // keeps those files readable for type resolution without watching them (they do not
    // change during a dev session). Standalone does not run the workspace-package watchers,
    // and linked workspace packages resolve to real paths under packages/, not node_modules.
    watchOptions: {
      ignored: /[\\/]node_modules[\\/]/,
    },
  }

  return config
}
