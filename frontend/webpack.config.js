/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = function (_env, argv) {
    const isProduction = argv.mode === 'production' || argv.mode === undefined
    const isDevelopment = !isProduction

    return {
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            fallback: {
                fs: require.resolve('browserify-fs'),
                path: require.resolve('path-browserify'),
                buffer: require.resolve('buffer'),
                stream: require.resolve('stream-browserify'),
                util: require.resolve('node-util'),
                crypto: require.resolve('crypto-browserify'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.hbs$/,
                    loader: 'raw-loader',
                },
                {
                    test: /\.(js|jsx)$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        envName: isProduction ? 'production' : 'development',
                        presets: [['@babel/preset-react', { runtime: 'automatic' }]],
                    },
                },
                {
                    test: /\.tsx?$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        envName: isProduction ? 'production' : 'development',
                        presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
                    },
                },
                {
                    test: /\.(svg|ttf|eot|woff|woff2|jpg|jpeg|png|gif)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'assets',
                            name: isProduction ? '[name].[contenthash:8].[ext]' : '[name].[ext]',
                        },
                    },
                },
                {
                    test: /\.(css)$/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        plugins: [
            new MonacoWebpackPlugin({
                languages: ['yaml'],
            }),
            new webpack.ProvidePlugin({
                process: 'process',
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
                'process.env.REACT_APP_BACKEND_HOST': JSON.stringify('https://localhost:4000'),
                'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
            }),
            ...[new HtmlWebpackPlugin({ template: './public/index.html' })],
            ...(isProduction
                ? [
                      new CopyPlugin({
                          patterns: [
                              {
                                  from: 'public',
                                  globOptions: {
                                      ignore: ['**/*.html'],
                                  },
                              },
                          ],
                      }),
                      new CompressionPlugin({
                          algorithm: 'gzip',
                      }),
                      new CompressionPlugin({
                          algorithm: 'brotliCompress',
                          filename: '[path][base].br',
                      }),
                  ]
                : []),
        ],
        output: isProduction
            ? {
                  chunkFilename: 'js/[contenthash:12].js',
                  filename: `js/[contenthash].js`,
                  publicPath: '/multicloud',
                  clean: true,
              }
            : undefined,
        devtool: isDevelopment && 'inline-source-map',
        devServer: {
            port: 3000,
            proxy: {
                '/multicloud/api': { target: 'https://localhost:4000', secure: false },
                '/multicloud/apis': { target: 'https://localhost:4000', secure: false },
                '/multicloud/events': { target: 'https://localhost:4000', secure: false },
                '/multicloud/proxy/search': { target: 'https://localhost:4000', secure: false },
                '/multicloud/authenticated': { target: 'https://localhost:4000', secure: false },
            },
            contentBase: __dirname + '/public/',
            contentBasePublicPath: '/multicloud',
            open: true,
            historyApiFallback: true,
            compress: true,
            https: true,
            overlay: true,
            hot: true,
        },
    }
}
