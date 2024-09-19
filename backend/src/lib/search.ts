/* Copyright Contributors to the Open Cluster Management project */
import { OutgoingHttpHeaders } from 'http2'
import { RequestOptions, request } from 'https'
import { URL } from 'url'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'
import { getNamespace, getServiceAccountToken, getServiceCACertificate } from '../lib/serviceAccountToken'
import { IResource } from '../resources/resource'

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
      if (pass === 1) {
        _query.variables.input[0].limit = 100
      }
    }
    let results: ISearchResult
    try {
      results = await getSearchResults(options, JSON.stringify(_query))
    } catch (e) {
      continue
    }
    const items = (results.data?.searchResult?.[0]?.items || []) as IResource[]
    resources = resources.concat(items)
    if (process.env.NODE_ENV !== 'test') {
      let timeout = 10000
      if (pass === 2 || items.length < 1000) timeout = 2000
      if (pass === 1 || items.length < 100) timeout = 1000
      await new Promise((r) => setTimeout(r, timeout))
    }
    if (!usePagedQuery) break
    i++
  }
  return resources
}

export function getSearchResults(options: string | RequestOptions | URL, variables: string) {
  return new Promise<ISearchResult>((resolve, reject) => {
    let body = ''
    const id = setTimeout(
      () => {
        console.error('request timeout')
        reject(Error('request timeout'))
      },
      2 * 60 * 1000
    )
    const req = request(options, (res) => {
      res.on('data', (data) => {
        body += data
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(body) as ISearchResult
          if (result.message) {
            console.error(result.message)
            reject(Error(result.message))
          }
          resolve(result)
        } catch (e) {
          // search might be overwhelmed
          // pause before next request
          setTimeout(() => {
            console.error(body)
            reject(Error(body))
          }, 2 * 1000)
        }
        clearTimeout(id)
      })
    })
    req.on('error', (e) => {
      console.error(e)
      reject(e)
    })
    req.write(variables)
    req.end()
  })
}
