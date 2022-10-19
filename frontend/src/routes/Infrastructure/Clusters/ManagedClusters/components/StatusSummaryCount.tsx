/* Copyright Contributors to the Open Cluster Management project */

import { AcmCountCardSection, AcmDrawerContext } from '../../../../../ui-components'
import { useCallback, useContext, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { ISearchResult, queryStatusCount } from '../../../../../lib/search'
import { useQuery } from '../../../../../lib/useQuery'
import { NavigationPath } from '../../../../../NavigationPath'
import { IRequestResult } from '../../../../../resources'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

const buildSearchLink = (filters: Record<string, string>, relatedKind?: string) => {
    let query = ''
    Object.keys(filters).forEach((key) => (query += `${query ? '%20' : ''}${key}:${filters[key]}`))
    return `${NavigationPath.search}?filters={"textsearch":"${query}"}${
        relatedKind ? `&showrelated=${relatedKind}` : ''
    }`
}

export function StatusSummaryCount() {
    const { policyreportState } = useSharedAtoms()
    const [policyReports] = useRecoilState(policyreportState)
    const { cluster } = useContext(ClusterContext)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation()
    const { isSearchAvailable, isApplicationsAvailable, isGovernanceAvailable } = useContext(PluginContext)
    const { push } = useHistory()
    const queryFunction = useCallback<() => IRequestResult<ISearchResult>>(() => {
        if (isSearchAvailable && cluster?.name) {
            return queryStatusCount(cluster?.name)
        } else {
            return {
                promise: Promise.resolve({ data: { searchResult: [] } } as ISearchResult),
                abort: () => {
                    // nothing to abort
                },
            }
        }
    }, [isSearchAvailable, cluster])
    /* istanbul ignore next */
    const { data, loading, startPolling } = useQuery(queryFunction)
    useEffect(startPolling, [startPolling])

    const policyReport = policyReports.filter(
        (pr) => pr.metadata.name?.replace('-policyreport', '') === cluster?.name
    )[0]
    const policyReportViolations = policyReport?.results?.filter((violation) => violation.source === 'insights') || []
    const policyReportViolationsCount = policyReportViolations.length ?? 0
    const criticalCount = policyReportViolations.filter((item) => item.properties?.total_risk === '4').length
    const importantCount = policyReportViolations.filter((item) => item.properties?.total_risk === '3').length
    const moderateCount = policyReportViolations.filter((item) => item.properties?.total_risk === '2').length
    const lowCount = policyReportViolations.filter((item) => item.properties?.total_risk === '1').length

    // Show cluster issues sidebar by default if showClusterIssues url param is present
    // This will be true if we are redirected to this page via search results table.
    useEffect(() => {
        const autoShowIssueSidebar = decodeURIComponent(window.location.search).includes('showClusterIssues=true')
        if (autoShowIssueSidebar && policyReportViolationsCount > 0) {
            setDrawerContext({
                isExpanded: true,
                onCloseClick: () => setDrawerContext(undefined),
                panelContent: <ClusterPolicySidebar data={policyReport} />,
                panelContentProps: { minSize: '50%' },
            })
        }
    }, [policyReport, policyReportViolationsCount, setDrawerContext])

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
                        count: /* istanbul ignore next */ (cluster?.nodes?.nodeList ?? []).length,
                        countClick: () => push(NavigationPath.clusterNodes.replace(':id', cluster?.name!)),
                        title: t('summary.nodes'),
                        description: (
                            <Trans
                                i18nKey="summary.nodes.inactive"
                                values={{
                                    number:
                                        /* istanbul ignore next */ cluster?.nodes?.unhealthy! +
                                        cluster?.nodes?.unknown!,
                                }}
                            />
                        ),
                        isDanger: cluster?.nodes?.unhealthy! + cluster?.nodes?.unknown! > 0,
                    },
                    ...(isSearchAvailable && isApplicationsAvailable
                        ? [
                              {
                                  id: 'applications',
                                  count:
                                      /* istanbul ignore next */ data?.[0]?.data?.searchResult?.[0]?.related?.[0]
                                          ?.count ?? 0,
                                  countClick: () =>
                                      push(
                                          buildSearchLink(
                                              { cluster: cluster?.name!, kind: 'subscription' },
                                              'application'
                                          )
                                      ),
                                  title: t('summary.applications'),
                                  linkText: t('summary.applications.launch'),
                                  onLinkClick: () => push(NavigationPath.applications),
                              },
                          ]
                        : []),
                    ...(isSearchAvailable && isGovernanceAvailable
                        ? [
                              {
                                  id: 'violations',
                                  count: /* istanbul ignore next */ data?.[0]?.data?.searchResult?.[1]?.count ?? 0 ?? 0,
                                  // TODO the link clicks here should both rooute to Policies table with new query url to filter by the cluster
                                  countClick: () =>
                                      push(
                                          buildSearchLink({
                                              cluster: 'local-cluster',
                                              kind: 'policy',
                                              namespace: cluster?.namespace!,
                                              compliant: '!Compliant',
                                          })
                                      ),
                                  title: t('summary.violations'),
                                  linkText: t('summary.violations.launch'),
                                  onLinkClick: () => push(NavigationPath.policies),
                                  isDanger: true,
                              },
                          ]
                        : []),
                    {
                        id: 'clusterIssues',
                        count: policyReportViolationsCount,
                        countClick: () => {
                            setDrawerContext({
                                isExpanded: true,
                                onCloseClick: () => setDrawerContext(undefined),
                                panelContent: <ClusterPolicySidebar data={policyReport} />,
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
                                      importantCount,
                                      moderateCount,
                                      lowCount,
                                  })
                                : '',
                        // Show the card in danger mode if there is a Critical or Major violation on the cluster
                        isDanger: policyReportViolations.some((item) => parseInt(item.properties?.total_risk, 10) >= 3),
                    },
                ]}
            />
        </div>
    )
}
