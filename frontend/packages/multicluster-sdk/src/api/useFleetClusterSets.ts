/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { ManagedClusterListGroupVersionKind } from '../internal/models'

// Helper function to check for condition - similar to checkForCondition from status-conditions.ts
const checkForCondition = (condition: string, conditions: V1CustomResourceDefinitionCondition[], status?: string) =>
  conditions?.find((c) => c.type === condition)?.status === (status ?? 'True')

/**
 * Hook that returns unique cluster set names from managed clusters with optional filtering by cluster proxy addon and availability status.
 *
 * This hook watches ManagedCluster resources and by default filters them to only include clusters
 * that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
 * the condition `ManagedClusterConditionAvailable` with status `True`. It then collects unique
 * values from the `cluster.open-cluster-management.io/clusterset` label.
 *
 * @param considerAllClusters - Optional boolean to consider all clusters regardless of labels and conditions.
 *   Defaults to false. When false (default), only considers clusters with the
 *   'feature.open-cluster-management.io/addon-cluster-proxy: available' label AND
 *   'ManagedClusterConditionAvailable' status: 'True'.
 *   When true, considers all clusters regardless of labels and conditions.
 *
 * @returns A tuple containing:
 *   - clusterSets: Array of unique cluster set names from the clusterset labels
 *   - loaded: Boolean indicating if the resource watch has loaded
 *   - error: Any error that occurred during the watch operation
 *
 * @example
 * ```tsx
 * // Get cluster sets from only clusters with cluster proxy addon available AND ManagedClusterConditionAvailable: 'True' (default behavior)
 * const [availableClusterSets, loaded, error] = useFleetClusterSets()
 *
 * // Get cluster sets from all clusters regardless of labels and conditions
 * const [allClusterSets, loaded, error] = useFleetClusterSets(true)
 *
 * // Explicitly filter by cluster proxy addon and availability (same as default)
 * const [filteredClusterSets, loaded, error] = useFleetClusterSets(false)
 *
 * if (!loaded) {
 *   return <Loading />
 * }
 *
 * if (error) {
 *   return <ErrorState error={error} />
 * }
 *
 * return (
 *   <div>
 *     {availableClusterSets.map(setName => (
 *       <div key={setName}>{setName}</div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useFleetClusterSets(considerAllClusters: boolean = false): [string[], boolean, any] {
  const [clusters, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
  })

  const clusterSetNames = clusters.flatMap((cluster) => {
    if (!cluster.metadata?.name) {
      return []
    }

    const clusterSetLabel = cluster.metadata?.labels?.['cluster.open-cluster-management.io/clusterset']
    if (!clusterSetLabel) {
      return []
    }

    if (considerAllClusters) {
      return [clusterSetLabel]
    }

    const hasClusterProxyLabel =
      cluster.metadata?.labels?.['feature.open-cluster-management.io/addon-cluster-proxy'] === 'available'

    // Check if cluster has ManagedClusterConditionAvailable status: 'True'
    const conditions = (cluster as any)?.status?.conditions || []
    const isClusterAvailable = checkForCondition('ManagedClusterConditionAvailable', conditions)

    return hasClusterProxyLabel && isClusterAvailable ? [clusterSetLabel] : []
  })

  // Return unique cluster set names
  const uniqueClusterSets = Array.from(new Set(clusterSetNames))

  return [uniqueClusterSets, loaded, error]
}
