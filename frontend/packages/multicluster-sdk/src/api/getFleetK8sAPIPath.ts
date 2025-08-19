/* Copyright Contributors to the Open Cluster Management project */
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'

import { getBackendUrl } from '../internal/apiRequests'
import { isHubRequest } from '../internal/isHubRequest'

/**
 * Function that provides the k8s API path for the fleet.
 *
 * @param cluster - The cluster name.
 * @returns The k8s API path for the fleet.
 */

export const getFleetK8sAPIPath = async (cluster?: string) => {
  if (await isHubRequest(cluster)) {
    return BASE_K8S_API_PATH
  } else {
    return `${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
  }
}
