/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources/utils'

const versionUrl = '/apiPaths'

export interface APIResourceNames {
  [kind: string]: APIResourceMeta
}

export interface APIResourceMeta {
  [kind: string]: { pluralName: string }
}

export function getApiPaths() {
  const url = getBackendUrl() + versionUrl
  return getRequest<APIResourceNames>(url)
}
