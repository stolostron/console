/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'

export function cors(req: Http2ServerRequest, res: Http2ServerResponse): boolean {
  if (process.env.NODE_ENV !== 'production') {
    if (req.headers['origin']) {
      res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
      res.setHeader('Vary', 'Origin, Access-Control-Allow-Origin')
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    switch (req.method) {
      case 'OPTIONS':
        if (req.headers['access-control-request-method']) {
          res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
        }
        if (req.headers['access-control-request-headers']) {
          res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        }
        res.writeHead(200).end()
        return true
    }
  }
  return false
}
