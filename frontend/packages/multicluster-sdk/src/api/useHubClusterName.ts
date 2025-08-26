/* Copyright Contributors to the Open Cluster Management project */
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that provides hub cluster name.
 *
 * @returns Array with `hubclustername`, `loaded` and `error` values.
 */
export function useHubClusterName(): [hubClusterName: string | undefined, loaded: boolean, error: any] {
  return useHubConfigurationItem('localHubName')
}
