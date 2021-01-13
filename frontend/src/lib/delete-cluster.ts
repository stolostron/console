import { ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../resources/cluster-deployment'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../resources/managed-cluster'
import { deleteResources } from './delete-resources'
import { IRequestResult, deleteResource, ResourceError, ResourceErrorCode } from './resource-request'

export function deleteCluster(clusterName: string, ignoreClusterDeploymentNotFound = false) {
    const deleteResourcesResult = deleteResources([
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: clusterName },
        },
        {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
            metadata: { name: clusterName, namespace: clusterName },
        },
    ])

    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0].status === 'rejected') {
                    reject(promisesSettledResult[0].reason)
                    return
                }
                if (promisesSettledResult[1].status === 'rejected') {
                    const error = promisesSettledResult[1].reason
                    if (error instanceof ResourceError) {
                        if (ignoreClusterDeploymentNotFound && error.code === ResourceErrorCode.NotFound) {
                            // DO NOTHING
                        } else {
                            reject(promisesSettledResult[1].reason)
                            return
                        }
                    }
                }
                resolve(promisesSettledResult)
            })
        }),
        abort: deleteResourcesResult.abort,
    }
}

export function detachCluster(clusterName: string) {
    return deleteResource({
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: { name: clusterName },
    })
}

export function deleteClusters(
    clusterNames: string[],
    destroy?: boolean
): IRequestResult<PromiseSettledResult<PromiseSettledResult<unknown>[]>[]> {
    const results = clusterNames.map((clusterName) => deleteCluster(clusterName, destroy))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}
