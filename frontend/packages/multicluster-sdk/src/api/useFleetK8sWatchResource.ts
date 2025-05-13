/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetSupport } from '../internal/hooks/useFleetSupport'
import { UseFleetK8sWatchResource } from '../types'

export const useFleetK8sWatchResource: UseFleetK8sWatchResource = (...args) => {
  const fleetSupport = useFleetSupport()
  // Technically this is a conditional hook call, but the hook will only change and crash the page when the ACM plugin is disabled or enabled
  if (fleetSupport) {
    const {
      sdkProvider: { useFleetK8sWatchResource },
      hubClusterName,
    } = fleetSupport
    return useFleetK8sWatchResource(hubClusterName, ...args)
  } else {
    return useK8sWatchResource(...args)
  }
}
