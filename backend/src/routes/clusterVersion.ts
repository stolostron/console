/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'

export interface ClusterVersion extends IResource {
  apiVersion: 'config.openshift.io/v1'
  kind: 'ClusterVersion'
  status?: {
    desired?: {
      version?: string
    }
  }
}

export interface ClusterVersionResponse {
  version?: string
  error?: string
}

export async function clusterVersion(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    try {
      const path = process.env.CLUSTER_API_URL + '/apis/config.openshift.io/v1/clusterversions/version'
      const clusterVersionResource = await jsonRequest<ClusterVersion>(path, serviceAccountToken)
        .then((clusterVersion: ClusterVersion) => {
          // Extract version from the ClusterVersion resource
          const version = clusterVersion.status?.desired?.version
          const response: ClusterVersionResponse = {
            version: version || undefined,
          }
          return response
        })
        .catch((err: Error) => {
          logger.error({ msg: 'Error getting ClusterVersion', error: err.message })
          const response: ClusterVersionResponse = {
            error: `Failed to get cluster version: ${err.message}`,
          }
          return response
        })

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(clusterVersionResource))
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
