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
        count: number
        kind: string
      }[]
    }[]
  }
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

export function getSearchResults(options: string | RequestOptions | URL, variables: string) {
  return new Promise<ISearchResult>((resolve, reject) => {
    let body = ''
    const req = request(options, (res) => {
      res.on('data', (data) => {
        body += data
      })
      res.on('end', () => {
        resolve(JSON.parse(body) as ISearchResult)
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

// get argo apps from search api in three queries with a second apart
// Search API mosquito bites -- just a few every n seconds
export const pagedSearchQueries: string[][] = [
  ['a*'],
  ['i*'],
  ['n*'],
  ['e*'],
  ['r*'],
  ['o*'],
  ['s*'],
  ['t*'],
  ['u*'],
  ['l*'],
  ['m*'],
  ['c*'],
  ['p*'],
  ['z*'],
  ['d*', 'b*', 'g*', '0*', '1*', '2*', '3*', '4*', '5*'],
  ['h*', 'k*', 'y*', 'v*', 'w*', 'f*', '6*', '7*', '8*', '9*'],
]
export async function getPagedSearchResources(
  query: {
    operationName: string
    variables: { input: { filters: { property: string; values: string[] }[]; limit: number }[] }
    query: string
  },
  pass: number
) {
  const options = await getServiceAccountOptions()
  let resources: IResource[] = []
  for (let i = 0; i < pagedSearchQueries.length; i++) {
    const values = pagedSearchQueries[i]
    const _query = structuredClone(query)
    _query.variables.input[0].filters.push({
      property: 'name',
      values,
    })
    if (pass === 2) {
      _query.variables.input[0].limit = 100
    }
    const results: ISearchResult = await getSearchResults(options, JSON.stringify(_query))
    resources = resources.concat((results.data?.searchResult?.[0]?.items || []) as IResource[])
    if (process.env.NODE_ENV !== 'test') {
      let timeout = 10000
      if (pass === 2) timeout = 1000
      if (pass === 3) timeout = 3000
      await new Promise((r) => setTimeout(r, timeout))
    }
  }
  return resources
}
