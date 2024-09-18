/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
import { PageSection, Stack } from '@patternfly/react-core'
import { isEqual } from 'lodash'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import {
  Addon,
  AddonStatus,
  Cluster,
  ClusterStatus,
  ManagedClusterInfo,
  Policy,
  PolicyReport,
  PolicyReportResults,
} from '../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import {
  AcmAlert,
  AcmDonutChart,
  AcmLoadingPage,
  AcmOverviewProviders,
  AcmSummaryList,
  colorThemes,
  Provider,
} from '../../../ui-components'
import { useClusterAddons } from '../../Infrastructure/Clusters/ClusterSets/components/useClusterAddons'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { searchClient } from '../../Search/search-sdk/search-client'
import { useSearchResultCountLazyQuery } from '../../Search/search-sdk/search-sdk'
import { SupportedAggregate, useAggregate } from '../../../lib/useAggregates'

function getClusterSummary(
  clusters: Cluster[],
  allAddons: { [id: string]: Addon[] },
  selectedCloud: string,
  setSelectedCloud: Dispatch<SetStateAction<string>>
) {
  const clusterSummary = clusters.reduce(
    (prev: any, curr: Cluster) => {
      // Data for Providers section.
      // Get cloud label. If not available set to Other until the label is present.
      const cloudLabel = curr?.labels?.cloud || 'Other'
      const cloud = curr.provider || Provider.other
      const provider = prev.providers.find((p: any) => p.provider === cloud)
      if (provider) {
        provider.clusterCount = provider.clusterCount + 1
        if (cloudLabel) {
          provider.cloudLabels.add(cloudLabel)
        }
      } else {
        const cloudLabels = new Set()
        if (cloudLabel) {
          cloudLabels.add(cloudLabel)
        }
        prev.providers.push({
          provider: cloud,
          clusterCount: 1,
          cloudLabels,
          isSelected: selectedCloud === cloud,
          onClick: () => {
            // Clicking on the selected cloud card will remove the selection.
            selectedCloud === cloud ? setSelectedCloud('') : setSelectedCloud(cloud)
          },
        })
      }

      // Collect stats if cluster matches selected cloud filter. Defaults to all.
      if (selectedCloud === '' || selectedCloud === cloud) {
        // Data for Summary section.
        prev.clusterNames.add(curr.name)
        prev.kubernetesTypes.add(curr.labels?.vendor ?? 'Other')
        prev.regions.add(curr.labels?.region ?? 'Other')

        const clusterStatus: ClusterStatus = curr.status
        // Data for Cluster status pie chart.
        if (clusterStatus === 'ready') {
          prev.ready = prev.ready + 1
        } else {
          prev.offline = prev.offline + 1
        }

        // addon statuses
        allAddons[curr.name].forEach(({ status }) => {
          switch (status) {
            case AddonStatus.Available:
              prev.addons.healthy.count = prev.addons.healthy.count + 1
              prev.addons.healthy.clusters.add(curr.name)
              break
            case AddonStatus.Degraded:
              prev.addons.danger.count = prev.addons.danger.count + 1
              prev.addons.danger.clusters.add(curr.name)
              break
            case AddonStatus.Progressing:
              prev.addons.progress.count = prev.addons.progress.count + 1
              prev.addons.progress.clusters.add(curr.name)
              break
            default:
              prev.addons.unknown.count = prev.addons.unknown.count + 1
              prev.addons.unknown.clusters.add(curr.name)
              break
          }
        })
      }
      return prev
    },
    {
      kubernetesTypes: new Set(),
      regions: new Set(),
      ready: 0,
      offline: 0,
      addons: {
        healthy: { count: 0, clusters: new Set() },
        danger: { count: 0, clusters: new Set() },
        progress: { count: 0, clusters: new Set() },
        pending: { count: 0, clusters: new Set() },
        unknown: { count: 0, clusters: new Set() },
      },
      providerCounts: {},
      providers: [],
      clusterNames: new Set(),
    }
  )

  return clusterSummary
}

