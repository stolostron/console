/* Copyright Contributors to the Open Cluster Management project */
import { UseIsFleetPrometheusAvailable } from '../types'
import { useMemo } from 'react'
import { MultiClusterObservabilityKind } from '../internal/models'
import { useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'

// Define the condition type for proper TypeScript typing
type K8sCondition = {
  type: string
  status: string
  lastTransitionTime?: string
  reason?: string
  message?: string
}

// Define the MultiClusterObservability resource type
type MultiClusterObservabilityResource = K8sResourceCommon & {
  status?: {
    conditions?: K8sCondition[]
  }
}

/**
 * Hook that determines if the fleet Prometheus is available.
 *
 * Checks if a MultiClusterObservability resource has been installed which supports using Thanos to collect
 * Prometheus metrics data from fleet clusters usch as CPU and Memory.
 *
 * @returns `true` if a MultiClusterObservability resource has been installed and is available; `false` otherwise
 */
export const useIsFleetPrometheusAvailable: UseIsFleetPrometheusAvailable = () => {
  const [mcos, loaded, error] = useK8sWatchResource<MultiClusterObservabilityResource[]>({
    groupVersionKind: MultiClusterObservabilityKind,
    isList: true,
  })

  const isMcoRunning = useMemo(
    () =>
      loaded &&
      mcos.length === 1 &&
      Boolean(mcos[0]?.status?.conditions?.find((c: K8sCondition) => c.type === 'Ready' && c?.status === 'True')),
    [mcos, loaded]
  )

  return useMemo(() => [isMcoRunning, loaded, error], [isMcoRunning, loaded, error])
}
