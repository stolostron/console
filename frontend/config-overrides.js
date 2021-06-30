/* Copyright Contributors to the Open Cluster Management project */

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    webpack: function (config, env) {
        for (let _rule of config.module.rules) {
            if (_rule.oneOf) {
                _rule.oneOf.unshift({
                    test: [/\.hbs$/],
                    loader: 'raw-loader',
               })
                break
            }
        }

        config.plugins.push(
            new MonacoWebpackPlugin({
                languages: ['yaml'],
            })
        )

        // Turn off mergeLonghand css minification optimizations
        // This fixes patternfly select input not having borders in production
        for (let plugin of config.optimization.minimizer) {
            if (plugin.pluginDescriptor && plugin.pluginDescriptor.name === 'OptimizeCssAssetsWebpackPlugin') {
                plugin.options.cssProcessorPluginOptions.preset[1].mergeLonghand = false
            }
        }
        return config
    },
}
