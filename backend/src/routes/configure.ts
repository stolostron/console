/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { getOauthInfoPromise } from './oauth'

export async function configure(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const oauthInfo = await getOauthInfoPromise()
    const responsePayload = {
        token_endpoint: oauthInfo.token_endpoint,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(responsePayload))
}
