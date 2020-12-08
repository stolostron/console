import { ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../resources/cluster-deployment'
import { ManagedClusterApiVersion } from '../resources/managed-cluster'
import { ManagedClusterAddOnKind } from '../resources/managed-cluster-add-on'
import { deleteResources } from './delete-resources'
import { IRequestResult } from './resource-request'

export function deleteCluster(clusterName: string): IRequestResult<PromiseSettledResult<unknown>[]> {
    return deleteResources([
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterAddOnKind,
            metadata: { name: clusterName },
        },
        {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
            metadata: { name: clusterName, namespace: clusterName },
        },
    ])
}

export function deleteClusters(
    clusterNames: string[]
): IRequestResult<PromiseSettledResult<PromiseSettledResult<unknown>[]>[]> {
    const results = clusterNames.map((clusterName) => deleteCluster(clusterName))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}
