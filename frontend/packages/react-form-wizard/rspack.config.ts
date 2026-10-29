/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable i18next/no-literal-string */
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import { rspack } from '@rspack/core'
import type { Configuration } from '@rspack/cli'

module.exports = function (env: any, argv: { hot: boolean; mode: string | undefined }) {
  const isProduction = argv.mode === 'production' || argv.mode === undefined
  const isDevelopment = !isProduction
  // The Cypress suite builds in production mode and serves the output with `rspack preview`
  // (see package.json). That needs the assets served from the root path rather than the
  // GitHub-Pages subpath used by the real `pages` build.
  const isCypress = !!(env && env.cypress)

  const config: Configuration = {
    entry: './wizards',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        { test: /\.(hbs|yaml)$/, type: 'asset/source' },
        { test: /\.(svg)$/, use: '@svgr/webpack' },
        { test: /\.(jpg|jpeg|png|gif|ttf|eot|woff|woff2)$/, type: 'asset/resource' },
        {
          test: /\.css$/,
          use: isDevelopment ? ['style-loader', 'css-loader'] : [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
          type: 'javascript/auto',
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean),
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
      }),
      isDevelopment && new ReactRefreshRspackPlugin(),
      new rspack.HtmlRspackPlugin({ title: 'Form Wizard', favicon: 'wizards/assets/favicon.svg' }),
      new rspack.CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[id].[contenthash:8].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
    ].filter(Boolean),
    output: {
      publicPath: isProduction && !isCypress ? '/react-form-wizard/' : '/',
    },
    devServer: {
      port: 3000,
      open: false,
      historyApiFallback: true,
      compress: true,
      hot: true,
    },
    devtool: isDevelopment ? 'source-map' : false,
  }

  return config
}
