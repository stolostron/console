/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Divider,
  Dropdown,
  DropdownItem,
  Gallery,
  GalleryItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Popover,
  Skeleton,
  TextVariants,
} from '@patternfly/react-core'
import { AngleDownIcon, AngleUpIcon, ExternalLinkAltIcon, HelpIcon, EllipsisVIcon } from '@patternfly/react-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AcmDynamicGrid } from '../../../components/AcmDynamicGrid'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { getUpgradeRiskPredictions } from '../../../lib/get-upgrade-risk-predictions'
import { SupportedAggregate, useAggregate } from '../../../lib/useAggregates'
import { ObservabilityEndpoint, PrometheusEndpoint, useMetricsPoll } from '../../../lib/useMetricsPoll'
import { NavigationPath } from '../../../NavigationPath'
import { getUserPreference, UserPreference } from '../../../resources'
import { Cluster } from '../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmButton, AcmDonutChart, AcmScrollable, colorThemes } from '../../../ui-components'
import { useAddRemediationPolicies } from '../../Governance/common/useCustom'
import { useClusterAddons } from '../../Infrastructure/Clusters/ClusterSets/components/useClusterAddons'
import {
  CriticalRiskIcon,
  ImportantRiskIcon,
  LowRiskIcon,
  ModerateRiskIcon,
} from '../../Infrastructure/Clusters/ManagedClusters/components/ClusterPolicySidebarIcons'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import SavedSearchesCard from './components/SavedSearchesCard'
import SummaryCard from './components/SummaryCard'
import { SummaryClustersCard } from './components/SummaryClustersCard'
import { Data, SummaryStatusCard } from './components/SummaryStatusCard'
import {
  getAddonHealth,
  getAppTypeSummary,
  getClusterProviderSummary,
  getClusterStatus,
  getClusterVersionSummary,
  getComplianceData,
  getFilteredClusters,
  getNodeSummary,
  getPolicyReport,
  getPolicySummary,
  getWorkerCoreTotal,
  parseAlertsMetric,
  parseOperatorMetric,
  parseUpgradeRiskPredictions,
} from './overviewDataFunctions'

interface WidgetLayout {
  visible: boolean
  position: number
}

