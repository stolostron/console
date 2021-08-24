/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import * as webpack from 'webpack'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import 'webpack-dev-server'

module.exports = function (_env: any, argv: { mode: string | undefined }) {
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
                process: require.resolve('process/browser'),
            },
            alias: {
                handlebars: 'handlebars/dist/handlebars.js',
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
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env', ['@babel/preset-react', { runtime: 'automatic' }]],
                        plugins: [
                            // ... other plugins
                            isDevelopment && 'react-refresh/babel',
                        ].filter(Boolean),
                    },
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/env',
                            ['@babel/preset-react', { runtime: 'automatic' }],
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            // ... other plugins
                            isDevelopment && 'react-refresh/babel',
                        ].filter(Boolean),
                    },
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
                    test: /\.(css)$/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
                'process.env.REACT_APP_BACKEND_HOST': JSON.stringify('https://localhost:4000'),
                'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
            }),
            new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
            new MonacoWebpackPlugin({ languages: ['yaml'] }),
            new HtmlWebpackPlugin({ template: './public/index.html' }),
            isProduction && new CopyPlugin({ patterns: [{ from: 'public', globOptions: { ignore: ['**/*.html'] } }] }),
            isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
            isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
            isDevelopment && new webpack.HotModuleReplacementPlugin(),
            isDevelopment && new ReactRefreshWebpackPlugin(),
        ].filter(Boolean),
        output: isProduction
            ? {
                  chunkFilename: 'js/[contenthash:12].js',
                  filename: `js/[contenthash].js`,
                  publicPath: '/multicloud',
                  clean: true,
              }
            : { publicPath: '/' },
        devtool: isDevelopment && 'inline-source-map',
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
            contentBase: './public/',
            contentBasePublicPath: '/multicloud',
            open: true,
            inline: true,
            historyApiFallback: true,
            compress: true,
            https: true,
            overlay: true,
            hot: true,
        },
    }
}
