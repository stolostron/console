/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */
import Router from 'find-my-way'
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { loadSettings, stopSettingsWatch } from './lib/config'
import { cors } from './lib/cors'
import { delay } from './lib/delay'
import { logger, stopLogger } from './lib/logger'
import { startLoggingMemory } from './lib/memory'
import { notFound, respondInternalServerError, respondOK } from './lib/respond'
import { startServer, stopServer } from './lib/server'
import { ServerSideEvents } from './lib/server-side-events'
import { ansibleTower } from './routes/ansibletower'
import { authenticated } from './routes/authenticated'
import { events, startWatching, stopWatching } from './routes/events'
import { liveness } from './routes/liveness'
import { login, loginCallback, logout } from './routes/oauth'
import { proxy } from './routes/proxy'
import { readiness } from './routes/readiness'
import { search } from './routes/search'
import { serve } from './routes/serve'
import { configure } from './routes/configure'
import { consoleLinks } from './routes/consoleLinks'
import { username } from './routes/username'

// Router defaults to max param length of 100 - We need to override to 200 to handle resources with very long names
// If the route exceeds 200 chars the route will not be found from this fn: router.find()
export const router = Router<Router.HTTPVersion.V2>({ maxParamLength: 200 })
router.get(`/readinessProbe`, readiness)
router.get(`/livenessProbe`, liveness)
router.get(`/ping`, respondOK)
router.all(`/api`, proxy)
router.all(`/api/*`, proxy)
router.all(`/apis`, proxy)
router.all(`/apis/*`, proxy)
router.all(`/version`, proxy)
router.all(`/version/`, proxy)
router.get(`/login`, login)
router.get(`/login/callback`, loginCallback)
router.get(`/logout`, logout)
router.get(`/logout/`, logout)
router.get(`/events`, events)
router.post(`/proxy/search`, search)
router.get(`/authenticated`, authenticated)
router.post(`/ansibletower`, ansibleTower)
router.get(`/*`, serve)
router.get('/configure', configure)
router.get('/console-links', consoleLinks)
router.get('/username', username)

export async function requestHandler(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        if (cors(req, res)) return
        await delay(req, res)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    if (req.url === '/multicloud') (req as any).url = '/'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    else if (req.url.startsWith('/multicloud')) (req as any).url = req.url.substr(11)

    const route = router.find(req.method as Router.HTTPMethod, req.url)
    if (!route) {
        logger.warn({ msg: 'route not found', url: req.url })
        return notFound(req, res)
    }

    try {
        const result: unknown = route.handler(req, res, route.params, route.store)
        if (result instanceof Promise) await result
    } catch (err) {
        logger.error(err)
        if (!res.headersSent) return respondInternalServerError(req, res)
    }
}

export function start(): Promise<Http2Server | undefined> {
    loadSettings()
    startWatching()
    return startServer({ requestHandler })
}

export async function stop(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
            logger.warn('process stop timeout. exiting...')
            process.exit(1)
        }, 0.5 * 1000).unref()
    }
    stopSettingsWatch()
    await ServerSideEvents.dispose()
    stopWatching()
    await stopServer()
    stopLogger()
}

if (process.env.LOG_MEMORY === 'true') {
    startLoggingMemory()
}
