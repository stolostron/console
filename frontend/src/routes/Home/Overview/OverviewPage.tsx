/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
import { ButtonVariant, PageSection, Split, SplitItem, Stack } from '@patternfly/react-core'
import { PlusIcon } from '@patternfly/react-icons'
import {
    AcmActionGroup,
    AcmAlert,
    AcmButton,
    AcmDonutChart,
    AcmLaunchLink,
    AcmLoadingPage,
    AcmOverviewProviders,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmScrollable,
    AcmSummaryList,
    Provider,
} from '@stolostron/ui-components'
import _ from 'lodash'
import { Dispatch, Fragment, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, applicationsState, argoApplicationsState, usePolicies } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Cluster, ClusterStatus, Policy } from '../../../resources'
import { ClusterManagementAddOn } from '../../../resources/cluster-management-add-on'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchResultCountLazyQuery, useSearchResultItemsLazyQuery } from '../Search/search-sdk/search-sdk'

function getClusterSummary(
    clusters: Cluster[],
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
                {
                    property: 'status',
                    values: ['ContainerCreating', 'ContainerStatusUnknown', 'Pending', 'Terminating', 'Waiting'],
                },
            ],
        },
        {
            keywords: [],
            filters: [
                { property: 'kind', values: ['pod'] },
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

    if (selectedClusters?.length > 0) {
        baseSearchQueries.forEach((query) => {
            query.filters.push({ property: 'cluster', values: selectedClusters })
        })
    }
    return baseSearchQueries
}

const PageActions = () => {
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
            </AcmActionGroup>
        </Fragment>
    )
}

