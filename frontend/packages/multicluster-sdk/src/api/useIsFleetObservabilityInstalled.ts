/* Copyright Contributors to the Open Cluster Management project */
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that determines if the Observability service has been installed on the hub
 *
 * @returns A tuple containing:
 * - `response`: Boolean indicating whether the Observability service has been installed
 * - `loaded`: Boolean indicating if the request has completed (successfully or with error)
 * - `error`: Any error that occurred during the request, including dependency check failures
 *
 * @example
 * ```typescript
 * // Check if the Observability service has been installed
 * const [response, loaded, error] = useIsFleetObservabilityInstalled()
 * if (!loaded) {
 *  return <Loading />
 * }
 * if (error) {
 *   return <ErrorState error={error} />
 * }
 * if (!loaded) {
 *   return <Loading />
 * }
 *
 * if (error) {
 *   return <ErrorState error={error} />
 * }
 *
 * @remarks
 * This hook
 * - is used by the useFleetPrometheusPoll() hook to determine if metrics can be retrieved from clusters outside of the hub cluster.
 * - see RHACM documentation for how to enable observability
 * https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.14/html/observability/observing-environments-intro#enabling-observability-service
 *
 */
export function useIsFleetObservabilityInstalled(): [
  isObservabilityInstalled: boolean | undefined,
  loaded: boolean,
  error: unknown,
] {
  return useHubConfigurationItem('isObservabilityInstalled')
}
