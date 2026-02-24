/* Copyright Contributors to the Open Cluster Management project */

import {
  AgentClusterInstallK8sResource,
  getVersionFromReleaseImage,
  HostedClusterK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { Alert, Label, Content, ContentVariants, Tooltip } from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { Link } from 'react-router-dom-v5-compat'
import { useMemo } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { getClusterNavPath, NavigationPath } from '../../NavigationPath'
import {
  ClusterCurator,
  ClusterImageSet,
  getRoles,
  NodeInfo,
  ClusterDeployment,
  ClusterDeploymentDefinition,
} from '../../resources'
import {
  Cluster,
  exportObjectString,
  getClusterStatusLabel,
  getISOStringTimestamp,
  AddonStatus,
  ClusterStatus,
  getAddonStatusLabel,
  ResourceErrorCode,
  patchResource,
  filterLabelFn,
} from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmInlineProvider,
  AcmInlineStatusGroup,
  AcmLabels,
  compareStrings,
  IAcmTableColumn,
  Provider,
  ProviderLongTextMap,
  AcmEmptyState,
  getNodeStatusLabel,
  IAcmTableAction,
  ITableAdvancedFilter,
  ITableFilter,
  StatusType,
  AcmVisitedLink,
} from '../../ui-components'
import { getDateTimeCell } from '../../routes/Infrastructure/helpers/table-row-helpers'
import { DistributionField } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/DistributionField'
import { StatusField } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/StatusField'
import { ClusterActionDropdown } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/ClusterActionDropdown'
import { TFunction } from 'react-i18next'
import keyBy from 'lodash/keyBy'
import { HighlightSearchText } from '../HighlightSearchText'
import AcmTimestamp from '../../lib/AcmTimestamp'
import { BulkActionModalProps, errorIsNot } from '../BulkActionModal'
import { deleteCluster, detachCluster } from '../../lib/delete-cluster'
import {
  ClusterAction,
  clusterDestroyable,
  clusterSupportsAction,
} from '../../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions'
import { SearchOperator } from '../../ui-components/AcmSearchInput'
import { handleStandardComparison, handleSemverOperatorComparison } from '../../lib/search-utils'
import { getClusterLabelData } from '../../routes/Infrastructure/Clusters/ManagedClusters/utils/utils'

const patchClusterPowerState = (cluster: Cluster, powerState: 'Hibernating' | 'Running') =>
  patchResource(
    {
      apiVersion: ClusterDeploymentDefinition.apiVersion,
      kind: ClusterDeploymentDefinition.kind,
      metadata: {
        name: cluster.name,
        namespace: cluster.namespace!,
      },
    } as ClusterDeployment,
    [{ op: 'replace', path: '/spec/powerState', value: powerState }]
  )

export function useClusterNameColumn(areLinksDisplayed: boolean = true): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.name'),
    tooltip: t('table.name.helperText.noBold'),
    sort: 'displayName',
    search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
    cell: (cluster, search) => (
      <>
        <span style={{ whiteSpace: 'nowrap' }}>
          {areLinksDisplayed ? (
            <AcmVisitedLink to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>
              <HighlightSearchText text={cluster.displayName} searchText={search} isLink useFuzzyHighlighting />
            </AcmVisitedLink>
          ) : (
            <HighlightSearchText text={cluster.displayName} searchText={search} useFuzzyHighlighting />
          )}
        </span>
        {cluster.hive.clusterClaimName && (
          <Content>
            <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
          </Content>
        )}
      </>
    ),
    exportContent: (cluster) => cluster.displayName,
  }
}

