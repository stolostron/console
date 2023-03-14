/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { HeadersInit } from 'node-fetch'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonPost, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { getServiceAccountToken } from './serviceAccountToken'
import { TokenReview } from './username'

const { HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_ACCEPT } = constants

export interface SavedSearch {
  description?: string
  id: string
  name: string
  searchText: string
}
export interface UserPreference extends IResource {
  apiVersion: 'console.open-cluster-management.io/v1'
  kind: 'UserPreference'
  spec?: {
    savedSearches?: SavedSearch[]
  }
}

export async function userpreference<T = unknown>(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()
    const agent = new Agent({ rejectUnauthorized: false })

    const headers: HeadersInit = {
      [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${serviceAccountToken}`,
      [HTTP2_HEADER_ACCEPT]: 'application/json',
      [HTTP2_HEADER_CONTENT_TYPE]: req.method === 'PATCH' ? 'application/json-patch+json' : 'application/json',
    }

    jsonPost<TokenReview>(
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
      .then(async (userResponse) => {
        const name =
          userResponse.body &&
          userResponse.body.status &&
          userResponse.body.status.user &&
          userResponse.body.status.user.username
            ? userResponse.body.status.user.username.toLowerCase().replace(/[^a-z0-9-.]/g, '-')
            : ''
        if (name) {
          let path = process.env.CLUSTER_API_URL + '/apis/console.open-cluster-management.io/v1/userpreferences'
          if (req.method === 'PATCH' || req.method === 'GET') {
            path = path + '/' + name
          }

          if (req.method === 'GET') {
            const getResponse = await jsonRequest<T>(path, serviceAccountToken)
              .then((response) => response)
              .catch((err: Error): undefined => {
                logger.error({ msg: 'Error getting UserPreference', error: err.message })
                return undefined
              })
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(getResponse))
          } else {
            let data: string = undefined
            const chucks: string[] = []
            req.on('data', (chuck: string) => {
              chucks.push(chuck)
            })
            req.on('end', async () => {
              data = chucks.join()

              const body =
                req.method === 'POST'
                  ? JSON.stringify({
                      apiVersion: 'console.open-cluster-management.io/v1',
                      kind: 'UserPreference',
                      metadata: {
                        name: name,
                      },
                      spec: {
                        savedSearches: JSON.parse(data) as SavedSearch[],
                      },
                    })
                  : data

              const fetchResponse = await fetchRetry(path, {
                method: req.method,
                headers,
                agent,
                body,
                compress: true,
              })
                .then((response) => response.json() as unknown)
                .catch((err: Error) => {
                  logger.error({
                    msg: req.method === 'POST' ? 'Error creating UserPreference' : 'Error updating UserPreference',
                    error: err.message,
                  })
                  return undefined
                })

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(fetchResponse))
            })
          }
        } else {
          logger.error(`Error getting username to preform UserPreference ${req.method} request`)
        }
      })
      .catch((err) => {
        logger.error(err)
        respondInternalServerError(req, res)
      })
  }
}
