/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Divider,
  FlexItem,
  Gallery,
  GalleryItem,
  PageSection,
  Skeleton,
} from '@patternfly/react-core'
import { AngleDownIcon, AngleUpIcon } from '@patternfly/react-icons'
import { useMemo, useState } from 'react'
import { Link, useRouteMatch } from 'react-router-dom'
import {
  GetArgoApplicationsHashSet,
  GetDiscoveredOCPApps,
  GetOpenShiftAppResourceMaps,
} from '../../../components/GetDiscoveredOCPApps'
import { useTranslation } from '../../../lib/acm-i18next'
import { PrometheusEndpoint, usePrometheusPoll } from '../../../lib/usePrometheusPoll'
import { NavigationPath } from '../../../NavigationPath'
import { Application, ApplicationSet, Cluster } from '../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { AcmDonutChart, AcmScrollable, colorThemes } from '../../../ui-components'
import { useClusterAddons } from '../../Infrastructure/Clusters/ClusterSets/components/useClusterAddons'
import {
  CriticalRiskIcon,
  ImportantRiskIcon,
  LowRiskIcon,
  ModerateRiskIcon,
} from '../../Infrastructure/Clusters/ManagedClusters/components/ClusterPolicySidebarIcons'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  getAddonHealth,
  getApplicationList,
  getAppSets,
  getClustersSummary,
  getClusterStatus,
  getComplianceData,
  getFilteredClusters,
  getPolicyReport,
  parseAlertsMetric,
  parseOperatorMetric,
} from './overviewDataFunctions'
import SummaryCard from './SummaryCard'

function renderSummaryLoading() {
  return [
    'clustersSummary-loading-1',
    'clustersSummary-loading-2',
    'clustersSummary-loading-3',
    'clustersSummary-loading-4',
    'clustersSummary-loading-5',
  ].map((id) => (
    <GalleryItem key={id} style={{ flex: 1, minWidth: '180px' }}>
      <Card isRounded>
        <CardTitle>
          <Skeleton width="25%" />
        </CardTitle>
        <CardBody>
          <Skeleton width="100%" />
        </CardBody>
      </Card>
    </GalleryItem>
  ))
}

