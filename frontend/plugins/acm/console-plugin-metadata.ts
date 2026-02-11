/* Copyright Contributors to the Open Cluster Management project */
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack'

/**
 * Contains required information to register this plugin with the OpenShift Console.
 * Defines plugin name, version, dependencies, and supported console versions.
 * Used by the dynamic plugin system to validate and load the ACM functionality.
 */

export const pluginMetadata: ConsolePluginBuildMetadata = {
  name: 'acm',
  version: '2.17.0',
  displayName: 'Red Hat Advanced Cluster Management for Kubernetes',
  description: 'Integrates Advanced Cluster Management functionality into the OpenShift Container Platform web console',
  exposedModules: {
    welcome: '../../src/routes/Home/Welcome/WelcomePlugin.tsx',
    overview: '../../src/routes/Home/Overview/OverviewPlugin.tsx',
    search: '../../src/routes/Search/SearchPlugin.tsx',
    applications: '../../src/routes/Applications/ApplicationsPlugin.tsx',
    governance: '../../src/routes/Governance/GovernancePlugin.tsx',
    roles: '../../src/routes/UserManagement/Roles/RolesManagementPlugin.tsx',
    identities: '../../src/routes/UserManagement/Identities/IdentitiesManagementPlugin.tsx',
    featureFlags: '../../src/utils/flags/useFeatureFlags.ts',
    acmResourceRoutes: '../../src/plugin-extensions/acmResourceRoutes.ts',
  },
  dependencies: {
    '@console/pluginAPI': '>=4.19.0',
    mce: '>=2.17',
  },
}
