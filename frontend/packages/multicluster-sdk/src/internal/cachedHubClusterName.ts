/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../api/apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

const getHubClusterNameUrl = '/hub'
let cachedHubClusterName: string | undefined = undefined

export const fetchHubClusterName = async (): Promise<string | undefined> => {
  if (cachedHubClusterName) {
    return cachedHubClusterName
  }
  const url = getBackendUrl() + getHubClusterNameUrl
  const data = await consoleFetchJSON(url, 'GET')
  cachedHubClusterName = data.localHubName
  return cachedHubClusterName
}

export const getCachedHubClusterName = (): string | undefined => {
  return cachedHubClusterName
}
