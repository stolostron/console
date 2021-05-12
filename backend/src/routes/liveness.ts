/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'fs'
import { Http2ServerRequest, Http2ServerResponse, constants } from 'http2'
import { Agent } from 'https'
import { FetchError, HeadersInit } from 'node-fetch'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { respondInternalServerError, respondOK } from '../lib/respond'
import { oauthInfoPromise } from './oauth'
const { HTTP2_HEADER_AUTHORIZATION } = constants

// The kubelet uses liveness probes to know when to restart a container.
export async function liveness(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (!isLive) return respondInternalServerError(req, res)
    const oauthInfo = await oauthInfoPromise
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

export let serviceAcccountToken: string
if (process.env.NODE_ENV !== 'test') {
    try {
        serviceAcccountToken = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token').toString()
    } catch (err) {
        serviceAcccountToken = process.env.TOKEN
        if (!serviceAcccountToken) {
            logger.error('service account token not found')
            process.exit(1)
        }
    }
}

const agent = new Agent({ rejectUnauthorized: false })

export async function apiServerPing(): Promise<void> {
    try {
        const response = await fetchRetry(process.env.CLUSTER_API_URL + '/apis', {
            headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${serviceAcccountToken}` },
            agent,
        })
        if (response.status !== 200) {
            setDead()
        }
        void response.blob()
    } catch (err) {
        if (err instanceof FetchError) {
            logger.error({ msg: 'kube api server ping failed', error: err.message })
            if (err.errno === 'ENOTFOUND' || err.code === 'ENOTFOUND') {
                setDead()
            }
        } else if (err instanceof Error) {
            logger.error({ msg: 'api server ping failed', error: err.message })
        } else {
            logger.error({ msg: 'api server ping failed', err: err as unknown })
        }
    }
}

if (process.env.NODE_ENV === 'production') {
    setInterval(apiServerPing, 30 * 1000).unref()
}
