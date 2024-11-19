/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources/utils'

export const usernameUrl = '/username'

export type IUsernameResult = {
  body: {
    username: string
  }
  statusCode: number
}

export function getUsername() {
  const url = getBackendUrl() + usernameUrl
  return getRequest<IUsernameResult>(url)
}
