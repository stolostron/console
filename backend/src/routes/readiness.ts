/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { logger } from '../lib/logger'
import { respondInternalServerError, respondOK } from '../lib/respond'

let isReady = false

// The kubelet uses readiness probes to know when a container is ready to start accepting traffic
export function readiness(req: Http2ServerRequest, res: Http2ServerResponse): void {
  if (!isReady) {
    respondInternalServerError(req, res)
  } else {
    respondOK(req, res)
  }
}

export function setReady(): void {
  if (!isReady) {
    logger.info('readiness set to true - initial loading complete')
    isReady = true
  }
}
