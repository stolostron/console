/* Copyright Contributors to the Open Cluster Management project */

import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import type { IResource } from '../resources/resource'
import { getHubClusterName, getIsHubSelfManaged, getIsObservabilityInstalled, getKubeResources } from './events'

interface AuthenticationResource {
  spec?: {
    type?: string
    oidcProviders?: Array<{
      claimMappings?: {
        username?: { claim?: string; prefix?: { prefixString?: string }; prefixPolicy?: string }
        groups?: { claim?: string; prefix?: string }
      }
    }>
  }
}

export function buildAuthentication(resources: IResource[]) {
  const clusterAuth = resources.find((r) => r.metadata?.name === 'cluster') as AuthenticationResource | undefined
  const isDirectAuthenticationEnabled = clusterAuth?.spec?.type === 'OIDC'

  const oidcClaimMappings = clusterAuth?.spec?.oidcProviders?.[0]?.claimMappings
  return {
    isDirectAuthenticationEnabled,
    ...(oidcClaimMappings && {
      claimMappings: {
        username: {
          claim: oidcClaimMappings.username?.claim,
          prefix: oidcClaimMappings.username?.prefix,
          prefixPolicy: oidcClaimMappings.username?.prefixPolicy,
        },
        groups: {
          claim: oidcClaimMappings.groups?.claim,
          prefix: oidcClaimMappings.groups?.prefix,
        },
      },
    }),
  }
}

export async function hub(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    try {
      const crdName = 'multiclusterglobalhubs.operator.open-cluster-management.io'
      const path = process.env.CLUSTER_API_URL + `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${crdName}`
      const [crdResponse, authentications] = await Promise.all([
        jsonRequest<IResource>(path, serviceAccountToken)
          .then((response) => ({ isGlobalHub: response.kind === 'CustomResourceDefinition' }))
          .catch((err: Error) => {
            logger.error({ msg: 'Error getting Multicluster Global Hubs', error: err.message })
            return { isGlobalHub: false }
          }),
        getKubeResources('Authentication', 'config.openshift.io/v1'),
      ])

      const response = {
        isGlobalHub: crdResponse.isGlobalHub,
        localHubName: getHubClusterName(),
        isHubSelfManaged: getIsHubSelfManaged(),
        isObservabilityInstalled: getIsObservabilityInstalled(),
        authentication: buildAuthentication(authentications),
      }

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(response))
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
