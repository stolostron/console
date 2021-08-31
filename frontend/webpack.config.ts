/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-var-requires */
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import webpack from 'webpack'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'
import * as path from 'path'
import ReactRefreshTypeScript from 'react-refresh-typescript'

module.exports = function (_env: any, argv: { hot?: boolean; mode: string | undefined }) {
    const isProduction = argv.mode === 'production' || argv.mode === undefined
    const isDevelopment = !isProduction

    const config: webpack.Configuration & { devServer: DevServerConfiguration } = {
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
                { test: /\.hbs$/, loader: 'raw-loader', exclude: /node_modules/ },
                { test: /\.css$/, use: ['style-loader', 'css-loader'] },
                { test: /\.(svg|ttf|eot|woff|woff2|jpg|jpeg|png|gif)$/, use: 'file-loader' },
                {
                    test: /\.(ts|tsx|js|jsx)$/,
                    include: path.join(__dirname, 'src'),
                    loader: 'ts-loader',
                    options: {
                        configFile: isDevelopment ? 'tsconfig.dev.json' : 'tsconfig.json',
                        transpileOnly: true,
                        ...(isDevelopment && {
                            getCustomTransformers: () => ({
                                before: [ReactRefreshTypeScript()],
                            }),
                        }),
                    },
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
                'process.env.REACT_APP_BACKEND_HOST': JSON.stringify('https://localhost:4000'),
                'process.env.REACT_APP_BACKEND_PATH': JSON.stringify('/multicloud'),
            }) as unknown as webpack.WebpackPluginInstance,
            new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
            new MonacoWebpackPlugin({ languages: ['yaml'] }),
            isProduction &&
                new CopyPlugin({
                    patterns: [{ from: 'public', globOptions: { ignore: ['**/*.html'] } }],
                }),
            isProduction && new CompressionPlugin({ algorithm: 'gzip' }),
            isProduction && new CompressionPlugin({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
            isDevelopment && new ReactRefreshWebpackPlugin(),
            // new HtmlWebpackPlugin({ title: 'test', favicon: 'public/favicon.svg' }),
            new HtmlWebpackPlugin({ template: './public/index.html' }),
        ].filter(Boolean) as webpack.WebpackPluginInstance[],
        output: {
            publicPath: isProduction ? '/multicloud' : '/',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        // optimization: {
        //     runtimeChunk: 'single',
        //     splitChunks: {
        //         cacheGroups: {
        //             vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' },
        //         },
        //     },
        // },
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
            hot: true,
            static: {
                publicPath: '/multicloud',
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            },
        },
        // devtool: isDevelopment && 'inline-source-map',
        devtool: isDevelopment && 'eval-cheap-module-source-map',
    }

    return config
}
