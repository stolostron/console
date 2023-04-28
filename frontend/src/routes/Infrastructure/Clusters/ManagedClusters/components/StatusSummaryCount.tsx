/* Copyright Contributors to the Open Cluster Management project */

import { get } from 'lodash'
import { useContext, useEffect, useMemo } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import {
  GetArgoApplicationsHashSet,
  GetDiscoveredOCPApps,
  GetOpenShiftAppResourceMaps,
} from '../../../../../components/GetDiscoveredOCPApps'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import { Application, ApplicationSet, ApplicationSetKind, Cluster } from '../../../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmCountCardSection, AcmDrawerContext } from '../../../../../ui-components'
import { getClusterList } from '../../../../Applications/helpers/resource-helper'
import { localClusterStr } from '../../../../Applications/Overview'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { useAllClusters } from './useAllClusters'

export function StatusSummaryCount() {
  const {
    applicationsState,
    applicationSetsState,
    argoApplicationsState,
    discoveredApplicationsState,
    discoveredOCPAppResourcesState,
    helmReleaseState,
    placementDecisionsState,
    policyreportState,
    subscriptionsState,
    usePolicies,
  } = useSharedAtoms()
  const applicationsMatch = useRouteMatch()
  const [applications] = useRecoilState(applicationsState)
  const [applicationSets] = useRecoilState(applicationSetsState)
  const [argoApps] = useRecoilState(argoApplicationsState)
  const [discoveredApplications] = useRecoilState(discoveredApplicationsState)
  const [helmReleases] = useRecoilState(helmReleaseState)
  const [policyReports] = useRecoilState(policyreportState)
  const [ocpApps] = useRecoilState(discoveredOCPAppResourcesState)
  const [placementDecisions] = useRecoilState(placementDecisionsState)
  const [subscriptions] = useRecoilState(subscriptionsState)
  const policies = usePolicies()

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
  const { isApplicationsAvailable, isGovernanceAvailable } = useContext(PluginContext)
  const { push } = useHistory()

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

  const argoAppList = argoApps.filter((argoApp) => {
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata.ownerReferences[0].kind === ApplicationSetKind

    const localCluster = clusters.find((cls) => cls.name === localClusterStr)
    const clusterList = getClusterList(argoApp, argoApps, placementDecisions, subscriptions, localCluster, clusters)
    return (!argoApp.metadata.ownerReferences || !isChildOfAppset) && clusterList.includes(cluster?.name!)
  })

  const argoApplicationsHashSet = GetArgoApplicationsHashSet(discoveredApplications, argoApps, clusters)
  const applicationList: Application[] = useMemo(() => {
    const appList: Application[] = []
    const localCluster = clusters.find((cls) => cls.name === localClusterStr)
    applications.forEach((application) => {
      const clusterList = getClusterList(
        application,
        argoApps,
        placementDecisions,
        subscriptions,
        localCluster,
        clusters
      )
      if (clusterList.includes(cluster?.name!)) {
        appList.push(application)
      }
    })
    return appList
  }, [applications, argoApps, cluster?.name, clusters, placementDecisions, subscriptions])

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
  const clusterOcpApps = useMemo(() => {
    const tempApps = []
    for (const [, value] of Object.entries(filteredOCPApps)) {
      if (value.cluster === cluster?.name) {
        tempApps.push(value)
      }
    }
    return tempApps
  }, [filteredOCPApps, cluster?.name])

  const clusterDiscoveredArgoApps = discoveredApplications.filter((app) => app.cluster === cluster?.name)

  const appSets: ApplicationSet[] = useMemo(() => {
    const filteredAppSets = applicationSets.filter((appSet) => {
      // Get the Placement name so we can find PlacementDecision
      const placementName = get(
        appSet,
        'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]',
        ''
      )
      // find the correct PlacementDecision which lists the clusters that match the decision parameters.
      const decision = placementDecisions.find((decision) => {
        const owner = decision.metadata.ownerReferences
        return owner ? owner.find((o) => o.kind === 'Placement' && o.name === placementName) : false
      })
      // determine whether the matched decision has placed an appSet in the current cluster.
      const clusterMatch = decision?.status?.decisions.findIndex((d) => d.clusterName === cluster?.name) ?? -1
      return clusterMatch > -1
    })
    return filteredAppSets
  }, [applicationSets, placementDecisions, cluster?.name])

  const appsCount = useMemo(
    () => [...applicationList, ...clusterDiscoveredArgoApps, ...clusterOcpApps, ...appSets, ...argoAppList].length,
    [applicationList, argoAppList, clusterDiscoveredArgoApps, clusterOcpApps, appSets]
  )

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
          ...(isApplicationsAvailable
            ? [
                {
                  id: 'applications',
                  count: appsCount,
                  countClick: () => push(NavigationPath.applications + `?cluster=${cluster?.name}`),
                  title: t('summary.applications'),
                },
              ]
            : []),
          ...(isGovernanceAvailable
            ? [
                {
                  id: 'violations',
                  count: policyViolationCount ?? 0,
                  countClick: () => push(NavigationPath.policies + '?violations=with-violations'),
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
