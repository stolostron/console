/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    deleteResource,
    HostedClusterApiVersion,
    HostedClusterKind,
    IResource,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    NodePoolApiVersion,
    NodePoolKind,
    ResourceError,
    ResourceErrorCode,
    SecretApiVersion,
    SecretKind,
} from '../resources'

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
            metadata: { name: np.metadata.name, namespace: cluster.namespace! },
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
                    rejectedPromises.find((p: any) => {
                        if (p.reason instanceof ResourceError && p.reason.code !== ResourceErrorCode.NotFound) {
                            reject(p.reason)
                        }
                    })
                }
                resolve(promisesSettledResult)
            })
        }),
        abort,
    }
}
