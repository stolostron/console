/* Copyright Contributors to the Open Cluster Management project */

import { IResource } from '../resources/resource'
import { getKubeResources } from '../routes/events'

export type ClusterMapType = {
  [key: string]: IResource
}
export function getClusterMap(): ClusterMapType {
  const managedClusters = getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
  return managedClusters.reduce((clusterMap, cluster) => {
    if (cluster.metadata.name) {
      clusterMap[cluster.metadata.name] = cluster
    }
    return clusterMap
  }, {} as ClusterMapType)
}
