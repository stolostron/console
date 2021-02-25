import React, { useContext, useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import _ from 'lodash'
import { useTranslation, Trans } from 'react-i18next'
import { AcmCountCardSection, AcmDrawerContext } from '@open-cluster-management/ui-components'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { queryStatusCount, queryCCXReports, ISearchResult } from '../../../../lib/search'
import { useQuery } from '../../../../lib/useQuery'
import { NavigationPath } from '../../../../NavigationPath'

const buildSearchLink = (filters: Record<string, string>, relatedKind?: string) => {
    let query = ''
    Object.keys(filters).forEach((key) => (query += `${query ? '%20' : ''}${key}:${filters[key]}`))
    return `/search?filters={"textsearch":"${query}"}${relatedKind ? `&showrelated=${relatedKind}` : ''}`
}

function DescriptionStringBuilder(PolicyReportResultData: ISearchResult[]) {
    const { t } = useTranslation(['cluster'])
    const policyReportViolationsCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].count', 0)
    const criticalCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].items', []).filter(
        (item: any) => item.risk === '4'
    ).length
    const majorCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].items', []).filter(
        (item: any) => item.risk === '3'
    ).length
    const minorCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].items', []).filter(
        (item: any) => item.risk === '2'
    ).length
    const lowCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].items', []).filter(
        (item: any) => item.risk === '1'
    ).length
    const warningCount = _.get(PolicyReportResultData, '[0].data.searchResult[0].items', []).filter(
        (item: any) => item.risk === '0'
    ).length
    if (policyReportViolationsCount === 0) {
        return ''
    }
    return `${t(
        'summary.cluster.issues.description'
    )} ${criticalCount} Critical, ${majorCount} Major, ${minorCount} Minor, ${lowCount} Low, ${warningCount} Warning`
}

export function StatusSummaryCount() {
    const { cluster } = useContext(ClusterContext)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster'])
    const { push } = useHistory()
    /* istanbul ignore next */
    const { data, loading, startPolling } = useQuery(
        useCallback(() => queryStatusCount(cluster?.name ?? ''), [cluster?.name])
    )
    const PolicyReportResults = useQuery(useCallback(() => queryCCXReports('34c3ecc5-624a-49a5-bab8-4fdc5e51a266'), []))
    const policyReportViolationsCount = _.get(PolicyReportResults, 'data[0].data.searchResult[0].count', 0)

    useEffect(startPolling, [startPolling])

    /* istanbul ignore next */
    const clusterName = cluster?.name ?? ''

    return (
        <div style={{ marginTop: '24px' }}>
            <AcmCountCardSection
                id="summary-status"
                title={t('summary.status')}
                loading={loading}
                loadingAriaLabel={t('summary.status.loading')}
                cards={[
                    {
                        id: 'nodes',
                        count: /* istanbul ignore next */ cluster?.nodes?.nodeList?.length ?? 0,
                        countClick: () => push(NavigationPath.clusterNodes.replace(':id', clusterName)),
                        title: t('summary.nodes'),
                        description: (
                            <Trans
                                i18nKey="cluster:summary.nodes.inactive"
                                values={{
                                    number:
                                        /* istanbul ignore next */ cluster?.nodes?.unhealthy! +
                                        cluster?.nodes?.unknown!,
                                }}
                            />
                        ),
                        isDanger: cluster?.nodes?.unhealthy! + cluster?.nodes?.unknown! > 0,
                    },
                    {
                        id: 'applications',
                        count: /* istanbul ignore next */ data?.[0]?.data?.searchResult?.[0]?.related?.[0]?.count ?? 0,
                        countClick: () =>
                            window.open(
                                buildSearchLink({ cluster: clusterName, kind: 'subscription' }, 'application'),
                                '_self'
                            ),
                        title: t('summary.applications'),
                        linkText: t('summary.applications.launch'),
                        onLinkClick: () => window.open('/multicloud/applications', '_self'),
                    },
                    {
                        id: 'violations',
                        count: /* istanbul ignore next */ data?.[0]?.data?.searchResult?.[1]?.count ?? 0 ?? 0,
                        countClick: () =>
                            window.open(
                                buildSearchLink({
                                    cluster: 'local-cluster',
                                    kind: 'policy',
                                    namespace: /* istanbul ignore next */ cluster?.namespace ?? '',
                                    compliant: '!Compliant',
                                }),
                                '_self'
                            ),
                        title: t('summary.violations'),
                        linkText: t('summary.violations.launch'),
                        onLinkClick: () => window.open('/multicloud/policies', '_self'),
                        isDanger: true,
                    },
                    {
                        id: 'clusterIssues',
                        count: policyReportViolationsCount,
                        countClick: () => {
                            setDrawerContext({
                                isExpanded: true,
                                onCloseClick: () => setDrawerContext(undefined),
                                panelContent: (
                                    <ClusterPolicySidebar
                                        data={PolicyReportResults.data || []}
                                        loading={PolicyReportResults.loading}
                                    />
                                ),
                                panelContentProps: { minSize: '50%' },
                            })
                        },
                        title:
                            policyReportViolationsCount > 0
                                ? t('summary.cluster.issues')
                                : t('summary.cluster.no.issues'),
                        description: DescriptionStringBuilder(PolicyReportResults.data || []),
                        // Show the card in danger mode if there is a Critical or Major violation on the cluster
                        isDanger: _.get(PolicyReportResults, 'data[0].data.searchResult[0].items', []).some(
                            (item: any) => parseInt(item.risk, 10) >= 3
                        ),
                    },
                ]}
            />
        </div>
    )
}
