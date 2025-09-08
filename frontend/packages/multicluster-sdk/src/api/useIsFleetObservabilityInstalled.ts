/* Copyright Contributors to the Open Cluster Management project */
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that provides is observability installed.
 *
 * @returns Array with `isObservabilityInstalled`, `loaded` and `error` values.
 */
export function useIsFleetObservabilityInstalled(): [
  isObservabilityInstalled: boolean | undefined,
  loaded: boolean,
  error: unknown,
] {
  return useHubConfigurationItem('isObservabilityInstalled')
}
