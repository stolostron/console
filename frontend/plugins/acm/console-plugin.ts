/* Copyright Contributors to the Open Cluster Management project */
import { PluginMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack'

/**
 * Contains required information to register this plugin with the OpenShift Console.
 * Defines plugin name, version, dependencies, and supported console versions.
 * Used by the dynamic plugin system to validate and load the ACM functionality.
 */

export const pluginMetadata: PluginMetadata = {
  name: 'acm',
  version: '2.14.0',
  displayName: 'Red Hat Advanced Cluster Management for Kubernetes',
  description: 'Integrates Advanced Cluster Management functionality into the OpenShift Container Platform web console',
  exposedModules: {
    welcome: '../../src/routes/Home/Welcome/WelcomePlugin.tsx',
    overview: '../../src/routes/Home/Overview/OverviewPlugin.tsx',
    search: '../../src/routes/Search/SearchPlugin.tsx',
    applications: '../../src/routes/Applications/ApplicationsPlugin.tsx',
    governance: '../../src/routes/Governance/GovernancePlugin.tsx'
  },
  dependencies: {
    "@console/pluginAPI": ">=4.15.0",
    "mce": ">=2.9"
  }
}