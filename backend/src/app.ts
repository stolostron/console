/* istanbul ignore file */
import * as Router from 'find-my-way'
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { EventStreams } from './lib/event-streams'
import { logger, stopLogger } from './lib/logger'
import { respondInternalServerError, notFound } from './lib/respond'
import { startServer, stopServer } from './lib/server'
import { cors } from './lib/cors'
import { delay } from './lib/delay'
import { router } from './router'
import { startLoggingMemory } from './lib/memory'

if (process.env.NODE_ENV === 'development') {
    startLoggingMemory()
}

async function requestHandler(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        cors(req, res)
        await delay(req, res)
    }

    const route = router.find(req.method as Router.HTTPMethod, req.url)
    if (!route) return notFound(req, res)

    try {
        const result: unknown = route.handler(req, res, route.params, route.store)
        if (result instanceof Promise) await result
    } catch (err) {
        logger.error(err)
        if (!res.headersSent) return respondInternalServerError(req, res)
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
