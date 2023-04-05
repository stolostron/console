/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import {
  GetArgoApplicationsHashSet,
  GetDiscoveredOCPApps,
  GetOpenShiftAppResourceMaps,
} from '../../../../../components/GetDiscoveredOCPApps'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { ISearchResult, queryStatusCount } from '../../../../../lib/search'
import { useQuery } from '../../../../../lib/useQuery'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import { Application, Cluster, IRequestResult } from '../../../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmCountCardSection, AcmDrawerContext } from '../../../../../ui-components'
import { getClusterList } from '../../../../Applications/helpers/resource-helper'
import { localClusterStr } from '../../../../Applications/Overview'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { useAllClusters } from './useAllClusters'

const buildSearchLink = (filters: Record<string, string>, relatedKind?: string) => {
  let query = ''
  Object.keys(filters).forEach((key) => (query += `${query ? '%20' : ''}${key}:${filters[key]}`))
  return `${NavigationPath.search}?filters={"textsearch":"${query}"}${relatedKind ? `&showrelated=${relatedKind}` : ''}`
}

export function StatusSummaryCount() {
  const {
    applicationsState,
    argoApplicationsState,
    discoveredApplicationsState,
    discoveredOCPAppResourcesState,
    helmReleaseState,
    placementDecisionsState,
    policyreportState,
    subscriptionsState,
  } = useSharedAtoms()
  const applicationsMatch = useRouteMatch()
  const [applications] = useRecoilState(applicationsState)
  const [argoApps] = useRecoilState(argoApplicationsState)
  const [discoveredApplications] = useRecoilState(discoveredApplicationsState)
  const [helmReleases] = useRecoilState(helmReleaseState)
  const [policyReports] = useRecoilState(policyreportState)
  const [ocpApps] = useRecoilState(discoveredOCPAppResourcesState)
  const [placementDecisions] = useRecoilState(placementDecisionsState)
  const [subscriptions] = useRecoilState(subscriptionsState)

  GetDiscoveredOCPApps(applicationsMatch.isExact, !ocpApps.length && !discoveredApplications.length)
  const { cluster } = useContext(ClusterContext)
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

  const policyReport = policyReports.filter((pr) => pr.metadata.name?.replace('-policyreport', '') === cluster?.name)[0]
  const policyReportViolations = policyReport?.results?.filter((violation) => violation.source === 'insights') || []
  const policyReportViolationsCount = policyReportViolations.length ?? 0
  const criticalCount = policyReportViolations.filter((item) => item.properties?.total_risk === '4').length
  const importantCount = policyReportViolations.filter((item) => item.properties?.total_risk === '3').length
  const moderateCount = policyReportViolations.filter((item) => item.properties?.total_risk === '2').length
  const lowCount = policyReportViolations.filter((item) => item.properties?.total_risk === '1').length

  const argoApplicationsHashSet = GetArgoApplicationsHashSet(discoveredApplications, argoApps, clusters)

  const applicationList: Application[] = []
  const localCluster = useMemo(() => clusters.find((cls) => cls.name === localClusterStr), [clusters])
  applications.forEach((application) => {
    const clusterList = getClusterList(application, argoApps, placementDecisions, subscriptions, localCluster, clusters)
    if (clusterList.includes(cluster?.name!)) {
      applicationList.push(application)
    }
  })

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

  const filteredOCPApps = GetOpenShiftAppResourceMaps(ocpApps, helmReleases, argoApplicationsHashSet)
  const clusterOcpApps = []
  for (const [, value] of Object.entries(filteredOCPApps)) {
    if (value.cluster === cluster?.name) {
      clusterOcpApps.push(value)
    }
  }

  const clusterDiscoveredArgoApps = discoveredApplications.filter((app) => app.cluster === cluster?.name)

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
            countClick: () => (cluster ? push(getClusterNavPath(NavigationPath.clusterNodes, cluster)) : undefined),
            title: t('summary.nodes'),
            description: (
              <Trans
                i18nKey="summary.nodes.inactive"
                values={{
                  number: /* istanbul ignore next */ cluster?.nodes?.unhealthy! + cluster?.nodes?.unknown!,
                }}
              />
            ),
            isDanger: cluster?.nodes?.unhealthy! + cluster?.nodes?.unknown! > 0,
          },
          ...(isSearchAvailable && isApplicationsAvailable
            ? [
                {
                  id: 'applications',
                  count: [...applicationList, ...clusterDiscoveredArgoApps, ...clusterOcpApps].length,
                  countClick: () => push(NavigationPath.applications + `?cluster=${cluster?.name}`),
                  title: t('summary.applications'),
                },
              ]
            : []),
          ...(isSearchAvailable && isGovernanceAvailable
            ? [
                {
                  id: 'violations',
                  count: /* istanbul ignore next */ data?.[0]?.data?.searchResult?.[0]?.count ?? 0 ?? 0,
                  // TODO the link clicks here should both rooute to Policies table with new query url to filter by the cluster
                  countClick: () =>
                    push(
                      buildSearchLink({
                        cluster: 'local-cluster',
                        kind: 'Policy',
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
            title: policyReportViolationsCount > 0 ? t('summary.cluster.issues') : t('summary.cluster.no.issues'),
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
