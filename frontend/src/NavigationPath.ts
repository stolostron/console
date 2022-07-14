/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { History, Location } from 'history'

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
    resourceLogs = '/multicloud/home/search/resources/logs',

    // Infrastructure
    infrastructure = '/multicloud/infrastructure',

    // Infrastructure - Clusters - Managed Clusters
    clusters = '/multicloud/infrastructure/clusters',
    managedClusters = '/multicloud/infrastructure/clusters/managed',
    createCluster = '/multicloud/infrastructure/clusters/create',
    editCluster = '/multicloud/infrastructure/clusters/edit/:namespace/:name',
    clusterDetails = '/multicloud/infrastructure/clusters/details/:id',
    clusterOverview = '/multicloud/infrastructure/clusters/details/:id/overview',
    clusterSettings = '/multicloud/infrastructure/clusters/details/:id/settings',
    clusterMachinePools = '/multicloud/infrastructure/clusters/details/:id/machinepools',
    clusterNodes = '/multicloud/infrastructure/clusters/details/:id/nodes',
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
    editCredentials = '/multicloud/credentials/edit/:namespace/:name',
    viewCredentials = '/multicloud/credentials/details/:namespace/:name',
}

export type CancelBackState = { cancelBack?: boolean }

export function locationWithCancelBack(
    pathname: History.Pathname,
    search?: History.Search,
    hash?: History.Hash
): Location<CancelBackState> {
    return { pathname, search: search || '', hash: hash || '', state: { cancelBack: true } }
}

export function cancelNavigation(location: Location<CancelBackState>, history: History, pathname: string) {
    if (location.state && location.state?.cancelBack) {
        history.goBack()
    } else {
        history.push(pathname)
    }
}
