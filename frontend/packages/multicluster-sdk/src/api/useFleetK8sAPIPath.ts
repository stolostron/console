/* Copyright Contributors to the Open Cluster Management project */
import { k8sListItems } from '@openshift-console/dynamic-plugin-sdk'
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './apiRequests'
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH, ManagedClusterModel } from './constants'
import { useHubClusterName } from './useHubClusterName'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const [hubClusterName, loaded, error] = useHubClusterName()

  if (!loaded) return [undefined, false, error]

  if (!cluster || cluster === hubClusterName) return [BASE_K8S_API_PATH, true, undefined]

  return [`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`, loaded, error]
}

export const getFleetK8sAPIPath = async (cluster?: string) => {
  const hubClusters = await k8sListItems({
    model: ManagedClusterModel,
    queryParams: { labelSelector: `local-cluster=true` },
  })

  const hubCluster = hubClusters?.[0]

  if (cluster && hubCluster?.metadata?.name !== cluster) {
    return `${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
  } else {
    return BASE_K8S_API_PATH
  }
}
