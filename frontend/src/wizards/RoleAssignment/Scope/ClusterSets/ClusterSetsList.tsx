/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { ClusterSetsTable } from '../../../../components/ClusterSets/ClusterSetsTable'
import { useTranslation } from '../../../../lib/acm-i18next'
import { ManagedClusterSet } from '../../../../resources'
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
      managedClusterSets.map((managedClusterSet) => ({
        ...managedClusterSet,
        clusters: clusters.filter((cluster) => cluster.clusterSet === managedClusterSet.metadata.name),
      })),
    [managedClusterSets, clusters]
  )

  const { t } = useTranslation()

  return (
    <ClusterSetsTable
      managedClusterSets={extendedManagedClusterSets}
      areLinksDisplayed={false}
      hideTableActions={true}
      onSelectClusterSet={onSelectClusterSet}
      initialSelectedClusterSets={selectedClusterSets}
      showExportButton={false}
      hiddenColumns={[t('table.cluster.statuses'), t('table.clusterSetBinding')]}
    />
  )
}
