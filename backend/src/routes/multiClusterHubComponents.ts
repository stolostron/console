/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { getMultiClusterHubComponents } from '../lib/multi-cluster-hub'
import { getAuthenticatedToken } from '../lib/token'

export async function multiClusterHubComponents(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const response = await getMultiClusterHubComponents(true)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response))
  }
}
