/* Copyright Contributors to the Open Cluster Management project */
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './use-fleet-k8s-watch-resource'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  if (cluster) {
    return `${getBackendUrl()}/managedclusterproxy/${cluster}`
  } else {
    return '/api/kubernetes'
  }
}
