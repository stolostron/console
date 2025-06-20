/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusPollProps, PrometheusResponse, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk'
import { useURLPoll as useFleetURLPoll } from './useURLPoll'
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN } from './constants'
import { getFleetPrometheusURL } from './utils'
import { useHubClusterName } from '../useHubClusterName'
import { getBackendUrl } from '../apiRequests'

type UsePrometheusPoll = (
  props: PrometheusPollProps & { cluster?: string }
) => [PrometheusResponse | null, unknown, boolean]

export const useFleetPrometheusPoll: UsePrometheusPoll = ({
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
}) => {
  const [hubClusterName] = useHubClusterName()
  const clusterForQuery = hubClusterName === cluster ? undefined : cluster

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
    clusterForQuery
      ? getFleetPrometheusURL(prometheusURLProps, `${getBackendUrl()}/observability`, clusterForQuery)
      : null,
    delay,
    query,
    timespan
  )

  const k8sPool = usePrometheusPoll({
    delay,
    endpoint,
    endTime,
    namespace,
    query: clusterForQuery ? undefined : query,
    samples,
    timeout,
    timespan,
    customDataSource,
  })

  return clusterForQuery ? fleetPool : (k8sPool as ReturnType<UsePrometheusPoll>)
}
