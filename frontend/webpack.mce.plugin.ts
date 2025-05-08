/* Copyright Contributors to the Open Cluster Management project */
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack'
import * as path from 'path'
import baseConfig from '../../webpack.base'
import { extensions } from './plugins/mce/console-extensions'
import { pluginMetadata } from './plugins/mce/metadata'

/**
 * @fileoverview MCE Plugin Webpack Configuration
 * Builds the Multicluster Engine plugin for dynamic loading in OpenShift Console.
 * Defines build output settings and integrates MCE-specific plugin metadata and extensions.
 * Creates standalone bundle that can be loaded by the OpenShift Console at runtime.
 */
module.exports = function(env, argv) {
  const config = baseConfig(env, argv)
  
  config.output.path = path.join(__dirname, 'plugins/mce/dist')
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