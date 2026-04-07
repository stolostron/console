/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { ClustersTable } from '../../../../components/Clusters'
import { AddCluster } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/AddCluster'
import { useAllClusters } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { Cluster } from '../../../../resources/utils'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmEmptyState } from '../../../../ui-components'

interface ClusterListProps {
  onSelectCluster: (clusters: Cluster[]) => void
  namespaces?: string[]
  selectedClusters?: Cluster[]
}

export const ClusterList = ({ onSelectCluster, namespaces, selectedClusters }: ClusterListProps) => {
  const clusters = useAllClusters(true)
  const filteredClusters = useMemo(
    () =>
      namespaces
        ? clusters.filter((cluster) => cluster.clusterSet !== undefined && namespaces?.includes(cluster.clusterSet))
        : clusters,
    [clusters, namespaces]
  )

  const { t } = useTranslation()
  return (
    <ClustersTable
      clusters={filteredClusters}
      tableKey="clusterList"
      hideTableActions={true}
      onSelectCluster={onSelectCluster}
      initialSelectedClusters={selectedClusters}
      showExportButton={false}
      areLinksDisplayed={false}
      hiddenColumns={['namespace', 'provider', 'controlplane', 'distribution', 'labels', 'addons', 'created']}
      emptyState={
        <AcmEmptyState
          key="mcEmptyState"
          title={t("You don't have any clusters yet")}
          message={t('To get started, create a cluster or import an existing cluster.')}
          action={<AddCluster type="button" />}
        />
      }
    />
  )
}
