import { ClustersTable } from '../../../../components/Clusters'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AddCluster } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/AddCluster'
import { useAllClusters } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { AcmEmptyState } from '../../../../ui-components'

const ClusterList = () => {
  const clusters = useAllClusters(true)
  const { t } = useTranslation()
  return (
    <ClustersTable
      clusters={clusters}
        // hideTableActions={true}
      showExportButton={false}
      areLinksDisplayed={false}
      hiddenColumns={[
        t('table.namespace'),
        t('Add-ons'),
        t('table.provider'),
        t('table.controlplane'),
        t('table.distribution'),
        t('table.labels'),
        t('table.nodes'),
        t('table.creationDate'),
      ]}
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

export default ClusterList
