/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { getMultiClusterEngineComponents } from '../lib/multi-cluster-engine'
import { getAuthenticatedToken } from '../lib/token'
export async function multiClusterEngineComponents(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const response = await getMultiClusterEngineComponents(true)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response))
  }
}
