/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusPollProps, PrometheusResponse, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk'
import { useURLPoll as useFleetURLPoll } from '../internal/useURLPoll'
import {
  BACKEND_URL,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
  MULTICLUSTER_OBSERVABILITY_NOT_INSTALLED,
} from '../internal/constants'
import { getFleetPrometheusURL } from '../internal/utils'
import { useHubClusterName } from './useHubClusterName'
import { Fleet } from '../types'
import { useIsFleetObservabilityInstalled } from './useIsFleetObservabilityInstalled'

/**
 * A fleet version of [`usePrometheusPoll`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#useprometheuspoll) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that polls Prometheus for metrics data from a specific cluster or across all clusters.
 *
 *
 * @param {PrometheusEndpoint} endpoint - one of the PrometheusEndpoint (label, query, range, rules, targets)
 * @param {string} [cluster] - The target cluster name. If not specified or matches hub cluster, queries local Prometheus
 * @param {boolean} [allClusters] - If true, queries across all clusters in the fleet (requires observability)
 * @param {string} [query] - (optional) Prometheus query string. If empty or undefined, polling is not started.
 * @param {number} [delay] - (optional) polling delay interval (ms)
 * @param {number} [endTime] - (optional) for QUERY_RANGE enpoint, end of the query range
 * @param {number} [samples] - (optional) for QUERY_RANGE enpoint
 * @param {number} [timespan] - (optional) for QUERY_RANGE enpoint
 * @param {string} [namespace] - (optional) a search param to append
 * @param {string} [timeout] - (optional) a search param to append
 *
 * @returns A tuple containing:
 * - `response`: PrometheusResponse object with query results, or undefined if loading/error
 * - `loaded`: Boolean indicating if the request has completed (successfully or with error)
 * - `error`: Any error that occurred during the request, including dependency check failures
 *
 * @example
 * ```typescript
 * // Query a specific cluster
 * const [response, loaded, error] = useFleetPrometheusPoll({
 *   cluster: 'my-managed-cluster',
 *   query: 'up',
 *   delay: 30000
 * });
 *
 * // Query all clusters (requires observability -- see the useIsFleetObservabilityInstalled() hook)
 * const [response, loaded, error] = useFleetPrometheusPoll({
 *   allClusters: true,
 *   query: 'cluster:cpu_usage_cores:sum',
 *   delay: 30000
 * });
 *
 * // Query hub cluster (same as local)
 * const [response, loaded, error] = useFleetPrometheusPoll({
 *   query: 'node_memory_MemAvailable_bytes',
 *   delay: 15000
 * });
 * ```
 *
 * @remarks
 * This hook intelligently routes Prometheus queries based on the target cluster:
 * - If no cluster is specified or the cluster matches the hub cluster, it uses the local Prometheus instance
 * - If a specific managed cluster is specified, it uses the fleet observability service (requires multicluster observability to be installed)
 * - If `allClusters` is true, it queries across all clusters in the fleet using the observability service
 *
 * The hook automatically handles:
 * - Checking if multicluster observability is installed when needed using useIsFleetObservabilityInstalled() hook
 * - Determining the hub cluster name for comparison
 * - Routing queries to the appropriate Prometheus endpoint
 * - Providing appropriate error states when dependencies are not available
 */

export const useFleetPrometheusPoll: (
  props: Fleet<PrometheusPollProps> & { allClusters?: boolean }
) => [response: PrometheusResponse | undefined, loaded: boolean, error: unknown] = ({
  delay,
  endpoint,
  endTime,
  namespace,
  query,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
  customDataSource,
  cluster,
  allClusters,
}) => {
  const [isObservabilityInstalled, isObservabilityInstalledLoaded, isObservabilityInstalledError] =
    useIsFleetObservabilityInstalled()
  const [hubClusterName, hubClusterNameLoaded, hubClusterNameLoadedError] = useHubClusterName()

  const waitingForHubClusterName = !allClusters && !!cluster && !hubClusterNameLoaded
  const isFleetQuery = allClusters || (cluster && cluster !== hubClusterName)

  // avoid using the multicluster observability query if it is not installed
  // avoid using either query if we are still waiting for the hub name to compare against the supplied cluster name
  const useFleet = isFleetQuery && isObservabilityInstalled && !waitingForHubClusterName
  const useLocal = !isFleetQuery && !waitingForHubClusterName

  const prometheusURLProps = {
    endpoint,
    endTime,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  }

  const fleetPoll = useFleetURLPoll<PrometheusResponse>(
    useFleet ? getFleetPrometheusURL(prometheusURLProps, `${BACKEND_URL}/observability`) : null,
    delay,
    query,
    timespan
  )

  const localPoll = usePrometheusPoll({
    delay,
    endpoint,
    endTime,
    namespace,
    query: useLocal ? query : undefined,
    samples,
    timeout,
    timespan,
    customDataSource,
  })

  if (waitingForHubClusterName) {
    // if we are still waiting for hub name to load,
    // there is no result, loaded is false, and we should return any error fetching the hub name
    return [undefined, false, hubClusterNameLoadedError]
  } else if (isFleetQuery && !isObservabilityInstalledLoaded) {
    // if we need to use multicluster observability but we don't yet know if it is installed,
    // there is no result, loaded is false, and we should return any error fetching the installation status
    return [undefined, false, isObservabilityInstalledError]
  } else if (isFleetQuery && !isObservabilityInstalled) {
    // if we need to use multicluster observability but it it not installed,
    // we return an error
    return [undefined, false, MULTICLUSTER_OBSERVABILITY_NOT_INSTALLED]
  } else {
    // otherwise, we return the fleet or single-cluster prometheus query result accordingly
    return useFleet ? fleetPoll : localPoll
  }
}
