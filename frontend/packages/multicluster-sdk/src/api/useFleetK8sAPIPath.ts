/* Copyright Contributors to the Open Cluster Management project */
import { useFleetSupport } from '../internal/hooks/useFleetSupport'
import { shouldUseFleetSupport } from '../internal/utils/shouldUseFleetSupport'
import { UseFleetK8sAPIPath } from '../types'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const fleetSupport = useFleetSupport()
  if (shouldUseFleetSupport(fleetSupport, cluster)) {
    const {
      sdkProvider: { getFleetK8sAPIPath },
    } = fleetSupport
    return getFleetK8sAPIPath(cluster)
  } else {
    return '/api/kubernetes'
  }
}
