/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterPool,
    ClusterPoolApiVersion,
    ClusterPoolKind,
    IResource,
    NamespaceApiVersion,
    NamespaceKind,
    ResourceError,
} from '../resources'
import { deleteResources } from './delete-resources'

export function deleteClusterPool(clusterPool: ClusterPool) {
    const resources: IResource[] = [
        {
            apiVersion: ClusterPoolApiVersion,
            kind: ClusterPoolKind,
            metadata: { name: clusterPool.metadata.name, namespace: clusterPool.metadata.namespace },
        },{
            apiVersion: NamespaceApiVersion,
            kind: NamespaceKind,
            metadata: { name: clusterPool.metadata.namespace! },
        }
    ]
    console.log('in deletion function')
    const deleteResourcesResult = deleteResources(resources)
    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0]?.status === 'rejected') {
                    const error = promisesSettledResult[0].reason
                    if (error instanceof ResourceError) {
                        reject(promisesSettledResult[0].reason)
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
