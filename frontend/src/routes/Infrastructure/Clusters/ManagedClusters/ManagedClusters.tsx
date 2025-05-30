/* Copyright Contributors to the Open Cluster Management project */

import {
  AgentClusterInstallK8sResource,
  getVersionFromReleaseImage,
  HostedClusterK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import {
  Alert,
  ButtonVariant,
  Label,
  PageSection,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom-v5-compat'
import { BulkActionModal, BulkActionModalProps, errorIsNot } from '../../../../components/BulkActionModal'
import { Pages, usePageVisitMetricHandler } from '../../../../hooks/console-metrics'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { getClusterNavPath, navigateToBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import {
  ClusterCurator,
  ClusterDeployment,
  ClusterDeploymentDefinition,
  ClusterImageSet,
  getRoles,
  ManagedClusterDefinition,
  NodeInfo,
} from '../../../../resources'
import {
  addonPathKey,
  AddonStatus,
  addonTextKey,
  Cluster,
  ClusterStatus,
  exportObjectString,
  getAddonStatusLabel,
  getClusterStatusLabel,
  ResourceErrorCode,
  patchResource,
  getISOStringTimestamp,
  filterLabelFn,
} from '../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmAlertContext,
  AcmEmptyState,
  AcmInlineProvider,
  AcmInlineStatusGroup,
  AcmLabels,
  AcmLaunchLink,
  AcmPageContent,
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
} from '../../../../ui-components'
import { getDateTimeCell } from '../../helpers/table-row-helpers'
import { usePageContext } from '../ClustersPage'
import { AddCluster } from './components/AddCluster'
import { BatchChannelSelectModal } from './components/BatchChannelSelectModal'
import { BatchUpgradeModal } from './components/BatchUpgradeModal'
import { ClusterActionDropdown } from './components/ClusterActionDropdown'
import { DistributionField } from './components/DistributionField'
import { OnboardingModal } from './components/OnboardingModal'
import { RemoveAutomationModal } from './components/RemoveAutomationModal'
import { StatusField } from './components/StatusField'
import { UpdateAutomationModal } from './components/UpdateAutomationModal'
import { useAllClusters } from './components/useAllClusters'
import { ClusterAction, clusterDestroyable, clusterSupportsAction } from './utils/cluster-actions'
import { TFunction } from 'react-i18next'
import keyBy from 'lodash/keyBy'
import { HighlightSearchText } from '../../../../components/HighlightSearchText'
import { SearchOperator } from '../../../../ui-components/AcmSearchInput'
import { handleStandardComparison, handleSemverOperatorComparison } from '../../../../lib/search-utils'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getClusterLabelData } from './utils/utils'

const onToggle = (acmCardID: string, setOpen: (open: boolean) => void) => {
  setOpen(false)
  localStorage.setItem(acmCardID, 'hide')
}

export default function ManagedClusters() {
  usePageVisitMetricHandler(Pages.clusters)
  const { t } = useTranslation()
  const alertContext = useContext(AcmAlertContext)
  const clusters = useAllClusters(true)
  const localHubName = useLocalHubName()

  const onBoardingModalID = 'clusteronboardingmodal'
  const [openOnboardingModal, setOpenOnboardingModal] = useState<boolean>(
    localStorage.getItem(onBoardingModalID)
      ? localStorage.getItem(onBoardingModalID) === 'show'
      : clusters.length === 1 && clusters.find((lc) => lc.name === localHubName) !== undefined //Check if one cluster exists and it is local-cluster
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])

  const OnBoardingModalLink = useCallback(() => {
    return (
      <Text
        component={TextVariants.a}
        isVisitedLink
        style={{
          cursor: 'pointer',
          display: 'inline-block',
        }}
        onClick={() => setOpenOnboardingModal(true)}
      >
        {t('Get started with Multicluster Hub')}
      </Text>
    )
  }, [t])

  usePageContext(clusters.length > 0, PageActions, OnBoardingModalLink)

  const navigate = useNavigate()
  const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
  useEffect(() => {
    const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
    canCreateManagedCluster.promise
      .then((result) => setCanCreateCluster(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canCreateManagedCluster.abort()
  }, [])

  return (
    <AcmPageContent id="clusters">
      <PageSection>
        <OnboardingModal open={openOnboardingModal} close={() => onToggle(onBoardingModalID, setOpenOnboardingModal)} />
        <Stack hasGutter={true}>
          <StackItem>
            <ClustersTable
              clusters={clusters}
              tableButtonActions={[
                {
                  id: 'createCluster',
                  title: t('managed.createCluster'),
                  click: () => navigateToBackCancelLocation(navigate, NavigationPath.createCluster),
                  isDisabled: !canCreateCluster,
                  tooltip: t('rbac.unauthorized'),
                  variant: ButtonVariant.primary,
                },
                {
                  id: 'importCluster',
                  title: t('managed.importCluster'),
                  click: () => navigateToBackCancelLocation(navigate, NavigationPath.importCluster),
                  isDisabled: !canCreateCluster,
                  tooltip: t('rbac.unauthorized'),
                  variant: ButtonVariant.secondary,
                },
              ]}
              emptyState={
                <AcmEmptyState
                  key="mcEmptyState"
                  title={t('managed.emptyStateHeader')}
                  message={<Trans i18nKey="managed.emptyStateMsg" components={{ bold: <strong /> }} />}
                  action={<AddCluster type="button" />}
                />
              }
            />
          </StackItem>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}

const PageActions = () => {
  const { clusterManagementAddonsState } = useSharedAtoms()
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const addons = clusterManagementAddons.filter(
    (cma) => cma.metadata.annotations?.[addonTextKey] && cma.metadata.annotations?.[addonPathKey]
  )

  return (
    <AcmLaunchLink
      links={addons?.map((cma) => ({
        id: cma.metadata.annotations?.[addonTextKey]!,
        text: cma.metadata.annotations?.[addonTextKey]!,
        href: cma.metadata.annotations?.[addonPathKey]!,
      }))}
    />
  )
}

export function ClustersTable(props: {
  clusters?: Cluster[]
  tableButtonActions?: IAcmTableButtonAction[]
  emptyState: React.ReactNode
}) {
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

  const clusterNameColumn = useClusterNameColumn()
  const clusterNameColumnModal = useClusterNameColumnModal()
  const clusterNamespaceColumn = useClusterNamespaceColumn()
  const clusterStatusColumn = useClusterStatusColumn()
  const clusterProviderColumn = useClusterProviderColumn()
  const clusterControlPlaneColumn = useClusterControlPlaneColumn(localHubName)
  const clusterDistributionColumn = useClusterDistributionColumn(props.clusters, clusterCurators, hostedClusters)
  const clusterLabelsColumn = useClusterLabelsColumn(localHubName, props.clusters!.length > 10)
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

  const columns = useMemo<IAcmTableColumn<Cluster>[]>(
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
          const clusterVersion = getClusterDistributionString(
            cluster,
            clusterImageSets,
            agentClusterInstalls,
            props.clusters
          )
          return handleSemverOperatorComparison(clusterVersion ?? '', value, operator)
        },
      },
    ]
  }, [t, agentClusterInstalls, clusterImageSets, props.clusters])

  const filters = useMemo<ITableFilter<Cluster>[]>(() => {
    const { labelOptions, labelMap } = getClusterLabelData(props.clusters || []) || {}
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
  }, [props.clusters, t])

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
        items={props.clusters}
        columns={columns}
        keyFn={mckeyFn}
        key="managedClustersTable"
        tableActionButtons={props.tableButtonActions}
        tableActions={tableActions}
        rowActions={rowActions}
        emptyState={props.emptyState}
        filters={filters}
        advancedFilters={advancedFilters}
        id="managedClusters"
        showExportButton
        secondaryFilterIds={['label']}
        exportFilePrefix="managedclusters"
      />
    </Fragment>
  )
}

