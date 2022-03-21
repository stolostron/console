/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
import { ButtonVariant, PageSection, Stack } from '@patternfly/react-core'
import { PlusIcon } from '@patternfly/react-icons'
import {
    AcmActionGroup,
    AcmAlert,
    AcmAutoRefreshSelect,
    AcmButton,
    AcmChartGroup,
    AcmDonutChart,
    AcmLaunchLink,
    AcmLoadingPage,
    AcmOverviewProviders,
    AcmPage,
    AcmPageHeader,
    AcmRefreshTime,
    AcmRoute,
    AcmScrollable,
    AcmSummaryList,
    Provider,
} from '@stolostron/ui-components'
import _ from 'lodash'
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    acmRouteState,
    applicationsState,
    argoApplicationsState,
    managedClustersState,
    usePolicies,
} from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Policy } from '../../../resources'
import { ClusterManagementAddOn } from '../../../resources/cluster-management-add-on'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchResultCountLazyQuery, useSearchResultItemsLazyQuery } from '../Search/search-sdk/search-sdk'
import { getProvider } from '../../../resources'

function getClusterSummary(clusters: any, selectedCloud: string, setSelectedCloud: Dispatch<SetStateAction<string>>) {
    const clusterSummary = clusters.reduce(
        (prev: any, curr: any) => {
            // Data for Providers section.
            const cloudLabel = curr.metadata?.labels?.cloud || ''
            const cloud = getProvider(curr) || Provider.other
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
                prev.clusterNames.add(curr.metadata.name)
                prev.kubernetesTypes.add(curr.metadata.labels.vendor ?? 'Other')
                prev.regions.add(curr.metadata.labels.region ?? 'Other')

                const clusterConditions = _.get(curr, 'status.conditions') || []
                const isReady =
                    _.get(
                        clusterConditions.find((c: any) => c.type === 'ManagedClusterConditionAvailable'),
                        'status'
                    ) === 'True'

                // Data for Cluster status pie chart.
                if (isReady) {
                    prev.ready = prev.ready + 1
                } else {
                    prev.offline = prev.offline + 1
                }
            }
            return prev
        },
        {
            kubernetesTypes: new Set(),
            regions: new Set(),
            ready: 0,
            offline: 0,
            providerCounts: {},
            providers: [],
            clusterNames: new Set(),
        }
    )

    return clusterSummary
}

const searchQueries = (selectedClusters: Array<string>): Array<any> => {
    const baseSearchQueries = [
        { keywords: [], filters: [{ property: 'kind', values: ['node'] }] },
        { keywords: [], filters: [{ property: 'kind', values: ['pod'] }] },
        {
            keywords: [],
            filters: [
                { property: 'kind', values: ['pod'] },
                { property: 'status', values: ['Running', 'Completed'] },
            ],
        },
        {
            keywords: [],
            filters: [
                { property: 'kind', values: ['pod'] },
                { property: 'status', values: ['Pending', 'ContainerCreating', 'Waiting', 'Terminating'] },
            ],
        },
        {
            keywords: [],
            filters: [
                { property: 'kind', values: ['pod'] },
                {
                    property: 'status',
                    values: ['Failed', 'CrashLoopBackOff', 'ImagePullBackOff', 'Terminated', 'OOMKilled', 'Unknown'],
                },
            ],
        },
    ]

    if (selectedClusters?.length > 0) {
        baseSearchQueries.forEach((query) => {
            query.filters.push({ property: 'cluster', values: selectedClusters })
        })
    }
    return baseSearchQueries
}

