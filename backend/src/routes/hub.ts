/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { ResourceList } from '../resources/resource-list'
import { getHubClusterName, getIsHubSelfManaged } from './events'

export async function hub(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    try {
      const path = process.env.CLUSTER_API_URL + '/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
      const getResponse = await jsonRequest(path, serviceAccountToken)
        .then((response: ResourceList<IResource>) => {
          const mcgh = response.items.find(
            (crd) => crd.metadata.name === 'multiclusterglobalhubs.operator.open-cluster-management.io'
          )
          return {
            isGlobalHub: mcgh !== undefined,
            localHubName: getHubClusterName(),
            isHubSelfManaged: getIsHubSelfManaged(),
          }
        })
        .catch((err: Error): undefined => {
          logger.error({ msg: 'Error getting Multicluster Global Hubs', error: err.message })
          return undefined
        })

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(getResponse))
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
