/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getServiceAccountToken } from './serviceAccountToken'

interface APIPathResponse {
  paths: string[]
}

interface APIResourcePathResponse {
  kind: string
  groupVersion: string
  resources: APIResourceMetadata[]
}

interface APIResourceMetadata {
  name: string
  namespaced: boolean
  kind: string
  verbs: string[]
}

export interface APIResourceNames {
  [kind: string]: APIResourceMeta
}

export interface APIResourceMeta {
  pluralName: string
}

export async function apiPaths(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  if (await getAuthenticatedToken(req, res)) {
    const serviceAccountToken = getServiceAccountToken()
    try {
      const paths = await jsonRequest<unknown>(process.env.CLUSTER_API_URL + '/', serviceAccountToken).then(
        async (response: APIPathResponse) => {
          const apiResourceLists = await Promise.allSettled(
            response.paths
              .filter((path) => {
                const pathArray = path.substring(1).split('/')
                return (
                  pathArray.length &&
                  ((pathArray[0] === 'api' && pathArray.length === 2) ||
                    (pathArray[0] === 'apis' && pathArray.length === 3))
                )
              })
              .map(async (path) => {
                return jsonRequest<APIResourcePathResponse>(process.env.CLUSTER_API_URL + path, serviceAccountToken)
              })
          )
          // return apiResourceLists
          return buildPathObject(apiResourceLists)
        }
      )

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(paths))
    } catch (err) {
      logger.error(err)
      console.log(err)
      respondInternalServerError(req, res)
    }
  }
}

function buildPathObject(apiResourcePathResponse: PromiseSettledResult<APIResourcePathResponse>[]) {
  const resourceNames: Record<string, APIResourceNames> = {}
  apiResourcePathResponse.forEach((settledPromise) => {
    if (settledPromise.status === 'fulfilled') {
      const resourceList = settledPromise.value
      const resourceKindMap: { [key: string]: APIResourceMeta } = {}
      const groupVersion = resourceList.groupVersion
      resourceList.resources.forEach((resource) => {
        if (resource['name'].split('/').length === 1) {
          const pluralName = resource['name']
          const kind = resource['kind']

          const apiMetadata: APIResourceMeta = {
            pluralName,
          }
          resourceKindMap[kind] = apiMetadata
        }
      })
      resourceNames[groupVersion] = resourceKindMap
    }
  })
  return resourceNames
}
