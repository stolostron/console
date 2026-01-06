/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useCallback, useEffect, useState } from 'react'
import { BulkActionModal, BulkActionModalProps } from '../BulkActionModal'
import { Cluster } from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { AcmTable, IAcmTableButtonAction } from '../../ui-components'
import { BatchChannelSelectModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchChannelSelectModal'
import { BatchUpgradeModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchUpgradeModal'
import { RemoveAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/RemoveAutomationModal'
import { UpdateAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/UpdateAutomationModal'
import { useLocalHubName } from '../../hooks/use-local-hub'
import { useTableColumns, useTableActions, useAdvancedFilters, useFilters } from './ClustersTableHelper'

interface ClustersTableProps {
  clusters?: Cluster[]
  tableButtonActions?: IAcmTableButtonAction[]
  emptyState: React.ReactNode
  hideTableActions?: boolean
  showExportButton?: boolean
  areLinksDisplayed?: boolean
  hiddenColumns?: string[]
  onSelectCluster?: (clusterList: Cluster[]) => void
  tableKey: string
  initialSelectedClusters?: Cluster[]
}

export function ClustersTable({
  clusters = [],
  tableButtonActions,
  emptyState,
  hideTableActions = false,
  showExportButton = true,
  areLinksDisplayed = true,
  hiddenColumns = [],
  onSelectCluster,
  tableKey,
  initialSelectedClusters,
}: ClustersTableProps) {
  useEffect(() => {
    sessionStorage.removeItem('DiscoveredClusterDisplayName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    sessionStorage.removeItem('DiscoveredClusterApiURL')
  }, [])

  const { clusterCuratorsState, hostedClustersState, infraEnvironmentsState } = useSharedAtoms()
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
  const localHubName = useLocalHubName()

  const [upgradeClusters, setUpgradeClusters] = useState<Array<Cluster> | undefined>()
  const [updateAutomationTemplates, setUpdateAutomationTemplates] = useState<Array<Cluster> | undefined>()
  const [removeAutomationTemplates, setRemoveAutomationTemplates] = useState<Array<Cluster> | undefined>()
  const [selectChannels, setSelectChannels] = useState<Array<Cluster> | undefined>()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<Cluster> | { open: false }>({
    open: false,
  })

  const keyFn = useCallback((cluster: Cluster) => cluster.name, [])

  const { agentClusterInstallsState, clusterImageSetsState } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)

  const { columns, modalColumns } = useTableColumns({
    clusters,
    areLinksDisplayed,
    localHubName,
    clusterCurators,
    hostedClusters,
    hideTableActions,
    hiddenColumns,
  })

  const tableActions = useTableActions(
    modalColumns,
    infraEnvs,
    setUpgradeClusters,
    setSelectChannels,
    setUpdateAutomationTemplates,
    setRemoveAutomationTemplates,
    setModalProps
  )

  const advancedFilters = useAdvancedFilters(clusters, clusterImageSets, agentClusterInstalls)
  const filters = useFilters(clusters)

  return (
    <Fragment>
      <BulkActionModal<Cluster> {...modalProps} />
      <UpdateAutomationModal
        clusters={updateAutomationTemplates}
        open={!!updateAutomationTemplates}
        close={() => {
          setUpdateAutomationTemplates(undefined)
        }}
      />
      <RemoveAutomationModal
        clusters={removeAutomationTemplates}
        open={!!removeAutomationTemplates}
        close={() => {
          setRemoveAutomationTemplates(undefined)
        }}
      />
      <BatchUpgradeModal
        clusters={upgradeClusters}
        open={!!upgradeClusters}
        close={() => {
          setUpgradeClusters(undefined)
        }}
      />
      <BatchChannelSelectModal
        clusters={selectChannels}
        open={!!selectChannels}
        close={() => {
          setSelectChannels(undefined)
        }}
      />
      <AcmTable<Cluster>
        items={clusters}
        columns={columns}
        keyFn={keyFn}
        key={tableKey}
        tableActionButtons={tableButtonActions}
        tableActions={hideTableActions ? [] : tableActions}
        rowActions={[]}
        emptyState={emptyState}
        filters={filters}
        advancedFilters={advancedFilters}
        id={tableKey}
        showExportButton={showExportButton}
        secondaryFilterIds={['label']}
        exportFilePrefix={tableKey}
        onSelect={onSelectCluster}
        initialSelectedItems={initialSelectedClusters}
      />
    </Fragment>
  )
}
