/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    ClusterClaimApiVersion,
    ClusterClaimKind,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
    deleteResource,
    IResource,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    ResourceError,
    ResourceErrorCode,
} from '../resources'
import { deleteResources } from './delete-resources'

export function deleteCluster(cluster: Cluster, ignoreClusterDeploymentNotFound = false) {
    const resources: IResource[] = [
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

export function detachCluster(clusterName: string) {
    return deleteResource({
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: { name: clusterName },
    })
}
