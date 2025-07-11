/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { respond, respondInternalServerError, catchInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { ResourceList } from '../resources/resource-list'
import { Route } from '../resources/route'
import { getAuthenticatedToken } from '../lib/token'

async function getForkliftInventoryRoute(): Promise<string> {
  const consoleServiceAccountToken = getServiceAccountToken()

  // Get routes with the service=forklift-inventory label in openshift-mtv namespace
  const routesPath =
    process.env.CLUSTER_API_URL +
    '/apis/route.openshift.io/v1/namespaces/openshift-mtv/routes?labelSelector=service%3Dforklift-inventory'

  const response = await fetchRetry(routesPath, {
    headers: {
      Authorization: `Bearer ${consoleServiceAccountToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const error = Object.assign(
      new Error(`Error getting forklift-inventory route: ${response.status} ${response.statusText}`),
      { statusCode: response.status }
    )
    throw error
  }

  const routesList = (await response.json()) as ResourceList<Route>
  if (routesList.items.length > 1) {
    logger.warn('Multiple forklift-inventory routes found and is not expected, using the first one')
  }

  const forkliftRoute = routesList.items[0]
  if (!forkliftRoute?.spec?.host) {
    const error = Object.assign(new Error('forklift-inventory route not found or missing host'), { statusCode: 404 })
    throw error
  }

  return forkliftRoute.spec.host
}

export async function forklift(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const consoleServiceAccountToken = getServiceAccountToken()
  const userToken = await getAuthenticatedToken(req, res)
  if (!consoleServiceAccountToken || !userToken) {
    respondInternalServerError(req, res)
    return
  }

  try {
    const path = req.url || ''
    // Remove /forklift/ prefix
    const forkliftPath = path.replace(/^\/forklift\/?/, '')

    // Get forklift inventory host from the route
    const host = await getForkliftInventoryRoute()

    // Construct forklift inventory URL
    const forkliftInventoryUrl = forkliftPath ? `https://${host}/${forkliftPath}` : `https://${host}`

    const response = await fetchRetry(forkliftInventoryUrl, {
      headers: {
        Authorization: `Bearer ${consoleServiceAccountToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      logger.error({
        msg: 'Forklift Inventory API error',
        status: response.status,
        statusText: response.statusText,
      })
      respond(
        res,
        { error: `Forklift Inventory API error: ${response.status} ${response.statusText}` },
        response.status
      )
      return
    }

    const jsonResponse: unknown = await response.json()
    respond(res, jsonResponse)
  } catch (err) {
    catchInternalServerError(res)(err)
  }
}
