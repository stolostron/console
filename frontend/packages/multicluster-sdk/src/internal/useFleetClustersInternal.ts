/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { K8sResourceCommon, useK8sWatchResource, Selector } from '@openshift-console/dynamic-plugin-sdk'
import { ManagedClusterListGroupVersionKind } from './models'
import { filterClusters } from './clusterUtils'
import { ClusterSetData, FleetClusterNamesOptions } from '../types/fleet'

/**
 * Internal hook that provides common implementation for fleet cluster operations.
 * This is shared between useFleetClusterNames and useFleetClusterSets.
 */
export function useFleetClustersInternal(
  returnAllClusters: boolean,
  options?: FleetClusterNamesOptions
): [K8sResourceCommon[], boolean, any, Selector | undefined] {
  // Build selector for optimization when possible
  const selector = useMemo((): Selector | undefined => {
    if (!options?.clusterSets?.length) {
      return undefined
    }

    // Only optimize if we're not including global
    if (options.includeGlobal) {
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
  }, [options?.clusterSets, options?.includeGlobal])

  const [clusters, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
    ...(selector && { selector }),
  })

  const filteredClusters = useMemo(() => {
    return filterClusters(clusters, returnAllClusters)
  }, [clusters, returnAllClusters])

  return [filteredClusters, loaded, error, selector]
}

/**
 * Organizes clusters into cluster set data structure
 */
export function organizeClustersBySet(
  clusters: K8sResourceCommon[],
  options?: FleetClusterNamesOptions
): ClusterSetData {
  const clusterSetData: ClusterSetData = {}

  // Organize clusters by their cluster set labels
  for (const cluster of clusters) {
    const clusterName = cluster.metadata!.name!
    const clusterSetLabel = cluster.metadata?.labels?.['cluster.open-cluster-management.io/clusterset'] || 'default'

    // Add to global set if requested
    if (options?.includeGlobal) {
      if (!clusterSetData.global) {
        clusterSetData.global = []
      }
      clusterSetData.global.push(clusterName)
    }

    // Check if this cluster set should be included
    if (!options?.clusterSets || options.clusterSets.includes(clusterSetLabel)) {
      if (!clusterSetData[clusterSetLabel]) {
        clusterSetData[clusterSetLabel] = []
      }
      clusterSetData[clusterSetLabel].push(clusterName)
    }
  }

  return clusterSetData
}
