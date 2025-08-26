/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusPollProps, PrometheusResponse, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk'
import { useURLPoll as useFleetURLPoll } from '../internal/useURLPoll'
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN } from '../internal/constants'
import { getFleetPrometheusURL } from '../internal/utils'
import { useHubClusterName } from './useHubClusterName'
import { getBackendUrl } from './../internal/apiRequests'
import { Fleet } from '../types'

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
  const [hubClusterName] = useHubClusterName()

  const clusterForQuery = hubClusterName !== cluster ? cluster : undefined
  const useFleet = !!clusterForQuery || allClusters

  const prometheusURLProps = {
    endpoint,
    endTime,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  }

  const fleetPool = useFleetURLPoll<PrometheusResponse>(
    useFleet ? getFleetPrometheusURL(prometheusURLProps, `${getBackendUrl()}/observability`) : null,
    delay,
    query,
    timespan
  )

  const k8sPool = usePrometheusPoll({
    delay,
    endpoint,
    endTime,
    namespace,
    query: useFleet ? undefined : query,
    samples,
    timeout,
    timespan,
    customDataSource,
  })

  return useFleet ? fleetPool : k8sPool
}
