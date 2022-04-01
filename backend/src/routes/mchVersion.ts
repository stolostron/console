/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken, isAuthenticated } from '../lib/token'
import { getServiceAccountToken } from './liveness'

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
export async function getMultiClusterHub(): Promise<MultiClusterHub | undefined> {
    const serviceAccountToken = getServiceAccountToken()
    if (multiclusterhub === undefined) {
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

export async function mchVersion(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)

    try {
        const authResponse = await isAuthenticated(token)
        if (authResponse.status === constants.HTTP_STATUS_OK) {
            const mch = await getMultiClusterHub()
            const responsePayload = {
                mchVersion: mch?.status.currentVersion,
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(responsePayload))
        } else {
            res.writeHead(authResponse.status).end()
            void authResponse.blob()
        }
    } catch (err) {
        logger.error(err)
        console.log(err)
        respondInternalServerError(req, res)
    }
}
