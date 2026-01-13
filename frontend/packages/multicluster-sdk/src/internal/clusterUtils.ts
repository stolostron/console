/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'

/**
 * Helper function to check for condition - similar to checkForCondition from status-conditions.ts
 */
export const checkForCondition = (
  condition: string,
  conditions: V1CustomResourceDefinitionCondition[],
  status?: string
) => conditions?.find((c) => c.type === condition)?.status === (status ?? 'True')

/**
 * Checks if a managed cluster meets the default filtering criteria:
 * - Has the cluster proxy addon available label
 * - Has ManagedClusterConditionAvailable status: 'True'
 */
export const isClusterAvailable = (cluster: K8sResourceCommon): boolean => {
  const hasClusterProxyLabel =
    cluster.metadata?.labels?.['feature.open-cluster-management.io/addon-cluster-proxy'] === 'available'

  const conditions = (cluster as any)?.status?.conditions || []
  const isAvailable = checkForCondition('ManagedClusterConditionAvailable', conditions)

  return hasClusterProxyLabel && isAvailable
}

/**
 * Gets the cluster set name from a ManagedCluster resource.
 * Returns the cluster set label value or 'default' if not present.
 */
export const getClusterSetName = (cluster: K8sResourceCommon): string => {
  return cluster.metadata?.labels?.['cluster.open-cluster-management.io/clusterset'] || 'default'
}

/**
 * Filters clusters based on the provided criteria.
 * When includeAll is false, only returns clusters that meet the default availability criteria.
 * When includeAll is true, returns all clusters that have a name.
 */
export const filterClusters = (clusters: K8sResourceCommon[], includeAll: boolean): K8sResourceCommon[] => {
  return clusters.filter((cluster) => {
    if (!cluster.metadata?.name) {
      return false
    }

    return includeAll || isClusterAvailable(cluster)
  })
}
