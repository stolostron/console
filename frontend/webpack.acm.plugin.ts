/* Copyright Contributors to the Open Cluster Management project */
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack'
import * as path from 'path'
import baseConfig from '../../webpack.base'
import { extensions } from './plugins/acm/console-extensions'
import { pluginMetadata } from './plugins/acm/console-plugin';

/**
 * @fileoverview ACM Plugin Webpack Configuration
 * Builds the ACM plugin as a dynamic module for OpenShift Console.
 * Configures output path, bundle naming, and registers the ConsoleRemotePlugin.
 * Packages ACM-specific extensions and metadata for runtime integration.
 */
module.exports = function(env, argv) {
  const config = baseConfig(env, argv)
  
  config.output.path = path.join(__dirname, 'dist')
  config.output.filename = '[name]-bundle.js'
  
  config.plugins.push(
    new ConsoleRemotePlugin({
      pluginMetadata,
      extensions,
      validateSharedModules: false,
      validateExtensionIntegrity: false
    })
  )
  
  return config
}