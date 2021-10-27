/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

export enum NavigationPath {
<<<<<<< HEAD
    addAnsibleAutomation = '/multicloud/ansible-automations/add',
    addCredentials = '/multicloud/credentials/add',
    ansibleAutomations = '/multicloud/ansible-automations',
    applications = '/multicloud/applications',
    bareMetalAssets = '/multicloud/bare-metal-assets',
    clusterCreateProgress = '/multicloud/cluster/progress/:namespace/:name',
    clusterDetails = '/multicloud/clusters/:id',
    clusterMachinePools = '/multicloud/clusters/:id/machinepools',
    clusterNodes = '/multicloud/clusters/:id/nodes',
    clusterOverview = '/multicloud/clusters/:id/overview',
    clusterPools = '/multicloud/cluster-pools',
    clusterSetAccess = '/multicloud/cluster-sets/:id/access',
    clusterSetClusterPools = '/multicloud/cluster-sets/:id/cluster-pools',
    clusterSetClusters = '/multicloud/cluster-sets/:id/clusters',
    clusterSetDetails = '/multicloud/cluster-sets/:id',
    clusterSetManage = '/multicloud/cluster-sets/:id/manage-resources',
    clusterSetOverview = '/multicloud/cluster-sets/:id/overview',
    clusterSetSubmariner = '/multicloud/cluster-sets/:id/submariner',
    clusterSetSubmarinerInstall = '/multicloud/cluster-sets/:id/install-submariner',
    clusterSets = '/multicloud/cluster-sets',
    clusterSettings = '/multicloud/clusters/:id/settings',
    clusters = '/multicloud/clusters',
    configureDiscovery = '/multicloud/configure-discovery',
    console = '/multicloud',
    createBareMetalAsset = '/multicloud/create-bare-metal-asset',
    createCluster = '/multicloud/create-cluster',
    createClusterPool = '/multicloud/create-cluster-pool',
    createClusterSet = '/multicloud/create-cluster-set',
    createDiscovery = '/multicloud/create-discovery',
    createInfraEnv = '/multicloud/create-infra-env',
    credentials = '/multicloud/credentials',
    discoveredClusters = '/multicloud/discovered-clusters',
    editAnsibleAutomation = '/multicloud/ansible-automations/edit/:namespace/:name',
    editBareMetalAsset = '/multicloud/bare-metal-assets/:namespace/:name',
    editCluster = '/multicloud/cluster/edit/:namespace/:name',
    editCredentials = '/multicloud/credentials/edit/:namespace/:name',
    governance = '/multicloud/policies',
    importCluster = '/multicloud/import-cluster',
    importCommand = '/multicloud/import-cluster/:clusterName',
    infraEnvironmentDetails = '/multicloud/infra-environments/:namespace/:name',
    infraEnvironmentHosts = '/multicloud/infra-environments/:namespace/:name/hosts',
    infraEnvironmentOverview = '/multicloud/infra-environments/:namespace/:name/overview',
    infraEnvironments = '/multicloud/infra-environments',
    policies = '/multicloud/policies/policies',
    policySets = '/multicloud/policies/policy-sets',
    viewAnsibleAutomation = '/multicloud/ansible-automations/view/:namespace/:name',
    viewCredentials = '/multicloud/credentials/view/:namespace/:name',
=======
    // Console
    console = '/multicloud',

    // Home
    home = '/multicloud/home',
    welcome = '/multicloud/home/welcome',
    overview = '/multicloud/home/overview',

    // Infrastructure
    infrastructure = '/multicloud/infrastructure',

    // Infrastructure - Clusters - Managed Clusters
    clusters = '/multicloud/infrastructure/clusters',
    managedClusters = '/multicloud/infrastructure/clusters/managed',
    createCluster = '/multicloud/infrastructure/clusters/create',
    editCluster = '/multicloud/infrastructure/clusters/edit/:namespace/:name',
    clusterCreateProgress = '/multicloud/infrastructure/clusters/create/:namespace/:name/progress',
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

    // Infrastructure - Bare Metal Assets
    bareMetalAssets = '/multicloud/infrastructure/bare-metal-assets',
    createBareMetalAsset = '/multicloud/infrastructure/bare-metal-assets/create',
    editBareMetalAsset = '/multicloud/infrastructure/bare-metal-assets/edit/:namespace/:name',

    // Infrastructure - Automations
    ansibleAutomations = '/multicloud/infrastructure/automations',
    addAnsibleAutomation = '/multicloud/infrastructure/automations/add',
    editAnsibleAutomation = '/multicloud/infrastructure/automations/edit/:namespace/:name',
    viewAnsibleAutomation = '/multicloud/infrastructure/automations/details/:namespace/:name',

    // Applications
    applications = '/multicloud/applications',

    // Governance
    governance = '/multicloud/governance',
    policies = '/multicloud/governance/policies',
    policySets = '/multicloud/governance/policy-sets',

    // Credentials
    credentials = '/multicloud/credentials',
    addCredentials = '/multicloud/credentials/create',
    editCredentials = '/multicloud/credentials/edit/:namespace/:name',
    viewCredentials = '/multicloud/credentials/details/:namespace/:name',

    // Search
    search = '/multicloud/search',
    resources = '/multicloud/resources',
>>>>>>> main
}
