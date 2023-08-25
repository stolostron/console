/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Divider,
  FlexItem,
  Gallery,
  GalleryItem,
  PageSection,
  Popover,
  Skeleton,
  TextVariants,
} from '@patternfly/react-core'
import { AngleDownIcon, AngleUpIcon, ExternalLinkAltIcon, HelpIcon } from '@patternfly/react-icons'
import { useMemo, useState } from 'react'
import { Link, useRouteMatch } from 'react-router-dom'
import {
  GetArgoApplicationsHashSet,
  GetDiscoveredOCPApps,
  GetOpenShiftAppResourceMaps,
} from '../../../components/GetDiscoveredOCPApps'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { ObservabilityEndpoint, useObservabilityPoll } from '../../../lib/useObservabilityPoll'
import { NavigationPath } from '../../../NavigationPath'
import { Application, ApplicationSet, Cluster } from '../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { AcmButton, AcmDonutChart, AcmScrollable, colorThemes } from '../../../ui-components'
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
    clusterManagementAddonsState,
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
  const [clusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
  const [isClusterSectionOpen, setIsClusterSectionOpen] = useState<boolean>(true)
  const [isInsightsSectionOpen, setIsInsightsSectionOpen] = useState<boolean>(true)
  const [isObservabilityInstalled, setIsObservabilityInstalled] = useState<boolean>(false)
  GetDiscoveredOCPApps(applicationsMatch.isExact, !ocpApps.length && !discoveredApplications.length)

  const grafanaRoute = useMemo(() => {
    const obsAddOn = clusterManagementAddons.filter(
      (cma) =>
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link'] &&
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link-text'] &&
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link-text'] === 'Grafana'
    )
    const link = obsAddOn?.[0].metadata.annotations?.['console.open-cluster-management.io/launch-link']
    if (link) {
      setIsObservabilityInstalled(true)
      return new URL(link).origin
    }
    return undefined
  }, [clusterManagementAddons])

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

  const grafanaLinkClusterLabelCondition = useMemo(() => {
    if (Object.keys(selectedClusterLabels).length > 0) {
      const labels: string[] = []
      Object.keys(selectedClusterLabels).forEach((key: string) =>
        labels.push(
          `${key.replaceAll(/[./-]+/g, '_')}=~%5C"${selectedClusterLabels[key]
            .join('|')
            .replaceAll(/[./-]+/g, '_')}%5C"`
        )
      )
      return ` * on(cluster) group_left label_replace(acm_managed_cluster_labels{${labels.join(
        ','
      )}},%5C"cluster%5C",%5C"$1%5C",%5C"name%5C", %5C"(.%2B)%5C")`
    }
    return ''
  }, [selectedClusterLabels])

  const [clusterOperators, operatorError, operatorLoading] = useObservabilityPoll({
    endpoint: ObservabilityEndpoint.QUERY,
    query: 'cluster_operator_conditions',
    skip: !isObservabilityInstalled,
  })
  const {
    clustersAffectedOperator,
    degraded,
    notAvailable,
    other,
  }: { clustersAffectedOperator: string[]; degraded: string[]; notAvailable: string[]; other: string[] } =
    useMemo(() => {
      return parseOperatorMetric(clusterOperators, filteredClusterNames)
    }, [clusterOperators, filteredClusterNames])

  const [alertsResult, alertsError, alertsLoading] = useObservabilityPoll({
    endpoint: ObservabilityEndpoint.QUERY,
    query: 'ALERTS',
    skip: !isObservabilityInstalled,
  })
  const {
    clustersAffectedAlerts,
    alertSeverity,
  }: {
    clustersAffectedAlerts: string[]
    alertSeverity: Record<
      string,
      {
        key: string
        label: string
        alerts: string[]
        icon?: JSX.Element
      }
    >
  } = useMemo(() => {
    return parseAlertsMetric(alertsResult, filteredClusterNames, t)
  }, [alertsResult, filteredClusterNames, t])

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
                        <CardBody isFilled={false}>
                          {summaryItem.link ? (
                            <Link style={{ fontSize: 24 }} to={summaryItem.link}>
                              {summaryItem.count}
                            </Link>
                          ) : (
                            <FlexItem style={{ fontSize: 24 }}>{summaryItem.count}</FlexItem>
                          )}
                        </CardBody>
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
                <div>
                  {t('Powered by Insights')}
                  <Popover
                    headerContent={t('Insights data')}
                    bodyContent={t('Red Hat Insights provides data to monitor your clusters more efficiently.')}
                  >
                    <Button
                      variant="plain"
                      style={{
                        padding: 0,
                        marginLeft: '8px',
                        verticalAlign: 'middle',
                      }}
                    >
                      <HelpIcon />
                    </Button>
                  </Popover>
                </div>

                <Button
                  onClick={() => setIsInsightsSectionOpen(!isInsightsSectionOpen)}
                  icon={isInsightsSectionOpen ? <AngleDownIcon /> : <AngleUpIcon />}
                  variant={'plain'}
                />
              </div>
            </>
          </CardTitle>
          {isInsightsSectionOpen && (
            <CardBody>
              <Gallery hasGutter style={{ display: 'flex', flexWrap: 'wrap' }}>
                <GalleryItem key={'cluster-recommendations-card'} style={{ flex: 1, minWidth: '375px' }}>
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
                {isObservabilityInstalled && (
                  <>
                    <GalleryItem key={'alerts-card'} style={{ flex: 1, minWidth: '375px' }}>
                      <SummaryCard
                        title={t('Alerts')}
                        summaryTotalHeader={`${clustersAffectedAlerts.length} ${
                          clustersAffectedAlerts.length > 1 ? 'clusters' : 'cluster'
                        } affected`}
                        loading={alertsLoading}
                        error={alertsError as string}
                        summaryData={Object.keys(alertSeverity).map((sev: string) => {
                          const linkSev =
                            alertSeverity[sev].key === 'other'
                              ? `severity!~%5C"critical|warning|info%5C"`
                              : `severity=%5C"${alertSeverity[sev].key}%5C"`
                          return {
                            label: alertSeverity[sev]?.label,
                            count: alertSeverity[sev]?.alerts.length,
                            link: {
                              type: 'button',
                              path: `${grafanaRoute}/explore?left=["now-1h","now","Observatorium",{"exemplar":true,"expr":"(ALERTS{${linkSev},alertstate=%5C"firing%5C"} == 1)${grafanaLinkClusterLabelCondition}"}]&orgId=1`,
                            },
                            icon: alertSeverity[sev]?.icon,
                          }
                        })}
                      />
                    </GalleryItem>
                    <GalleryItem key={'failing-operators-card'} style={{ flex: 1, minWidth: '375px' }}>
                      <SummaryCard
                        title={t('Failing operators')}
                        summaryTotalHeader={`${clustersAffectedOperator.length} ${
                          clustersAffectedOperator.length > 1 ? 'clusters' : 'cluster'
                        } affected`}
                        loading={operatorLoading}
                        error={operatorError as string}
                        summaryData={[
                          {
                            key: 'degraded',
                            icon: <CriticalRiskIcon />,
                            label: t('Degraded'),
                            count: degraded.length,
                            operators: degraded,
                          },
                          {
                            key: 'notavailable',
                            icon: undefined,
                            label: t('Not available'),
                            count: notAvailable.length,
                            operators: notAvailable,
                          },
                          {
                            key: 'other',
                            icon: undefined,
                            label: t('Other'),
                            count: other.length,
                            operators: other,
                          },
                        ].map((sevRating) => {
                          let linkCondition = ''
                          switch (sevRating.key) {
                            case 'degraded':
                              // condition["type"] == "Degraded" and condition["status"] == "True" -> Degraded
                              linkCondition = `(cluster_operator_conditions{condition=%5C"Degraded%5C"} == 1)`
                              break
                            case 'notavailable':
                              // condition["type"] == "Available" and condition["status"] == "False" -> Not Available
                              linkCondition = `(cluster_operator_conditions{condition=%5C"Available%5C"} == 0)`
                              break
                            case 'other':
                              // condition["type"] == "Progressing" and condition["status"] == "True" -> Other
                              // condition["type"] == "Upgradeable" and condition["status"] == "False" -> Other
                              // condition["type"] == "Failing" and condition["status"] == "True" -> Other
                              linkCondition = `(cluster_operator_conditions{condition=%5C"Progressing%5C"} == 1 or cluster_operator_conditions{condition=%5C"Upgradeable%5C"} == 0 or cluster_operator_conditions{condition=%5C"Failing%5C"} == 1)`
                              break
                          }
                          return {
                            label: sevRating.label,
                            count: sevRating.count,
                            link: {
                              type: 'button',
                              path: `${grafanaRoute}/explore?left=["now-1h","now","Observatorium",{"exemplar":true,"expr":"${linkCondition}${grafanaLinkClusterLabelCondition}"}]&orgId=1`,
                            },
                            icon: sevRating.icon,
                          }
                        })}
                      />
                    </GalleryItem>
                  </>
                )}
                {!isObservabilityInstalled && (
                  <GalleryItem key={'alerts-card'} style={{ flex: 1, minWidth: '375px' }}>
                    <Card isRounded isFullHeight>
                      <CardTitle>{'Enable Observability to see more metrics'}</CardTitle>
                      <CardBody isFilled={false}>
                        <AcmButton
                          variant={'link'}
                          component={TextVariants.a}
                          href={DOC_LINKS.MANAGE_APPLICATIONS}
                          target="_blank"
                          style={{ padding: 0 }}
                        >
                          {t('View documentation')} <ExternalLinkAltIcon />
                        </AcmButton>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                )}
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
