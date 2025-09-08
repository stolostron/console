/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getMultiClusterEngineComponents, MultiClusterEngineComponent } from '../lib/multi-cluster-engine'
import { getManagedClusterAddOn, isAddOnHealthy, ManagedClusterAddOn } from '../lib/managed-cluster-addon'

function processHypershiftStatus(
  components: MultiClusterEngineComponent[] | undefined,
  hypershiftAddon: ManagedClusterAddOn | undefined
): boolean {
  try {
    // Check if we have components
    if (!components) {
      return false
    }

    // Check if hypershift components are enabled
    const hypershift = components.find((component) => component.name === 'hypershift')
    const hypershiftLocalHosting = components.find((component) => component.name === 'hypershift-local-hosting')

    if (!hypershift?.enabled || !hypershiftLocalHosting?.enabled) {
      return false
    }

    // Check if the hypershift addon exists and is healthy
    if (!hypershiftAddon) {
      return false
    }

    return isAddOnHealthy(hypershiftAddon)
  } catch (error) {
    logger.error('Error processing hypershift status:', error)
    return false
  }
}

export async function hypershiftStatus(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) {
    return // getAuthenticatedToken already handles the response
  }

  try {
    // Get the local hub name from query parameter or default to 'local-cluster'
    const url = new URL(req.url, `http://${req.headers.host}`)
    const localHubName = url.searchParams.get('hubName') || 'local-cluster'

    // Fetch MultiClusterEngine components (no cache for fresh data, throw errors)
    const components = await getMultiClusterEngineComponents(true, true)

    // Fetch the hypershift-addon for the local hub (throw errors)
    const hypershiftAddon = await getManagedClusterAddOn(localHubName, 'hypershift-addon', true)

    // Process the results to determine if hypershift is enabled
    const isHypershiftEnabled = processHypershiftStatus(components, hypershiftAddon)

    const responsePayload = {
      statusCode: 200,
      body: { isHypershiftEnabled },
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(responsePayload))
  } catch (err) {
    logger.error('Error fetching hypershift status:', err)
    respondInternalServerError(req, res)
  }
}
