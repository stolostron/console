/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { Cluster } from '../../../../../resources/utils/get-cluster'

/**
 * Hook to get available updates for hosted/hypershift clusters.
 * Uses ManagedClusterInfo versionAvailableUpdates instead of ClusterImageSets
 * to align with the standalone cluster upgrade flow.
 *
 * Returns empty object when:
 * - Cluster is not hypershift/hosted
 * - ManagedClusterInfo upgrade data is not yet available
 *
 * @param cluster - The Cluster object
 * @returns Record<version, releaseImage> mapping of available updates
 */
export const useHypershiftAvailableUpdates = (cluster?: Cluster) => {
  const hypershiftAvailableUpdates: Record<string, string> = useMemo(() => {
    if (!(cluster?.isHypershift || cluster?.isHostedCluster)) {
      return {}
    }

    // Use versionAvailableUpdates from ManagedClusterInfo (via distribution.upgradeInfo)
    const versionAvailableUpdates = cluster?.distribution?.upgradeInfo?.versionAvailableUpdates

    // Return empty if MCI data not available - this disables upgrade
    if (!versionAvailableUpdates || versionAvailableUpdates.length === 0) {
      return {}
    }

    // Build version -> image mapping from MCI data
    const updates: Record<string, string> = {}
    versionAvailableUpdates.forEach((release) => {
      if (release.version && release.image) {
        updates[release.version] = release.image
      }
    })

    return updates
  }, [cluster?.isHostedCluster, cluster?.isHypershift, cluster?.distribution?.upgradeInfo?.versionAvailableUpdates])

  return hypershiftAvailableUpdates
}
