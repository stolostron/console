/* Copyright Contributors to the Open Cluster Management project */
import { OutgoingHttpHeaders } from 'http2'
import { RequestOptions, request } from 'https'
import { URL } from 'url'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'
import { getNamespace, getServiceAccountToken, getServiceCACertificate } from '../lib/serviceAccountToken'
import { IResource } from '../resources/resource'
import { logger } from './logger'

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

// search api does not provide paging but we want to break up our searches so as not to overtax the search api by querying for all apps at once
// this is pseudo-paging: we grab all apps that begin with a letter, that way we don't have overlapping results
// we don't want to do this letter by letter because that would take 36 searches
// so we create 6 groupings of letters and we try to make each group search return about the same number of apps
export const pagedSearchQueries: string[][] = [
  ['a*', 'i*', 'n*'],
  ['e*', 'r*', 'o*'],
  ['s*', 't*', 'u*', 'l*', 'm*', 'c*'],
  ['d*', 'b*', 'g*', '0*', '1*', '2*', '3*', '4*'],
  ['h*', 'p*', 'k*', 'y*', 'v*', 'z*', 'w*', 'f*'],
  ['j*', 'q*', 'x*', '5*', '6*', '7*', '8*', '9*'],
]

export async function getPagedSearchResources(
  query: {
    operationName: string
    variables: { input: { filters: { property: string; values: string[] }[]; limit: number }[] }
    query: string
  },
  usePagedQuery: boolean,
  kind: string,
  pass: number
) {
  const options = await getServiceAccountOptions()
  let resources: IResource[] = []
  for (let i = 0; i < pagedSearchQueries.length; ) {
    const _query = structuredClone(query)
    // should we limit the results by groupings of apps that
    // begin with certain letters?
    if (usePagedQuery) {
      const values = pagedSearchQueries[i]
      _query.variables.input[0].filters.push({
        property: 'name',
        values,
      })
    }
    let results: ISearchResult
    try {
      results = await getSearchResults(options, JSON.stringify(_query), kind, pass)
    } catch (e) {
      logger.error(`getPagedSearchResources ${kind} ${e}`)
      continue
    }
    const items = (results.data?.searchResult?.[0]?.items || []) as IResource[]
    resources = resources.concat(items)
    if (process.env.NODE_ENV !== 'test') {
      let timeout = 10000
      if (items.length < 1000) timeout = 2000
      await new Promise((r) => setTimeout(r, timeout))
    }
    if (!usePagedQuery) break
    i++
  }
  logger.info({
    msg: `search end ${kind}`,
    count: resources.length,
  })
  return resources
}

export function getSearchResults(
  options: string | RequestOptions | URL,
  variables: string,
  kind: string,
  pass: number
) {
  // if acm/mce are starting up, increase the timeout in case search hasn't started yet
  const requestTimeout = (pass <= 2 ? 10 : 2) * 60 * 1000
  return new Promise<ISearchResult>((resolve, reject) => {
    let body = ''
    const id = setTimeout(() => {
      logger.error(`getSearchResults ${kind} request timeout`)
      reject(Error('request timeout'))
    }, requestTimeout)
    const req = request(options, (res) => {
      res.on('data', (data) => {
        body += data
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(body) as ISearchResult
          if (result.message) {
            logger.error(`getSearchResults ${kind} return error ${result.message}`)
            reject(Error(result.message))
          }
          resolve(result)
        } catch (e) {
          // search might be overwhelmed
          // pause before next request
          logger.error(`getSearchResults ${kind} parse error ${e} ${body}`)
          setTimeout(() => {
            reject(Error(body))
          }, requestTimeout)
        }
        clearTimeout(id)
      })
    })
    req.on('error', (e) => {
      logger.error(`getSearchResults ${kind} request error ${e.message}`)
      reject(e)
    })
    req.write(variables)
    req.end()
  })
}
