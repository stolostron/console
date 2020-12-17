/* istanbul ignore file */

export enum NavigationPath {
    console = '/console',
    clusters = '/console/clusters',
    clusterDetails = '/console/clusters/:id',
    clusterOverview = '/console/clusters/:id/overview',
    clusterNodes = '/console/clusters/:id/nodes',
    clusterSettings = '/console/clusters/:id/settings',
    discoveredClusters = '/console/discovered-clusters',
    createCluster = '/console/create-cluster',
    importCluster = '/console/import-cluster',
    importCommand = '/console/import-cluster/:clusterName',
    providerConnections = '/console/connections',
    editConnection = '/console/connections/:namespace/:name',
    addConnection = '/console/add-connection',
    bareMetalAssets = '/console/bare-metal-assets',
    editBareMetalAsset = '/console/bare-metal-assets/:namespace/:name',
    createBareMetalAsset = '/console/create-bare-metal-asset',
}