export default function OverviewPageBeta(props: { selectedClusterLabels: Record<string, string[]> }) {
  const { selectedClusterLabels } = props
  const applicationsMatch = useRouteMatch()
  const { t } = useTranslation()
  const {
    applicationsState,
    applicationSetsState,
    argoApplicationsState,
    discoveredApplicationsState,
    discoveredOCPAppResourcesState,
    helmReleaseState,
    policyreportState,
    placementDecisionsState,
    subscriptionsState,
    usePolicies,
    managedClusterInfosState,
  } = useSharedAtoms()

  const policies = usePolicies()
  const allAddons = useClusterAddons()
  const [apps] = useRecoilState(applicationsState)
  const [applicationSets] = useRecoilState(applicationSetsState)
  const [argoApps] = useRecoilState(argoApplicationsState)
  const [discoveredApplications] = useRecoilState(discoveredApplicationsState)
  const [managedClusterInfos] = useRecoilState(managedClusterInfosState)
  const [helmReleases] = useRecoilState(helmReleaseState)
  const [ocpApps] = useRecoilState(discoveredOCPAppResourcesState)
  const [placementDecisions] = useRecoilState(placementDecisionsState)
  const [policyReports] = useRecoilState(policyreportState)
  const [subscriptions] = useRecoilState(subscriptionsState)
  const [isInsightsSectionOpen, setIsInsightsSectionOpen] = useState<boolean>(true)
  const [isClusterSectionOpen, setIsClusterSectionOpen] = useState<boolean>(true)
  GetDiscoveredOCPApps(applicationsMatch.isExact, !ocpApps.length && !discoveredApplications.length)

  const clusterLabelsSearchFilter = useMemo(() => {
    const labelStringArray: string[] = []
    Object.keys(selectedClusterLabels).forEach((labelKey) => {
      selectedClusterLabels[labelKey].forEach((label) => labelStringArray.push(`${labelKey}=${label}`))
    })
    if (labelStringArray.length > 0) {
      return encodeURIComponent(`label:${labelStringArray.join(',')}`)
    }
    return undefined
  }, [selectedClusterLabels])

  const allClusters: Cluster[] = useAllClusters()
  const filteredClusters = useMemo(
    () => getFilteredClusters(allClusters, selectedClusterLabels),
    [allClusters, selectedClusterLabels]
  )
  const filteredClusterNames = useMemo(() => filteredClusters.map((cluster) => cluster.name), [filteredClusters])

  const consoleURL = useMemo(
    () => allClusters.filter((cluster) => cluster.name === 'local-cluster').map((cluster) => cluster.consoleURL)[0],
    [allClusters]
  )

  const argoApplicationsHashSet = GetArgoApplicationsHashSet(discoveredApplications, argoApps, filteredClusters)
  const filteredOCPApps: Record<string, any> = useMemo(
    () => GetOpenShiftAppResourceMaps(ocpApps, helmReleases, argoApplicationsHashSet),
    [ocpApps, helmReleases, argoApplicationsHashSet]
  )

  const appSets: ApplicationSet[] = useMemo(() => {
    return getAppSets(applicationSets, placementDecisions, filteredClusterNames)
  }, [applicationSets, placementDecisions, filteredClusterNames])

  const applicationList: Application[] = useMemo(() => {
    return getApplicationList(apps, argoApps, allClusters, placementDecisions, subscriptions, filteredClusterNames)
  }, [apps, argoApps, allClusters, placementDecisions, subscriptions, filteredClusterNames])

  const clustersSummary = useMemo(() => {
    return getClustersSummary(
      filteredClusters,
      filteredClusterNames,
      managedClusterInfos,
      applicationList,
      appSets,
      filteredOCPApps,
      t
    )
  }, [applicationList, appSets, filteredClusters, filteredClusterNames, filteredOCPApps, managedClusterInfos, t])

  const {
    policyReportCriticalCount,
    policyReportImportantCount,
    policyReportModerateCount,
    policyReportLowCount,
    clustersWithIssuesCount,
  } = useMemo(() => {
    return getPolicyReport(policyReports, filteredClusters)
  }, [filteredClusters, policyReports])

  const clusterStatusData = useMemo(() => {
    return getClusterStatus(filteredClusters, clusterLabelsSearchFilter, t)
  }, [filteredClusters, clusterLabelsSearchFilter, t])

  const complianceData: any = useMemo(() => {
    return getComplianceData(allClusters, filteredClusterNames, policies, t)
  }, [allClusters, filteredClusterNames, policies, t])

  const clusterAddonData = useMemo(() => {
    return getAddonHealth(allAddons, filteredClusterNames, t)
  }, [allAddons, filteredClusterNames, t])

  const [clusterOperators, operatorError, operatorLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: 'cluster_operator_conditions',
  })
  const {
    availableCount,
    degradedCount,
    notAvailableCount,
    otherCount,
  }: { availableCount: number; degradedCount: number; notAvailableCount: number; otherCount: number } = useMemo(() => {
    return parseOperatorMetric(clusterOperators)
  }, [clusterOperators])

  const [alertsResult, alertsError, alertsLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: 'ALERTS',
  })
  const alertSeverity: Record<string, { label: string; count: number; icon: React.JSX.Element | undefined }> =
    useMemo(() => {
      return parseAlertsMetric(alertsResult, t)
    }, [alertsResult, t])

  return (
    <AcmScrollable>
      <PageSection>
        <Gallery hasGutter style={{ display: 'flex', flexWrap: 'wrap' }}>
          {clustersSummary
            ? clustersSummary.map(
                (summaryItem: { id: string; title: string; icon?: any; count: number; link?: string }) => {
                  return (
                    <GalleryItem key={summaryItem.id} style={{ flex: 1, minWidth: '180px' }}>
                      <Card isRounded>
                        {summaryItem.icon ? (
                          <CardTitle>
                            {
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                {summaryItem.title}
                                {summaryItem.icon}
                              </div>
                            }
                          </CardTitle>
                        ) : (
                          <CardTitle>{summaryItem.title}</CardTitle>
                        )}
                        {summaryItem.count ? (
                          <CardBody isFilled={false}>
                            {summaryItem.link ? (
                              <Link style={{ fontSize: 24 }} to={summaryItem.link}>
                                {summaryItem.count}
                              </Link>
                            ) : (
                              <FlexItem style={{ fontSize: 24 }}>{summaryItem.count}</FlexItem>
                            )}
                          </CardBody>
                        ) : (
                          <Skeleton shape={'square'} width="40px" />
                        )}
                      </Card>
                    </GalleryItem>
                  )
                }
              )
            : renderSummaryLoading()}
        </Gallery>
      </PageSection>

      <PageSection style={{ paddingTop: 0 }}>
        <Card>
          <CardTitle>
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {t('Powered by Insights')}
                <Button
                  onClick={() => setIsInsightsSectionOpen(!isInsightsSectionOpen)}
                  icon={isInsightsSectionOpen ? <AngleDownIcon /> : <AngleUpIcon />}
                  variant={'plain'}
                />
              </div>
              {(alertsError || operatorError) && (
                <Alert title={t('An unexpected error occurred while getting metrics.')} isInline variant={'danger'} />
              )}
            </>
          </CardTitle>
          {isInsightsSectionOpen && (
            <CardBody>
              <Gallery hasGutter style={{ display: 'flex', flexWrap: 'wrap' }}>
                <GalleryItem key={'cluster-recommendations-card'} style={{ flex: 1, minWidth: '400px' }}>
                  <SummaryCard
                    title={t('Cluster recommendations')}
                    summaryTotalHeader={`${clustersWithIssuesCount} ${
                      clustersWithIssuesCount > 1 ? 'clusters' : 'cluster'
                    } affected`}
                    summaryData={[
                      { icon: <CriticalRiskIcon />, label: 'Critical', count: policyReportCriticalCount },
                      { icon: <ImportantRiskIcon />, label: 'Important', count: policyReportImportantCount },
                      { icon: <ModerateRiskIcon />, label: 'Moderate', count: policyReportModerateCount },
                      { icon: <LowRiskIcon />, label: 'Low', count: policyReportLowCount },
                    ].map((sevRating) => {
                      return {
                        label: sevRating.label,
                        count: sevRating.count,
                        link: {
                          type: 'link',
                          path: `${
                            NavigationPath.search
                          }?filters={"textsearch":"kind%3APolicyReport%20${sevRating.label.toLowerCase()}%3A>0"}`,
                        },
                        icon: sevRating.icon,
                      }
                    })}
                    insights
                  />
                </GalleryItem>
                <GalleryItem key={'alerts-card'} style={{ flex: 1, minWidth: '400px' }}>
                  <SummaryCard
                    title={t('Alerts')}
                    loading={alertsLoading}
                    summaryData={Object.keys(alertSeverity).map((sev: string) => {
                      return {
                        label: alertSeverity[sev]?.label,
                        count: alertSeverity[sev]?.count,
                        link: {
                          type: 'button',
                          path: `${consoleURL}/monitoring/query-browser?query0=ALERTS{severity="${sev}"}`,
                        },
                        icon: alertSeverity[sev]?.icon,
                      }
                    })}
                  />
                </GalleryItem>
                <GalleryItem key={'failing-operators-card'} style={{ flex: 1, minWidth: '400px' }}>
                  <SummaryCard
                    title={t('Failing operators')}
                    loading={operatorLoading}
                    summaryData={[
                      { icon: <CriticalRiskIcon />, label: t('Degraded'), count: degradedCount },
                      { icon: undefined, label: t('Not available'), count: notAvailableCount },
                      { icon: undefined, label: t('Other'), count: otherCount },
                      { icon: undefined, label: t('Available'), count: availableCount },
                    ].map((sevRating) => {
                      return {
                        label: sevRating.label,
                        count: sevRating.count,
                        link: {
                          type: 'link',
                          path: `${NavigationPath.search}?filters={"textsearch":"kind%3AClusterOperator"}`,
                        },
                        icon: sevRating.icon,
                      }
                    })}
                  />
                </GalleryItem>
              </Gallery>
            </CardBody>
          )}
          <Divider />
          <CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {t('Cluster health')}
              <Button
                onClick={() => setIsClusterSectionOpen(!isClusterSectionOpen)}
                icon={isClusterSectionOpen ? <AngleDownIcon /> : <AngleUpIcon />}
                variant={'plain'}
              />
            </div>
          </CardTitle>
          {isClusterSectionOpen && (
            <CardBody isFilled={false}>
              <Gallery hasGutter style={{ display: 'flex', flexWrap: 'wrap' }}>
                <GalleryItem key={'cluster-recommendations-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <AcmDonutChart
                    title={t('Status')}
                    description={t('Overview of cluster status')}
                    loading={!clusterStatusData}
                    data={clusterStatusData}
                    colorScale={colorThemes.criticalSuccess}
                  />
                </GalleryItem>
                <GalleryItem key={'cluster-recommendations-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <AcmDonutChart
                    title={t('Violations')}
                    description={t('Overview of policy violation status')}
                    loading={!complianceData}
                    data={complianceData}
                    colorScale={colorThemes.criticalSuccess}
                  />
                </GalleryItem>
                <GalleryItem key={'cluster-recommendations-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <AcmDonutChart
                    title={t('Cluster add-ons')}
                    description={t('Overview of cluster add-ons')}
                    loading={!clusterAddonData}
                    data={clusterAddonData}
                    colorScale={colorThemes.criticalLowUnknownSuccess}
                  />
                </GalleryItem>
              </Gallery>
            </CardBody>
          )}
        </Card>
      </PageSection>
    </AcmScrollable>
  )
}
