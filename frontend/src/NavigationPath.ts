/* istanbul ignore file */

export enum NavigationPath {
    clusterManagement = '/cluster-management/cluster-management',
    clusters = '/cluster-management/cluster-management/clusters',
    discoveredClusters = '/cluster-management/cluster-management/discovered-clusters',
    clusterDetails = '/cluster-management/cluster-management/clusters/:id',
    clusterOverview = '/cluster-management/cluster-management/clusters/:id/overview',
    clusterNodes = '/cluster-management/cluster-management/clusters/:id/nodes',
    clusterSettings = '/cluster-management/cluster-management/clusters/:id/settings',
    createCluster = '/cluster-management/cluster-management/create-cluster',
    importCluster = '/cluster-management/cluster-management/import-cluster',
    importCommand = '/cluster-management/cluster-management/import-cluster/:clusterName',
    providerConnections = '/cluster-management/cluster-management/provider-connections',
    addConnection = '/cluster-management/cluster-management/provider-connections/add-connection',
    editConnection = '/cluster-management/cluster-management/provider-connections/:namespace/:name',
    bareMetalAssets = '/cluster-management/bare-metal-assets',
    createBareMetalAssets = '/cluster-management/bare-metal-assets/create',
    editBareMetalAssets = '/cluster-management/bare-metal-assets/:namespace/:name/edit',
}
