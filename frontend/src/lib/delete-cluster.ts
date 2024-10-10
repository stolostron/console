/* Copyright Contributors to the Open Cluster Management project */

import { InfraEnvK8sResource } from '@openshift-assisted/ui-lib/cim'
import {
  Cluster,
  ClusterClaimApiVersion,
  ClusterClaimKind,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  deleteResource,
  HostedClusterApiVersion,
  HostedClusterKind,
  InfraEnvApiVersion,
  InfraEnvKind,
  IResource,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  NodePoolApiVersion,
  NodePoolKind,
  patchResource,
  ResourceError,
  ResourceErrorCode,
  SecretApiVersion,
  SecretKind,
} from '../resources'
import { clusterDestroyable } from '../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions'
import { deleteResources } from './delete-resources'
import { Provider } from '../ui-components'

export function deleteCluster({
  cluster,
  ignoreClusterDeploymentNotFound,
  infraEnvs,
  deletePullSecret,
}: {
  cluster: Cluster
  ignoreClusterDeploymentNotFound: boolean
  infraEnvs: InfraEnvK8sResource[]
  deletePullSecret: boolean
}) {
  let resources: IResource[] = []

  if (clusterDestroyable(cluster)) {
    resources = !(cluster.isHypershift || cluster.isHostedCluster)
      ? [
          {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
            metadata: { name: cluster.name!, namespace: cluster.namespace! },
          },
        ]
      : []
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

    if (deletePullSecret && cluster.hive?.secrets?.pullSecret) {
      resources.push({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: cluster.hive.secrets.pullSecret,
          namespace: cluster.namespace,
        },
      })
    }

    // clean up Hypershift artifacts
    if (cluster.isHostedCluster || cluster.isHypershift) {
      resources.push({
        apiVersion: HostedClusterApiVersion,
        kind: HostedClusterKind,
        metadata: {
          name: cluster.name,
          namespace: cluster.namespace,
        },
      })

      cluster.hypershift?.nodePools?.forEach((np) => {
        resources.push({
          apiVersion: NodePoolApiVersion,
          kind: NodePoolKind,
          metadata: {
            name: np.metadata?.name,
            namespace: cluster.namespace,
          },
        })
      })

      cluster.hypershift?.secretNames?.forEach((name) => {
        resources.push({
          apiVersion: SecretApiVersion,
          kind: SecretKind,
          metadata: { name, namespace: cluster.namespace },
        })
      })
    }

    if (cluster.provider === Provider.hostinventory || cluster.provider === Provider.nutanix) {
      const infraEnv = infraEnvs.find((ie) => {
        const clusterRef = ie.spec?.clusterRef
        return clusterRef?.name === cluster.name && clusterRef?.namespace === cluster.namespace
      })

      if (infraEnv) {
        resources.push({
          apiVersion: InfraEnvApiVersion,
          kind: InfraEnvKind,
          metadata: {
            name: infraEnv.metadata?.name,
            namespace: infraEnv.metadata?.namespace,
          },
        })

        const pullSecretName = infraEnv.spec?.pullSecretRef?.name

        if (deletePullSecret && pullSecretName) {
          if (
            infraEnv.metadata?.namespace !== cluster.namespace ||
            pullSecretName !== cluster.hive.secrets?.pullSecret
          ) {
            resources.push({
              apiVersion: SecretApiVersion,
              kind: SecretKind,
              metadata: {
                name: pullSecretName,
                namespace: infraEnv.metadata?.namespace,
              },
            })
          }
        }
      }
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
