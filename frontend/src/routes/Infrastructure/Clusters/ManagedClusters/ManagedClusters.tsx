/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, PageSection, Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
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
  ITableFilter,
  Provider,
  ProviderLongTextMap,
  StatusType,
} from '../../../../ui-components'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { BulkActionModal, errorIsNot, IBulkActionModalProps } from '../../../../components/BulkActionModal'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { createBackCancelLocation, getClusterNavPath, NavigationPath } from '../../../../NavigationPath'
import {
  addonPathKey,
  AddonStatus,
  addonTextKey,
  Cluster,
  ClusterCurator,
  ClusterDeployment,
  ClusterDeploymentDefinition,
  ClusterStatus,
  getAddonStatusLabel,
  getClusterStatusLabel,
  ManagedClusterDefinition,
  patchResource,
  ResourceErrorCode,
} from '../../../../resources'
import { getDateTimeCell } from '../../helpers/table-row-helpers'
import { usePageContext } from '../ClustersPage'
import { AddCluster } from './components/AddCluster'
import { BatchChannelSelectModal } from './components/BatchChannelSelectModal'
import { BatchUpgradeModal } from './components/BatchUpgradeModal'
import { ClusterActionDropdown } from './components/ClusterActionDropdown'
import { DistributionField } from './components/DistributionField'
import { StatusField } from './components/StatusField'
import { useAllClusters } from './components/useAllClusters'
import { UpdateAutomationModal } from './components/UpdateAutomationModal'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useSharedAtoms, useRecoilState } from '../../../../shared-recoil'
import { OnboardingModal } from './components/OnboardingModal'
import { transformBrowserUrlToFilterPresets } from '../../../../lib/urlQuery'
import { ClusterAction, clusterSupportsAction } from './utils/cluster-actions'

const onToggle = (acmCardID: string, setOpen: (open: boolean) => void) => {
  setOpen(false)
  localStorage.setItem(acmCardID, 'hide')
}

