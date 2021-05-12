/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { respondInternalServerError, respondOK } from '../lib/respond'
import { isLive } from './liveness'
import { oauthInfoPromise } from './oauth'

// The kubelet uses readiness probes to know when a container is ready to start accepting traffic
export async function readiness(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (!isLive) return respondInternalServerError(req, res)
    const oauthInfo = await oauthInfoPromise
    if (!oauthInfo.authorization_endpoint) return respondInternalServerError(req, res)
    return respondOK(req, res)
}
