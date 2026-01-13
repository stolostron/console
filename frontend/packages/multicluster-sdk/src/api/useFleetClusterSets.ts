/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { FleetClusterNamesOptions, ClusterSetData } from '../types/fleet'
import { useFleetClustersInternal, organizeClustersBySet } from '../internal/useFleetClustersInternal'

/**
 * Hook that returns cluster names organized by cluster sets with optional filtering.
 *
 * This hook watches ManagedCluster resources and by default filters them to only include clusters
 * that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
 * the condition `ManagedClusterConditionAvailable` with status `True`. It then organizes cluster
 * names by their cluster set labels.
 *
 * @param options - Configuration object for cluster set organization
 * @param options.returnAllClusters - Whether to return all clusters regardless of availability status. Defaults to false.
 * @param options.clusterSets - Specific cluster set names to include. If not specified, includes all cluster sets.
 * @param options.includeGlobal - Whether to include a special "global" set containing all clusters. Defaults to false.
 *
 * @returns A tuple containing:
 *   - clusterSetData: ClusterSetData object organized by cluster sets
 *   - loaded: Boolean indicating if the resource watch has loaded
 *   - error: Any error that occurred during the watch operation
 *
 * @example
 * ```tsx
 * // Get clusters organized by cluster sets (default behavior)
 * const [clusterSetData, loaded, error] = useFleetClusterSets({})
 *
 * // Include global set with all clusters
 * const [clusterSetsWithGlobal, loaded, error] = useFleetClusterSets({
 *   includeGlobal: true
 * })
 *
 * // Filter to specific cluster sets
 * const [productionAndStaging, loaded, error] = useFleetClusterSets({
 *   clusterSets: ['production', 'staging']
 * })
 *
 * if (!loaded) return <Loading />
 * if (error) return <ErrorState error={error} />
 *
 * return (
 *   <div>
 *     {clusterSetData.global && (
 *       <div>
 *         <h3>All Clusters</h3>
 *         {clusterSetData.global.map(name => <div key={name}>{name}</div>)}
 *       </div>
 *     )}
 *     {Object.entries(clusterSetData).filter(([setName]) => setName !== 'global').map(([setName, clusters]) => (
 *       <div key={setName}>
 *         <h3>{setName}</h3>
 *         {clusters.map(name => <div key={name}>{name}</div>)}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useFleetClusterSets(options: FleetClusterNamesOptions = {}): [ClusterSetData, boolean, any] {
  const returnAllClusters = options.returnAllClusters ?? false

  const [filteredClusters, loaded, error] = useFleetClustersInternal(returnAllClusters, options)

  const result = useMemo(() => {
    return organizeClustersBySet(filteredClusters, options)
  }, [filteredClusters, options])

  return [result, loaded, error]
}
