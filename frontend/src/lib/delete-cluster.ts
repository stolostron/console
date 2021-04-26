/* Copyright Contributors to the Open Cluster Management project */

import { ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../resources/cluster-deployment'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../resources/managed-cluster'
import { ClusterClaimApiVersion, ClusterClaimKind } from '../resources/cluster-claim'
import { deleteResources } from './delete-resources'
import { deleteResource, ResourceError, ResourceErrorCode } from './resource-request'
import { Cluster } from '../lib/get-cluster'
import { IResource } from '../resources/resource'

export function deleteCluster(cluster: Cluster, ignoreClusterDeploymentNotFound = false) {
    const resources: IResource[] = [
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: cluster.name! },
        },
        {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
            metadata: { name: cluster.name!, namespace: cluster.namespace! },
        },
    ]

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
