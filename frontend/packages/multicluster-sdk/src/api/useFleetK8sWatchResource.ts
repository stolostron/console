/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource as useInternalFleetK8sWatchResource } from './use-fleet-k8s-watch-resource/use-fleet-k8s-watch-resource'
import { UseFleetK8sWatchResource } from '../types'

export const useFleetK8sWatchResource: UseFleetK8sWatchResource = (initResource) => {
  const hubClusterName = useHubClusterName()
  return useInternalFleetK8sWatchResource(hubClusterName, initResource)
}
