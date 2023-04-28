/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import CompressionPlugin from 'compression-webpack-plugin'
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'
import MergeJsonWebpackPlugin from 'merge-jsons-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import webpack from 'webpack'
import { supportedLanguages } from './src/lib/supportedLanguages'

module.exports = function (env: any, argv: { hot?: boolean; mode: string | undefined }) {
  const isProduction = argv.mode === 'production' || argv.mode === undefined
  const isDevelopment = !isProduction
  const locales = supportedLanguages
  const config: webpack.Configuration & { devServer: DevServerConfiguration } = {
    entry: {},
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        fs: require.resolve('browserify-fs'),
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('node-util'),
        crypto: require.resolve('crypto-browserify'),
        process: require.resolve('process/browser'),
      },
      alias: {
        handlebars: 'handlebars/dist/handlebars.js',
      },
    },
    module: {
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
          use: isDevelopment ? ['style-loader', 'css-loader'] : [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.css$/,
          include: /node_modules\/@patternfly/,
          loader: 'null-loader',
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
          options: {
            configFile: isDevelopment ? 'tsconfig.json' : 'tsconfig.json',
            transpileOnly: true,
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new ConsoleRemotePlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
        'process.env.MODE': JSON.stringify('plugin'),
        'process.env.PLUGIN_PROXY_PATH': JSON.stringify(`/api/proxy/plugin/${env.plugin}/console`),
        'process.env.TRANSLATION_NAMESPACE': JSON.stringify(`plugin__${env.plugin}`),
      }) as unknown as webpack.WebpackPluginInstance,
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      new MonacoWebpackPlugin({ languages: ['yaml'] }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[id].[contenthash:8].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      ...locales.map((locale) => {
        return new MergeJsonWebpackPlugin({
          files: [
            `../../public/locales/${locale}/translation.json`,
            `../../node_modules/@openshift-assisted/locales/lib/${locale}/translation.json`,
          ],
          output: {
            fileName: `locales/${locale}/plugin__${env.plugin}.json`,
          },
          space: 4,
        })
      }),
      isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
      isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
    ].filter(Boolean) as webpack.WebpackPluginInstance[],
    output: {
      assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      clean: true,
    },
    optimization: {
      minimizer: [
        `...`,
        new CssMinimizerPlugin({ minimizerOptions: { preset: ['default', { mergeLonghand: false }] } }),
      ],
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
      https: false,
      hot: true,
      client: {
        overlay: {
          warnings: false,
          errors: true,
        },
      },
    },
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
  }
  return config
}
