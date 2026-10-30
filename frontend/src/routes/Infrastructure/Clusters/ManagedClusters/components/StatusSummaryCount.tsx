/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useClusterPolicyReport } from '../../../../../hooks/usePolicyReports'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { SupportedAggregate, useAggregate } from '../../../../../lib/useAggregates'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import { useSharedAtoms } from '../../../../../shared-atoms'
import { AcmCountCardSection, AcmDrawerContext } from '../../../../../ui-components'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'

export function StatusSummaryCount() {
  const { usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const { cluster } = useClusterDetailsContext()
  const {
    policyReport,
    isLoading: isPolicyReportLoading,
    isError: isPolicyReportError,
  } = useClusterPolicyReport(cluster?.name)
  // Avoid treating an in-flight or failed fetch as "no cluster issues".
  const isPolicyReportUnavailable = isPolicyReportLoading || isPolicyReportError

  const { isApplicationsAvailable, isGovernanceAvailable } = useContext(PluginContext)
  const { setDrawerContext } = useContext(AcmDrawerContext)
  const { t } = useTranslation()

  const navigate = useNavigate()

  const {
    policyReportViolations,
    policyReportViolationsCount,
    criticalCount,
    importantCount,
    moderateCount,
    lowCount,
  } = useMemo(() => {
    const policyReportViolations = policyReport?.results?.filter((violation) => violation.source === 'insights') || []
    const violationsCount = policyReportViolations.length ?? 0

    return {
      policyReportViolations,
      policyReportViolationsCount: violationsCount,
      criticalCount: policyReportViolations.filter((item) => item.properties?.total_risk === '4').length,
      importantCount: policyReportViolations.filter((item) => item.properties?.total_risk === '3').length,
      moderateCount: policyReportViolations.filter((item) => item.properties?.total_risk === '2').length,
      lowCount: policyReportViolations.filter((item) => item.properties?.total_risk === '1').length,
    }
  }, [policyReport])

  // Show cluster issues sidebar by default if showClusterIssues url param is present
  // This will be true if we are redirected to this page via search results table.
  useEffect(() => {
    const autoShowIssueSidebar = decodeURIComponent(window.location.search).includes('showClusterIssues=true')
    if (autoShowIssueSidebar && !isPolicyReportUnavailable && policyReport && policyReportViolationsCount > 0) {
      // Add a small delay to ensure the drawer context is ready after location change
      const timeoutId = setTimeout(() => {
        setDrawerContext({
          isExpanded: true,
          onCloseClick: () => setDrawerContext(undefined),
          panelContent: <ClusterPolicySidebar data={policyReport} />,
          panelContentProps: { minSize: '50%' },
        })
      }, 100) // 100ms delay to ensure drawer context is ready

      return () => clearTimeout(timeoutId)
    }
  }, [isPolicyReportUnavailable, policyReport, policyReportViolationsCount, setDrawerContext])

  const { itemCount } = useAggregate(SupportedAggregate.statuses, { clusters: [cluster.name] })

  const nodesCount = useMemo(() => (cluster?.nodes?.nodeList ?? []).length, [cluster])

  const policyViolationCount: number = useMemo(() => {
    let violationCount = 0
    for (const policy of policies) {
      if (policy.spec.disabled) continue
      for (const clusterStatus of policy.status?.status ?? []) {
        if (clusterStatus.clustername === cluster?.name && clusterStatus.compliant === 'NonCompliant') {
          violationCount++
        }
      }
    }
    return violationCount
  }, [policies, cluster])

  const hasClusterIssues = !isPolicyReportUnavailable && policyReportViolationsCount > 0
  const clusterIssuesTitle =
    isPolicyReportUnavailable || hasClusterIssues ? t('summary.cluster.issues') : t('summary.cluster.no.issues')

  const getClusterIssuesDescription = useCallback(() => {
    if (isPolicyReportError) {
      return t('Unable to retrieve cluster issues.')
    }
    if (isPolicyReportLoading) {
      return t('Loading')
    }
    if (hasClusterIssues) {
      return t('summary.cluster.issues.description.count', {
        criticalCount,
        importantCount,
        moderateCount,
        lowCount,
      })
    }
    return ''
  }, [
    isPolicyReportError,
    isPolicyReportLoading,
    hasClusterIssues,
    criticalCount,
    importantCount,
    moderateCount,
    lowCount,
    t,
  ])

  return (
    <div style={{ marginTop: '24px' }}>
      <AcmCountCardSection
        id="summary-status"
        title={t('summary.status')}
        cards={[
          {
            id: 'nodes',
            count: nodesCount,
            countClick: () => (cluster ? navigate(getClusterNavPath(NavigationPath.clusterNodes, cluster)) : undefined),
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
          ...(isApplicationsAvailable
            ? [
                {
                  id: 'applications',
                  count: itemCount,
                  countClick: () => navigate(NavigationPath.applications + `?cluster=${cluster?.name}`),
                  title: t('summary.applications'),
                },
              ]
            : []),
          ...(isGovernanceAvailable
            ? [
                {
                  id: 'violations',
                  count: policyViolationCount ?? 0,
                  countClick: () => navigate(NavigationPath.policies + '?violations=violations'),
                  title: t('summary.violations'),
                  isDanger: true,
                },
              ]
            : []),
          {
            id: 'clusterIssues',
            count: isPolicyReportUnavailable ? 0 : policyReportViolationsCount,
            countClick: () => {
              if (isPolicyReportUnavailable || !policyReport) return
              setDrawerContext({
                isExpanded: true,
                onCloseClick: () => setDrawerContext(undefined),
                panelContent: <ClusterPolicySidebar data={policyReport} />,
                panelContentProps: { minSize: '50%' },
              })
            },
            title: clusterIssuesTitle,
            description: getClusterIssuesDescription(),
            // Show the card in danger mode if there is a Critical or Major violation on the cluster
            isDanger:
              !isPolicyReportUnavailable &&
              policyReportViolations.some((item) => Number.parseInt(item.properties?.total_risk, 10) >= 3),
          },
        ]}
      />
    </div>
  )
}
