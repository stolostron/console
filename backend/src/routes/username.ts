/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getServiceAccountToken } from './serviceAccountToken'

// Type returned by /apis/authentication.k8s.io/v1/tokenreviews
export interface TokenReview {
  spec: {
    token: string
  }
  status: {
    authenticated: boolean
    error: string
    user: {
      username: string
    }
  }
}

export async function username(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    try {
      const response = await jsonPost<TokenReview>(
        process.env.CLUSTER_API_URL + '/apis/authentication.k8s.io/v1/tokenreviews',
        {
          apiVersion: 'authentication.k8s.io/v1',
          kind: 'TokenReview',
          spec: {
            token,
          },
        },
        serviceAccountToken
      )
      const name =
        response.body && response.body.status && response.body.status.user && response.body.status.user.username
          ? response.body.status.user.username
          : ''
      const responsePayload = {
        statusCode: response.statusCode,
        body: { username: name },
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(responsePayload))
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