const searchQueries = (selectedClusters: Array<string>, clusters: Cluster[]): Array<any> => {
  const baseSearchQueries = [
    {
      keywords: [],
      filters: [
        { property: 'kind', values: ['Pod'] },
        { property: 'status', values: ['Running', 'Completed'] },
      ],
    },
    {
      keywords: [],
      filters: [
        { property: 'kind', values: ['Pod'] },
        {
          property: 'status',
          values: ['ContainerCreating', 'ContainerStatusUnknown', 'Pending', 'Terminating', 'Waiting'],
        },
      ],
    },
    {
      keywords: [],
      filters: [
        { property: 'kind', values: ['Pod'] },
        {
          property: 'status',
          values: [
            'CrashLoopBackOff',
            'CreateContainerError',
            'Error',
            'Failed',
            'ImagePullBackOff',
            'OOMKilled',
            'Terminated',
            'Unknown',
          ],
        },
      ],
    },
  ]

  if (selectedClusters?.length < clusters.length) {
    baseSearchQueries.forEach((query) => {
      query.filters.push({ property: 'cluster', values: selectedClusters })
    })
  }
  return baseSearchQueries
}

export default function OverviewPage() {
  usePageVisitMetricHandler(Pages.overview)
  const { t } = useTranslation()
  const { managedClusterInfosState, policyreportState, usePolicies } = useSharedAtoms()

  const policies = usePolicies()
  const policyReports = useRecoilValue(policyreportState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const [selectedCloud, setSelectedCloud] = useState<string>('')
  const [selectedClusterNames, setSelectedClusterNames] = useState<string[]>([])
  const [summaryData, setSummaryData] = useState<any>({
    kubernetesTypes: new Set(),
    regions: new Set(),
    ready: 0,
    offline: 0,
    addons: {
      healthy: { count: 0, clusters: new Set() },
      danger: { count: 0, clusters: new Set() },
      progress: { count: 0, clusters: new Set() },
      pending: { count: 0, clusters: new Set() },
      unknown: { count: 0, clusters: new Set() },
    },
    providers: [],
  })

  const clusters = useAllClusters(true)

  const { itemCount, loading } = useAggregate(SupportedAggregate.statuses, {})

  const allAddons = useClusterAddons()

  const nonCompliantClusters = useMemo(() => {
    const nonCompliantClustersSet = new Set<string>()
    policies.forEach((c: Policy) => {
      c?.status?.status?.forEach((i: { clustername: string; clusternamespace: string; compliant?: string }) => {
        if (selectedClusterNames.length === 0 || selectedClusterNames.includes(i.clustername)) {
          if (i.compliant === 'NonCompliant') {
            nonCompliantClustersSet.add(i.clustername)
          }
        }
      })
    })
    return nonCompliantClustersSet
  }, [policies, selectedClusterNames])

  const compliantClusters = useMemo(() => {
    const tempClusters: string[] =
      selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((c) => c.name ?? '')
    return tempClusters.filter((c) => !nonCompliantClusters.has(c))
  }, [selectedClusterNames, clusters, nonCompliantClusters])

  const nodeCount = useMemo(() => {
    let count = 0
    managedClusterInfos.forEach((managedClusterInfo: ManagedClusterInfo) => {
      if (
        selectedClusterNames.length === 0 ||
        (managedClusterInfo.metadata.name && selectedClusterNames.includes(managedClusterInfo.metadata.name))
      ) {
        count = count + (managedClusterInfo.status?.nodeList?.length ?? 0)
      }
    })
    return count
  }, [selectedClusterNames, managedClusterInfos])

  const [fireSearchQuery, { data: searchData, loading: searchLoading, error: searchError }] =
    useSearchResultCountLazyQuery({
      client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

  useEffect(() => {
    fireSearchQuery({
      variables: { input: searchQueries(selectedClusterNames, clusters) },
    })
  }, [fireSearchQuery, selectedClusterNames, clusters])
  const searchResult = useMemo(() => searchData?.searchResult || [], [searchData?.searchResult])

  // Process data from API.
  useEffect(() => {
    const { kubernetesTypes, regions, ready, offline, providers, clusterNames, addons } = getClusterSummary(
      clusters || [],
      allAddons,
      selectedCloud,
      setSelectedCloud
    )
    setSummaryData({ kubernetesTypes, regions, ready, offline, addons, providers })

    if (selectedCloud === '') {
      if (selectedClusterNames.length !== clusters.map((cluster) => cluster.name).length) {
        setSelectedClusterNames(clusters.map((cluster) => cluster.name))
      }
    } else if (!isEqual(selectedClusterNames, Array.from(clusterNames))) {
      setSelectedClusterNames(Array.from(clusterNames))
    }
  }, [clusters, selectedCloud, searchData, selectedClusterNames, allAddons])

  const {
    policyReportCriticalCount,
    policyReportImportantCount,
    policyReportModerateCount,
    policyReportLowCount,
    clustersWithIssuesCount,
  } = useMemo(() => {
    const clustersToSearch: string[] =
      selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((cluster) => cluster.name ?? '')
    const policyReportsForSelectedClusters = policyReports.filter((policyReport: PolicyReport) =>
      clustersToSearch.find((clusterName: string) => clusterName === policyReport.scope?.name)
    )

    let policyReportCriticalCount = 0
    let policyReportImportantCount = 0
    let policyReportModerateCount = 0
    let policyReportLowCount = 0
    let clustersWithIssuesCount = 0
    policyReportsForSelectedClusters.forEach((policyReport: PolicyReport) => {
      const insightsFilteredResults = policyReport.results.filter((result) => result.source === 'insights')
      insightsFilteredResults.length > 0 && clustersWithIssuesCount++
      insightsFilteredResults.forEach((result: PolicyReportResults) => {
        switch (result.properties.total_risk) {
          case '4':
            policyReportCriticalCount++
            break
          case '3':
            policyReportImportantCount++
            break
          case '2':
            policyReportModerateCount++
            break
          case '1':
            policyReportLowCount++
            break
        }
      })
    })

    return {
      policyReportCriticalCount,
      policyReportImportantCount,
      policyReportModerateCount,
      policyReportLowCount,
      clustersWithIssuesCount,
    }
  }, [policyReports, selectedClusterNames, clusters])

  const { kubernetesTypes, regions, ready, offline, addons, providers } = summaryData
  const { healthy, danger, progress, unknown } = addons
  const provider = providers.find((p: any) => p.provider === selectedCloud)
  const cloudLabelFilter: string =
    selectedCloud === ''
      ? ''
      : `%20label%3a${Array.from(provider.cloudLabels)
          .map((n) => `cloud=${n}`)
          .join(',')}`

  const buildSummaryLinks = useCallback(
    (kind: string, localCluster?: boolean) => {
      const localClusterFilter: string = localCluster === true ? `%20cluster%3Alocal-cluster` : ''
      return selectedCloud === ''
        ? `${NavigationPath.search}?filters={"textsearch":"kind%3A${kind}${localClusterFilter}"}`
        : `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster${cloudLabelFilter}"}&showrelated=${kind}`
    },
    [cloudLabelFilter, selectedCloud]
  )

  const summary = useMemo(() => {
    let overviewSummary = [
      {
        isLoading: loading,
        description: t('Applications'),
        count: itemCount || 0,
        href: NavigationPath.applications,
      },
      {
        isLoading: !clusters,
        description: t('Clusters'),
        count: selectedClusterNames.length > 0 ? selectedClusterNames.length : clusters.length || 0,
        href: `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster${cloudLabelFilter}"}`,
      },
      {
        isLoading: kubernetesTypes?.size === null,
        description: t('Kubernetes type'),
        count: kubernetesTypes?.size,
      },
      {
        isLoading: regions?.size === null,
        description: t('Region'),
        count: regions?.size,
      },
      {
        isLoading: nodeCount === null,
        description: t('Nodes'),
        count: nodeCount || 0,
        href: buildSummaryLinks('Node'),
      },
    ]
    if (searchError) {
      // Hide pods data if search is unavailable or throwing errors
      overviewSummary = overviewSummary.slice(0, 5)
    }
    return overviewSummary
  }, [
    loading,
    t,
    itemCount,
    clusters,
    selectedClusterNames,
    cloudLabelFilter,
    kubernetesTypes?.size,
    regions?.size,
    nodeCount,
    buildSummaryLinks,
    searchError,
  ])

  const podData = useMemo(() => {
    // TODO: Breaks url if length of selectedClustersFilter is too big.
    // Issue: https://github.com/open-cluster-management/backlog/issues/7087
    const urlClusterFilter: string =
      selectedClusterNames.length > 0 ? `%20cluster%3A${selectedClusterNames.join(',')}` : ''
    return [
      {
        key: t('Failed'),
        value: searchResult[2]?.count || 0,
        link: `${NavigationPath.search}?filters={"textsearch":"kind%3APod%20status%3ACrashLoopBackOff%2CError%2CFailed%2CImagePullBackOff%2CRunContainerError%2CTerminated%2CUnknown%2COOMKilled%2CCreateContainerError${urlClusterFilter}"}`,
      },
      {
        key: t('Pending'),
        value: searchResult[1]?.count || 0,
        link: `${NavigationPath.search}?filters={"textsearch":"kind%3APod%20status%3AContainerCreating%2CPending%2CTerminating%2CWaiting%2CContainerStatusUnknown${urlClusterFilter}"}`,
      },
      {
        key: t('Running'),
        value: searchResult[0]?.count || 0,
        isPrimary: true,
        link: `${NavigationPath.search}?filters={"textsearch":"kind%3APod%20status%3ARunning%2CCompleted${urlClusterFilter}"}`,
      },
    ]
  }, [searchResult, selectedClusterNames, t])

  // TODO: Breaks url if length of selectedClustersFilter is too big.
  // Issue: https://github.com/open-cluster-management/backlog/issues/7087
  function buildClusterComplianceLinks(clusterNames: Array<string> = []): string {
    return `${NavigationPath.search}?filters={"textsearch":"kind:Cluster${
      clusterNames.length > 0 ? `%20name:${clusterNames.join(',')}` : ''
    }"}&showrelated=Policy`
  }
  const complianceData = useMemo(() => {
    return [
      {
        key: t('With violations'),
        value: nonCompliantClusters.size,
        useForTitleCount: true,
        link: buildClusterComplianceLinks(Array.from(nonCompliantClusters)),
      },
      {
        key: t('With no violations'),
        value: compliantClusters.length,
        isPrimary: true,
        link: buildClusterComplianceLinks(compliantClusters),
      },
    ]
  }, [compliantClusters, nonCompliantClusters, t])

  const clusterData = useMemo(() => {
    return [
      {
        key: t('Offline'),
        value: offline,
        link: `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20ManagedClusterConditionAvailable%3A!True${cloudLabelFilter}"}`,
      },
      {
        key: t('Ready'),
        value: ready,
        isPrimary: true,
        link: `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20ManagedClusterConditionAvailable%3ATrue${cloudLabelFilter}"}`,
      },
    ]
  }, [cloudLabelFilter, offline, ready, t])

  function buildClusterAddonLinks(addonType: string): string {
    return `${NavigationPath.managedClusters}?add-ons=${addonType}`
  }

  const clusterAddonData = useMemo(() => {
    return [
      {
        key: t('Degraded'),
        value: danger.count,
        link: buildClusterAddonLinks(AddonStatus.Degraded),
      },
      {
        key: t('Progressing'),
        value: progress.count,
        link: buildClusterAddonLinks(AddonStatus.Progressing),
      },
      {
        key: t('Unknown'),
        value: unknown.count,
        link: buildClusterAddonLinks(AddonStatus.Unknown),
      },
      {
        key: t('Available'),
        value: healthy.count,
        isPrimary: true,
        link: buildClusterAddonLinks(AddonStatus.Available),
      },
    ]
  }, [healthy, danger, progress, unknown, t])

  const policyReportData = useMemo(() => {
    return [
      {
        key: t('Critical'),
        value: policyReportCriticalCount,
        isPrimary: true,
        link:
          policyReportCriticalCount > 0
            ? `${NavigationPath.search}?filters={"textsearch":"kind%3APolicyReport%20critical%3A>0"}`
            : undefined,
      },
      {
        key: t('Important'),
        value: policyReportImportantCount,
        link:
          policyReportImportantCount > 0
            ? `${NavigationPath.search}?filters={"textsearch":"kind%3APolicyReport%20important%3A>0"}`
            : undefined,
      },
      {
        key: t('Moderate'),
        value: policyReportModerateCount,
        link:
          policyReportModerateCount > 0
            ? `${NavigationPath.search}?filters={"textsearch":"kind%3APolicyReport%20moderate%3A>0"}`
            : undefined,
      },
      {
        key: t('Low'),
        value: policyReportLowCount,
        link:
          policyReportLowCount > 0
            ? `${NavigationPath.search}?filters={"textsearch":"kind%3APolicyReport%20low%3A>0"}`
            : undefined,
      },
    ]
  }, [policyReportCriticalCount, policyReportImportantCount, policyReportLowCount, policyReportModerateCount, t])

  return (
    <>
      {searchError && (
        <PageSection>
          <AcmAlert
            noClose
            isInline
            variant={searchError?.graphQLErrors[0]?.message?.includes('not enabled') ? 'info' : 'warning'}
            title={
              searchError?.graphQLErrors[0]?.message?.includes('not enabled')
                ? t('Configuration alert')
                : t('An unexpected error occurred.')
            }
            subtitle={
              searchError?.graphQLErrors[0]?.message ||
              t('The search service is unavailable or degraded. Some data might be missing from this view.')
            }
          />
        </PageSection>
      )}
      <PageSection style={{ paddingTop: 0 }}>
        <Stack hasGutter>
          {!clusters ? <AcmLoadingPage /> : <AcmOverviewProviders providers={providers} />}

          <AcmSummaryList title={t('Summary')} list={summary} />

          <Stack hasGutter>
            <AcmMasonry minSize={400} maxColumns={searchError ? 3 : 4}>
              <AcmDonutChart
                title={t('Cluster violations')}
                description={t('Overview of policy violation status')}
                loading={!complianceData}
                data={complianceData}
                colorScale={colorThemes.criticalSuccess}
              />
              {!searchError ? (
                <AcmDonutChart
                  title={t('Pods')}
                  description={t('Overview of pod count and status')}
                  loading={searchLoading}
                  data={podData}
                  colorScale={colorThemes.criticalLowSuccess}
                />
              ) : undefined}
              <AcmDonutChart
                title={t('Cluster status')}
                description={t('Overview of cluster status')}
                loading={!clusterData}
                data={clusterData}
                colorScale={colorThemes.criticalSuccess}
              />
              <AcmDonutChart
                title={t('Cluster issues')}
                description={t('Overview of cluster issues')}
                loading={!policyReportData}
                data={policyReportData}
                donutLabel={{
                  title: `${clustersWithIssuesCount}`,
                  subTitle: t('{{count}} clusters with issues', { count: clustersWithIssuesCount }),
                }}
                colorScale={colorThemes.criticalImportantModerateLow}
              />
              <AcmDonutChart
                title={t('Cluster add-ons')}
                description={t('Overview of cluster add-ons')}
                loading={!clusterAddonData}
                data={clusterAddonData}
                colorScale={colorThemes.criticalLowUnknownSuccess}
              />
            </AcmMasonry>
          </Stack>
        </Stack>
      </PageSection>
    </>
  )
}