export function useClusterNameColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.name'),
    tooltip: t('table.name.helperText.noBold'),
    sort: 'displayName',
    search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
    cell: (cluster, search) => (
      <>
        <span style={{ whiteSpace: 'nowrap' }}>
          <Link to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>
            <HighlightSearchText text={cluster.displayName} searchText={search} isTruncate />
          </Link>
        </span>
        {cluster.hive.clusterClaimName && (
          <TextContent>
            <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
          </TextContent>
        )}
      </>
    ),
    exportContent: (cluster) => cluster.displayName,
  }
}

export function useClusterNameColumnModal(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.name'),
    tooltip: t('table.name.helperText.noBold'),
    sort: 'displayName',
    search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
    cell: (cluster) => (
      <>
        <span style={{ whiteSpace: 'nowrap' }}>
          <Link to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>{cluster.displayName}</Link>
          {!clusterDestroyable(cluster) ? (
            <Tooltip
              content={
                <Text>
                  {cluster.isHypershift
                    ? t(
                        'Hosted clusters cannot be destroyed from the console. Use the individual cluster destroy option to see CLI instructions.'
                      )
                    : t('Imported clusters cannot be destroyed.')}
                </Text>
              }
            >
              <Label style={{ marginLeft: '5px' }} color="red">
                {t('Undestroyable')}
              </Label>
            </Tooltip>
          ) : (
            ''
          )}
        </span>
        {cluster.hive.clusterClaimName && (
          <TextContent>
            <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
          </TextContent>
        )}
      </>
    ),
  }
}