const PageActions = (props: { timestamp: string; reloading: boolean; refetch: () => void }) => {
    const { t } = useTranslation()
    const [addons, setAddons] = useState()
    useEffect(() => {
        fireManagedClusterView(
            'local-cluster',
            'clustermanagementaddon',
            'addon.open-cluster-management.io/v1alpha1',
            'observability-controller'
        )
            .then((viewResponse) => {
                if (viewResponse.message) {
                    console.error('Error getting addons: ', viewResponse.message)
                } else {
                    setAddons(viewResponse.result)
                }
            })
            .catch((err) => {
                console.error('Error getting addons: ', err)
            })
    }, [])

    function getLaunchLink(addon: ClusterManagementAddOn) {
        const pathKey = 'console.open-cluster-management.io/launch-link'
        const textKey = 'console.open-cluster-management.io/launch-link-text'
        if (addon && addon.metadata.name === 'observability-controller') {
            return [
                {
                    id: addon.metadata.annotations?.[textKey] || '',
                    text: addon.metadata.annotations?.[textKey] || '',
                    href: addon.metadata.annotations?.[pathKey] || '',
                },
            ]
        } else {
            return []
        }
    }

    return (
        <Fragment>
            <AcmActionGroup>
                {addons && <AcmLaunchLink links={getLaunchLink(addons)} />}
                <AcmButton
                    component={Link}
                    variant={ButtonVariant.link}
                    to={NavigationPath.addCredentials}
                    id="add-credential"
                    icon={<PlusIcon />}
                    iconPosition="left"
                >
                    {t('Add credential')}
                </AcmButton>
                <AcmAutoRefreshSelect refetch={props.refetch} refreshIntervals={[30, 60, 5 * 60, 30 * 60, 0]} />
            </AcmActionGroup>
            <AcmRefreshTime timestamp={props.timestamp} reloading={props.reloading} />
        </Fragment>
    )
}

