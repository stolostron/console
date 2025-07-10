/* Copyright Contributors to the Open Cluster Management project */
import { k8sListItems } from '@openshift-console/dynamic-plugin-sdk'
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './apiRequests'
import { BASE_K8S_API_PATH, LOCAL_CLUSTER_LABEL, MANAGED_CLUSTER_API_PATH } from '../internal/constants'
import { ManagedClusterModel } from '../internal/models'
import { useHubClusterName } from './useHubClusterName'

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const [hubClusterName, loaded, error] = useHubClusterName()

  if (!cluster) return [BASE_K8S_API_PATH, true, undefined]

  if (!loaded) return [undefined, false, error]

  if (cluster === hubClusterName) return [BASE_K8S_API_PATH, true, undefined]

  return [`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`, loaded, error]
}

const NO_MULTICLUSTER = 'NO_MULTICLUSTER'
let cachedHubClusterName: string | undefined = undefined

export const getFleetK8sAPIPath = async (cluster?: string) => {
  if (!cluster) return BASE_K8S_API_PATH

  if (!cachedHubClusterName) {
    const hubClusters = await k8sListItems({
      model: ManagedClusterModel,
      queryParams: { labelSelector: { matchLabels: { [LOCAL_CLUSTER_LABEL]: true } } },
    }).catch((error) => {
      if (error.code === 404) {
        return []
      }
    })

    cachedHubClusterName = hubClusters?.[0]?.metadata?.name || NO_MULTICLUSTER
  }

  return cluster && cachedHubClusterName !== cluster
    ? `${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/${cluster}`
    : BASE_K8S_API_PATH
}
