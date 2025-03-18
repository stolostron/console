/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../resources/utils'
import { UseFleetK8sAPIPath } from '@stolostron/multicluster-sdk'

export const getFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  return `${getBackendUrl()}/managedclusterproxy/${cluster}`
}
