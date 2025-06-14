/* Copyright Contributors to the Open Cluster Management project */
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './utils/api-resource-list'
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from './constants'
import { useBackendURL } from './useBackendURL'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const [backendURL, loaded, error] = useBackendURL(cluster)

  const fleetK8sApiPath = backendURL ? `${backendURL}/${MANAGED_CLUSTER_API_PATH}/${cluster}` : undefined
  return [fleetK8sApiPath, loaded, error]
}

export const getFleetK8sAPIPath = async (cluster?: string) => {
  if (cluster) {
    const backendURL = await getBackendUrl()
    return `${backendURL}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
  } else {
    return BASE_K8S_API_PATH
  }
}