export default function OverviewPage() {
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const policies = usePolicies()
    const [apps] = useRecoilState(applicationsState)
    const [argoApps] = useRecoilState(argoApplicationsState)
    useEffect(() => setRoute(AcmRoute.Overview), [setRoute])
    const [clusters, setClusters] = useState<any[]>([])
    const [selectedCloud, setSelectedCloud] = useState<string>('')
    const [selectedClusterNames, setSelectedClusterNames] = useState<string[]>([])
    const [summaryData, setSummaryData] = useState<any>({
        kubernetesTypes: new Set(),
        regions: new Set(),
        ready: 0,
        offline: 0,
        providers: [],
    })

    const timestamp = new Date().toString() as string
    if (!_.isEqual(clusters, managedClusters || [])) {
        setClusters(managedClusters || [])
    }

    const nonCompliantClusters = new Set<string>()
    policies.forEach((c: Policy) => {
        c?.status?.status?.forEach((i: { clustername: string; clusternamespace: string; compliant?: string }) => {
            if (selectedClusterNames.length === 0 || selectedClusterNames.includes(i.clustername)) {
                if (i.compliant === 'NonCompliant') {
                    nonCompliantClusters.add(i.clustername)
                }
            }
        })
    })
    const tempClusters = selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((c) => c.metadata?.name)
    const compliantClusters = tempClusters.filter((c) => !nonCompliantClusters.has(c))

    // SEARCH-API
    const [
        fireSearchQuery,
        { called: searchCalled, data: searchData, loading: searchLoading, error: searchError, refetch: searchRefetch },
    ] = useSearchResultCountLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    useEffect(() => {
        if (!searchCalled) {
            fireSearchQuery({
                variables: { input: searchQueries(selectedClusterNames) },
            })
        } else {
            searchRefetch &&
                searchRefetch({
                    input: searchQueries(selectedClusterNames),
                })
        }
    }, [fireSearchQuery, selectedClusterNames, searchCalled, searchRefetch])
    const searchResult = searchData?.searchResult || []

    // Process data from API.
    useEffect(() => {
        const { kubernetesTypes, regions, ready, offline, providers, clusterNames } = getClusterSummary(
            clusters || [],
            selectedCloud,
            setSelectedCloud
        )
        setSummaryData({ kubernetesTypes, regions, ready, offline, providers })

        if (selectedCloud === '') {
            if (!_.isEqual(selectedClusterNames, [])) {
                setSelectedClusterNames([])
            }
        } else if (!_.isEqual(selectedClusterNames, Array.from(clusterNames))) {
            setSelectedClusterNames(Array.from(clusterNames))
        }
    }, [clusters, selectedCloud, searchData, selectedClusterNames])

    const [
        firePolicyReportQuery,
        {
            called: searchPolicyReportCalled,
            data: searchPolicyReportData,
            loading: searchPolicyReportLoading,
            error: searchPolicyReportError,
            refetch: searchPolicyReportRefetch,
        },
    ] = useSearchResultItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    const policyReportQuery = (clustersToSearch: Array<string>) => {
        return [
            {
                keywords: [],
                filters: [
                    {
                        property: 'kind',
                        values: ['policyreport'],
                    },
                    {
                        property: 'scope',
                        values: clustersToSearch,
                    },
                ],
            },
        ]
    }

    useEffect(() => {
        const clustersToSearch =
            selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((cluster) => cluster.metadata.name)
        if (!searchPolicyReportCalled && clustersToSearch.length > 0) {
            firePolicyReportQuery({
                variables: { input: policyReportQuery(clustersToSearch) },
            })
        } else if (clustersToSearch.length > 0) {
            searchPolicyReportRefetch &&
                searchPolicyReportRefetch({
                    input: policyReportQuery(clustersToSearch),
                })
        }
    }, [firePolicyReportQuery, clusters, selectedClusterNames, searchPolicyReportCalled, searchPolicyReportRefetch])
    const searchPolicyReportResult = searchPolicyReportData?.searchResult || []
    const policyReportItems = searchPolicyReportResult[0]?.items || []
    const policyReportCriticalCount = policyReportItems.reduce(
        (total: any, currentValue: any) => total + currentValue.critical,
        0
    )
    const policyReportImportantCount = policyReportItems.reduce(
        (total: any, currentValue: any) => total + currentValue.important,
        0
    )
    const policyReportModerateCount = policyReportItems.reduce(
        (total: any, currentValue: any) => total + currentValue.moderate,
        0
    )
    const policyReportLowCount = policyReportItems.reduce(
        (total: any, currentValue: any) => total + currentValue.low,
        0
    )

    const refetchData = () => {
        searchRefetch && searchRefetch({ input: searchQueries(selectedClusterNames) })
        const clustersToSearch =
            selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((cluster) => cluster.metadata.name)
        searchPolicyReportRefetch && searchPolicyReportRefetch({ input: policyReportQuery(clustersToSearch) })
    }

    const { kubernetesTypes, regions, ready, offline, providers } = summaryData
    const provider = providers.find((p: any) => p.provider === selectedCloud)
    const cloudLabelFilter: string =
        selectedCloud === ''
            ? ''
            : `%20label%3a${Array.from(provider.cloudLabels)
                  .map((n) => `cloud=${n}`)
                  .join(',')}`
    function buildSummaryLinks(kind: string, localCluster?: boolean) {
        const localClusterFilter: string = localCluster === true ? `%20cluster%3Alocal-cluster` : ''
        return selectedCloud === ''
            ? `/multicloud/home/search?filters={"textsearch":"kind%3A${kind}${localClusterFilter}"}`
            : `/multicloud/home/search?filters={"textsearch":"kind%3Acluster${cloudLabelFilter}"}&showrelated=${kind}`
    }
    const summary =
        searchLoading || searchPolicyReportLoading
            ? []
            : [
                  {
                      isPrimary: false,
                      description: 'Applications',
                      count: [...apps, ...argoApps].length || 0,
                      href: buildSummaryLinks('application', true),
                  },
                  {
                      isPrimary: false,
                      description: 'Clusters',
                      count:
                          selectedClusterNames.length > 0 ? selectedClusterNames.length : managedClusters.length || 0,
                      href: `/multicloud/home/search?filters={"textsearch":"kind%3Acluster${cloudLabelFilter}"}`,
                  },
                  { isPrimary: false, description: 'Kubernetes type', count: kubernetesTypes?.size },
                  { isPrimary: false, description: 'Region', count: regions?.size },
                  {
                      isPrimary: false,
                      description: 'Nodes',
                      count: searchResult[0]?.count || 0,
                      href: buildSummaryLinks('node'),
                  },
                  {
                      isPrimary: false,
                      description: 'Pods',
                      count: searchResult[1]?.count || 0,
                      href: buildSummaryLinks('pod'),
                  },
              ]

    // TODO: Breaks url if length of selectedClustersFilter is too big.
    // Issue: https://github.com/open-cluster-management/backlog/issues/7087
    const urlClusterFilter: string =
        selectedClusterNames.length > 0 ? `%20cluster%3A${selectedClusterNames.join(',')}` : ''
    const podData =
        searchLoading || searchPolicyReportLoading
            ? []
            : [
                  {
                      key: 'Failed',
                      value: searchResult[4]?.count || 0,
                      link: `/multicloud/home/search?filters={"textsearch":"kind%3Apod%20status%3ACrashLoopBackOff%2CFailed%2CImagePullBackOff%2CRunContainerError%2CTerminated%2CUnknown%2COOMKilled${urlClusterFilter}"}`,
                  },
                  {
                      key: 'Pending',
                      value: searchResult[3]?.count || 0,
                      link: `/multicloud/home/search?filters={"textsearch":"kind%3Apod%20status%3AContainerCreating%2CPending%2CTerminating%2CWaiting${urlClusterFilter}"}`,
                  },
                  {
                      key: 'Running',
                      value: searchResult[2]?.count || 0,
                      isPrimary: true,
                      link: `/multicloud/home/search?filters={"textsearch":"kind%3Apod%20status%3ARunning%2CCompleted${urlClusterFilter}"}`,
                  },
              ]

    // TODO: Breaks url if length of selectedClustersFilter is too big.
    // Issue: https://github.com/open-cluster-management/backlog/issues/7087
    function buildClusterComplianceLinks(clusterNames: Array<string> = []): string {
        return `/multicloud/home/search?filters={"textsearch":"kind:cluster${
            clusterNames.length > 0 ? `%20name:${clusterNames.join(',')}` : ''
        }"}&showrelated=policy`
    }
    const complianceData =
        searchLoading || searchPolicyReportLoading
            ? []
            : [
                  {
                      key: 'With violations',
                      value: nonCompliantClusters.size,
                      link: buildClusterComplianceLinks(Array.from(nonCompliantClusters)),
                  },
                  {
                      key: 'Without violations',
                      value: compliantClusters.length,
                      isPrimary: true,
                      link: buildClusterComplianceLinks(compliantClusters),
                  },
              ]

    const clusterData =
        searchLoading || searchPolicyReportLoading
            ? []
            : [
                  {
                      key: 'Offline',
                      value: offline,
                      link: `/multicloud/home/search?filters={"textsearch":"kind%3Acluster%20ManagedClusterConditionAvailable%3A!True${cloudLabelFilter}"}`,
                  },
                  {
                      key: 'Ready',
                      value: ready,
                      isPrimary: true,
                      link: `/multicloud/home/search?filters={"textsearch":"kind%3Acluster%20ManagedClusterConditionAvailable%3ATrue${cloudLabelFilter}"}`,
                  },
              ]

    const policyReportData =
        searchLoading || searchPolicyReportLoading
            ? []
            : [
                  {
                      key: 'Critical',
                      value: policyReportCriticalCount,
                      isPrimary: true,
                      link:
                          policyReportCriticalCount > 0
                              ? `/multicloud/home/search?filters={"textsearch":"kind%3Apolicyreport%20critical%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Important',
                      value: policyReportImportantCount,
                      link:
                          policyReportImportantCount > 0
                              ? `/multicloud/home/search?filters={"textsearch":"kind%3Apolicyreport%20important%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Moderate',
                      value: policyReportModerateCount,
                      link:
                          policyReportModerateCount > 0
                              ? `/multicloud/home/search?filters={"textsearch":"kind%3Apolicyreport%20moderate%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Low',
                      value: policyReportLowCount,
                      link:
                          policyReportLowCount > 0
                              ? `/multicloud/home/search?filters={"textsearch":"kind%3Apolicyreport%20low%3A>0"}`
                              : undefined,
                  },
              ]

    if (searchError || searchPolicyReportError) {
        return (
            <AcmPage
                header={
                    <AcmPageHeader
                        title={t('overview')}
                        actions={<PageActions timestamp={timestamp} reloading={searchLoading} refetch={refetchData} />}
                    />
                }
            >
                <PageSection>
                    <AcmAlert
                        noClose
                        isInline
                        variant={searchError?.graphQLErrors[0]?.message.includes('not enabled') ? 'info' : 'danger'}
                        title={
                            searchError?.graphQLErrors[0]?.message.includes('not enabled')
                                ? t('Configuration alert')
                                : t('An unexpected error occurred.')
                        }
                        subtitle={searchError?.graphQLErrors[0]?.message || t('The backend service is unavailable.')}
                    />
                </PageSection>
            </AcmPage>
        )
    }

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('Overview')}
                    actions={<PageActions timestamp={timestamp} reloading={searchLoading} refetch={refetchData} />}
                />
            }
        >
            <AcmScrollable>
                <PageSection>
                    <Stack hasGutter>
                        {searchLoading || searchPolicyReportLoading ? (
                            <AcmLoadingPage />
                        ) : (
                            <AcmOverviewProviders providers={providers} />
                        )}

                        {searchLoading || searchPolicyReportLoading ? (
                            <AcmSummaryList key="loading" loading title={t('Summary')} list={summary} />
                        ) : (
                            <AcmSummaryList title={t('Summary')} list={summary} />
                        )}

                        {searchLoading || searchPolicyReportLoading ? (
                            <AcmChartGroup>
                                <AcmDonutChart
                                    loading
                                    key="chart-loading-1"
                                    title="Cluster violations"
                                    description={t('Overview of policy violation status')}
                                    data={[]}
                                />
                                <AcmDonutChart
                                    loading
                                    key="chart-loading-2"
                                    title="Pods"
                                    description={t('Overview of pod count and status')}
                                    data={[]}
                                />
                                <AcmDonutChart
                                    loading
                                    key="chart-loading-3"
                                    title="Cluster status"
                                    description={t('Overview of cluster status')}
                                    data={[]}
                                />
                                <AcmDonutChart
                                    loading
                                    key="chart-loading-4"
                                    title="Clusters with issues"
                                    description={t('Overview of cluster issues')}
                                    data={[]}
                                />
                            </AcmChartGroup>
                        ) : (
                            <AcmChartGroup>
                                <AcmDonutChart
                                    title="Cluster violations"
                                    description={t('Overview of policy violation status')}
                                    data={complianceData}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--success-color--100)',
                                    ]}
                                />
                                <AcmDonutChart
                                    title="Pods"
                                    description={t('Overview of pod count and status')}
                                    data={podData}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--info-color--100)',
                                        'var(--pf-global--success-color--100)',
                                    ]}
                                />
                                <AcmDonutChart
                                    title="Cluster status"
                                    description={t('Overview of cluster status')}
                                    data={clusterData}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--success-color--100)',
                                    ]}
                                />
                                <AcmDonutChart
                                    title="Cluster issues"
                                    description={t('Overview of cluster issues')}
                                    data={policyReportData}
                                    donutLabel={{
                                        title: `${policyReportItems.length}`,
                                        subTitle: t('Clusters with issues'),
                                    }}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--palette--orange-300)',
                                        'var(--pf-global--palette--orange-200)',
                                        'var(--pf-global--warning-color--100)',
                                    ]}
                                />
                            </AcmChartGroup>
                        )}
                    </Stack>
                </PageSection>
            </AcmScrollable>
        </AcmPage>
    )
}