export function useClusterNamespaceColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.namespace'),
    tooltip: t(
      'Standalone clusters will display the namespace used by the ManagedCluster resource. Hosted clusters will display the hosting namespace when the status is "Pending import" and the ManagedCluster namespace when the status is "Ready".'
    ),
    sort: 'namespace',
    search: 'namespace',
    cell: (cluster, search) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        <HighlightSearchText text={cluster.namespace ?? '-'} searchText={search} isTruncate />
      </span>
    ),
    exportContent: (cluster) => cluster.namespace,
  }
}

export function useClusterStatusColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.status'),
    sort: 'status',
    search: 'status',
    cell: (cluster) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        <StatusField cluster={cluster} />
      </span>
    ),
    exportContent: (cluster) => {
      return getClusterStatusLabel(cluster.status, t)
    },
  }
}

export function useClusterProviderColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.provider'),
    sort: 'provider',
    search: 'provider',
    cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
    exportContent: (cluster) => {
      return ProviderLongTextMap[cluster?.provider!]
    },
  }
}

export const getControlPlaneString = (cluster: Cluster, hubClusterName: string, t: TFunction<string, undefined>) => {
  const clusterHasControlPlane = () => {
    return cluster.nodes?.nodeList?.some((node: NodeInfo) => getRoles(node).includes('control-plane')) || false
  }
  const isHosted =
    cluster.isHostedCluster ||
    cluster.isHypershift ||
    (cluster.distribution?.displayVersion?.includes('ROSA') && !clusterHasControlPlane())

  const isHub = cluster.name === hubClusterName || cluster.isRegionalHubCluster

  if (isHub && isHosted) {
    return t('Hub, Hosted')
  }

  if (isHub) {
    return t('Hub')
  }

  if (isHosted) {
    return t('Hosted')
  }

  return t('Standalone')
}

export function useClusterControlPlaneColumn(hubClusterName: string): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.controlplane'),
    cell: (cluster) => {
      return getControlPlaneString(cluster, hubClusterName, t)
    },
    exportContent: (cluster) => {
      return getControlPlaneString(cluster, hubClusterName, t)
    },
  }
}

export function getClusterDistributionString(
  cluster: Cluster,
  clusterImageSets: ClusterImageSet[],
  agentClusterInstalls: AgentClusterInstallK8sResource[],
  allClusters: Cluster[] | undefined
): string | undefined {
  const agentClusterObject: Record<string, string> = {}
  const agentClusterInstallsMap = keyBy(agentClusterInstalls, (install) => {
    return `${install.metadata?.namespace}/${install.metadata?.name}`
  })

  if (allClusters) {
    allClusters.forEach((cluster) => {
      const agentClusterInstall = agentClusterInstallsMap[`${cluster.namespace}/${cluster.name}`]
      const clusterImage = clusterImageSets.find(
        (clusterImageSet) => clusterImageSet.metadata?.name === agentClusterInstall?.spec?.imageSetRef?.name
      )
      const version = getVersionFromReleaseImage(clusterImage?.spec?.releaseImage)
      if (version) {
        agentClusterObject[cluster?.name] = version
      }
    })
  }

  let version
  const openshiftText = 'OpenShift'
  const microshiftText = 'MicroShift'

  if (cluster?.provider === Provider.microshift) {
    version = cluster?.microshiftDistribution?.version
    return version ?? `${microshiftText} ${version}`
  }
  // use version from cluster image
  const clusterImageVersion = agentClusterObject[cluster.name]
  if (clusterImageVersion) {
    return `${openshiftText} ${clusterImageVersion}`
  }
  // else use displayVersion
  return cluster?.distribution?.displayVersion
}

