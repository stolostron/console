/* Copyright Contributors to the Open Cluster Management project */
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './apiRequests'
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'
import { useHubClusterName } from './useHubClusterName'
import { getCachedHubClusterName } from '../internal/cachedHubClusterName'

/**
 * Hook that provides the k8s API path for the fleet.
 *
 * @param cluster - The cluster name.
 * @returns Array with `k8sAPIPath`, `loaded` and `error` values.
 */
export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const [hubClusterName, loaded, error] = useHubClusterName()

  if (!loaded) return [undefined, false, error]

  if (!cluster || cluster === hubClusterName) return [BASE_K8S_API_PATH, true, undefined]

  return [`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`, loaded, error]
}

/**
 * Function that provides the k8s API path for the fleet.
 *
 * @param cluster - The cluster name.
 * @returns The k8s API path for the fleet.
 */

export const getFleetK8sAPIPath = async (cluster?: string) => {
  const cachedHubClusterName = await getCachedHubClusterName()
  if (cluster && cachedHubClusterName !== cluster) {
    return `${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
  } else {
    return BASE_K8S_API_PATH
  }
}
