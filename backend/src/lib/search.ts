/* Copyright Contributors to the Open Cluster Management project */
import { OutgoingHttpHeaders } from 'http2'
import { RequestOptions, request } from 'https'
import { URL } from 'url'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'
import { getNamespace, getServiceAccountToken, getServiceCACertificate } from '../lib/serviceAccountToken'
import { logger } from './logger'
import { IQuery } from '../routes/aggregators/applications'

export type ISearchResult = {
  data: {
    searchResult: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?: any
      count?: number
      related?: {
        count?: number
        kind: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items?: any
      }[]
    }[]
  }
  message?: string
}

export async function getServiceAccountOptions() {
  const serviceAccountToken = getServiceAccountToken()
  const headers: OutgoingHttpHeaders = {
    authorization: `Bearer ${serviceAccountToken}`,
    accept: 'application/json',
    'content-type': 'application/json',
  }
  const options = await getSearchOptions(headers)
  options.rejectUnauthorized = false
  return options
}

export async function getSearchOptions(headers: OutgoingHttpHeaders): Promise<RequestOptions> {
  const mch = await getMultiClusterHub()
  const namespace = getNamespace()
  const machineNs = process.env.NODE_ENV === 'test' ? 'undefined' : `${mch?.metadata?.namespace || namespace}`
  const searchService = `https://search-search-api.${machineNs}.svc.cluster.local:4010`
  const searchUrl = process.env.SEARCH_API_URL || searchService
  const endpoint = process.env.globalSearchFeatureFlag === 'enabled' ? '/federated' : '/searchapi/graphql'
  const url = new URL(searchUrl + endpoint)
  headers.host = url.hostname
  const options: RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers,
    ca: getServiceCACertificate(),
  }
  return options
}

export async function getSearchResults(query: IQuery) {
  const options = await getServiceAccountOptions()
  const requestTimeout = 2 * 60 * 1000
  return new Promise<ISearchResult>((resolve, reject) => {
    let body = ''
    const id = setTimeout(() => {
      logger.error(`getSearchResults request timeout`)
      reject(Error('request timeout'))
    }, requestTimeout)
    const req = request(options, (res) => {
      res.on('data', (data) => {
        body += data
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(body) as ISearchResult
          const message = typeof result === 'string' ? result : result.message
          if (message) {
            logger.error(`getSearchResults return error ${message}`)
            reject(Error(result.message))
          }
          resolve(result)
        } catch (e) {
          // search might be overwhelmed
          // pause before next request
          logger.error(`getSearchResults parse error ${e} ${body}`)
          setTimeout(() => {
            reject(Error(body))
          }, requestTimeout)
        }
        clearTimeout(id)
      })
    })
    req.on('error', (e) => {
      logger.error(`getSearchResults request error ${e.message}`)
      reject(e)
    })
    req.write(JSON.stringify(query))
    req.end()
  })
}

const ping = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['Pod'],
          },
          {
            property: 'name',
            values: ['search-api*'],
          },
        ],
        limit: 1,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export async function pingSearchAPI() {
  const options = await getServiceAccountOptions()
  return new Promise<boolean>((resolve, reject) => {
    let body = ''
    const id = setTimeout(
      () => {
        logger.error(`ping searchAPI timeout`)
        reject(Error('request timeout'))
      },
      4 * 60 * 1000
    )
    const req = request(options, (res) => {
      res.on('data', (data) => {
        body += data
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(body) as { data: unknown }
          if (result.data) {
            resolve(true)
          } else {
            reject(new Error('no data'))
          }
        } catch (e) {
          logger.error(`pingSearchAPI parse error ${e} ${body}`)
          reject(new Error(new String(e).valueOf()))
        }
        clearTimeout(id)
      })
    })
    req.on('error', (e) => {
      reject(e)
    })
    req.write(JSON.stringify(ping))
    req.end()
  })
}
