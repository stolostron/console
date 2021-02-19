/* istanbul ignore file */
import * as Router from 'find-my-way'
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { corsMiddleware } from './middlewares/cors-middleware'
import { EventStreams } from './lib/event-streams'
import { logger, stopLogger } from './lib/logger'
import { respondInternalServerError, respondNotFound } from './lib/respond'
import { startServer, stopServer } from './lib/server'
import { router } from './router'

export let requestHandler: (req: Http2ServerRequest, res: Http2ServerResponse) => Promise<void>

if (process.env.NODE_ENV !== 'production') {
    requestHandler = corsMiddleware(routeHandler)
} else {
    requestHandler = routeHandler
}

async function routeHandler(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const route = router.find(req.method as Router.HTTPMethod, req.url)
    if (!route) {
        return respondNotFound(req, res)
    } else 
        try {
            const result: unknown = route.handler(req, res, route.params, route.store)
            if (result instanceof Promise) await result
        } catch (err) {
            logger.error(err)
            return respondInternalServerError(req, res)
        }
    }
}

export function start(): Promise<Http2Server | undefined> {
    return startServer({ requestHandler })
}

export async function stop(): Promise<void> {
    await stopServer()
    await EventStreams.dispose()
    stopLogger()
}