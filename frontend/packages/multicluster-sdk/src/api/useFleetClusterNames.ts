/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useFleetClustersInternal } from '../internal/useFleetClustersInternal'

/**
 * Hook that returns names of managed clusters with optional filtering.
 *
 * This hook watches ManagedCluster resources and by default filters them to only include clusters
 * that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
 * the condition `ManagedClusterConditionAvailable` with status `True`.
 *
 * @param returnAllClusters - Optional boolean to return all cluster names regardless of availability status. Defaults to false.
 *
 * @returns A tuple containing:
 *   - clusterNames: Array of cluster names
 *   - loaded: Boolean indicating if the resource watch has loaded
 *   - error: Any error that occurred during the watch operation
 *
 * @example
 * ```tsx
 * // Get available cluster names (default behavior)
 * const [availableClusterNames, loaded, error] = useFleetClusterNames()
 *
 * // Get all cluster names regardless of availability
 * const [allClusterNames, loaded, error] = useFleetClusterNames(true)
 *
 * if (!loaded) return <Loading />
 * if (error) return <ErrorState error={error} />
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
  const shouldReturnAllClusters = returnAllClusters ?? false

  const [filteredClusters, loaded, error] = useFleetClustersInternal(shouldReturnAllClusters)

  const result = useMemo(() => {
    return filteredClusters.map((cluster) => cluster.metadata!.name!)
  }, [filteredClusters])

  return [result, loaded, error]
}
