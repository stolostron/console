/* Copyright Contributors to the Open Cluster Management project */

import { AcmButton, AcmEmptyState, AcmLabels, AcmTable } from '../../ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../BulkActionModal'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { canUser } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import {
  ExtendedManagedClusterSet,
  ManagedClusterSet,
  ManagedClusterSetDefinition,
  isGlobalClusterSet,
} from '../../resources'
import { Cluster, deleteResource, ResourceErrorCode } from '../../resources/utils'
import { ClusterSetActionDropdown } from '../../routes/Infrastructure/Clusters/ClusterSets/components/ClusterSetActionDropdown'
import {
  ClusterStatuses,
  getClusterStatusCount,
} from '../../routes/Infrastructure/Clusters/ClusterSets/components/ClusterStatuses'
import { GlobalClusterSetPopover } from '../../routes/Infrastructure/Clusters/ClusterSets/components/GlobalClusterSetPopover'
import { CreateClusterSetModal } from '../../routes/Infrastructure/Clusters/ClusterSets/CreateClusterSet/CreateClusterSetModal'
import { useSharedAtoms, useRecoilValue } from '../../shared-recoil'
import { getMappedClusterSetClusters } from '../../routes/Infrastructure/Clusters/ClusterSets/components/useClusters'

interface ClusterSetsTableProps {
  managedClusterSets?: ExtendedManagedClusterSet[]
  areLinksDisplayed?: boolean
  hideTableActions?: boolean
  onSelectClusterSet?: (managedClusterSets: ManagedClusterSet[]) => void
  hiddenColumns?: string[]
  showExportButton?: boolean
  initialSelectedClusterSets?: ManagedClusterSet[]
}

