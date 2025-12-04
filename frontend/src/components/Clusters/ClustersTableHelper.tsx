/* Copyright Contributors to the Open Cluster Management project */

import {
  AgentClusterInstallK8sResource,
  getVersionFromReleaseImage,
  HostedClusterK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { Label, Text, TextContent, TextVariants, Tooltip } from '@patternfly/react-core'
import { nowrap } from '@patternfly/react-table'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { getClusterNavPath, NavigationPath } from '../../NavigationPath'
import { ClusterCurator, ClusterImageSet, getRoles, NodeInfo } from '../../resources'
import { Cluster, exportObjectString, getClusterStatusLabel, getISOStringTimestamp } from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmInlineProvider,
  AcmInlineStatusGroup,
  AcmLabels,
  compareStrings,
  IAcmTableColumn,
  Provider,
  ProviderLongTextMap,
} from '../../ui-components'
import { getDateTimeCell } from '../../routes/Infrastructure/helpers/table-row-helpers'
import { DistributionField } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/DistributionField'
import { StatusField } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/StatusField'
import { clusterDestroyable } from '../../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions'
import { TFunction } from 'react-i18next'
import keyBy from 'lodash/keyBy'
import { HighlightSearchText } from '../HighlightSearchText'
import AcmTimestamp from '../../lib/AcmTimestamp'

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
            <Link to={getClusterNavPath(NavigationPath.clusterDetails, cluster)}>
              <HighlightSearchText text={cluster.displayName} searchText={search} isLink useFuzzyHighlighting />
            </Link>
          ) : (
            <HighlightSearchText text={cluster.displayName} searchText={search} useFuzzyHighlighting />
          )}
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
        hostedCluster={hostedClusters.find((hc) => cluster.name === hc.metadata?.name)}
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
