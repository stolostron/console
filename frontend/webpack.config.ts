/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import * as webpack from 'webpack'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import { Configuration, WebpackPluginInstance } from 'webpack'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'
import * as path from 'path'

module.exports = function (_env: any, argv: { hot?: boolean; mode: string | undefined }) {
    const isProduction = argv.mode === 'production' || argv.mode === undefined
    const isDevelopment = !isProduction

    const plugins = [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
            'process.env.REACT_APP_BACKEND_HOST': JSON.stringify('https://localhost:4000'),
            'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
        }) as unknown as WebpackPluginInstance,
        new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
        new MonacoWebpackPlugin({ languages: ['yaml'] }),
        new HtmlWebpackPlugin({ template: './public/index.html' }),
    ].filter(Boolean) as WebpackPluginInstance[]

    if (isProduction) {
        plugins.push(
            new CopyPlugin({
                patterns: [{ from: 'public', globOptions: { ignore: ['**/*.html'] } }],
            }) as unknown as WebpackPluginInstance
        )
        plugins.push(new CompressionPlugin({ algorithm: 'gzip' }) as unknown as WebpackPluginInstance)
        plugins.push(
            new CompressionPlugin({
                algorithm: 'brotliCompress',
                filename: '[path][base].br',
            }) as unknown as WebpackPluginInstance
        )
    } else {
        plugins.push(new webpack.HotModuleReplacementPlugin())
    }

    const config: Configuration & { devServer: DevServerConfiguration } = {
        entry: ['react-hot-loader/patch', './src/index.tsx'],
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
                'react-dom': '@hot-loader/react-dom',
            },
        },
        module: {
            rules: [
                {
                    test: /\.hbs$/,
                    exclude: /node_modules/,
                    loader: 'raw-loader',
                },
                {
                    test: /\.(css)$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(svg|ttf|eot|woff|woff2|jpg|jpeg|png|gif)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'assets',
                            name: '[name].[contenthash:8].[ext]',
                        },
                    },
                },
                {
                    test: /\.(ts|tsx|js|jsx)$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: { transpileOnly: isDevelopment },
                },
            ],
        },
        plugins,
        output: {
            publicPath: isProduction ? '/multicloud' : '/',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' },
                },
            },
        },
        devServer: {
            port: 3000,
            proxy: {
                '/multicloud/api': { target: 'https://localhost:4000', secure: false },
                '/multicloud/apis': { target: 'https://localhost:4000', secure: false },
                '/multicloud/events': { target: 'https://localhost:4000', secure: false },
                '/multicloud/proxy/search': { target: 'https://localhost:4000', secure: false },
                '/multicloud/authenticated': { target: 'https://localhost:4000', secure: false },
                '/multicloud/common': { target: 'https://localhost:4000', secure: false },
                '/multicloud/version': { target: 'https://localhost:4000', secure: false },
            },
            open: true,
            historyApiFallback: true,
            compress: true,
            https: true,
            hot: 'only',
            static: {
                publicPath: '/multicloud',
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            },
        },
        devtool: isDevelopment && 'inline-source-map',
    }

    return config
}
