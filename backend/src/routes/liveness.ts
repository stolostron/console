/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'fs'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { FetchError } from 'node-fetch'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { respondInternalServerError, respondOK } from '../lib/respond'
import { getOauthInfoPromise } from './oauth'
const { HTTP2_HEADER_AUTHORIZATION } = constants

// The kubelet uses liveness probes to know when to restart a container.
export async function liveness(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (!isLive) return respondInternalServerError(req, res)
    const oauthInfo = await getOauthInfoPromise()
    if (!oauthInfo.authorization_endpoint) return respondInternalServerError(req, res)
    return respondOK(req, res)
}

export let isLive = true

export function setDead(): void {
    if (isLive) {
        logger.warn('liveness set to false')
        isLive = false
    }
}

export function getServiceAccountToken(): string {
    if (serviceAccountToken === undefined) {
        try {
            serviceAccountToken = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf-8')
        } catch (err: unknown) {
            serviceAccountToken = process.env.TOKEN
            if (!serviceAccountToken) {
                if (err instanceof Error) {
                    logger.error('Error reading service account token', err && err.message)
                } else {
                    logger.error({ msg: 'Error reading service account token', err: err })
                }
                process.exit(1)
            }
        }
    }
    return serviceAccountToken
}
let serviceAccountToken: string

const agent = new Agent({ rejectUnauthorized: false })

export async function apiServerPing(): Promise<void> {
    const msg = 'kube api server ping failed'
    try {
        const response = await fetchRetry(process.env.CLUSTER_API_URL + '/apis', {
            headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${serviceAccountToken}` },
            agent,
        })
        if (response.status !== 200) {
            const { status } = response
            logger.error({ msg, response: { status } })
            setDead()
        }
        void response.blob()
    } catch (err) {
        if (err instanceof FetchError) {
            logger.error({ msg, error: err.message })
            if (err.errno === 'ENOTFOUND' || err.code === 'ENOTFOUND') {
                setDead()
            }
        } else if (err instanceof Error) {
            logger.error({ msg, error: err.message })
        } else {
            logger.error({ msg, err: err as unknown })
        }
    }
}

if (process.env.NODE_ENV === 'production') {
    setInterval(apiServerPing, 30 * 1000).unref()
}