export const ClusterSetsTable = ({
  managedClusterSets,
  areLinksDisplayed = true,
  hideTableActions = false,
  onSelectClusterSet,
  hiddenColumns = [],
  showExportButton = true,
  initialSelectedClusterSets,
}: ClusterSetsTableProps) => {
  const { t } = useTranslation()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ManagedClusterSet> | { open: false }>({
    open: false,
  })
  const [createClusterSetModalOpen, setCreateClusterSetModalOpen] = useState<boolean>(false)
  const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
  useEffect(() => {
    const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
    canCreateManagedClusterSet.promise
      .then((result) => setCanCreateClusterSet(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canCreateManagedClusterSet.abort()
  }, [])
  const {
    managedClusterSetBindingsState,
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    clusterManagementAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    clusterCuratorsState,
    hostedClustersState,
    nodePoolsState,
    discoveredClusterState,
  } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const certificateSigningRequests = useRecoilValue(certificateSigningRequestsState)
  const managedClusterAddOns = useRecoilValue(managedClusterAddonsState)
  const clusterManagementAddOns = useRecoilValue(clusterManagementAddonsState)
  const clusterClaims = useRecoilValue(clusterClaimsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const nodePools = useRecoilValue(nodePoolsState)
  const discoveredClusters = useRecoilValue(discoveredClusterState)

  const managedClusterSetClusters: Record<string, Cluster[]> = {}

  managedClusterSets?.forEach((managedClusterSet) => {
    if (managedClusterSet.metadata.name) {
      const clusters = getMappedClusterSetClusters({
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddOns,
        clusterManagementAddOns,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        hostedClusters,
        nodePools,
        discoveredClusters,
        managedClusterSets: [managedClusterSet],
      })
      managedClusterSetClusters[managedClusterSet.metadata.name] = clusters
    }
  })

  function clusterSetSortFn(a: ManagedClusterSet, b: ManagedClusterSet): number {
    if (isGlobalClusterSet(a) && !isGlobalClusterSet(b)) {
      return -1
    } else if (!isGlobalClusterSet(a) && isGlobalClusterSet(b)) {
      return 1
    }
    return a.metadata?.name && b.metadata?.name ? a.metadata?.name.localeCompare(b.metadata?.name) : 0
  }

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (managedClusterSet: ManagedClusterSet) => (
          <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
        ),
      },
      {
        header: t('table.cluster.statuses'),
        cell: (managedClusterSet: ManagedClusterSet) => <ClusterStatuses managedClusterSet={managedClusterSet} />,
      },
    ],
    [t]
  )

  function mckeyFn(managedClusterSet: ManagedClusterSet) {
    return managedClusterSet.metadata.name!
  }

  const disabledResources = managedClusterSets?.filter((resource) => isGlobalClusterSet(resource))
  const getNamespaceBindings = (managedClusterSet: ManagedClusterSet) => {
    const bindings = managedClusterSetBindings.filter(
      (mcsb) => mcsb.spec.clusterSet === managedClusterSet.metadata.name!
    )
    return bindings.map((mcsb) => mcsb.metadata.namespace!)
  }

  return (
    <Fragment>
      <CreateClusterSetModal isOpen={createClusterSetModalOpen} onClose={() => setCreateClusterSetModalOpen(false)} />
      <BulkActionModal {...modalProps} />
      <AcmTable<ManagedClusterSet>
        items={managedClusterSets}
        disabledItems={disabledResources}
        columns={[
          {
            header: t('table.name'),
            sort: clusterSetSortFn,
            search: 'metadata.name',
            cell: (managedClusterSet: ManagedClusterSet) => (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {areLinksDisplayed ? (
                    <Link
                      to={generatePath(NavigationPath.clusterSetOverview, { id: managedClusterSet.metadata.name! })}
                    >
                      {managedClusterSet.metadata.name}
                    </Link>
                  ) : (
                    managedClusterSet.metadata.name
                  )}
                </span>
                {isGlobalClusterSet(managedClusterSet) && <GlobalClusterSetPopover />}
              </>
            ),
            exportContent: (managedClusterSet: ManagedClusterSet) => managedClusterSet.metadata.name,
          },
          {
            header: t('table.cluster.statuses'),
            cell: (managedClusterSet: ManagedClusterSet) => <ClusterStatuses managedClusterSet={managedClusterSet} />,
            exportContent: (managedClusterSet: ManagedClusterSet) => {
              const status = getClusterStatusCount(managedClusterSetClusters[managedClusterSet.metadata.name!])
              const clusterStatusAvailable =
                status &&
                Object.values(status).find((val) => {
                  return typeof val === 'number' && val > 0
                })

              if (clusterStatusAvailable)
                return (
                  `${t('healthy')}: ${status?.healthy}, ${t('running')}: ${status?.running}, ` +
                  `${t('warning')}: ${status?.warning}, ${t('progress')}: ${status?.progress}, ` +
                  `${t('danger')}: ${status?.danger}, ${t('detached')}: ${status?.detached}, ` +
                  `${t('pending')}: ${status?.pending}, ${t('sleep')}: ${status?.sleep}, ` +
                  `${t('unknown')}: ${status?.unknown}`
                )
            },
          },
          {
            header: t('table.clusterSetBinding'),
            tooltip: t('clusterSetBinding.edit.message.noBold'),
            cell: (managedClusterSet: ManagedClusterSet) => {
              const namespaces = getNamespaceBindings(managedClusterSet)
              return namespaces.length ? (
                <AcmLabels labels={namespaces} collapse={namespaces.filter((_ns, i) => i > 1)} />
              ) : (
                '-'
              )
            },
            exportContent: (managedClusterSet: ManagedClusterSet) => {
              const namespaceBinding = getNamespaceBindings(managedClusterSet)
              if (namespaceBinding) {
                return `${getNamespaceBindings(managedClusterSet).toString()}`
              }
            },
          },
          {
            header: t('table.clusters'),
            cell: (managedClusterSet: ExtendedManagedClusterSet) => managedClusterSet.clusters?.length,
            exportContent: (managedClusterSet: ExtendedManagedClusterSet) => managedClusterSet.clusters?.length,
          },
          ...(hideTableActions
            ? []
            : [
                {
                  header: '',
                  isActionCol: true,
                  cell: (managedClusterSet: ManagedClusterSet) => {
                    return <ClusterSetActionDropdown managedClusterSet={managedClusterSet} isKebab={true} />
                  },
                  cellTransforms: [fitContent],
                },
              ]),
        ].filter((column) => !hiddenColumns.includes(column.header))}
        keyFn={mckeyFn}
        key="clusterSetsTable"
        tableActions={
          hideTableActions
            ? []
            : [
                {
                  id: 'deleteClusterSets',
                  title: t('bulk.delete.sets'),
                  click: (managedClusterSets: ManagedClusterSet[]) => {
                    setModalProps({
                      open: true,
                      title: t('bulk.title.deleteSet'),
                      action: t('delete'),
                      processing: t('deleting'),
                      items: managedClusterSets,
                      emptyState: undefined, // table action is only enabled when items are selected
                      description: t('bulk.message.deleteSet'),
                      columns: modalColumns,
                      keyFn: (managedClusterSet) => managedClusterSet.metadata.name as string,
                      actionFn: deleteResource,
                      close: () => setModalProps({ open: false }),
                      isDanger: true,
                      icon: 'warning',
                      confirmText: t('confirm'),
                      isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                  },
                  variant: 'bulk-action' as const,
                },
              ]
        }
        tableActionButtons={
          hideTableActions
            ? []
            : [
                {
                  id: 'createClusterSet',
                  title: t('managed.createClusterSet'),
                  click: () => setCreateClusterSetModalOpen(true),
                  isDisabled: !canCreateClusterSet,
                  tooltip: t('rbac.unauthorized'),
                  variant: ButtonVariant.primary,
                },
              ]
        }
        rowActions={[]}
        emptyState={
          <AcmEmptyState
            key="mcEmptyState"
            title={t("You don't have any cluster sets yet")}
            message={t('To get started, create a cluster set.')}
            action={
              <div>
                <AcmButton
                  role="link"
                  onClick={() => setCreateClusterSetModalOpen(true)}
                  isDisabled={!canCreateClusterSet}
                  tooltip={t('rbac.unauthorized')}
                >
                  {t('managed.createClusterSet')}
                </AcmButton>
                <ViewDocumentationLink doclink={DOC_LINKS.CLUSTER_SETS} />
              </div>
            }
          />
        }
        showExportButton={showExportButton}
        exportFilePrefix="clustersets"
        onSelect={onSelectClusterSet}
        initialSelectedItems={initialSelectedClusterSets}
      />
    </Fragment>
  )
}
