/* Copyright Contributors to the Open Cluster Management project */

import { AcmCountCardSection, AcmDrawerContext } from '@open-cluster-management/ui-components'
import { useCallback, useContext, useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { queryStatusCount } from '../../../../lib/search'
import { useQuery } from '../../../../lib/useQuery'
import { NavigationPath } from '../../../../NavigationPath'
import { listNamespacedPolicyReports } from '../../../../resources/policy-report'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'

const buildSearchLink = (filters: Record<string, string>, relatedKind?: string) => {
    let query = ''
    Object.keys(filters).forEach((key) => (query += `${query ? '%20' : ''}${key}:${filters[key]}`))
    return `/search?filters={"textsearch":"${query}"}${relatedKind ? `&showrelated=${relatedKind}` : ''}`
}

export function StatusSummaryCount() {
    const { cluster } = useContext(ClusterContext)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster'])
    const { push } = useHistory()
    /* istanbul ignore next */
    const { data, loading, startPolling } = useQuery(
        useCallback(() => queryStatusCount(cluster?.name!), [cluster?.name])
    )
    const { data: policyReportData = [] } = useQuery(
        useCallback(() => listNamespacedPolicyReports(cluster?.namespace!), [cluster?.namespace])
    )

    useEffect(startPolling, [startPolling])

    const policyReportViolationsCount = policyReportData.length
    const criticalCount = policyReportData.filter((item) => item.results[0].data.total_risk === '4').length
    const majorCount = policyReportData.filter((item) => item.results[0].data.total_risk === '3').length
    const minorCount = policyReportData.filter((item) => item.results[0].data.total_risk === '2').length
    const lowCount = policyReportData.filter((item) => item.results[0].data.total_risk === '1').length
    const warningCount = policyReportData.filter((item) => item.results[0].data.total_risk === '0').length

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
                        countClick: () => push(NavigationPath.clusterNodes.replace(':id', cluster?.name!)),
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
                                buildSearchLink({ cluster: cluster?.name!, kind: 'subscription' }, 'application'),
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
                                    namespace: cluster?.namespace!,
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
                                panelContent: <ClusterPolicySidebar data={policyReportData} />,
                                panelContentProps: { minSize: '50%' },
                            })
                        },
                        title:
                            policyReportViolationsCount > 0
                                ? t('summary.cluster.issues')
                                : t('summary.cluster.no.issues'),
                        description:
                            policyReportViolationsCount > 0
                                ? t('summary.cluster.issues.description.count', {
                                      criticalCount,
                                      majorCount,
                                      minorCount,
                                      lowCount,
                                      warningCount,
                                  })
                                : '',
                        // Show the card in danger mode if there is a Critical or Major violation on the cluster
                        isDanger: policyReportData.some((item) => parseInt(item.results[0].data.total_risk, 10) >= 3),
                    },
                ]}
            />
        </div>
    )
}