export default function OverviewPage(props: Readonly<{ selectedClusterLabels: Record<string, string[]> }>) {
  const { selectedClusterLabels } = props
  usePageVisitMetricHandler(Pages.overviewFleet)
  const { t } = useTranslation()
  const { clusterManagementAddonsState, policyreportState } = useSharedAtoms()

  const policies = useAddRemediationPolicies()
  const allAddons = useClusterAddons()
  const policyReports = useRecoilValue(policyreportState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const [isOpen, setIsOpen] = useState(false)
  const [summarySectionWidgetToggle, setSummarySectionWidgetToggle] = useState<Record<string, WidgetLayout>>({
    clusterProvider: { visible: true, position: 0 },
    appType: { visible: true, position: 1 },
    policies: { visible: true, position: 2 },
    clusterVersion: { visible: true, position: 3 },
    nodes: { visible: true, position: 4 },
    coreCount: { visible: true, position: 5 },
  })
  const [isInsightsSectionOpen, setIsInsightsSectionOpen] = useState<boolean>(
    localStorage.getItem('insights-section-toggle') ? localStorage.getItem('insights-section-toggle') === 'true' : true
  )
  const [isClusterSectionOpen, setIsClusterSectionOpen] = useState<boolean>(
    localStorage.getItem('cluster-section-toggle') ? localStorage.getItem('cluster-section-toggle') === 'true' : true
  )
  const [isCustomizationSectionOpen, setIsCustomizationSectionOpen] = useState<boolean>(
    localStorage.getItem('saved-search-section-toggle')
      ? localStorage.getItem('saved-search-section-toggle') === 'true'
      : true
  )
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

  const requestedCounts = useAggregate(
    SupportedAggregate.statuses,
    filteredClusterNames.length < 100 ? { clusters: filteredClusterNames } : {}
  )

  const {
    policyReportCriticalCount,
    policyReportImportantCount,
    policyReportModerateCount,
    policyReportLowCount,
    clustersWithIssuesCount,
  } = useMemo(() => {
    if (isInsightsSectionOpen) {
      return getPolicyReport(policyReports, filteredClusters)
    }
    return {
      policyReportCriticalCount: 0,
      policyReportImportantCount: 0,
      policyReportModerateCount: 0,
      policyReportLowCount: 0,
      clustersWithIssuesCount: 0,
    }
  }, [isInsightsSectionOpen, filteredClusters, policyReports])

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
    if (isInsightsSectionOpen && managedClusterIds.length > 0) {
      getUpgradeRiskPredictions(managedClusterIds).then((res) => setUpgradeRiskPredictions(res))
    }
  }, [isInsightsSectionOpen, managedClusterIds])

  const { criticalUpdateCount, warningUpdateCount, infoUpdateCount, clustersWithRiskPredictors } = useMemo(() => {
    const reducedUpgradeRiskPredictions = upgradeRiskPredictions.reduce((acc: any[], curr: any) => {
      if (curr?.error) {
        console.error(curr.error)
      } else if (curr?.body.predictions) {
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

  const [clusterOperators, operatorError, operatorLoading] = useMetricsPoll({
    endpoint: ObservabilityEndpoint.QUERY,
    query: 'cluster_operator_conditions',
    skip: !isInsightsSectionOpen || !isObservabilityInstalled,
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

  const [alertsResult, alertsError, alertsLoading] = useMetricsPoll({
    endpoint: ObservabilityEndpoint.QUERY,
    query: 'ALERTS',
    skip: !isInsightsSectionOpen || !isObservabilityInstalled,
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
    if (isCustomizationSectionOpen) {
      getUserPreference().then((resp) => {
        setIsUserPreferenceLoading(false)
        setUserPreference(resp)
      })
    }
  }, [isCustomizationSectionOpen])

  const userSavedSearches = useMemo(() => {
    return userPreference?.spec?.savedSearches ?? []
  }, [userPreference])

  const clusterProviderSummary = useMemo(() => {
    return getClusterProviderSummary(filteredClusters)
  }, [filteredClusters])

  const clusterVersionSummary = useMemo(() => {
    return getClusterVersionSummary(filteredClusters)
  }, [filteredClusters])

  const [workerCoreCountMetric, workerCoreCountError, workerCoreCountLoading] = useMetricsPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: 'acm_managed_cluster_worker_cores',
    skip: false,
  })
  const workerCoreTotal = useMemo(() => {
    return getWorkerCoreTotal(workerCoreCountMetric, filteredClusters)
  }, [workerCoreCountMetric, filteredClusters])

  const nodeSummary: Data = useMemo(() => {
    return getNodeSummary(filteredClusters, t)
  }, [filteredClusters, t])

  const appTypeSummary: Data = useMemo(() => {
    return getAppTypeSummary(requestedCounts, t)
  }, [requestedCounts, t])

  const policySummary = useMemo(() => {
    return getPolicySummary(policies, filteredClusterNames, allClusters.length, t)
  }, [policies, filteredClusterNames, allClusters.length, t])

  // Min width is determined based on how many legend items are in the child donut charts because the legend wraps at 6 items
  const minLegendCardWidth = useMemo(() => {
    const largestlegendSet = Math.max(clusterProviderSummary.length, clusterVersionSummary.length)
    const columns = Math.trunc(largestlegendSet / 6)
    const remainder = largestlegendSet % 6 > 0 ? 150 : 0
    // 150 length per legend columns plus 150 for donut width
    const legendCardWidth = columns * 150 + remainder + 150
    return legendCardWidth > 400 ? legendCardWidth : 400
  }, [clusterProviderSummary, clusterVersionSummary])

  const workerCoreLaunchLink = useCallback((text: string, isLarge: boolean) => {
    return (
      <AcmButton
        variant="link"
        isInline
        icon={<ExternalLinkAltIcon style={{ fontSize: 12 }} />}
        iconPosition="right"
        onClick={() =>
          window.open(
            `${window.location.origin}/monitoring/query-browser?query0=acm_managed_cluster_worker_cores`,
            '_blank'
          )
        }
        style={isLarge ? { fontSize: 24 } : {}}
      >
        {text}
      </AcmButton>
    )
  }, [])

  return (
    <AcmScrollable>
      <PageSection>
        <AcmDynamicGrid minSize={minLegendCardWidth}>
          <SummaryClustersCard
            title={t('Clusters')}
            chartLabel={{
              title: `${filteredClusterNames.length}`,
              subTitle: t('total clusters'),
            }}
            data={clusterProviderSummary}
          />
          <SummaryStatusCard key={'application-type-summary'} title={t('Application types')} data={appTypeSummary} />
          <SummaryStatusCard key={'policies-status-summary'} title={t('Policies')} data={policySummary} />
          <SummaryClustersCard isPieChart title={t('Cluster version')} data={clusterVersionSummary} />
          <SummaryStatusCard key={'node-summary'} title={t('Nodes')} data={nodeSummary} />
          {summarySectionWidgetToggle['coreCount'].visible && (
            <Card isRounded style={{ height: '200px' }}>
              <CardTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {t('Worker core count')}
                <Dropdown
                  onSelect={() => setIsOpen(!isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => {
                        setIsOpen(!isOpen)
                      }}
                      variant="plain"
                      isExpanded={isOpen}
                    ><EllipsisVIcon /></MenuToggle>
                  )}
                  isOpen={isOpen}
                  isPlain={true}
                >
                  <DropdownItem
                    key="hide card"
                    onClick={() =>
                      setSummarySectionWidgetToggle({
                        clusterProvider: { visible: true, position: 0 },
                        appType: { visible: true, position: 1 },
                        policies: { visible: true, position: 2 },
                        clusterVersion: { visible: true, position: 3 },
                        nodes: { visible: true, position: 4 },
                        coreCount: { visible: false, position: 5 },
                      })
                    }
                  >
                    {t('Hide card')}
                  </DropdownItem>
                </Dropdown>
              </CardTitle>
              <CardBody isFilled={false}>
                <>
                  {workerCoreCountError && (
                    <Alert
                      isInline={true}
                      title={
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {t('An unexpected error occurred while retrieving metrics.')}
                          {workerCoreLaunchLink(t('Launch to metric'), false)}
                        </div>
                      }
                      variant={'danger'}
                    />
                  )}
                  {workerCoreCountLoading ? <Skeleton width="50%" /> : workerCoreLaunchLink(`${workerCoreTotal}`, true)}
                </>
              </CardBody>
            </Card>
          )}
        </AcmDynamicGrid>
      </PageSection>

      <PageSection style={{ paddingTop: 0 }}>
        <Card>
          <CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {t('Insights')}
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
                id={'insights-section-toggle'}
                onClick={() => {
                  localStorage.setItem('insights-section-toggle', `${!isInsightsSectionOpen}`)
                  setIsInsightsSectionOpen(!isInsightsSectionOpen)
                }}
                icon={isInsightsSectionOpen ? <AngleDownIcon /> : <AngleUpIcon />}
                variant={'plain'}
              />
            </div>
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
                id={'cluster-section-toggle'}
                onClick={() => {
                  localStorage.setItem('cluster-section-toggle', `${!isClusterSectionOpen}`)
                  setIsClusterSectionOpen(!isClusterSectionOpen)
                }}
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
                    loading={!clusterStatusData} // Add an unknown state
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
                id={'saved-search-section-toggle'}
                onClick={() => {
                  localStorage.setItem('saved-search-section-toggle', `${!isCustomizationSectionOpen}`)
                  setIsCustomizationSectionOpen(!isCustomizationSectionOpen)
                }}
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
    </AcmScrollable>
  )
}
