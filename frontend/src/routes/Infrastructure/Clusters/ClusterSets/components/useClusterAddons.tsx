/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { Addon, mapAddons } from '../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import keyBy from 'lodash/keyBy'

export function useClusterAddons(clusterName?: string) {
  const {
    clusterDeploymentsState,
    managedClustersState,
    managedClusterInfosState,
    hostedClustersState,
    managedClusterAddonsState,
    clusterManagementAddonsState,
  } = useSharedAtoms()

  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const managedClusters = useRecoilValue(managedClustersState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const managedClusterAddons = useRecoilValue(managedClusterAddonsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)

  const addons = useMemo(() => {
    let uniqueClusterNames
    if (!clusterName) {
      const mcs = managedClusters.filter((mc) => mc.metadata?.name) ?? []
      uniqueClusterNames = Array.from(
        new Set([
          ...clusterDeployments.map((cd) => cd.metadata.name),
          ...managedClusterInfos.map((mc) => mc.metadata.name),
          ...mcs.map((mc) => mc.metadata.name),
          ...hostedClusters.map((hc) => hc.metadata?.name),
        ])
      )
    } else {
      uniqueClusterNames = [clusterName]
    }
    const result: { [id: string]: Addon[] } = {}

    // use maps to speed up this search
    const clusterManagementAddonsMap = keyBy(clusterManagementAddons, 'metadata.name')
    uniqueClusterNames.forEach((cluster) => {
      if (cluster) {
        const clusterAddons = managedClusterAddons?.[cluster] || []
        result[cluster] = mapAddons(clusterManagementAddonsMap, clusterAddons)
      }
    })
    return result
  }, [
    clusterManagementAddons,
    clusterName,
    managedClusters,
    clusterDeployments,
    managedClusterInfos,
    hostedClusters,
    managedClusterAddons,
  ])
  return addons
}
