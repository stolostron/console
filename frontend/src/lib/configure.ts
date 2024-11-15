/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources/utils'

export const configureUrl = '/configure'

export type IConfigureResult = {
  token_endpoint: string
}

export function configure() {
  const url = getBackendUrl() + '/configure'
  return getRequest<IConfigureResult>(url)
}
