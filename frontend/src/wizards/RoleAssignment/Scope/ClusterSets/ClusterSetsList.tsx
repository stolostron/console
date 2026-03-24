/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { ClusterSetsTable } from '../../../../components/ClusterSets/ClusterSetsTable'
import { isGlobalClusterSet, ManagedClusterSet } from '../../../../resources'
import { useAllClusters } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'

interface ClusterSetsListProps {
  onSelectClusterSet: (clusters: ManagedClusterSet[]) => void
  selectedClusterSets?: ManagedClusterSet[]
}

export const ClusterSetsList = ({ onSelectClusterSet, selectedClusterSets }: ClusterSetsListProps) => {
  const { managedClusterSetsState } = useSharedAtoms()
  const managedClusterSets = useRecoilValue(managedClusterSetsState)
  const clusters = useAllClusters(true)
  const extendedManagedClusterSets = useMemo(
    () =>
      managedClusterSets
        .filter((managedClusterSet) => !isGlobalClusterSet(managedClusterSet))
        .map((managedClusterSet) => ({
          ...managedClusterSet,
          clusters: clusters.filter((cluster) => cluster.clusterSet === managedClusterSet.metadata.name),
        })),
    [managedClusterSets, clusters]
  )

  return (
    <ClusterSetsTable
      managedClusterSets={extendedManagedClusterSets}
      areLinksDisplayed={false}
      hideTableActions={true}
      onSelectClusterSet={onSelectClusterSet}
      initialSelectedClusterSets={selectedClusterSets}
      showExportButton={false}
      hiddenColumns={['clustersetbinding']}
    />
  )
}
