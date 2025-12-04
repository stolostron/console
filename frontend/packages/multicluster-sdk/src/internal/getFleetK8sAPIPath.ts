/* Copyright Contributors to the Open Cluster Management project */
import { BASE_K8S_API_PATH, BACKEND_URL, MANAGED_CLUSTER_API_PATH } from './constants'

export function getFleetK8sAPIPath(hubClusterName?: string, cluster?: string) {
  return !cluster || cluster === hubClusterName
    ? BASE_K8S_API_PATH
    : `${BACKEND_URL}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
}
