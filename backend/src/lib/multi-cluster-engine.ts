/* Copyright Contributors to the Open Cluster Management project */

import { jsonRequest } from './json-request'
import { logger } from './logger'
import { getServiceAccountToken } from './serviceAccountToken'

// Type returned by /apis/authentication.k8s.io/v1/tokenreviews
export interface MultiClusterEngineComponent {
  name: string
  enabled: boolean
}

interface MultiClusterEngine {
  spec: {
    targetNamespace: string
    overrides?: {
      components?: MultiClusterEngineComponent[]
    }
  }
}

interface MultiClusterEngineList {
  items: MultiClusterEngine[]
}

let MultiClusterEngine: Promise<MultiClusterEngine | undefined>
export async function getMultiClusterEngine(noCache?: boolean): Promise<MultiClusterEngine | undefined> {
  const serviceAccountToken = getServiceAccountToken()
  if (MultiClusterEngine === undefined || noCache) {
    MultiClusterEngine = jsonRequest<MultiClusterEngineList>(
      process.env.CLUSTER_API_URL + '/apis/multicluster.openshift.io/v1/multiclusterengines',
      serviceAccountToken
    )
      .then((response) => {
        return response.items && response.items[0] ? response.items[0] : undefined
      })
      .catch((err: Error): undefined => {
        logger.error({ msg: 'Error getting MultiClusterEngine', error: err.message })
        return undefined
      })
  }
  return MultiClusterEngine
}

export async function getMultiClusterEngineComponents(
  noCache?: boolean,
  throwErrors?: boolean
): Promise<MultiClusterEngineComponent[] | undefined> {
  if (throwErrors) {
    // Don't use the cached version if we want to throw errors
    const serviceAccountToken = getServiceAccountToken()
    const response = await jsonRequest<MultiClusterEngineList>(
      process.env.CLUSTER_API_URL + '/apis/multicluster.openshift.io/v1/multiclusterengines',
      serviceAccountToken
    )
    const multiClusterEngine = response.items && response.items[0] ? response.items[0] : undefined
    return multiClusterEngine?.spec?.overrides?.components
  }

  const multiClusterEngine = await getMultiClusterEngine(noCache)
  return multiClusterEngine?.spec?.overrides?.components
}
