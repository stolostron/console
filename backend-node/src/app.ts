/* Copyright Contributors to the Open Cluster Management project */
import Router from 'find-my-way'
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { loadSettings } from './lib/config'
import { stopFileWatches } from './lib/fileWatch'
import { cors } from './lib/cors'
import { delay } from './lib/delay'
import { logger, stopLogger } from './lib/logger'
import { startLoggingMemory } from './lib/memory'
import { notFound, respondInternalServerError, respondOK } from './lib/respond'
import { startServer, stopServer } from './lib/server'
import { ServerSideEvents } from './lib/server-side-events'
import { aggregate, startAggregating, stopAggregating } from './routes/aggregator'
import { ansibleTower } from './routes/ansibletower'
import { events, startWatching, stopWatching } from './routes/events'
import { liveness } from './routes/liveness'
import { readiness } from './routes/readiness'
import { search } from './routes/search'
import { placementDebug } from './routes/placementDebug'
import { upgradeRiskPredictions } from './routes/upgrade-risks-prediction'
import { watchTLSSecurityProfile } from './lib/tlsProfileWatch'
import { watchPlacementDebugCA } from './lib/placementDebugCAWatch'
import { invalidatePlacementDebugAgent } from './lib/agent'
import {
  getAwsAccountIds,
  getAwsBillingAccountIds,
  getWizardOIDCConfigs,
  getWizardCloudProviders,
  getClusterNameCheck,
  getOCMRoleARN,
  getRoleARNs,
  getUserRole,
  getWizardVersions,
  getWizardVPCs,
  getWizardMachineTypes,
} from './routes/rosaWizardApi'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
const eventsEnabled = process.env.DISABLE_EVENTS !== 'true'

// Router defaults to max param length of 100 - We need to override to 500 to handle resources with very long names
// If the route exceeds 500 chars the route will not be found from this fn: router.find()
export const router = Router<Router.HTTPVersion.V2>({ maxParamLength: 500 })
router.get('/readinessProbe', readiness)
router.get('/livenessProbe', liveness)
router.get('/ping', respondOK)
if (eventsEnabled) {
  router.get('/events', events)
}
router.post('/proxy/search', search)
router.post('/placement-debug', placementDebug)
router.post('/ansibletower', ansibleTower)
router.post('/upgrade-risks-prediction', upgradeRiskPredictions)
router.post('/aggregate/*', aggregate)

// rosa wizard routes
router.post('/aws-account-ids', getAwsAccountIds)
router.post('/aws-billing-accounts', getAwsBillingAccountIds)
router.post('/oidc-configs', getWizardOIDCConfigs)
router.post('/regions', getWizardCloudProviders)
router.post('/cluster-name-check', getClusterNameCheck)
router.post('/sts-role-arns', getRoleARNs)
router.post('/vpcs', getWizardVPCs)
router.post('/sts-ocm-role', getOCMRoleARN)
router.post('/sts-user-role', getUserRole)
router.post('/openshift-versions', getWizardVersions)
router.post('/machine-types', getWizardMachineTypes)

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

let stopTLSProfileWatch: (() => void) | undefined
let stopPlacementDebugCAWatch: (() => void) | undefined
export async function start() {
  await loadSettings()
  if (eventsEnabled) {
    startWatching()
    startAggregating()
  }
  stopPlacementDebugCAWatch = watchPlacementDebugCA(() => {
    invalidatePlacementDebugAgent()
  })
  stopTLSProfileWatch = watchTLSSecurityProfile(async (options) => {
    try {
      await stopServer()
      await startServer({ requestHandler, ...options })
    } catch (err) {
      logger.error({
        msg: 'server restart failed on TLS profile change',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  })
}

export async function stop(): Promise<void> {
  if (isDevelopment) {
    setTimeout(() => {
      logger.warn('process stop timeout. exiting...')
      process.exit(1)
    }, 0.5 * 1000).unref()
  }
  stopFileWatches()
  await ServerSideEvents.dispose()
  stopWatching()
  stopAggregating()
  stopPlacementDebugCAWatch?.()
  stopTLSProfileWatch?.()
  await stopServer()
  stopLogger()
}

if (process.env.LOG_MEMORY === 'true') {
  startLoggingMemory()
}
