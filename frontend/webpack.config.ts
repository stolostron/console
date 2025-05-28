/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MergeJsonWebpackPlugin from 'merge-jsons-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import * as path from 'path'
import ReactRefreshTypeScript from 'react-refresh-typescript'
import webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'
import { supportedLanguages } from './src/lib/supportedLanguages'
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = function (env: any, argv: { hot?: boolean; mode: string | undefined }) {
  const isProduction = argv.mode === 'production' || argv.mode === undefined
  const isDevelopment = !isProduction
  const locales = supportedLanguages
  const openBrowser = !env.LAUNCH
  const useTsChecker = argv.hot || !openBrowser
  const config: webpack.Configuration & { devServer: DevServerConfiguration } = {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('node-util'),
        crypto: require.resolve('crypto-browserify'),
        process: require.resolve('process/browser'),
        vm: require.resolve('vm-browserify'),
      },
      alias: {
        handlebars: 'handlebars/dist/handlebars.js',
      },
    },
    module: {
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
          use: isDevelopment ? ['style-loader', 'css-loader'] : [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
          options: {
            configFile: isDevelopment ? 'tsconfig.dev.json' : 'tsconfig.json',
            transpileOnly: true,
            getCustomTransformers: () => ({
              before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
            }),
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
        'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
        'process.env.TRANSLATION_NAMESPACE': JSON.stringify('translation'),
      }) as unknown as webpack.WebpackPluginInstance,
      ...locales.map((locale) => {
        return new MergeJsonWebpackPlugin({
          files: [
            `./public/locales/${locale}/translation.json`,
            `./node_modules/@openshift-assisted/locales/lib/${locale}/translation.json`,
          ],
          output: {
            fileName: `.${isDevelopment ? '/multicloud' : ''}/locales/${locale}/translation.json`,
          },
          space: 4,
        })
      }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      useTsChecker &&
        new ForkTsCheckerWebpackPlugin({
          async: true,
          typescript: {
            configFile: isDevelopment ? 'tsconfig.dev.json' : 'tsconfig.json',
          },
          eslint: {
            enabled: isDevelopment,
            files: ['./src/**/*.{ts,tsx,js,jsx}'],
          },
        }),
      new MonacoWebpackPlugin({ languages: ['yaml'] }),
      isProduction &&
        new CopyPlugin({
          patterns: [{ from: 'public', globOptions: { ignore: ['**/*.html', '**/translation.json'] } }],
        }),
      isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
      isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
      isDevelopment && new ReactRefreshWebpackPlugin(),
      // new HtmlWebpackPlugin({ title: 'test', favicon: 'public/favicon.svg' }),
      new HtmlWebpackPlugin({ template: './public/index.html' }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[id].[contenthash:8].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      new BundleAnalyzerPlugin({ analyzerMode: 'disabled' }),
    ].filter(Boolean) as webpack.WebpackPluginInstance[],
    output: {
      assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      publicPath: isProduction ? '/multicloud/' : '/',
      path: path.resolve(__dirname, 'build'),
      clean: true,
    },
    optimization: {
      //     runtimeChunk: 'single',
      //     splitChunks: {
      //         cacheGroups: {
      //             vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' },
      //         },
      //     },
      minimizer: [
        `...`,
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: ['default', { mergeLonghand: false }],
          },
        }),
      ],
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
        '/multicloud/metrics',
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
      ].map((backendPath) => ({
        path: backendPath,
        target: `https://localhost:${process.env.BACKEND_PORT}`,
        secure: false,
      })),
      open: openBrowser,
      historyApiFallback: true,
      compress: true,
      https: true,
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
  }

  return config
}
