/* Copyright Contributors to the Open Cluster Management project */
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack'

/**
 * Defines core information for registering the Multicluster Engine plugin.
 * Includes plugin identifier, version constraints, and required dependencies.
 * Enables the OpenShift Console to discover and load MCE capabilities.
 */
export const pluginMetadata: ConsolePluginBuildMetadata = {
  name: 'mce',
  version: '2.17.0',
  displayName: 'Red Hat Multicluster Engine for Kubernetes',
  description: 'Integrates Multicluster Engine functionality into the OpenShift Container Platform web console',
  exposedModules: {
    contextProvider: '../../src/components/PluginDataContextProvider.tsx',
    context: '../../src/lib/PluginDataContext.tsx',
    perspective: '../../src/perspective.tsx',
    clusters: '../../src/routes/Infrastructure/Clusters/ClustersPlugin.tsx',
    automations: '../../src/routes/Infrastructure/Automations/AutomationsPlugin.tsx',
    environments: '../../src/routes/Infrastructure/InfraEnvironments/InfraEnvironmentsPlugin.tsx',

    credentials: '../../src/routes/Credentials/CredentialsPlugin.tsx',
  },
  dependencies: {
    '@console/pluginAPI': '>=4.15.0',
  },
}
