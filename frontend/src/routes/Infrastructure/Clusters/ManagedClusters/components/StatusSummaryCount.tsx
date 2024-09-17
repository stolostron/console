/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmCountCardSection, AcmDrawerContext } from '../../../../../ui-components'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { SupportedAggregate, useAggregate } from '../../../../../lib/useAggregates'

export function StatusSummaryCount() {
  const { policyreportState, usePolicies } = useSharedAtoms()
  const policyReports = useRecoilValue(policyreportState)
  const policies = usePolicies()
  const { cluster } = useClusterDetailsContext()

  const { isApplicationsAvailable, isGovernanceAvailable } = useContext(PluginContext)
  const { setDrawerContext } = useContext(AcmDrawerContext)
  const { t } = useTranslation()

  const navigate = useNavigate()

  const {
    policyReport,
    policyReportViolations,
    policyReportViolationsCount,
    criticalCount,
    importantCount,
    moderateCount,
    lowCount,
  } = useMemo(() => {
    const policyReport = policyReports.filter(
      (pr) => pr.metadata.name?.replace('-policyreport', '') === cluster?.name
    )[0]
    const policyReportViolations = policyReport?.results?.filter((violation) => violation.source === 'insights') || []
    const violationsCount = policyReportViolations.length ?? 0

    return {
      policyReport,
      policyReportViolations,
      policyReportViolationsCount: violationsCount,
      criticalCount: policyReportViolations.filter((item) => item.properties?.total_risk === '4').length,
      importantCount: policyReportViolations.filter((item) => item.properties?.total_risk === '3').length,
      moderateCount: policyReportViolations.filter((item) => item.properties?.total_risk === '2').length,
      lowCount: policyReportViolations.filter((item) => item.properties?.total_risk === '1').length,
    }
  }, [policyReports, cluster?.name])

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
