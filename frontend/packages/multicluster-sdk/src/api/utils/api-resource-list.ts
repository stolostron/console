/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

const versionUrl = '/apiPaths'

export interface APIResourceNames {
  [kind: string]: APIResourceMeta
}

export interface APIResourceMeta {
  [kind: string]: { pluralName: string }
}

export interface IRequestResult<ResultType = unknown> {
  promise: Promise<ResultType>
  abort: () => void
}

export function getRequest<ResultT>(url: string | Promise<string>): IRequestResult<ResultT> {
  const abortController = new AbortController()
  return {
    promise: Promise.resolve(url).then((url) =>
      consoleFetchJSON(url, 'GET', { signal: abortController.signal }).then((result: { data: any }) => result.data)
    ),
    abort: () => abortController.abort(),
  }
}

export function getBackendUrl() {
  return '/api/proxy/plugin/acm/console/multicloud'
  // if (process.env.NODE_ENV === 'test') {
  //   return process.env.JEST_DEFAULT_HOST ?? ''
  // }
  // if (process.env.MODE === 'plugin') {
  //   const proxyPath = process.env.PLUGIN_PROXY_PATH
  //   const value = proxyPath ? `${proxyPath}${process.env.REACT_APP_BACKEND_PATH}` : ''
  //   return value
  // }
  // /* istanbul ignore next */
  // return process.env.REACT_APP_BACKEND_PATH ?? ''
}

export function getApiPaths() {
  const url = getBackendUrl() + versionUrl
  return getRequest<APIResourceNames>(url)
}
