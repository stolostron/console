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
    
//    addWebpackModuleRule({
//      test: [/\.svg$/],
//      include: path.resolve(__dirname, "./graphics"),
//      loader: 'svg-sprite-loader',
//    }),
 
  // TO INCLUDE TEMPTIFLY SRC DIRECTLY
  removeModuleScopePlugin(),
  ...addExternalBabelPlugins(
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-transform-react-jsx',
  ),
  
);