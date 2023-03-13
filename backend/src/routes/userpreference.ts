/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { HeadersInit } from 'node-fetch'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { getServiceAccountToken } from './serviceAccountToken'

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

    let path = process.env.CLUSTER_API_URL + '/apis/console.open-cluster-management.io/v1/userpreferences'
    if (req.method === 'PATCH' || req.method === 'GET') {
      path = path + '/' + req.url.split('/')[2]
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
      let body = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', async () => {
        body = chucks.join()

        const fetchResponse = await fetchRetry(path, {
          method: req.method,
          headers,
          agent,
          body: body,
          compress: true,
        })
          .then(async (response) => {
            return response.json()
          })
          .catch((err) => {
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
  }
}
