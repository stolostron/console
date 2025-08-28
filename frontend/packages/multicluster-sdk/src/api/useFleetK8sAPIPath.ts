/* Copyright Contributors to the Open Cluster Management project */
import { BACKEND_URL, BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that provides the k8s API path for the fleet.
 *
 * @param cluster - The cluster name.
 * @returns Array with `k8sAPIPath`, `loaded` and `error` values.
 */
export function useFleetK8sAPIPath(
  cluster?: string
): [k8sAPIPath: string | undefined, loaded: boolean, error: Error | undefined] {
  const [hubClusterName, loaded, error] = useHubConfigurationItem('localHubName')

  if (!loaded) return [undefined, false, error]

  if (!cluster || cluster === hubClusterName) return [BASE_K8S_API_PATH, true, undefined]

  return [`${BACKEND_URL}/${MANAGED_CLUSTER_API_PATH}/${cluster}`, loaded, error]
}
