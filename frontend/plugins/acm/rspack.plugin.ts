/* Copyright Contributors to the Open Cluster Management project */
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack'
const rspackConfig = require('../rspack.plugin.base')
import { extensions } from './console-extensions'
import { pluginMetadata } from './console-plugin-metadata'

/**
 * @fileoverview ACM Plugin Rspack Configuration
 * Builds the ACM plugin as a dynamic module for OpenShift Console.
 * Configures output path, bundle naming, and registers the ConsoleRemotePlugin.
 * Packages ACM-specific extensions and metadata for runtime integration.
 */
module.exports = function (env: any, argv: { hot?: boolean; mode?: string }) {
  const config = rspackConfig(env, argv)

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
