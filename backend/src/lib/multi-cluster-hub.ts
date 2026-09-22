/* Copyright Contributors to the Open Cluster Management project */

import { getServiceAccountToken } from './serviceAccountToken'
import { jsonRequest } from './json-request'
import { logger } from './logger'

// Type returned by /apis/authentication.k8s.io/v1/tokenreviews

interface MultiClusterHubComponent {
  name: string
  enabled: boolean
}

interface MultiClusterHub {
  metadata: {
    namespace: string
  }
  status: {
    currentVersion: string
  }
  spec?: { overrides?: { components?: MultiClusterHubComponent[] } }
}

interface MultiClusterHubList {
  items: MultiClusterHub[]
}

let multiclusterhub: Promise<MultiClusterHub | undefined> | undefined

/** Clear MultiClusterHub cache. Used for test isolation. */
export function resetMultiClusterHubCache(): void {
  multiclusterhub = undefined
}

export async function getMultiClusterHub(noCache?: boolean): Promise<MultiClusterHub | undefined> {
  const serviceAccountToken = getServiceAccountToken()
  if (multiclusterhub === undefined || noCache) {
    multiclusterhub = jsonRequest<MultiClusterHubList>(
      process.env.CLUSTER_API_URL + '/apis/operator.open-cluster-management.io/v1/multiclusterhubs',
      serviceAccountToken
    )
      .then((response) => {
        return response.items?.[0] ?? undefined
      })
      .catch((err: Error): undefined => {
        logger.debug({ msg: 'MultiClusterHub not found', error: err.message })
        return undefined
      })
  }
  return multiclusterhub
}

export async function getMultiClusterHubComponents(noCache?: boolean): Promise<MultiClusterHubComponent[] | undefined> {
  const multiClusterHub = await getMultiClusterHub(noCache)
  return multiClusterHub?.spec?.overrides?.components
}
