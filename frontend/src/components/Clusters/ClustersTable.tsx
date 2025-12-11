/* Copyright Contributors to the Open Cluster Management project */

import { fitContent } from '@patternfly/react-table'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps } from '../BulkActionModal'
import { Cluster } from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { AcmTable, IAcmTableButtonAction, IAcmTableColumn } from '../../ui-components'
import { BatchChannelSelectModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchChannelSelectModal'
import { BatchUpgradeModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchUpgradeModal'
import { ClusterActionDropdown } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/ClusterActionDropdown'
import { RemoveAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/RemoveAutomationModal'
import { UpdateAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/UpdateAutomationModal'
import { useLocalHubName } from '../../hooks/use-local-hub'
import {
  useClusterNameColumn,
  useClusterNameColumnModal,
  useClusterNamespaceColumn,
  useClusterStatusColumn,
  useClusterProviderColumn,
  useClusterControlPlaneColumn,
  useClusterDistributionColumn,
  useClusterLabelsColumn,
  useClusterNodesColumn,
  useClusterAddonColumn,
  useClusterCreatedDateColumn,
  useModalColumns,
  useTableActions,
  useAdvancedFilters,
  useFilters,
} from './ClustersTableHelper'

interface ClustersTableProps {
  clusters?: Cluster[]
  tableButtonActions?: IAcmTableButtonAction[]
  emptyState: React.ReactNode
  hideTableActions?: boolean
  showExportButton?: boolean
  areLinksDisplayed?: boolean
  hiddenColumns?: string[]
  onSelectCluster?: (clusterList: Cluster[]) => void
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

  const mckeyFn = useCallback(function mckeyFn(cluster: Cluster) {
    return cluster.name!
  }, [])

  const clusterNameColumn = useClusterNameColumn(areLinksDisplayed)
  const clusterNameColumnModal = useClusterNameColumnModal(areLinksDisplayed)
  const clusterNamespaceColumn = useClusterNamespaceColumn()
  const clusterStatusColumn = useClusterStatusColumn()
  const clusterProviderColumn = useClusterProviderColumn()
  const clusterControlPlaneColumn = useClusterControlPlaneColumn(localHubName)
  const clusterDistributionColumn = useClusterDistributionColumn(clusters, clusterCurators, hostedClusters)
  const clusterLabelsColumn = useClusterLabelsColumn(clusters.length > 10, localHubName)
  const clusterNodesColumn = useClusterNodesColumn()
  const clusterAddonsColumn = useClusterAddonColumn()
  const clusterCreatedDataColumn = useClusterCreatedDateColumn()
  const { agentClusterInstallsState, clusterImageSetsState } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)

  const modalColumns = useModalColumns(clusterNameColumnModal, clusterStatusColumn, clusterProviderColumn)

  const allColumns = useMemo<IAcmTableColumn<Cluster>[]>(
    () => [
      clusterNameColumn,
      clusterNamespaceColumn,
      clusterStatusColumn,
      clusterProviderColumn,
      clusterControlPlaneColumn,
      clusterDistributionColumn,
      clusterLabelsColumn,
      clusterNodesColumn,
      clusterAddonsColumn,
      clusterCreatedDataColumn,
      ...(!hideTableActions
        ? [
            {
              header: '',
              cell: (cluster: Cluster) => <ClusterActionDropdown cluster={cluster} isKebab={true} />,
              cellTransforms: [fitContent],
              isActionCol: true,
            },
          ]
        : []),
    ],
    [
      clusterNameColumn,
      clusterNamespaceColumn,
      clusterStatusColumn,
      clusterProviderColumn,
      clusterControlPlaneColumn,
      clusterDistributionColumn,
      clusterLabelsColumn,
      clusterNodesColumn,
      clusterAddonsColumn,
      clusterCreatedDataColumn,
      hideTableActions,
    ]
  )

  // Filter out hidden columns
  const columns = useMemo(
    () =>
      allColumns.filter((column) =>
        typeof column.header === 'string' ? !hiddenColumns.includes(column.header) : true
      ),
    [allColumns, hiddenColumns]
  )

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
        keyFn={mckeyFn}
        key="managedClustersTable"
        tableActionButtons={tableButtonActions}
        tableActions={hideTableActions ? [] : tableActions}
        rowActions={[]}
        emptyState={emptyState}
        filters={filters}
        advancedFilters={advancedFilters}
        id="managedClusters"
        showExportButton={showExportButton}
        secondaryFilterIds={['label']}
        exportFilePrefix="managedclusters"
        onSelect={onSelectCluster}
      />
    </Fragment>
  )
}
