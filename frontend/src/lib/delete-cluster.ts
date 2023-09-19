/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterClaimApiVersion,
  ClusterClaimKind,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  deleteResource,
  HostedClusterApiVersion,
  HostedClusterKind,
  IResource,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../resources'
import { clusterDestroyable } from '../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions'
import { deleteResources } from './delete-resources'

export function deleteCluster(cluster: Cluster, ignoreClusterDeploymentNotFound = false) {
  let resources: IResource[] = []

  if (clusterDestroyable(cluster)) {
    resources = [
      {
        apiVersion: ClusterDeploymentApiVersion,
        kind: ClusterDeploymentKind,
        metadata: { name: cluster.name!, namespace: cluster.namespace! },
      },
    ]
    if (cluster.isManaged) {
      resources.push({
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: { name: cluster.name! },
      })
    }
    if (cluster.hive?.clusterClaimName) {
      resources.push({
        apiVersion: ClusterClaimApiVersion,
        kind: ClusterClaimKind,
        metadata: {
          name: cluster.hive?.clusterClaimName!,
          namespace: cluster.hive.clusterPoolNamespace!,
        },
      })
    }
  }

  const deleteResourcesResult = deleteResources(resources)
  return {
    promise: new Promise((resolve, reject) => {
      deleteResourcesResult.promise.then((promisesSettledResult) => {
        if (promisesSettledResult[0]?.status === 'rejected') {
          const error = promisesSettledResult[0].reason
          if (error instanceof ResourceError) {
            if (ignoreClusterDeploymentNotFound && error.code === ResourceErrorCode.NotFound) {
              // DO NOTHING
            } else {
              reject(promisesSettledResult[0].reason)
              return
            }
          }
        }
        if (promisesSettledResult[1]?.status === 'rejected') {
          reject(promisesSettledResult[1].reason)
          return
        }
        resolve(promisesSettledResult)
      })
    }),
    abort: deleteResourcesResult.abort,
  }
}

export function detachCluster(cluster: Cluster) {
  if (cluster.isHypershift && !cluster.hypershift?.agent) {
    // remove annotations
    patchResource(
      {
        apiVersion: HostedClusterApiVersion,
        kind: HostedClusterKind,
        metadata: {
          name: cluster.name,
          namespace: cluster.hypershift?.hostingNamespace,
        },
      },
      [
        // ~1 jsonpatch spec escape /
        {
          op: 'remove',
          path: '/metadata/annotations/cluster.open-cluster-management.io~1hypershiftdeployment',
        },
        {
          op: 'remove',
          path: '/metadata/annotations/cluster.open-cluster-management.io~1managedcluster-name',
        },
      ]
    )
  }

  return deleteResource({
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: cluster.name },
  })
}
