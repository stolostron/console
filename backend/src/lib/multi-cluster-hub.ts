/* Copyright Contributors to the Open Cluster Management project */

import { jsonRequest } from './json-request'
import { logger } from './logger'
import { getServiceAccountToken } from '../routes/liveness'

// Type returned by /apis/authentication.k8s.io/v1/tokenreviews
interface MultiClusterHub {
    metadata: {
        namespace: string
    }
    status: {
        currentVersion: string
    }
}

interface MultiClusterHubList {
    items: MultiClusterHub[]
}

let multiclusterhub: Promise<MultiClusterHub | undefined>
export async function getMultiClusterHub(noCache?: boolean): Promise<MultiClusterHub | undefined> {
    const serviceAccountToken = getServiceAccountToken()
    if (multiclusterhub === undefined || noCache) {
        multiclusterhub = jsonRequest<MultiClusterHubList>(
            process.env.CLUSTER_API_URL + '/apis/operator.open-cluster-management.io/v1/multiclusterhubs',
            serviceAccountToken
        )
            .then((response) => {
                return response.items && response.items[0] ? response.items[0] : undefined
            })
            .catch((err: Error): undefined => {
                logger.error({ msg: 'Error getting MultiClusterHub', error: err.message })
                return undefined
            })
    }
    return multiclusterhub
}
