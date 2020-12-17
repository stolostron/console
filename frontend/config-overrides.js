const {
  override,
  addExternalBabelPlugins,
  removeModuleScopePlugin,
  addWebpackModuleRule,
} = require("customize-cra");

const path = require("path");
 
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
  
);