/* Copyright Contributors to the Open Cluster Management project */
import { fetchHubConfiguration } from '../internal/cachedHubConfiguration'
import { MANAGED_CLUSTER_API_PATH, BASE_K8S_API_PATH } from '../internal/constants'
import { getBackendUrl } from '../internal/apiRequests'

/**
 * Function that provides the k8s API path for the fleet.
 *
 * @param cluster - The cluster name.
 * @returns The k8s API path for the fleet.
 */

export const getFleetK8sAPIPath = async (cluster?: string) => {
  const cacheHubConfiguration = await fetchHubConfiguration()
  const cachedHubClusterName = cacheHubConfiguration?.localHubName
  if (cluster && cachedHubClusterName !== cluster) {
    return `${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
  } else {
    return BASE_K8S_API_PATH
  }
}
