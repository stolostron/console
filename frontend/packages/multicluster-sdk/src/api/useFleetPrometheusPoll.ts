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
