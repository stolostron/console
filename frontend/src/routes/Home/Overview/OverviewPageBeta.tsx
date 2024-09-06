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
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { getUpgradeRiskPredictions } from '../../../lib/get-upgrade-risk-predictions'
import { ObservabilityEndpoint, useObservabilityPoll } from '../../../lib/useObservabilityPoll'
import { NavigationPath } from '../../../NavigationPath'
import { Cluster, getUserPreference, UserPreference } from '../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmButton, AcmDonutChart, colorThemes } from '../../../ui-components'
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
  getClustersSummary,
  getClusterStatus,
  getComplianceData,
  getFilteredClusters,
  getPolicyReport,
  parseAlertsMetric,
  parseOperatorMetric,
  parseUpgradeRiskPredictions,
} from './overviewDataFunctions'
import SavedSearchesCard from './SavedSearchesCard'
import SummaryCard from './SummaryCard'
import { SupportedAggregate, useAggregate } from '../../../lib/useAggregates'

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
  usePageVisitMetricHandler(Pages.overviewFleet)
  const { t } = useTranslation()
  const { clusterManagementAddonsState, policyreportState, usePolicies, managedClusterInfosState } = useSharedAtoms()

  const policies = usePolicies()
  const allAddons = useClusterAddons()
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const policyReports = useRecoilValue(policyreportState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const [isClusterSectionOpen, setIsClusterSectionOpen] = useState<boolean>(true)
  const [isInsightsSectionOpen, setIsInsightsSectionOpen] = useState<boolean>(true)
  const [isCustomizationSectionOpen, setIsCustomizationSectionOpen] = useState<boolean>(true)
  const [isObservabilityInstalled, setIsObservabilityInstalled] = useState<boolean>(false)
  const [upgradeRiskPredictions, setUpgradeRiskPredictions] = useState<any[]>([])
  const [isUserPreferenceLoading, setIsUserPreferenceLoading] = useState(true)
  const [userPreference, setUserPreference] = useState<UserPreference | undefined>(undefined)

  const grafanaRoute = useMemo(() => {
    const obsAddOn = clusterManagementAddons.filter(
      (cma) =>
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link'] &&
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link-text'] &&
        cma.metadata.annotations?.['console.open-cluster-management.io/launch-link-text'] === 'Grafana'
    )
    const link = obsAddOn?.[0]?.metadata?.annotations?.['console.open-cluster-management.io/launch-link']
    if (link) {
      setIsObservabilityInstalled(true)
      return new URL(link).origin
    }
    return undefined
  }, [clusterManagementAddons])

  const clusterLabelsSearchFilter = useMemo(() => {
    const filteredSelectedClusterLabels = { ...selectedClusterLabels }
    if (selectedClusterLabels['region']) {
      filteredSelectedClusterLabels['region'] = selectedClusterLabels['region'].filter((value) => value !== 'Other')
    }
    const labelStringArray: string[] = []
    Object.keys(filteredSelectedClusterLabels).forEach((labelKey) => {
      filteredSelectedClusterLabels[labelKey].forEach((label) => labelStringArray.push(`${labelKey}=${label}`))
    })
    if (labelStringArray.length > 0) {
      return encodeURIComponent(`label:${labelStringArray.join(',')}`)
    }
    return undefined
  }, [selectedClusterLabels])

  const allClusters: Cluster[] = useAllClusters(true /* exclude unclaimed cluster pool clusters */)
  const filteredClusters = useMemo(
    () => getFilteredClusters(allClusters, selectedClusterLabels),
    [allClusters, selectedClusterLabels]
  )
  const filteredClusterNames = useMemo(() => filteredClusters.map((cluster) => cluster.name), [filteredClusters])

  const { applicationCount, loading } = useAggregate(
    SupportedAggregate.statuses,
    filteredClusterNames.length < 100 ? { clusters: filteredClusterNames } : {}
  )

  const clustersSummary = useMemo(() => {
    return getClustersSummary(filteredClusters, filteredClusterNames, managedClusterInfos, applicationCount, loading, t)
  }, [filteredClusters, filteredClusterNames, managedClusterInfos, applicationCount, loading, t])

  const {
    policyReportCriticalCount,
    policyReportImportantCount,
    policyReportModerateCount,
    policyReportLowCount,
    clustersWithIssuesCount,
  } = useMemo(() => {
    return getPolicyReport(policyReports, filteredClusters)
  }, [filteredClusters, policyReports])

  const managedClusterIds = useMemo(() => {
    const ids: string[] = []
    allClusters.forEach((cluster) => {
      if (cluster.labels?.clusterID) {
        ids.push(cluster.labels?.clusterID)
      }
    })
    return ids
  }, [allClusters])

  useEffect(() => {
    if (managedClusterIds.length > 0) {
      getUpgradeRiskPredictions(managedClusterIds).then((res) => setUpgradeRiskPredictions(res))
    }
  }, [managedClusterIds])

  const { criticalUpdateCount, warningUpdateCount, infoUpdateCount, clustersWithRiskPredictors } = useMemo(() => {
    const reducedUpgradeRiskPredictions = upgradeRiskPredictions.reduce((acc: any[], curr: any) => {
      if (curr && curr.body && curr.body.predictions) {
        return [...acc, ...curr.body.predictions]
      }
      return acc
    }, [])
    return parseUpgradeRiskPredictions(reducedUpgradeRiskPredictions)
  }, [upgradeRiskPredictions])

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
    const filteredSelectedClusterLabels = { ...selectedClusterLabels }
    if (selectedClusterLabels['region']) {
      filteredSelectedClusterLabels['region'] = selectedClusterLabels['region'].filter((value) => value !== 'Other')
    }
    if (Object.keys(filteredSelectedClusterLabels).length > 0) {
      const labels: string[] = []
      Object.keys(filteredSelectedClusterLabels).forEach((key: string) =>
        labels.push(
          `${key.replaceAll(/[./-]+/g, '_')}=~%5C"${filteredSelectedClusterLabels[key]
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

  useEffect(() => {
    getUserPreference().then((resp) => {
      setIsUserPreferenceLoading(false)
      setUserPreference(resp)
    })
  }, [])

  const userSavedSearches = useMemo(() => {
    return userPreference?.spec?.savedSearches ?? []
  }, [userPreference])

  return (
    <>
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
                    bodyContent={
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {t('Red Hat Insights gathers data and uses it to produce actionable recommendations.')}
                        <Button
                          id={'redhat-insights-link'}
                          variant="link"
                          href={'https://console.redhat.com/openshift/insights'}
                          component="a"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: 0,
                            marginTop: '0.5rem',
                          }}
                        >
                          {t('View Red Hat Insights')}
                        </Button>
                      </div>
                    }
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
                    summaryTotalHeader={{
                      num: `${clustersWithIssuesCount}`,
                      text: clustersWithIssuesCount !== 1 ? t('clusters affected') : t('cluster affected'),
                    }}
                    summaryData={[
                      { icon: <CriticalRiskIcon />, label: t('Critical'), count: policyReportCriticalCount },
                      { icon: <ImportantRiskIcon />, label: t('Important'), count: policyReportImportantCount },
                      { icon: <ModerateRiskIcon />, label: t('Moderate'), count: policyReportModerateCount },
                      { icon: <LowRiskIcon />, label: t('Low'), count: policyReportLowCount },
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
                <GalleryItem key={'upgrade-risk-prediction-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <SummaryCard
                    title={t('Update risk predictions')}
                    titlePopover={
                      <Popover
                        bodyContent={t(
                          'Cluster update risks are only collected for OpenShift Container Platform clusters.'
                        )}
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
                    }
                    summaryTotalHeader={{
                      num: `${clustersWithRiskPredictors}`,
                      text:
                        clustersWithRiskPredictors === 1
                          ? t('cluster needs to be reviewed before updating')
                          : t('clusters need to be reviewed before updating'),
                    }}
                    summaryData={[
                      { icon: <CriticalRiskIcon />, label: t('Critical'), count: criticalUpdateCount },
                      { icon: <ModerateRiskIcon />, label: t('Warning'), count: warningUpdateCount },
                      { icon: <LowRiskIcon />, label: t('Info'), count: infoUpdateCount },
                    ].map((sevRating) => {
                      return {
                        label: sevRating.label,
                        count: sevRating.count,
                        link: {
                          type: 'link',
                          path: NavigationPath.managedClusters, // Any way to navigate to clusters table with context of risk severity?
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
                        summaryTotalHeader={{
                          num: `${clustersAffectedAlerts.length}`,
                          text: clustersAffectedAlerts.length !== 1 ? t('clusters affected') : t('cluster affected'),
                        }}
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
                        summaryTotalHeader={{
                          num: `${clustersAffectedOperator.length}`,
                          text: clustersAffectedOperator.length !== 1 ? t('clusters affected') : t('cluster affected'),
                        }}
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
                      <CardTitle>{t('Enable Observability to see more metrics')}</CardTitle>
                      <CardBody isFilled={false}>
                        <AcmButton
                          variant={'link'}
                          component={TextVariants.a}
                          href={DOC_LINKS.ENABLE_OBSERVABILITY}
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
                <GalleryItem key={'cluster-status-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <AcmDonutChart
                    title={t('Status')}
                    description={t('Overview of cluster status')}
                    loading={!clusterStatusData}
                    data={clusterStatusData}
                    colorScale={colorThemes.criticalSuccess}
                  />
                </GalleryItem>
                <GalleryItem key={'cluster-violations-card'} style={{ flex: 1, minWidth: '375px' }}>
                  <AcmDonutChart
                    title={t('Violations')}
                    description={t('Overview of policy violation status')}
                    loading={!complianceData}
                    data={complianceData}
                    colorScale={colorThemes.criticalSuccess}
                  />
                </GalleryItem>
                <GalleryItem key={'cluster-add-ons-card'} style={{ flex: 1, minWidth: '375px' }}>
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
          <Divider />
          <CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {t('Your view')}
              <Button
                onClick={() => setIsCustomizationSectionOpen(!isCustomizationSectionOpen)}
                icon={isCustomizationSectionOpen ? <AngleDownIcon /> : <AngleUpIcon />}
                variant={'plain'}
              />
            </div>
          </CardTitle>
          {isCustomizationSectionOpen && (
            <CardBody isFilled={false}>
              <Gallery hasGutter style={{ display: 'flex', flexWrap: 'wrap' }}>
                <GalleryItem key={'saved-search-card'} style={{ flex: 1, minWidth: '375px', maxWidth: '50%' }}>
                  <SavedSearchesCard
                    isUserPreferenceLoading={isUserPreferenceLoading}
                    savedSearches={userSavedSearches}
                  />
                </GalleryItem>
              </Gallery>
            </CardBody>
          )}
        </Card>
      </PageSection>
    </>
  )
}