export function useClusterNameColumnModal(areLinksDisplayed: boolean = true): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.name'),
    tooltip: t('table.name.helperText.noBold'),
    sort: 'displayName',
    search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
    cell: (cluster) => (
      <>
        <span style={{ whiteSpace: 'nowrap' }}>
          {areLinksDisplayed ? (
            <Link to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>{cluster.displayName}</Link>
          ) : (
            <span>{cluster.displayName}</span>
          )}
          {clusterDestroyable(cluster) ? (
            ''
          ) : (
            <Tooltip
              content={
                <Content component="p">
                  {cluster.isHypershift
                    ? t(
                        'Hosted clusters cannot be destroyed from the console. Use the individual cluster destroy option to see CLI instructions.'
                      )
                    : t('Imported clusters cannot be destroyed.')}
                </Content>
              }
            >
              <Label style={{ marginLeft: '5px' }} color="red">
                {t('Undestroyable')}
              </Label>
            </Tooltip>
          )}
        </span>
        {cluster.hive.clusterClaimName && (
          <Content>
            <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
          </Content>
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
        <HighlightSearchText text={cluster.namespace ?? '-'} searchText={search} useFuzzyHighlighting />
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

  switch (true) {
    case isHub && isHosted:
      return t('Hub, Hosted')
    case isHub:
      return t('Hub')
    case isHosted:
      return t('Hosted')
    default:
      return t('Standalone')
  }
}

export function useClusterControlPlaneColumn(hubClusterName: string = ''): IAcmTableColumn<Cluster> {
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
        hostedCluster={hostedClusters.find(
          (hc) => hc.metadata?.name === cluster.name && hc.metadata?.namespace === cluster.namespace
        )}
        resource={'managedclusterpage'}
      />
    ),
    exportContent: (cluster) => {
      return getClusterDistributionString(cluster, clusterImageSets, agentClusterInstalls, allClusters)
    },
  }
}

export function useClusterLabelsColumn(isLarge: boolean, hubClusterName: string = ''): IAcmTableColumn<Cluster> {
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
    cell: (cluster) =>
      cluster.nodes?.nodeList?.length ? (
        <AcmInlineStatusGroup
          healthy={cluster.nodes?.ready}
          danger={cluster.nodes?.unhealthy}
          unknown={cluster.nodes?.unknown}
        />
      ) : (
        '-'
      ),
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

export function useClusterSetColumn(): IAcmTableColumn<Cluster> {
  const { t } = useTranslation()
  return {
    header: t('table.clusterSet'),
    sort: 'clusterSet',
    search: 'clusterSet',
    cell: (cluster, search) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        <HighlightSearchText text={cluster.clusterSet ?? '-'} searchText={search} useFuzzyHighlighting />
      </span>
    ),
    exportContent: (cluster) => cluster.clusterSet,
  }
}

export function useModalColumns(
  clusterNameColumnModal: IAcmTableColumn<Cluster>,
  clusterStatusColumn: IAcmTableColumn<Cluster>,
  clusterProviderColumn: IAcmTableColumn<Cluster>
): IAcmTableColumn<Cluster>[] {
  return [clusterNameColumnModal, clusterStatusColumn, clusterProviderColumn]
}

export function useTableActions(
  modalColumns: IAcmTableColumn<Cluster>[],
  infraEnvs: any[],
  setUpgradeClusters: (clusters: Array<Cluster> | undefined) => void,
  setSelectChannels: (clusters: Array<Cluster> | undefined) => void,
  setUpdateAutomationTemplates: (clusters: Array<Cluster> | undefined) => void,
  setRemoveAutomationTemplates: (clusters: Array<Cluster> | undefined) => void,
  setModalProps: (props: BulkActionModalProps<Cluster> | { open: false }) => void
): IAcmTableAction<Cluster>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'upgradeClusters',
      title: t('managed.update.plural'),
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
      click: (clusters) =>
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
          keyFn: (cluster) => cluster.name,
          actionFn: (cluster) => patchClusterPowerState(cluster, 'Hibernating'),
          close: () => setModalProps({ open: false }),
          isValidError: errorIsNot([ResourceErrorCode.NotFound]),
        }),
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
          keyFn: (cluster) => cluster.name,
          actionFn: (cluster) => patchClusterPowerState(cluster, 'Running'),
          close: () => setModalProps({ open: false }),
          isValidError: errorIsNot([ResourceErrorCode.NotFound]),
        })
      },
      variant: 'bulk-action',
    },
    { id: 'seperator-2', variant: 'action-separator' },
    {
      id: 'detachCluster',
      title: t('managed.detach.plural'),
      click: (clusters) =>
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
          keyFn: (cluster) => cluster.name,
          actionFn: (cluster) => detachCluster(cluster),
          close: () => setModalProps({ open: false }),
          isDanger: true,
          icon: 'warning',
          confirmText: t('confirm'),
          isValidError: errorIsNot([ResourceErrorCode.NotFound]),
        }),
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
              >
                <Content>
                  {t('It will not be destroyed when you perform this action.', {
                    count: unDestroyedClusters.length,
                  })}
                </Content>
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
          keyFn: (cluster) => cluster.name,
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
  ]
}