export function useClusterDistributionColumn(
  allClusters: Cluster[] | undefined,
  clusterCurators: ClusterCurator[],
  hostedClusters: HostedClusterK8sResource[]
): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  const { agentClusterInstallsState, clusterImageSetsState } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)

  return {
    header: t('table.distribution'),
    sort: 'distribution.displayVersion',
    search: 'distribution.displayVersion',
    cell: (cluster) => (
      <DistributionField
        cluster={cluster}
        clusterCurator={clusterCurators.find((curator) => curator.metadata.name === cluster.name)}
        hostedCluster={hostedClusters.find((hc) => cluster.name === hc.metadata?.name)}
        resource={'managedclusterpage'}
      />
    ),
    exportContent: (cluster) => {
      return getClusterDistributionString(cluster, clusterImageSets, agentClusterInstalls, allClusters)
    },
  }
}

export function useClusterLabelsColumn(hubClusterName: string, isLarge: boolean): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.labels'),
    search: (cluster) =>
      cluster.labels ? Object.keys(cluster.labels).map((key) => `${key}=${cluster.labels![key]}`) : '',
    cell: (cluster) => {
      if (cluster.labels) {
        const labelKeys = Object.keys(cluster.labels)
        const collapse =
          [
            'cloud',
            'clusterID',
            'installer.name',
            'installer.namespace',
            'name',
            'vendor',
            'managed-by',
            hubClusterName,
            'openshiftVersion',
          ].filter((label) => {
            return labelKeys.includes(label)
          }) ?? []
        labelKeys.forEach((label) => {
          if (label.includes('open-cluster-management.io')) {
            collapse.push(label)
          }
        })
        return (
          <AcmLabels
            labels={cluster.labels}
            expandedText={t('Show less')}
            collapsedText={t('show.more', { count: collapse.length })}
            allCollapsedText={t('count.labels', { count: collapse.length })}
            collapse={collapse}
            isCompact={isLarge}
          />
        )
      } else {
        return '-'
      }
    },
    exportContent: (cluster) => {
      if (cluster.labels) {
        return exportObjectString(cluster.labels)
      }
    },
  }
}

export function useClusterNodesColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.nodes'),
    sort: 'nodes',
    cell: (cluster) => {
      return cluster.nodes!.nodeList!.length > 0 ? (
        <AcmInlineStatusGroup
          healthy={cluster.nodes!.ready}
          danger={cluster.nodes!.unhealthy}
          unknown={cluster.nodes!.unknown}
        />
      ) : (
        '-'
      )
    },
    exportContent: (cluster) => {
      return `${t('healthy')}: ${cluster.nodes!.ready}, ${t('danger')}: ${cluster.nodes!.unhealthy}, ${t('unknown')}: ${cluster.nodes!.unknown}`
    },
  }
}

export function useClusterAddonColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('Add-ons'),
    sort: 'addons',
    cell: (cluster) => {
      return cluster.addons!.addonList.length > 0 ? (
        <AcmInlineStatusGroup
          healthy={cluster.addons!.available}
          danger={cluster.addons!.degraded}
          progress={cluster.addons!.progressing}
          unknown={cluster.addons!.unknown}
          groupId="add-ons"
        />
      ) : (
        '-'
      )
    },
    exportContent: (cluster) => {
      return `${t('healthy')}: ${cluster.addons!.available}, ${t('danger')}: ${cluster.addons!.degraded}, ${t('in progress')}: ${cluster.addons!.progressing}, ${t('unknown')}: ${cluster.addons!.unknown}`
    },
  }
}

export function useClusterCreatedDateColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.creationDate'),
    sort: (a: Cluster, b: Cluster) => {
      const dateTimeCellA = getDateTimeCell(a.creationTimestamp ? new Date(a.creationTimestamp).toString() : '-')
      const dateTimeCellB = getDateTimeCell(b.creationTimestamp ? new Date(b.creationTimestamp).toString() : '-')
      return compareStrings(
        dateTimeCellA.sortableValue == 0 ? '' : dateTimeCellA.sortableValue.toString(),
        dateTimeCellB.sortableValue == 0 ? '' : dateTimeCellB.sortableValue.toString()
      )
    },
    search: 'creationDate',
    cellTransforms: [nowrap],
    cell: (cluster) => {
      return <AcmTimestamp timestamp={cluster.creationTimestamp ?? ''} />
    },
    exportContent: (cluster) => {
      if (cluster.creationTimestamp) {
        return getISOStringTimestamp(cluster.creationTimestamp)
      }
    },
  }
}
