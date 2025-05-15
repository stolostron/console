/* Copyright Contributors to the Open Cluster Management project */

import { fetchGet, getBackendUrl } from './fetchRetry'

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
      fetchGet<ResultT>(url, abortController.signal).then((result: { data: any }) => result.data)
    ),
    abort: () => abortController.abort(),
  }
}

export function getApiPaths() {
  const url = getBackendUrl() + versionUrl
  return getRequest<APIResourceNames>(url)
}
