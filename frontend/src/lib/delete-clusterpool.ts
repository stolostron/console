/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterPool,
    ClusterPoolApiVersion,
    ClusterPoolKind,
    IResource,
    ResourceError,
    SecretApiVersion,
    SecretKind,
} from '../resources'
import { deleteResources } from './delete-resources'

export function deleteClusterPool(clusterPool: ClusterPool) {
    const resources: IResource[] = [
        {
            apiVersion: ClusterPoolApiVersion,
            kind: ClusterPoolKind,
            metadata: { name: clusterPool.metadata.name, namespace: clusterPool.metadata.namespace },
        },
        {
            apiVersion: SecretApiVersion,
            kind: SecretKind,
            metadata: { name: clusterPool.spec?.pullSecretRef.name, namespace: clusterPool.metadata.namespace },
        },
        {
            apiVersion: SecretApiVersion,
            kind: SecretKind,
            metadata: {
                name: clusterPool.spec?.installConfigSecretTemplateRef.name,
                namespace: clusterPool.metadata.namespace,
            },
        },
        {
            apiVersion: SecretApiVersion,
            kind: SecretKind,
            metadata: {
                name: `${clusterPool.metadata.name}-ssh-private-key`,
                namespace: clusterPool.metadata.namespace,
            },
        },
    ]

    switch (clusterPool.metadata.labels!['cloud']) {
        case 'AWS':
            resources.push({
                apiVersion: SecretApiVersion,
                kind: SecretKind,
                metadata: { name: `${clusterPool.metadata.name}-aws-creds`, namespace: clusterPool.metadata.namespace },
            })
            break
        case 'GCP':
            resources.push({
                apiVersion: SecretApiVersion,
                kind: SecretKind,
                metadata: { name: `${clusterPool.metadata.name}-gcp-creds`, namespace: clusterPool.metadata.namespace },
            })
            break
        case 'Azure':
            resources.push({
                apiVersion: SecretApiVersion,
                kind: SecretKind,
                metadata: { name: `${clusterPool.metadata.name}-azure-creds`, namespace: clusterPool.metadata.namespace },
            })
            break
    }

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