export default function ManagedClusters() {
  const { t } = useTranslation()
  const alertContext = useContext(AcmAlertContext)
  let clusters = useAllClusters()
  clusters = clusters.filter((cluster) => {
    // don't show clusters in cluster pools in table
    if (cluster.hive.clusterPool) {
      return cluster.hive.clusterClaimName !== undefined
    } else {
      return true
    }
  })

  const onBoardingModalID = `${window.location.href}/clusteronboardingmodal`
  const [openOnboardingModal, setOpenOnboardingModal] = useState<boolean>(
    localStorage.getItem(onBoardingModalID)
      ? localStorage.getItem(onBoardingModalID) === 'show'
      : clusters.length === 1 && clusters.find((lc) => lc.name === 'local-cluster') !== undefined //Check if one cluster exists and it is local-cluster
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

  const history = useHistory()
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
                  click: () => history.push(createBackCancelLocation(NavigationPath.createCluster)),
                  isDisabled: !canCreateCluster,
                  tooltip: t('rbac.unauthorized'),
                  variant: ButtonVariant.primary,
                },
                {
                  id: 'importCluster',
                  title: t('managed.importCluster'),
                  click: () => history.push(createBackCancelLocation(NavigationPath.importCluster)),
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
  const [clusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
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
  emptyState?: React.ReactNode
}) {
  useEffect(() => {
    sessionStorage.removeItem('DiscoveredClusterDisplayName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    sessionStorage.removeItem('DiscoveredClusterApiURL')
  }, [])
  const { clusterCuratorsState, hostedClustersState } = useSharedAtoms()
  const [clusterCurators] = useRecoilState(clusterCuratorsState)
  const [hostedClusters] = useRecoilState(hostedClustersState)

  const { t } = useTranslation()
  const presets = transformBrowserUrlToFilterPresets(window.location.search)
  const [upgradeClusters, setUpgradeClusters] = useState<Array<Cluster> | undefined>()
  const [updateAutomationTemplates, setUpdateAutomationTemplates] = useState<Array<Cluster> | undefined>()
  const [selectChannels, setSelectChannels] = useState<Array<Cluster> | undefined>()
  const [modalProps, setModalProps] = useState<IBulkActionModalProps<Cluster> | { open: false }>({
    open: false,
  })

  const mckeyFn = useCallback(function mckeyFn(cluster: Cluster) {
    return cluster.name!
  }, [])

  const clusterNameColumn = useClusterNameColumn()
  const clusterNamespaceColumn = useClusterNamespaceColumn()
  const clusterStatusColumn = useClusterStatusColumn()
  const clusterProviderColumn = useClusterProviderColumn()
  const clusterControlPlaneColumn = useClusterControlPlaneColumn()
  const clusterDistributionColumn = useClusterDistributionColumn(clusterCurators, hostedClusters)
  const clusterLabelsColumn = useClusterLabelsColumn()
  const clusterNodesColumn = useClusterNodesColumn()
  const clusterAddonsColumn = useClusterAddonColumn()
  const clusterCreatedDataColumn = useClusterCreatedDateColumn()

  const modalColumns = useMemo(
    () => [clusterNameColumn, clusterStatusColumn, clusterProviderColumn],
    [clusterNameColumn, clusterStatusColumn, clusterProviderColumn]
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
      {
        id: 'updateAutomationTemplates',
        title: t('Update automation template'),
        click: (managedClusters: Array<Cluster>) => {
          if (!managedClusters) return
          setUpdateAutomationTemplates(managedClusters)
        },
        variant: 'bulk-action',
      },
      { id: 'seperator-1', variant: 'action-seperator' },
      {
        id: 'hibernate-cluster',
        title: t('managed.hibernate.plural'),
        click: (clusters) => {
          setModalProps({
            open: true,
            title: t('bulk.title.hibernate'),
            action: t('hibernate'),
            processing: t('hibernating'),
            resources: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Hibernate)),
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
            plural: t('hibernatable.clusters'),
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
            resources: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Resume)),
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
            plural: t('resumable.clusters'),
          })
        },
        variant: 'bulk-action',
      },
      { id: 'seperator-2', variant: 'action-seperator' },
      {
        id: 'detachCluster',
        title: t('managed.detach.plural'),
        click: (clusters) => {
          setModalProps({
            open: true,
            title: t('bulk.title.detach'),
            action: t('detach'),
            plural: t('detachable clusters'),
            processing: t('detaching'),
            resources: clusters.filter((cluster) => clusterSupportsAction(cluster, ClusterAction.Detach)),
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
          setModalProps({
            open: true,
            title: t('bulk.title.destroy'),
            action: t('destroy'),
            processing: t('destroying'),
            plural: t('destroyable clusters'),
            resources: clusters.filter(
              (cluster) =>
                clusterSupportsAction(cluster, ClusterAction.Destroy) ||
                clusterSupportsAction(cluster, ClusterAction.Detach)
            ),
            description: t('bulk.message.destroy'),
            columns: modalColumns,
            keyFn: (cluster) => cluster.name as string,
            actionFn: (cluster) => deleteCluster(cluster, true),
            close: () => setModalProps({ open: false }),
            isDanger: true,
            icon: 'warning',
            confirmText: t('confirm'),
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
          })
        },
        variant: 'bulk-action',
      },
    ],
    [modalColumns, t]
  )

  const rowActions = useMemo(() => [], [])

  const filters = useMemo<ITableFilter<Cluster>[]>(() => {
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
  }, [t])

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
        plural="clusters"
        items={props.clusters}
        columns={columns}
        keyFn={mckeyFn}
        key="managedClustersTable"
        tableActionButtons={props.tableButtonActions}
        tableActions={tableActions}
        rowActions={rowActions}
        emptyState={props.emptyState}
        initialFilters={presets.initialFilters.addons ? { 'add-ons': presets.initialFilters.addons } : undefined}
        filters={filters}
        id="managedClusters"
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
    cell: (cluster) => (
      <>
        <span style={{ whiteSpace: 'nowrap' }}>
          <Link to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>{cluster.displayName}</Link>
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
    cell: (cluster) => cluster.namespace || '-',
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
  }
}

export function useClusterProviderColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.provider'),
    sort: 'provider',
    search: 'provider',
    cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
  }
}

export function useClusterControlPlaneColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.controlplane'),
    cell: (cluster) => {
      if (cluster.name === 'local-cluster') {
        return t('Hub')
      }
      if (cluster.isRegionalHubCluster) {
        if (cluster.isHostedCluster || cluster.isHypershift) {
          return t('Hub, Hosted')
        }
        return t('Hub')
      }
      if (cluster.isHostedCluster || cluster.isHypershift) {
        return t('Hosted')
      } else {
        return t('Standalone')
      }
    },
  }
}

export function useClusterDistributionColumn(
  clusterCurators: ClusterCurator[],
  hostedClusters: HostedClusterK8sResource[]
): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
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
  }
}

export function useClusterLabelsColumn(): IAcmTableColumn<Cluster> {
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
            'local-cluster',
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
            expandedText={t('show.less')}
            collapsedText={t('show.more', { number: collapse.length })}
            allCollapsedText={t('count.labels', { number: collapse.length })}
            collapse={collapse}
          />
        )
      } else {
        return '-'
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
    cell: (cluster) => {
      const dateTimeCell = getDateTimeCell(
        cluster.creationTimestamp ? new Date(cluster.creationTimestamp).toString() : '-'
      )
      return dateTimeCell.title === 'Invalid Date' ? '-' : dateTimeCell.title
    },
  }
}
