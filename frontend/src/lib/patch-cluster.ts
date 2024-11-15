/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterDeployment,
  ClusterDeploymentDefinition,
  ManagedCluster,
  ManagedClusterDefinition,
  managedClusterSetLabel,
} from '../resources'
import { patchResource, ResourceError, ResourceErrorCode } from '../resources/utils'

export function patchClusterSetLabel(
  clusterName: string,
  op: 'remove' | 'add' | 'replace',
  value: string,
  isManaged: boolean
) {
  const patch: { op: 'remove' | 'add' | 'replace'; path: string; value?: string } = {
    op,
    path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
  }
  if (value && op !== 'remove') {
    patch.value = value
  }
  const requests = [
    ...(isManaged
      ? [
          patchResource(
            {
              apiVersion: ManagedClusterDefinition.apiVersion,
              kind: ManagedClusterDefinition.kind,
              metadata: {
                name: clusterName,
              },
            } as ManagedCluster,
            [patch]
          ),
        ]
      : []),
    patchResource(
      {
        apiVersion: ClusterDeploymentDefinition.apiVersion,
        kind: ClusterDeploymentDefinition.kind,
        metadata: {
          name: clusterName,
          namespace: clusterName,
        },
      } as ClusterDeployment,
      [patch]
    ),
  ]

  return {
    promise: new Promise((resolve, reject) => {
      return Promise.allSettled(requests.map((request) => request.promise)).then((results) => {
        for (const result of results) {
          if (result.status === 'rejected') {
            const error = result.reason
            if (error instanceof ResourceError && error.code !== ResourceErrorCode.NotFound) {
              return reject(result)
            }
          }
        }
        return resolve(results)
      })
    }),
    abort: () => requests.forEach((request) => request.abort()),
  }
}