export function useAdvancedFilters(
  clusters: Cluster[],
  clusterImageSets: any[],
  agentClusterInstalls: any[]
): ITableAdvancedFilter<Cluster>[] {
  const { t } = useTranslation()

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
}

export function useFilters(clusters: Cluster[]): ITableFilter<Cluster>[] {
  const { t } = useTranslation()
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
}

interface UseTableColumnsParams {
  clusters: Cluster[]
  areLinksDisplayed: boolean
  localHubName: string
  clusterCurators: any[]
  hostedClusters: any[]
  hideTableActions: boolean
  hiddenColumns: string[]
}

export function useTableColumns({
  clusters,
  areLinksDisplayed,
  localHubName,
  clusterCurators,
  hostedClusters,
  hideTableActions,
  hiddenColumns,
}: UseTableColumnsParams) {
  const clusterNameColumn = useClusterNameColumn(areLinksDisplayed)
  const clusterNameColumnModal = useClusterNameColumnModal(areLinksDisplayed)
  const clusterNamespaceColumn = useClusterNamespaceColumn()
  const clusterStatusColumn = useClusterStatusColumn()
  const clusterProviderColumn = useClusterProviderColumn()
  const clusterControlPlaneColumn = useClusterControlPlaneColumn(localHubName)
  const clusterDistributionColumn = useClusterDistributionColumn(clusters, clusterCurators, hostedClusters)
  const clusterLabelsColumn = useClusterLabelsColumn(clusters.length > 10, localHubName)
  const clusterSetColumn = useClusterSetColumn()
  const clusterNodesColumn = useClusterNodesColumn()
  const clusterAddonsColumn = useClusterAddonColumn()
  const clusterCreatedDataColumn = useClusterCreatedDateColumn()

  const modalColumns = useModalColumns(clusterNameColumnModal, clusterStatusColumn, clusterProviderColumn)

  const allTableColumns = useMemo<IAcmTableColumn<Cluster>[]>(
    () => [
      clusterNameColumn,
      clusterNamespaceColumn,
      clusterStatusColumn,
      clusterProviderColumn,
      clusterControlPlaneColumn,
      clusterDistributionColumn,
      clusterSetColumn,
      clusterLabelsColumn,
      clusterNodesColumn,
      clusterAddonsColumn,
      clusterCreatedDataColumn,
      ...(hideTableActions
        ? []
        : [
            {
              header: '',
              cell: (cluster: Cluster) => <ClusterActionDropdown cluster={cluster} isKebab={true} />,
              cellTransforms: [fitContent],
              isActionCol: true,
            },
          ]),
    ],
    [
      clusterNameColumn,
      clusterNamespaceColumn,
      clusterStatusColumn,
      clusterProviderColumn,
      clusterControlPlaneColumn,
      clusterDistributionColumn,
      clusterSetColumn,
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
      allTableColumns.filter((column) =>
        typeof column.header === 'string' ? !hiddenColumns.includes(column.header) : true
      ),
    [allTableColumns, hiddenColumns]
  )

  return {
    columns,
    modalColumns,
  }
}
