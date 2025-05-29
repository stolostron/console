/* Copyright Contributors to the Open Cluster Management project */
import Router from 'find-my-way'
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { authenticated } from './lib/authenticated'
import { loadSettings, stopSettingsWatch } from './lib/config'
import { cors } from './lib/cors'
import { delay } from './lib/delay'
import { logger, stopLogger } from './lib/logger'
import { startLoggingMemory } from './lib/memory'
import { notFound, respondInternalServerError, respondOK } from './lib/respond'
import { startServer, stopServer } from './lib/server'
import { ServerSideEvents } from './lib/server-side-events'
import { aggregate, startAggregating, stopAggregating } from './routes/aggregator'
import { ansibleTower } from './routes/ansibletower'
import { apiPaths } from './routes/apiPaths'
import { configure } from './routes/configure'
import { events, startWatching, stopWatching } from './routes/events'
import { hub } from './routes/hub'
import { liveness } from './routes/liveness'
import { metrics } from './routes/metrics'
import { observabilityProxy, prometheusProxy } from './routes/metricsProxy'
import { login, loginCallback, logout } from './routes/oauth'
import { operatorCheck } from './routes/operatorCheck'
import { proxy } from './routes/proxy'
import { readiness } from './routes/readiness'
import { search } from './routes/search'
import { serveHandler } from './routes/serve'
import { upgradeRiskPredictions } from './routes/upgrade-risks-prediction'
import { username } from './routes/username'
import { userpreference } from './routes/userpreference'
import { virtualMachineProxy } from './routes/virtualMachineProxy'
import { multiClusterHubComponents } from './routes/multiClusterHubComponents'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
const eventsEnabled = process.env.DISABLE_EVENTS !== 'true'

// Router defaults to max param length of 100 - We need to override to 500 to handle resources with very long names
// If the route exceeds 500 chars the route will not be found from this fn: router.find()
export const router = Router<Router.HTTPVersion.V2>({ maxParamLength: 500 })
router.get('/readinessProbe', readiness)
router.get('/livenessProbe', liveness)
router.get('/ping', respondOK)
router.all('/api', proxy)
router.all('/api/*', proxy)
router.all('/apis', proxy)
router.all('/apis/*', proxy)
router.get('/apiPaths', apiPaths)
router.get('/version', proxy)
router.get('/version/', proxy)
router.post('/operatorCheck', operatorCheck)
router.get('/observability/*', observabilityProxy)
router.get('/prometheus/*', prometheusProxy)
if (!isProduction) {
  router.get('/configure', configure)
  router.get('/login', login)
  router.get('/login/callback', loginCallback)
  router.get('/logout', logout)
  router.get('/logout/', logout)
}
if (eventsEnabled) {
  router.get('/events', events)
}
router.post('/proxy/search', search)
router.get('/authenticated', authenticated)
router.post('/ansibletower', ansibleTower)
router.get('/username', username)
router.all('/userpreference', userpreference)
router.all('/metrics', metrics)
router.get('/hub', hub)
router.post('/upgrade-risks-prediction', upgradeRiskPredictions)
router.post('/aggregate/*', aggregate)
router.put('/virtualmachines/*', virtualMachineProxy)
router.put('/virtualmachineinstances/*', virtualMachineProxy)
router.post('/virtualmachinesnapshots', virtualMachineProxy)
router.post('/virtualmachinerestores', virtualMachineProxy)
router.get('/multiclusterhub/components', multiClusterHubComponents)
router.get('/*', serveHandler)

export async function requestHandler(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  if (!isProduction) {
    if (cors(req, res)) return
    await delay(req, res)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  if (req.url === '/multicloud') (req as any).url = '/'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  else if (req.url.startsWith('/multicloud')) (req as any).url = req.url.substring(11)

  const route = router.find(req.method as Router.HTTPMethod, req.url)
  if (!route) {
    logger.warn({ msg: 'route not found', url: req.url })
    return notFound(req, res)
  }

  try {
    const result: unknown = route.handler(req, res, route.params, route.store, route.searchParams)
    if (result instanceof Promise) await result
  } catch (err) {
    logger.error(err)
    if (!res.headersSent) return respondInternalServerError(req, res)
  }
}

export function start(): Promise<Http2Server | undefined> {
  loadSettings()
  if (eventsEnabled) {
    startWatching()
    startAggregating()
  }
  return startServer({ requestHandler })
}

export async function stop(): Promise<void> {
  if (isDevelopment) {
    setTimeout(() => {
      logger.warn('process stop timeout. exiting...')
      process.exit(1)
    }, 0.5 * 1000).unref()
  }
  stopSettingsWatch()
  await ServerSideEvents.dispose()
  stopWatching()
  stopAggregating()
  await stopServer()
  stopLogger()
}

if (process.env.LOG_MEMORY === 'true') {
  startLoggingMemory()
}
