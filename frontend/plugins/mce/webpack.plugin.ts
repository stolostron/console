/* Copyright Contributors to the Open Cluster Management project */
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack'
const webpackConfig = require('../webpack.plugin.base')
import { extensions } from './console-extensions'
import { pluginMetadata } from './console-plugin-metadata'

/**
 * @fileoverview MCE Plugin Webpack Configuration
 * Builds the Multicluster Engine plugin for dynamic loading in OpenShift Console.
 * Defines build output settings and integrates MCE-specific plugin metadata and extensions.
 * Creates standalone bundle that can be loaded by the OpenShift Console at runtime.
 */
module.exports = function (env: any, argv: { hot?: boolean; mode?: string }) {
  const config = webpackConfig(env, argv)

  config.plugins.push(
    new ConsoleRemotePlugin({
      pluginMetadata,
      extensions,
      validateSharedModules: false,
      validateExtensionIntegrity: false,
    })
  )

  return config
}
