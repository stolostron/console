/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useFleetClustersInternal } from '../internal/useFleetClustersInternal'
import { getClusterSetName } from '../internal/clusterUtils'

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
 * const [availableClusterSets, loaded, error] = useFleetClusterSetNames()
 *
 * // Get cluster sets from all clusters regardless of labels and conditions
 * const [allClusterSets, loaded, error] = useFleetClusterSetNames(true)
 *
 * // Explicitly filter by cluster proxy addon and availability (same as default)
 * const [filteredClusterSets, loaded, error] = useFleetClusterSetNames(false)
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
export function useFleetClusterSetNames(considerAllClusters: boolean = false): [string[], boolean, any] {
  const [filteredClusters, loaded, error] = useFleetClustersInternal({
    returnAllClusters: considerAllClusters,
  })

  const uniqueClusterSets = useMemo(() => {
    const clusterSetNames = filteredClusters.map(getClusterSetName)

    // Return unique cluster set names
    return Array.from(new Set(clusterSetNames))
  }, [filteredClusters])

  return [uniqueClusterSets, loaded, error]
}