export default function OverviewPage() {
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    const policies = usePolicies()
    const [apps] = useRecoilState(applicationsState)
    const [argoApps] = useRecoilState(argoApplicationsState)
    useEffect(() => setRoute(AcmRoute.Overview), [setRoute])
    const [selectedCloud, setSelectedCloud] = useState<string>('')
    const [selectedClusterNames, setSelectedClusterNames] = useState<string[]>([])
    const [summaryData, setSummaryData] = useState<any>({
        kubernetesTypes: new Set(),
        regions: new Set(),
        ready: 0,
        offline: 0,
        providers: [],
    })

    const allClusters: Cluster[] = useAllClusters()
    const clusters: Cluster[] = useMemo(() => {
        return allClusters.filter((cluster) => {
            // don't show clusters in cluster pools in table
            if (cluster.hive.clusterPool) {
                return cluster.hive.clusterClaimName !== undefined
            } else {
                return true
            }
        })
    }, [allClusters])

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
    const tempClusters: string[] =
        selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((c) => c.name ?? '')
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
    const searchResult = useMemo(() => searchData?.searchResult || [], [searchData?.searchResult])

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
            selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((cluster) => cluster.name ?? '')
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

    const {
        policyReportCriticalCount,
        policyReportImportantCount,
        policyReportModerateCount,
        policyReportLowCount,
        clustersWithIssuesCount,
    } = useMemo(() => {
        const searchPolicyReportResult = searchPolicyReportData?.searchResult || []
        const policyReportItems = searchPolicyReportResult[0]?.items || []
        const clustersWithIssuesCount = policyReportItems.filter((item: any) => item.numRuleViolations > 0).length
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

        return {
            policyReportCriticalCount,
            policyReportImportantCount,
            policyReportModerateCount,
            policyReportLowCount,
            clustersWithIssuesCount,
        }
    }, [searchPolicyReportData?.searchResult])

    const { kubernetesTypes, regions, ready, offline, providers } = summaryData
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
                : `${NavigationPath.search}?filters={"textsearch":"kind%3Acluster${cloudLabelFilter}"}&showrelated=${kind}`
        },
        [cloudLabelFilter, selectedCloud]
    )
    const summary = useMemo(() => {
        let overviewSummary = searchLoading
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
                      count: selectedClusterNames.length > 0 ? selectedClusterNames.length : clusters.length || 0,
                      href: `${NavigationPath.search}?filters={"textsearch":"kind%3Acluster${cloudLabelFilter}"}`,
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
        if (searchError) {
            // Hide node and pods if search is unavailable or throwing errors
            overviewSummary = overviewSummary.slice(0, 4)
        }
        return overviewSummary
    }, [
        apps,
        argoApps,
        buildSummaryLinks,
        cloudLabelFilter,
        kubernetesTypes?.size,
        clusters,
        regions?.size,
        searchError,
        searchLoading,
        searchResult,
        selectedClusterNames.length,
    ])

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
                      link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3ACrashLoopBackOff%2CError%2CFailed%2CImagePullBackOff%2CRunContainerError%2CTerminated%2CUnknown%2COOMKilled%2CCreateContainerError${urlClusterFilter}"}`,
                  },
                  {
                      key: 'Pending',
                      value: searchResult[3]?.count || 0,
                      link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3AContainerCreating%2CPending%2CTerminating%2CWaiting%2CContainerStatusUnknown${urlClusterFilter}"}`,
                  },
                  {
                      key: 'Running',
                      value: searchResult[2]?.count || 0,
                      isPrimary: true,
                      link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3ARunning%2CCompleted${urlClusterFilter}"}`,
                  },
              ]

    // TODO: Breaks url if length of selectedClustersFilter is too big.
    // Issue: https://github.com/open-cluster-management/backlog/issues/7087
    function buildClusterComplianceLinks(clusterNames: Array<string> = []): string {
        return `${NavigationPath.search}?filters={"textsearch":"kind:cluster${
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
                      link: `${NavigationPath.search}?filters={"textsearch":"kind%3Acluster%20ManagedClusterConditionAvailable%3A!True${cloudLabelFilter}"}`,
                  },
                  {
                      key: 'Ready',
                      value: ready,
                      isPrimary: true,
                      link: `${NavigationPath.search}?filters={"textsearch":"kind%3Acluster%20ManagedClusterConditionAvailable%3ATrue${cloudLabelFilter}"}`,
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
                              ? `${NavigationPath.search}?filters={"textsearch":"kind%3Apolicyreport%20critical%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Important',
                      value: policyReportImportantCount,
                      link:
                          policyReportImportantCount > 0
                              ? `${NavigationPath.search}?filters={"textsearch":"kind%3Apolicyreport%20important%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Moderate',
                      value: policyReportModerateCount,
                      link:
                          policyReportModerateCount > 0
                              ? `${NavigationPath.search}?filters={"textsearch":"kind%3Apolicyreport%20moderate%3A>0"}`
                              : undefined,
                  },
                  {
                      key: 'Low',
                      value: policyReportLowCount,
                      link:
                          policyReportLowCount > 0
                              ? `${NavigationPath.search}?filters={"textsearch":"kind%3Apolicyreport%20low%3A>0"}`
                              : undefined,
                  },
              ]

    return (
        <AcmPage header={<AcmPageHeader title={t('Overview')} actions={<PageActions />} />}>
            <AcmScrollable>
                {searchError && (
                    <PageSection>
                        <AcmAlert
                            noClose
                            isInline
                            variant={
                                searchError?.graphQLErrors[0]?.message.includes('not enabled') ? 'info' : 'warning'
                            }
                            title={
                                searchError?.graphQLErrors[0]?.message.includes('not enabled')
                                    ? t('Configuration alert')
                                    : t('An unexpected error occurred.')
                            }
                            subtitle={
                                searchError?.graphQLErrors[0]?.message ||
                                t(
                                    'The search service is unavailable or degraded. Some data might be missing from this view.'
                                )
                            }
                        />
                    </PageSection>
                )}
                <PageSection>
                    <Stack hasGutter>
                        {searchLoading ? <AcmLoadingPage /> : <AcmOverviewProviders providers={providers} />}

                        {searchLoading ? (
                            <AcmSummaryList key="loading" loading title={t('Summary')} list={summary} />
                        ) : (
                            <AcmSummaryList title={t('Summary')} list={summary} />
                        )}

                        {searchLoading ? (
                            <Split hasGutter isWrappable>
                                <SplitItem isFilled>
                                    <AcmDonutChart
                                        loading
                                        key="chart-loading-1"
                                        title="Cluster violations"
                                        description={t('Overview of policy violation status')}
                                        data={[]}
                                    />
                                </SplitItem>
                                {!searchError && (
                                    <SplitItem isFilled>
                                        <AcmDonutChart
                                            loading
                                            key="chart-loading-2"
                                            title="Pods"
                                            description={t('Overview of pod count and status')}
                                            data={[]}
                                        />
                                    </SplitItem>
                                )}
                                <SplitItem isFilled>
                                    <AcmDonutChart
                                        loading
                                        key="chart-loading-3"
                                        title="Cluster status"
                                        description={t('Overview of cluster status')}
                                        data={[]}
                                    />
                                </SplitItem>
                                {!searchPolicyReportError && (
                                    <SplitItem isFilled>
                                        <AcmDonutChart
                                            loading
                                            key="chart-loading-4"
                                            title="Clusters with issues"
                                            description={t('Overview of cluster issues')}
                                            data={[]}
                                        />
                                    </SplitItem>
                                )}
                            </Split>
                        ) : (
                            <Split hasGutter isWrappable>
                                <SplitItem>
                                    <AcmDonutChart
                                        title="Cluster violations"
                                        description={t('Overview of policy violation status')}
                                        data={complianceData}
                                        colorScale={[
                                            'var(--pf-global--danger-color--100)',
                                            'var(--pf-global--success-color--100)',
                                        ]}
                                    />
                                </SplitItem>
                                {!searchError && (
                                    <SplitItem>
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
                                    </SplitItem>
                                )}
                                <SplitItem>
                                    <AcmDonutChart
                                        title="Cluster status"
                                        description={t('Overview of cluster status')}
                                        data={clusterData}
                                        colorScale={[
                                            'var(--pf-global--danger-color--100)',
                                            'var(--pf-global--success-color--100)',
                                        ]}
                                    />
                                </SplitItem>
                                {!searchPolicyReportError && (
                                    <SplitItem>
                                        <AcmDonutChart
                                            title="Cluster issues"
                                            description={t('Overview of cluster issues')}
                                            data={policyReportData}
                                            donutLabel={{
                                                title: `${clustersWithIssuesCount}`,
                                                subTitle:
                                                    clustersWithIssuesCount === 1
                                                        ? t('Cluster with issues')
                                                        : t('Clusters with issues'),
                                            }}
                                            colorScale={[
                                                'var(--pf-global--danger-color--100)',
                                                'var(--pf-global--palette--orange-300)',
                                                'var(--pf-global--palette--orange-200)',
                                                'var(--pf-global--warning-color--100)',
                                            ]}
                                        />
                                    </SplitItem>
                                )}
                            </Split>
                        )}
                    </Stack>
                </PageSection>
            </AcmScrollable>
        </AcmPage>
    )
}
