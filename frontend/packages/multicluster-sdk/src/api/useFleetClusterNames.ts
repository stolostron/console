/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { K8sResourceCommon, useK8sWatchResource, Selector } from '@openshift-console/dynamic-plugin-sdk'
import { ManagedClusterListGroupVersionKind } from '../internal/models'
import { filterClusters } from '../internal/clusterUtils'
import { ClusterSetData, FleetClusterNamesOptions } from '../types/fleet'

// Overload 1: Simple signature returning cluster names as string array
export function useFleetClusterNames(returnAllClusters?: boolean): [string[], boolean, any]

// Overload 2: Advanced signature returning structured cluster set data
export function useFleetClusterNames(options: FleetClusterNamesOptions): [ClusterSetData, boolean, any]

/**
 * Hook that returns names of managed clusters with optional filtering and cluster set organization.
 *
 * This hook watches ManagedCluster resources and by default filters them to only include clusters
 * that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
 * the condition `ManagedClusterConditionAvailable` with status `True`.
 *
 * The hook supports two modes:
 * 1. **Simple mode**: Returns a flat array of cluster names (backward compatible)
 * 2. **Advanced mode**: Returns structured data organized by cluster sets
 *
 * @param returnAllClusters - When using simple mode: optional boolean to return all cluster names
 *   regardless of availability status. Defaults to false.
 * @param options - When using advanced mode: configuration object for cluster set organization
 * @param options.returnAllClusters - Whether to return all clusters regardless of availability status. Defaults to false.
 * @param options.clusterSets - Specific cluster set names to include. If not specified, includes all cluster sets.
 * @param options.includeGlobal - Whether to include a special "global" set containing all clusters. Defaults to false.
 * @param options.includeClustersNotInSets - Whether to include clusters not assigned to any cluster set. Defaults to true.
 *
 * @returns A tuple containing:
 *   - clusterData: Either string[] (simple mode) or ClusterSetData (advanced mode)
 *   - loaded: Boolean indicating if the resource watch has loaded
 *   - error: Any error that occurred during the watch operation
 *
 * @example
 * ```tsx
 * // Simple mode examples
 * const [availableClusterNames, loaded, error] = useFleetClusterNames()
 * const [allClusterNames, loaded2, error2] = useFleetClusterNames(true)
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
 *
 * @example
 * ```tsx
 * // Advanced mode examples
 * const [clusterSetData, loaded, error] = useFleetClusterNames({
 *   clusterSets: ['production', 'staging'],
 *   includeGlobal: true,
 *   includeClustersNotInSets: false
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
 *     {Object.entries(clusterSetData.clusterSets).map(([setName, clusters]) => (
 *       <div key={setName}>
 *         <h3>{setName}</h3>
 *         {clusters.map(name => <div key={name}>{name}</div>)}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useFleetClusterNames(
  returnAllClustersOrOptions?: boolean | FleetClusterNamesOptions
): [string[] | ClusterSetData, boolean, any] {
  // Determine if we're using simple or advanced mode
  const isAdvancedMode = typeof returnAllClustersOrOptions === 'object'
  const options = isAdvancedMode ? returnAllClustersOrOptions : undefined
  const returnAllClusters = isAdvancedMode ? options?.returnAllClusters ?? false : returnAllClustersOrOptions ?? false

  // Build selector for optimization when possible
  const selector = useMemo((): Selector | undefined => {
    if (!isAdvancedMode || !options?.clusterSets?.length) {
      return undefined
    }

    // Only optimize if we're not including global or clusters not in sets
    if (options.includeGlobal || options.includeClustersNotInSets !== false) {
      return undefined
    }

    // For single cluster set, use exact match
    if (options.clusterSets.length === 1) {
      return {
        matchLabels: {
          'cluster.open-cluster-management.io/clusterset': options.clusterSets[0],
        },
      }
    }

    // For multiple cluster sets, use 'in' operator
    return {
      matchExpressions: [
        {
          key: 'cluster.open-cluster-management.io/clusterset',
          operator: 'In',
          values: options.clusterSets,
        },
      ],
    }
  }, [isAdvancedMode, options?.clusterSets, options?.includeGlobal, options?.includeClustersNotInSets])

  const [clusters, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
    ...(selector && { selector }),
  })

  const result = useMemo(() => {
    const filteredClusters = filterClusters(clusters, returnAllClusters)

    if (!isAdvancedMode) {
      // Simple mode: return cluster names array
      return filteredClusters.map((cluster) => cluster.metadata!.name!)
    }

    // Advanced mode: organize by cluster sets
    const clusterSetData: ClusterSetData = {
      clusterSets: {},
    }

    // Organize clusters by their cluster set labels
    for (const cluster of filteredClusters) {
      const clusterName = cluster.metadata!.name!
      const clusterSetLabel = cluster.metadata?.labels?.['cluster.open-cluster-management.io/clusterset']

      // Add to global set if requested
      if (options?.includeGlobal) {
        if (!clusterSetData.global) {
          clusterSetData.global = []
        }
        clusterSetData.global.push(clusterName)
      }

      if (clusterSetLabel) {
        // Check if this cluster set should be included
        if (!options?.clusterSets || options.clusterSets.includes(clusterSetLabel)) {
          if (!clusterSetData.clusterSets[clusterSetLabel]) {
            clusterSetData.clusterSets[clusterSetLabel] = []
          }
          clusterSetData.clusterSets[clusterSetLabel].push(clusterName)
        }
      } else {
        // Cluster not in any set
        if (options?.includeClustersNotInSets !== false) {
          if (!clusterSetData.clustersNotInSets) {
            clusterSetData.clustersNotInSets = []
          }
          clusterSetData.clustersNotInSets.push(clusterName)
        }
      }
    }

    return clusterSetData
  }, [clusters, returnAllClusters, isAdvancedMode, options])

  return [result, loaded, error]
}
