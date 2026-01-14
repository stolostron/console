/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useFleetClustersInternal } from '../internal/useFleetClustersInternal'

/**
 * Hook that returns names of managed clusters with optional filtering by cluster proxy addon and availability status.
 *
 * This hook watches ManagedCluster resources and by default filters them to only include clusters
 * that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
 * the condition `ManagedClusterConditionAvailable` with status `True`.
 *
 * @param returnAllClusters - Optional boolean to return all cluster names regardless of labels and conditions.
 *   Defaults to false. When false (default), only returns clusters with the
 *   'feature.open-cluster-management.io/addon-cluster-proxy: available' label AND
 *   'ManagedClusterConditionAvailable' status: 'True'.
 *   When true, returns all cluster names regardless of labels and conditions.
 *
 * @returns A tuple containing:
 *   - clusterNames: Array of cluster names (filtered by default, or all clusters if specified)
 *   - loaded: Boolean indicating if the resource watch has loaded
 *   - error: Any error that occurred during the watch operation
 *
 * @example
 * ```tsx
 * // Get only clusters with cluster proxy addon available AND ManagedClusterConditionAvailable: 'True' (default behavior)
 * const [availableClusterNames, loaded, error] = useFleetClusterNames()
 *
 * // Get all cluster names regardless of labels and conditions
 * const [allClusterNames, loaded, error] = useFleetClusterNames(true)
 *
 * // Explicitly filter by cluster proxy addon and availability (same as default)
 * const [filteredClusterNames, loaded, error] = useFleetClusterNames(false)
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
 *     {availableClusterNames.map(name => (
 *       <div key={name}>{name}</div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useFleetClusterNames(returnAllClusters?: boolean): [string[], boolean, any] {
  const [filteredClusters, loaded, error] = useFleetClustersInternal({ returnAllClusters })

  const result = useMemo(() => {
    return filteredClusters.map((cluster) => cluster.metadata!.name!)
  }, [filteredClusters])

  return [result, loaded, error]
}
