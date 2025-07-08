/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../api/apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

const getHubClusterNameUrl = '/hub'
let cachedhubClusterName: string | undefined = undefined

export const fetchHubClusterName = async () => {
  if (cachedhubClusterName) {
    return cachedhubClusterName
  }
  const url = getBackendUrl() + getHubClusterNameUrl
  const data = await consoleFetchJSON(url, 'GET')
  cachedhubClusterName = data.localHubName
  return cachedhubClusterName
}

export const getCachedHubClusterName = () => {
  return cachedhubClusterName
}
