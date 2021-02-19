/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'

export function corsMiddleware(next: (req: Http2ServerRequest, res: Http2ServerResponse) => Promise<void> | void) {
    return async function handleCors(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
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
                    return res.writeHead(200).end()
            }
        }
        await next(req, res)
    }
}
