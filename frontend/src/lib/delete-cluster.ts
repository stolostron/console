import { ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../resources/cluster-deployment'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../resources/managed-cluster'
import { deleteResources } from './delete-resources'
import { IRequestResult } from './resource-request'

export function deleteCluster(clusterName: string, destroy?: boolean): IRequestResult<PromiseSettledResult<unknown>[]> {
    if (destroy) {
        return deleteResources([
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
    }
    // case for detach, no deployment to delete
    return deleteResources([
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: clusterName },
        },
    ])
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
