/* Copyright Contributors to the Open Cluster Management project */

import { Alert, TextContent } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps, errorIsNot } from '../BulkActionModal'
import { useTranslation } from '../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../lib/delete-cluster'
import { ClusterDeployment, ClusterDeploymentDefinition } from '../../resources'
import {
  AddonStatus,
  Cluster,
  ClusterStatus,
  getAddonStatusLabel,
  getClusterStatusLabel,
  ResourceErrorCode,
  patchResource,
  filterLabelFn,
} from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmEmptyState,
  AcmTable,
  compareStrings,
  getNodeStatusLabel,
  IAcmTableAction,
  IAcmTableButtonAction,
  IAcmTableColumn,
  ITableAdvancedFilter,
  ITableFilter,
  Provider,
  ProviderLongTextMap,
  StatusType,
} from '../../ui-components'
import { BatchChannelSelectModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchChannelSelectModal'
import { BatchUpgradeModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/BatchUpgradeModal'
import { ClusterActionDropdown } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/ClusterActionDropdown'
import { RemoveAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/RemoveAutomationModal'
import { UpdateAutomationModal } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/UpdateAutomationModal'
import {
  ClusterAction,
  clusterDestroyable,
  clusterSupportsAction,
} from '../../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions'
import { SearchOperator } from '../../ui-components/AcmSearchInput'
import { handleStandardComparison, handleSemverOperatorComparison } from '../../lib/search-utils'
import { useLocalHubName } from '../../hooks/use-local-hub'
import { getClusterLabelData } from '../../routes/Infrastructure/Clusters/ManagedClusters/utils/utils'
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
  getClusterDistributionString,
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

  const { t } = useTranslation()
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

  const modalColumns = useMemo(
    () => [clusterNameColumnModal, clusterStatusColumn, clusterProviderColumn],
    [clusterNameColumnModal, clusterStatusColumn, clusterProviderColumn]
  )

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
      {
        header: '',
        cell: (cluster: Cluster) => {
          return <ClusterActionDropdown cluster={cluster} isKebab={true} />
        },
        cellTransforms: [fitContent],
        isActionCol: true,
      },
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

  const tableActions = useMemo<IAcmTableAction<Cluster>[]>(
    () => [
      {
        id: 'upgradeClusters',
        title: t('managed.upgrade.plural'),
        click: (managedClusters: Array<Cluster>) => {
          if (!managedClusters) return
          setUpgradeClusters(managedClusters)
        },
        variant: 'bulk-action',
      },
      {
        id: 'selectChannels',
        title: t('managed.selectChannel.plural'),
        click: (managedClusters: Array<Cluster>) => {
          if (!managedClusters) return
          setSelectChannels(managedClusters)
        },
        variant: 'bulk-action',
      },
      { id: 'seperator-0', variant: 'action-separator' },
      {
        id: 'updateAutomationTemplates',
        title: t('Update automation template'),
        click: (managedClusters: Array<Cluster>) => {
          if (!managedClusters) return
          setUpdateAutomationTemplates(managedClusters)
        },
        variant: 'bulk-action',
      },
      {
        id: 'removeAutomationTemplates',
        title: t('Remove automation templates'),
        click: (managedClusters: Array<Cluster>) => {
          if (!managedClusters) return
          setRemoveAutomationTemplates(managedClusters)
        },
        variant: 'bulk-action',
      },
      { id: 'seperator-1', variant: 'action-separator' },
      {
        id: 'hibernate-cluster',
        title: t('managed.hibernate.plural'),
        click: (clusters) => {
          setModalProps({
            open: true,
            title: t('bulk.title.hibernate'),
            action: t('hibernate'),
            processing: t('hibernating'),
            items: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Hibernate)),
            emptyState: (
              <AcmEmptyState
                title={t('No clusters available')}
                message={t('None of the selected clusters can be hibernated.')}
              />
            ),
            description: t('bulk.message.hibernate'),
            columns: modalColumns,
            keyFn: (cluster) => cluster.name as string,
            actionFn: (cluster) => {
              return patchResource(
                {
                  apiVersion: ClusterDeploymentDefinition.apiVersion,
                  kind: ClusterDeploymentDefinition.kind,
                  metadata: {
                    name: cluster.name!,
                    namespace: cluster.namespace!,
                  },
                } as ClusterDeployment,
                [{ op: 'replace', path: '/spec/powerState', value: 'Hibernating' }]
              )
            },
            close: () => {
              setModalProps({ open: false })
            },
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
          })
        },
        variant: 'bulk-action',
      },
      {
        id: 'resume-cluster',
        title: t('managed.resume.plural'),
        click: (clusters) => {
          setModalProps({
            open: true,
            title: t('bulk.title.resume'),
            action: t('resume'),
            processing: t('resuming'),
            items: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Resume)),
            emptyState: (
              <AcmEmptyState
                title={t('No clusters available')}
                message={t('None of the selected clusters can be resumed.')}
              />
            ),
            description: t('bulk.message.resume'),
            columns: modalColumns,
            keyFn: (cluster) => cluster.name as string,
            actionFn: (cluster) => {
              return patchResource(
                {
                  apiVersion: ClusterDeploymentDefinition.apiVersion,
                  kind: ClusterDeploymentDefinition.kind,
                  metadata: {
                    name: cluster.name!,
                    namespace: cluster.namespace!,
                  },
                } as ClusterDeployment,
                [{ op: 'replace', path: '/spec/powerState', value: 'Running' }]
              )
            },
            close: () => {
              setModalProps({ open: false })
            },
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
          })
        },
        variant: 'bulk-action',
      },
      { id: 'seperator-2', variant: 'action-separator' },
      {
        id: 'detachCluster',
        title: t('managed.detach.plural'),
        click: (clusters) => {
          setModalProps({
            open: true,
            title: t('bulk.title.detach'),
            action: t('detach'),
            processing: t('detaching'),
            items: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Detach)),
            emptyState: (
              <AcmEmptyState
                title={t('No clusters available')}
                message={t('None of the selected clusters can be detached.')}
              />
            ),
            description: t('bulk.message.detach'),
            columns: modalColumns,
            keyFn: (cluster) => cluster.name as string,
            actionFn: (cluster) => detachCluster(cluster),
            close: () => setModalProps({ open: false }),
            isDanger: true,
            icon: 'warning',
            confirmText: t('confirm'),
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
          })
        },
        variant: 'bulk-action',
      },
      {
        id: 'destroyCluster',
        title: t('managed.destroy.plural'),
        click: (clusters) => {
          const unDestroyedClusters = clusters.filter((cluster) => !clusterDestroyable(cluster))
          setModalProps({
            open: true,
            alert:
              unDestroyedClusters.length > 0 ? (
                <Alert
                  variant="danger"
                  isInline
                  title={t('You selected {{count}} cluster that cannot be destroyed', {
                    count: unDestroyedClusters.length,
                  })}
                  style={{ marginTop: '20px' }}
                >
                  <TextContent>
                    {t('It will not be destroyed when you perform this action.', {
                      count: unDestroyedClusters.length,
                    })}
                  </TextContent>
                </Alert>
              ) : undefined,
            title: t('bulk.title.destroy'),
            action: t('destroy'),
            processing: t('destroying'),
            items: clusters.filter(
              (cluster) =>
                clusterSupportsAction(cluster, ClusterAction.Destroy) ||
                clusterSupportsAction(cluster, ClusterAction.Detach)
            ),
            emptyState: (
              <AcmEmptyState
                title={t('No clusters available')}
                message={t('None of the selected clusters can be destroyed or detached.')}
              />
            ),
            description: t('bulk.message.destroy'),
            columns: modalColumns,
            keyFn: (cluster) => cluster.name as string,
            actionFn: (cluster, options) =>
              deleteCluster({
                cluster,
                ignoreClusterDeploymentNotFound: true,
                infraEnvs,
                deletePullSecret: !!options?.deletePullSecret,
              }),
            close: () => setModalProps({ open: false }),
            isDanger: true,
            icon: 'warning',
            confirmText: t('confirm'),
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
            enableDeletePullSecret: true,
          })
        },
        variant: 'bulk-action',
      },
    ],
    [modalColumns, infraEnvs, t]
  )

  const rowActions = useMemo(() => [], [])

  const advancedFilters = useMemo<ITableAdvancedFilter<Cluster>[]>(() => {
    return [
      {
        id: 'name',
        label: t('table.name'),
        availableOperators: [SearchOperator.Equals],
        tableFilterFn: ({ value }, cluster) => handleStandardComparison(cluster.name, value, SearchOperator.Equals),
      },
      {
        id: 'namespace',
        label: t('table.namespace'),
        availableOperators: [SearchOperator.Equals],
        tableFilterFn: ({ value }, cluster) => handleStandardComparison(cluster.name, value, SearchOperator.Equals),
      },
      {
        id: 'distribution',
        columnDisplayName: 'Distribution',
        label: t('table.distribution'),
        availableOperators: [
          SearchOperator.Equals,
          SearchOperator.GreaterThan,
          SearchOperator.LessThan,
          SearchOperator.GreaterThanOrEqualTo,
          SearchOperator.LessThanOrEqualTo,
          SearchOperator.NotEquals,
        ],
        tableFilterFn: ({ operator, value }, cluster) => {
          const clusterVersion = getClusterDistributionString(cluster, clusterImageSets, agentClusterInstalls, clusters)
          return handleSemverOperatorComparison(clusterVersion ?? '', value, operator)
        },
      },
    ]
  }, [t, agentClusterInstalls, clusterImageSets, clusters])

  const filters = useMemo<ITableFilter<Cluster>[]>(() => {
    const { labelOptions, labelMap } = getClusterLabelData(clusters || []) || {}
    return [
      {
        id: 'provider',
        label: t('table.provider'),
        options: Object.values(Provider)
          .map((key) => ({
            label: ProviderLongTextMap[key],
            value: key,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues, cluster) => selectedValues.includes(cluster.provider ?? ''),
      },
      {
        id: 'label',
        label: t('table.labels'),
        options: labelOptions || [],
        supportsInequality: true,
        tableFilterFn: (selectedValues, item) => filterLabelFn(selectedValues, item, labelMap),
      },
      {
        id: 'status',
        label: t('table.status'),
        options: Object.keys(ClusterStatus)
          .map((status) => ({
            label: getClusterStatusLabel(status as ClusterStatus, t),
            value: status,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues, cluster) => selectedValues.includes(cluster.status),
      },
      {
        id: 'nodes',
        label: t('table.nodes'),
        options: Object.keys(StatusType)
          .map((status) => ({
            label: getNodeStatusLabel(status as StatusType, t),
            value: status,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues, cluster) =>
          selectedValues.some((value) => {
            switch (value) {
              case StatusType.healthy:
                return !!cluster.nodes?.ready
              case StatusType.danger:
                return !!cluster.nodes?.unhealthy
              case StatusType.unknown:
                return !!cluster.nodes?.unknown
              default:
                return false
            }
          }),
      },
      {
        id: 'add-ons',
        label: t('Add-ons'),
        options: Object.keys(AddonStatus)
          .map((status) => ({
            label: getAddonStatusLabel(status as AddonStatus, t),
            value: status,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues, cluster) =>
          selectedValues.some((value) => {
            switch (value) {
              case AddonStatus.Available:
                return !!cluster.addons?.available
              case AddonStatus.Degraded:
                return !!cluster.addons?.degraded
              case AddonStatus.Progressing:
                return !!cluster.addons?.progressing
              case AddonStatus.Unknown:
                return !!cluster.addons?.unknown
              default:
                return false
            }
          }),
      },
    ]
  }, [clusters, t])

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
        rowActions={rowActions}
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
