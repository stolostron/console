/* Copyright Contributors to the Open Cluster Management project */
import { BASE_K8S_API_PATH } from '../internal/constants'
import { getFleetK8sAPIPath } from '../internal/getFleetK8sAPIPath'
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

  return [getFleetK8sAPIPath(hubClusterName, cluster), loaded, error]
}
