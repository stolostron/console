/* Copyright Contributors to the Open Cluster Management project */
import { OutgoingHttpHeaders } from 'http2'
import { RequestOptions, request } from 'https'
import { URL } from 'url'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'
import { getNamespace, getServiceAccountToken, getServiceCACertificate } from '../lib/serviceAccountToken'

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
  const searchService = `https://search-search-api.${mch?.metadata?.namespace || namespace}.svc.cluster.local:4010`
  const searchUrl = process.env.SEARCH_API_URL || searchService
  const endpoint =
    process.env.searchApiEnpoint ||
    (process.env.globalSearchFeatureFlag === 'enabled' ? '/federated' : '/searchapi/graphql')
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
