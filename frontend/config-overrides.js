const { override, addExternalBabelPlugins, removeModuleScopePlugin, addWebpackModuleRule, addWebpackPlugin } = require('customize-cra')

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const path = require('path')

module.exports = override(
    addWebpackModuleRule({
      test: [/\.hbs$/],
      loader: 'handlebars-loader',
      query: {
        precompileOptions: {
          knownHelpersOnly: false
        }
      }
    }),

   addWebpackPlugin(new MonacoWebpackPlugin({
     languages: ['yaml']
   }))
);
