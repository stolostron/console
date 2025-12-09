export const isClusterInClusters = (clusters: string[], cluster: Cluster) =>
  clusters.some((selectedCluster) => {
    const selectedStr = selectedCluster?.toString().trim()
    const clusterStr = cluster.name?.toString().trim()
    return selectedStr === clusterStr
  })
