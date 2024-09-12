/* Copyright Contributors to the Open Cluster Management project */

import { IResource } from '../resources/resource'
import { getKubeResources } from '../routes/events'

export type ClusterMapType = {
  [key: string]: IResource
}
export function getClusterMap(): ClusterMapType {
  const managedClusters = getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
  const clusterDeployments = getKubeResources('ClusterDeployment', 'hive.openshift.io/v1')
  const hostedClusters = getKubeResources('HostedCluster', 'hypershift.openshift.io/v1beta1')
  return [...managedClusters, ...clusterDeployments, ...hostedClusters].reduce((clusterMap, cluster) => {
    if (cluster.metadata.name) {
      clusterMap[cluster.metadata.name] = cluster
    }
    return clusterMap
  }, {} as ClusterMapType)
}
