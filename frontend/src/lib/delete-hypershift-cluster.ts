/* Copyright Contributors to the Open Cluster Management project */

import {
  HostedClusterApiVersion,
  HostedClusterKind,
  IResource,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  NodePoolApiVersion,
  NodePoolKind,
  SecretApiVersion,
  SecretKind,
} from '../resources'
import { Cluster, deleteResource, ResourceError, ResourceErrorCode } from '../resources/utils'

export const deleteHypershiftCluster = (cluster: Cluster) => {
  const resources: IResource[] = [
    {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: { name: cluster.name! },
    },
    {
      apiVersion: KlusterletAddonConfigApiVersion,
      kind: KlusterletAddonConfigKind,
      metadata: { name: cluster.name!, namespace: cluster.namespace! },
    },
    {
      apiVersion: HostedClusterApiVersion,
      kind: HostedClusterKind,
      metadata: { name: cluster.name!, namespace: cluster.namespace! },
    },
  ]
  cluster.hypershift?.nodePools?.forEach((np) => {
    resources.push({
      apiVersion: NodePoolApiVersion,
      kind: NodePoolKind,
      metadata: { name: np.metadata?.name, namespace: cluster.namespace! },
    })
  })

  cluster.hypershift?.secretNames?.forEach((name) => {
    resources.push({
      apiVersion: SecretApiVersion,
      kind: SecretKind,
      metadata: { name, namespace: cluster.namespace! },
    })
  })

  const deletePromises = resources.map((resource) => deleteResource(resource))

  const promises = Promise.allSettled(deletePromises.map((result) => result.promise))
  const abort = () => deletePromises.forEach((result) => result.abort())

  return {
    promise: new Promise((resolve, reject) => {
      promises.then((promisesSettledResult) => {
        const rejectedPromises = promisesSettledResult.filter((p) => p.status === 'rejected')
        if (rejectedPromises.length) {
          const errPromise = rejectedPromises.find(
            (p: any) => p.reason instanceof ResourceError && p.reason.code !== ResourceErrorCode.NotFound
          )
          if (errPromise) {
            reject((errPromise as any).reason)
          }
        }
        resolve(promisesSettledResult)
      })
    }),
    abort,
  }
}
