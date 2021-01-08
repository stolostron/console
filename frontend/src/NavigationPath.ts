/* istanbul ignore file */

export enum NavigationPath {
    console = '/multicloud',
    clusters = '/multicloud/clusters',
    clusterDetails = '/multicloud/clusters/:id',
    clusterOverview = '/multicloud/clusters/:id/overview',
    clusterNodes = '/multicloud/clusters/:id/nodes',
    clusterSettings = '/multicloud/clusters/:id/settings',
    discoveredClusters = '/multicloud/discovered-clusters',
    createCluster = '/multicloud/create-cluster',
    importCluster = '/multicloud/import-cluster',
    importCommand = '/multicloud/import-cluster/:clusterName',
    providerConnections = '/multicloud/connections',
    editConnection = '/multicloud/connections/:namespace/:name',
    addConnection = '/multicloud/add-connection',
    bareMetalAssets = '/multicloud/bare-metal-assets',
    editBareMetalAsset = '/multicloud/bare-metal-assets/:namespace/:name',
    createBareMetalAsset = '/multicloud/create-bare-metal-asset',
}
