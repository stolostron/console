/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { FetchError } from 'node-fetch'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { respondInternalServerError, respondOK } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
const { HTTP2_HEADER_AUTHORIZATION } = constants

// The kubelet uses liveness probes to know when to restart a container.
export function liveness(req: Http2ServerRequest, res: Http2ServerResponse): void {
  if (!isLive) {
    respondInternalServerError(req, res)
  } else {
    respondOK(req, res)
  }
}

export let isLive = true

export function setDead(): void {
  if (isLive) {
    logger.warn('liveness set to false')
    isLive = false
  }
}

export async function apiServerPing(): Promise<void> {
  const msg = 'kube api server ping failed'
  try {
    const response = await fetchRetry(process.env.CLUSTER_API_URL + '/apis', {
      headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${getServiceAccountToken()}` },
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
