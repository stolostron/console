/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterDeployment,
    ClusterDeploymentDefinition,
    ManagedCluster,
    ManagedClusterDefinition,
    managedClusterSetLabel,
    patchResource,
    ResourceError,
    ResourceErrorCode,
} from '@open-cluster-management/resources'

export function patchClusterSetLabel(clusterName: string, op: 'remove' | 'add' | 'replace', value?: string) {
    const patch: { op: 'remove' | 'add' | 'replace'; path: string; value?: string } = {
        op,
        path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
    }
    if (value && op !== 'remove') {
        patch.value = value
    }
    const requests = [
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

    const patchClustersResult = {
        promise: Promise.allSettled(requests.map((request) => request.promise)),
        abort: () => requests.forEach((request) => request.abort()),
    }

    return {
        promise: new Promise((resolve, reject) => {
            patchClustersResult.promise.then((result) => {
                if (result[0].status === 'rejected') {
                    const error = result[0].reason
                    if (error instanceof ResourceError && error.code !== ResourceErrorCode.NotFound) {
                        return reject(result[0])
                    }
                }
                if (result[1].status === 'rejected') {
                    const error = result[1].reason
                    if (error instanceof ResourceError && error.code !== ResourceErrorCode.NotFound) {
                        return reject(result[1])
                    }
                }

                return resolve(result)
            })
        }),
        abort: patchClustersResult.abort,
    }
}
