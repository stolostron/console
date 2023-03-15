/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { LocationDescriptor } from 'history'
import { useMemo } from 'react'
import { generatePath } from 'react-router'
import { useHistory, useLocation } from 'react-router-dom'
import { Cluster } from './resources'

export const getClusterNavPath = (
  navPath:
    | NavigationPath.editCluster
    | NavigationPath.clusterDetails
    | NavigationPath.clusterOverview
    | NavigationPath.clusterSettings
    | NavigationPath.clusterMachinePools
    | NavigationPath.clusterNodes,
  cluster: Cluster
) =>
  generatePath(navPath, {
    name: cluster.name,
    namespace: (cluster.isHypershift ? cluster.hypershift?.hostingNamespace : cluster.namespace) || '~managed-cluster',
  })

export enum NavigationPath {
  // Console
  console = '/multicloud',

  // Home
  home = '/multicloud/home',
  welcome = '/multicloud/home/welcome',
  overview = '/multicloud/home/overview',

  // Home - Search
  search = '/multicloud/home/search',
  resources = '/multicloud/home/search/resources',
  resourceYAML = '/multicloud/home/search/resources/yaml',
  resourceRelated = '/multicloud/home/search/resources/related',
  resourceLogs = '/multicloud/home/search/resources/logs',

  // Infrastructure
  infrastructure = '/multicloud/infrastructure',

  // Infrastructure - Clusters - Managed Clusters
  clusters = '/multicloud/infrastructure/clusters',
  managedClusters = '/multicloud/infrastructure/clusters/managed',
  createAWSControlPlane = '/multicloud/infrastructure/clusters/create/aws/control-plane',
  createBMControlPlane = '/multicloud/infrastructure/clusters/create/hostinventory/control-plane',
  createKubeVirtControlPlane = '/multicloud/infrastructure/clusters/create/kubevirt/control-plane',
  createDiscoverHost = '/multicloud/infrastructure/clusters/create/discover-host',
  createCluster = '/multicloud/infrastructure/clusters/create',
  createAWSCLI = '/multicloud/infrastructure/clusters/create/aws/cli',
  createKubeVirtCLI = '/multicloud/infrastructure/clusters/create/kubevirt/cli',
  editCluster = '/multicloud/infrastructure/clusters/edit/:namespace/:name',
  clusterDetails = '/multicloud/infrastructure/clusters/details/:namespace/:name',
  clusterOverview = '/multicloud/infrastructure/clusters/details/:namespace/:name/overview',
  clusterSettings = '/multicloud/infrastructure/clusters/details/:namespace/:name/settings',
  clusterMachinePools = '/multicloud/infrastructure/clusters/details/:namespace/:name/machinepools',
  clusterNodes = '/multicloud/infrastructure/clusters/details/:namespace/:name/nodes',
  importCluster = '/multicloud/infrastructure/clusters/import',
  importCommand = '/multicloud/infrastructure/clusters/import/:clusterName',

  // Infrastructure - Clusters - Cluster Sets
  clusterSets = '/multicloud/infrastructure/clusters/sets',
  createClusterSet = '/multicloud/infrastructure/clusters/sets/create',
  clusterSetDetails = '/multicloud/infrastructure/clusters/sets/details/:id',
  clusterSetOverview = '/multicloud/infrastructure/clusters/sets/details/:id/overview',
  clusterSetAccess = '/multicloud/infrastructure/clusters/sets/details/:id/access',
  clusterSetClusterPools = '/multicloud/infrastructure/clusters/sets/details/:id/cluster-pools',
  clusterSetClusters = '/multicloud/infrastructure/clusters/sets/details/:id/clusters',
  clusterSetManage = '/multicloud/infrastructure/clusters/sets/details/:id/manage-resources',
  clusterSetSubmariner = '/multicloud/infrastructure/clusters/sets/details/:id/submariner',
  clusterSetSubmarinerInstall = '/multicloud/infrastructure/clusters/sets/details/:id/install-submariner',

  // Infrastructure - Clusters - Cluster Pools
  clusterPools = '/multicloud/infrastructure/clusters/pools',
  createClusterPool = '/multicloud/infrastructure/clusters/pools/create',

  // Infrastructure - Clusters - Discovery
  discoveredClusters = '/multicloud/infrastructure/clusters/discovered',
  configureDiscovery = '/multicloud/infrastructure/clusters/discovered/configure',
  createDiscovery = '/multicloud/infrastructure/clusters/discovered/create',

  // Infrastructure - Environments
  infraEnvironments = '/multicloud/infrastructure/environments',
  createInfraEnv = '/multicloud/infrastructure/environments/create',
  infraEnvironmentDetails = '/multicloud/infrastructure/environments/details/:namespace/:name',
  infraEnvironmentHosts = '/multicloud/infrastructure/environments/details/:namespace/:name/hosts',
  infraEnvironmentOverview = '/multicloud/infrastructure/environments/details/:namespace/:name/overview',

