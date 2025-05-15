/* Copyright Contributors to the Open Cluster Management project */
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './utils/fetchRetry'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  if (cluster) {
    return `${getBackendUrl()}/managedclusterproxy/${cluster}`
  } else {
    return '/api/kubernetes'
  }
}

export const getBaseURLApiPath = (cluster?: string) => {
  if (cluster) {
    return `${getBackendUrl()}/managedclusterproxy/${cluster}`
  } else {
    return '/api/kubernetes'
  }
}
