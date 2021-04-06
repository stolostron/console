/* Copyright Contributors to the Open Cluster Management project */

import { ClusterDeploymentDefinition, ClusterDeployment } from '../resources/cluster-deployment'
import { ManagedClusterDefinition, ManagedCluster } from '../resources/managed-cluster'
import { IRequestResult, ResourceError, ResourceErrorCode, patchResource } from './resource-request'
import { managedClusterSetLabel } from '../resources/managed-cluster-set'

export function patchClusterSetLabel(clusterName: string, op: 'remove' | 'add', value?: string) {
    const requests = [
        patchResource(
            {
                apiVersion: ManagedClusterDefinition.apiVersion,
                kind: ManagedClusterDefinition.kind,
                metadata: {
                    name: clusterName,
                },
            } as ManagedCluster,
            [
                {
                    op,
                    path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                    value,
                },
            ]
        ),
        patchResource(
            {
                apiVersion: ClusterDeploymentDefinition.apiVersion,
                kind: ClusterDeploymentDefinition.kind,
                metadata: {
                    name: clusterName,
                    namespace: clusterName,
                },
            } as ClusterDeployment,
            [
                {
                    op,
                    path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                    value,
                },
            ]
        ),
    ]

    const patchClustersResult = {
        promise: Promise.allSettled(requests.map((request) => request.promise)),
        abort: () => requests.forEach((request) => request.abort()),
    }

    return {
        promise: new Promise((resolve, reject) => {
            patchClustersResult.promise.then((result) => {
                console.log('RESULT', result)
                if (result[0].status === 'rejected') {
                    const error = result[0].reason
                    if (error instanceof ResourceError && error.code !== ResourceErrorCode.NotFound) {
                        return reject(error)
                    }
                }
                if (result[1].status === 'rejected') {
                    const error = result[1].reason
                    if (error instanceof ResourceError && error.code !== ResourceErrorCode.NotFound) {
                        return reject(error)
                    }
                }

                return resolve(result)
            })
        }),
        abort: patchClustersResult.abort,
    }
}