  // Infrastructure - Automations
  ansibleAutomations = '/multicloud/infrastructure/automations',
  addAnsibleAutomation = '/multicloud/infrastructure/automations/add',
  editAnsibleAutomation = '/multicloud/infrastructure/automations/edit/:namespace/:name',
  viewAnsibleAutomation = '/multicloud/infrastructure/automations/details/:namespace/:name',

  // Applications
  advancedConfiguration = '/multicloud/applications/advanced',
  applications = '/multicloud/applications',
  createApplicationArgo = '/multicloud/applications/create/argo',
  editApplicationArgo = '/multicloud/applications/edit/argo/:namespace/:name',
  createApplicationSubscription = '/multicloud/applications/create/subscription',
  applicationDetails = '/multicloud/applications/details/:namespace/:name',
  applicationOverview = '/multicloud/applications/details/:namespace/:name/overview',
  applicationTopology = '/multicloud/applications/details/:namespace/:name/topology',
  editApplicationSubscription = '/multicloud/applications/edit/subscription/:namespace/:name',

  // Governance
  governance = '/multicloud/governance',
  policies = '/multicloud/governance/policies',
  policySets = '/multicloud/governance/policy-sets',
  createPolicy = '/multicloud/governance/policies/create',
  editPolicy = '/multicloud/governance/policies/edit/:namespace/:name',
  createPolicyAutomation = '/multicloud/governance/policyautomation/create/:namespace/:name',
  editPolicyAutomation = '/multicloud/governance/policyautomation/edit/:namespace/:name',
  policyDetails = '/multicloud/governance/policies/details/:namespace/:name',
  policyDetailsResults = '/multicloud/governance/policies/details/:namespace/:name/results',
  policyDetailsHistory = '/multicloud/governance/policies/details/:namespace/:name/status/:clusterName/templates/:templateName/history',
  policyTemplateDetails = '/multicloud/governance/policies/details/:namespace/:name/template/:clusterName/:apiGroup/:apiVersion/:kind/:templateName',
  createPolicySet = '/multicloud/governance/policy-sets/create',
  editPolicySet = '/multicloud/governance/policy-sets/edit/:namespace/:name',

  // Credentials
  credentials = '/multicloud/credentials',
  addCredentials = '/multicloud/credentials/create',
  addAWSType = '/multicloud/credentials/create/aws/type',
  editCredentials = '/multicloud/credentials/edit/:namespace/:name',
  viewCredentials = '/multicloud/credentials/details/:namespace/:name',

  emptyPath = '',
}

export type BackCancelState = {
  /** Number of entries Back button can navigate back in history */
  maxBackSteps?: number
  /** Number of entries Cancel button should navigate back in history to get to starting point */
  cancelSteps?: number
}

export function createBackCancelLocation(
  location: LocationDescriptor<BackCancelState>
): LocationDescriptor<BackCancelState> {
  const newState: BackCancelState = { maxBackSteps: 1, cancelSteps: 1 }
  return typeof location === 'string'
    ? { pathname: location, state: newState }
    : {
        ...location,
        state: {
          ...(location?.state ? location.state : {}),
          ...newState,
        },
      }
}

export function useBackCancelNavigation(): {
  nextStep: (location: LocationDescriptor<BackCancelState>) => () => void
  back: (defaultLocation: LocationDescriptor<BackCancelState>) => () => void
  cancel: (defaultLocation: LocationDescriptor<BackCancelState>) => () => void
} {
  const history = useHistory<BackCancelState>()
  const { state } = useLocation<BackCancelState>()

  return useMemo(
    () => ({
      nextStep: (newLocation) => () => {
        const newState: BackCancelState = {
          maxBackSteps: state?.maxBackSteps ? state.maxBackSteps + 1 : 1, // when starting at an intermediate step, back can navigate to this point
          cancelSteps: state?.cancelSteps ? state.cancelSteps + 1 : 0, // when starting at an intermediate step, cancel should go to default
        }
        history.push(
          typeof newLocation === 'string'
            ? { pathname: newLocation, state: newState }
            : {
                ...newLocation,
                state: {
                  ...(state ? state : {}),
                  ...(newLocation.state ? newLocation.state : {}),
                  ...newState,
                },
              }
        )
      },
      back: (defaultLocation) => () => {
        if (state?.maxBackSteps) {
          history.goBack()
        } else {
          history.push(defaultLocation)
        }
      },
      cancel: (defaultLocation) => () => {
        if (state?.cancelSteps) {
          history.go(-state.cancelSteps)
        } else {
          history.push(defaultLocation)
        }
      },
    }),
    [history, state]
  )
}
