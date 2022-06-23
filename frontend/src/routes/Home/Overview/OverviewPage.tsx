/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
import { ButtonVariant, PageSection, Stack } from '@patternfly/react-core'
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
    AcmScrollable,
    AcmSummaryList,
    Provider,
} from '@stolostron/ui-components'
import _ from 'lodash'
import { Dispatch, Fragment, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationsState,
    argoApplicationsState,
    managedClusterInfosState,
    managedClustersState,
    policyreportState,
    usePolicies,
} from '../../../atoms'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { getProvider, ManagedClusterInfo, Policy, PolicyReport, PolicyReportResults } from '../../../resources'
import { ClusterManagementAddOn } from '../../../resources/cluster-management-add-on'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchResultCountLazyQuery } from '../Search/search-sdk/search-sdk'

function getClusterSummary(clusters: any, selectedCloud: string, setSelectedCloud: Dispatch<SetStateAction<string>>) {
    const clusterSummary = clusters.reduce(
        (prev: any, curr: any) => {
            // Data for Providers section.
            // Get cloud label. If not available set to Other until the label is present.
            const cloudLabel = curr.metadata?.labels?.cloud || 'Other'
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

function PageActions() {
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
    const [managedClusters] = useRecoilState(managedClustersState)
    const policies = usePolicies()
    const [apps] = useRecoilState(applicationsState)
    const [argoApps] = useRecoilState(argoApplicationsState)
    const [policyReports] = useRecoilState(policyreportState)
    const [managedClusterInfos] = useRecoilState(managedClusterInfosState)
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

    if (!_.isEqual(clusters, managedClusters || [])) {
        setClusters(managedClusters || [])
    }

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
        const tempClusters =
            selectedClusterNames.length > 0 ? selectedClusterNames : clusters.map((c) => c.metadata?.name)
        return tempClusters.filter((c) => !nonCompliantClusters.has(c))
    }, [selectedClusterNames, clusters, nonCompliantClusters])

    const nodeCount = useMemo(() => {
        let count = 0
        managedClusterInfos.forEach((managedClusterInfo: ManagedClusterInfo) => {
            count = count + (managedClusterInfo.status?.nodeList?.length ?? 0)
        })
        return count
    }, [managedClusterInfos])

    const [fireSearchQuery, { data: searchData, loading: searchLoading, error: searchError }] =
        useSearchResultCountLazyQuery({
            client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        })

    useEffect(() => {
        fireSearchQuery({
            variables: { input: searchQueries(selectedClusterNames) },
        })
    }, [fireSearchQuery, selectedClusterNames])
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

    const { policyReportCriticalCount, policyReportImportantCount, policyReportModerateCount, policyReportLowCount } =
        useMemo(() => {
            const clustersToSearch: string[] =
                selectedClusterNames.length > 0
                    ? selectedClusterNames
                    : clusters.map((cluster) => cluster.metadata.name)
            const policyReportsForSelectedClusters = policyReports.filter((policyReport: PolicyReport) =>
                clustersToSearch.find((clusterName: string) => clusterName === policyReport.scope?.name)
            )

            const policyReportCriticalCount = policyReportsForSelectedClusters.reduce(
                (total: number, currentValue: PolicyReport) => {
                    const criticalResults = currentValue.results.filter(
                        (result: PolicyReportResults) => result.properties.total_risk === '4'
                    )
                    return total + criticalResults.length
                },
                0
            )
            const policyReportImportantCount = policyReportsForSelectedClusters.reduce(
                (total: number, currentValue: PolicyReport) => {
                    const importantResults = currentValue.results.filter(
                        (result: PolicyReportResults) => result.properties.total_risk === '3'
                    )
                    return total + importantResults.length
                },
                0
            )
            const policyReportModerateCount = policyReportsForSelectedClusters.reduce(
                (total: number, currentValue: PolicyReport) => {
                    const moderateResults = currentValue.results.filter(
                        (result: PolicyReportResults) => result.properties.total_risk === '2'
                    )
                    return total + moderateResults.length
                },
                0
            )
            const policyReportLowCount = policyReportsForSelectedClusters.reduce(
                (total: number, currentValue: PolicyReport) => {
                    const lowResults = currentValue.results.filter(
                        (result: PolicyReportResults) => result.properties.total_risk === '1'
                    )
                    return total + lowResults.length
                },
                0
            )

            return {
                policyReportCriticalCount,
                policyReportImportantCount,
                policyReportModerateCount,
                policyReportLowCount,
            }
        }, [policyReports, selectedClusterNames, clusters])

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
        let overviewSummary = [
            {
                isLoading: !apps || !argoApps,
                isPrimary: false,
                description: 'Applications',
                count: [...apps, ...argoApps].length || 0,
                href: buildSummaryLinks('application', true),
            },
            {
                isLoading: !managedClusters,
                isPrimary: false,
                description: 'Clusters',
                count: selectedClusterNames.length > 0 ? selectedClusterNames.length : managedClusters.length || 0,
                href: `${NavigationPath.search}?filters={"textsearch":"kind%3Acluster${cloudLabelFilter}"}`,
            },
            {
                isloading: !kubernetesTypes?.size,
                isPrimary: false,
                description: 'Kubernetes type',
                count: kubernetesTypes?.size,
            },
            { isLoading: !regions?.size, isPrimary: false, description: 'Region', count: regions?.size },
            {
                isLoading: !nodeCount,
                isPrimary: false,
                description: 'Nodes',
                count: nodeCount || 0,
                href: buildSummaryLinks('node'),
            },
            {
                isLoading: searchLoading,
                isPrimary: false,
                description: 'Pods',
                count: searchResult[0]?.count || 0,
                href: buildSummaryLinks('pod'),
            },
        ]
        if (searchError) {
            // Hide pods data if search is unavailable or throwing errors
            overviewSummary = overviewSummary.slice(0, 5)
        }
        return overviewSummary
    }, [
        apps,
        argoApps,
        buildSummaryLinks,
        cloudLabelFilter,
        kubernetesTypes?.size,
        managedClusters,
        nodeCount,
        regions?.size,
        searchError,
        searchLoading,
        searchResult,
        selectedClusterNames.length,
    ])

    const podData = useMemo(() => {
        // TODO: Breaks url if length of selectedClustersFilter is too big.
        // Issue: https://github.com/open-cluster-management/backlog/issues/7087
        const urlClusterFilter: string =
            selectedClusterNames.length > 0 ? `%20cluster%3A${selectedClusterNames.join(',')}` : ''
        return [
            {
                key: 'Failed',
                value: searchResult[3]?.count || 0,
                link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3ACrashLoopBackOff%2CFailed%2CImagePullBackOff%2CRunContainerError%2CTerminated%2CUnknown%2COOMKilled${urlClusterFilter}"}`,
            },
            {
                key: 'Pending',
                value: searchResult[2]?.count || 0,
                link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3AContainerCreating%2CPending%2CTerminating%2CWaiting${urlClusterFilter}"}`,
            },
            {
                key: 'Running',
                value: searchResult[1]?.count || 0,
                isPrimary: true,
                link: `${NavigationPath.search}?filters={"textsearch":"kind%3Apod%20status%3ARunning%2CCompleted${urlClusterFilter}"}`,
            },
        ]
    }, [searchResult, selectedClusterNames])

    // TODO: Breaks url if length of selectedClustersFilter is too big.
    // Issue: https://github.com/open-cluster-management/backlog/issues/7087
    function buildClusterComplianceLinks(clusterNames: Array<string> = []): string {
        return `${NavigationPath.search}?filters={"textsearch":"kind:cluster${
            clusterNames.length > 0 ? `%20name:${clusterNames.join(',')}` : ''
        }"}&showrelated=policy`
    }
    const complianceData = useMemo(() => {
        return [
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
    }, [compliantClusters, nonCompliantClusters])

    const clusterData = useMemo(() => {
        return [
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
    }, [cloudLabelFilter, offline, ready])

    const policyReportData = useMemo(() => {
        return [
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
    }, [policyReportCriticalCount, policyReportImportantCount, policyReportLowCount, policyReportModerateCount])

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
                        {providers.length === 0 ? <AcmLoadingPage /> : <AcmOverviewProviders providers={providers} />}

                        <AcmSummaryList title={t('Summary')} list={summary} />

                        <Stack hasGutter>
                            <AcmMasonry minSize={400} maxColumns={searchError ? 3 : 4}>
                                <AcmDonutChart
                                    title="Cluster violations"
                                    description={t('Overview of policy violation status')}
                                    loading={!complianceData}
                                    data={complianceData}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--success-color--100)',
                                    ]}
                                />
                                {!searchError ? (
                                    <AcmDonutChart
                                        title="Pods"
                                        description={t('Overview of pod count and status')}
                                        loading={searchLoading}
                                        data={podData}
                                        colorScale={[
                                            'var(--pf-global--danger-color--100)',
                                            'var(--pf-global--info-color--100)',
                                            'var(--pf-global--success-color--100)',
                                        ]}
                                    />
                                ) : undefined}
                                <AcmDonutChart
                                    title="Cluster status"
                                    description={t('Overview of cluster status')}
                                    loading={!clusterData}
                                    data={clusterData}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--success-color--100)',
                                    ]}
                                />
                                <AcmDonutChart
                                    title="Cluster issues"
                                    description={t('Overview of cluster issues')}
                                    loading={!policyReportData}
                                    data={policyReportData}
                                    donutLabel={{
                                        title: `${policyReports.length}`,
                                        subTitle: t('Clusters with issues'),
                                    }}
                                    colorScale={[
                                        'var(--pf-global--danger-color--100)',
                                        'var(--pf-global--palette--orange-300)',
                                        'var(--pf-global--palette--orange-200)',
                                        'var(--pf-global--warning-color--100)',
                                    ]}
                                />
                            </AcmMasonry>
                        </Stack>
                    </Stack>
                </PageSection>
            </AcmScrollable>
        </AcmPage>
    )
}
