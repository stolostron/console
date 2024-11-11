/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk'
import { CheckCircleIcon, ExclamationCircleIcon, UnknownIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'

import { IResultStatuses } from '../../../lib/useAggregates'
import { NavigationPath } from '../../../NavigationPath'
import { Addon, AddonStatus, Cluster, Policy, PolicyReport, PolicyReportResults } from '../../../resources'
import { compareStrings, Provider, ProviderShortTextMap } from '../../../ui-components'
import {
  CriticalRiskIcon,
  ImportantRiskIcon,
} from '../../Infrastructure/Clusters/ManagedClusters/components/ClusterPolicySidebarIcons'

export function getFilteredClusters(allClusters: Cluster[], selectedClusterLabels: Record<string, string[]>) {
  const selectedLabelValues: number = Object.keys(selectedClusterLabels).reduce(
    (acc, curr) => acc + selectedClusterLabels[curr].length,
    0
  )
  if (selectedLabelValues === 0) {
    // if no label values are selected -> using all clusters
    return allClusters
  }
  return allClusters.filter((cluster) => {
    if (cluster.labels) {
      let labels = { ...cluster.labels }
      if (!labels['region']) {
        // region label not present in cluster's labels - adding region=Other
        labels = { ...labels, region: 'Other' }
      }
      return Object.keys(labels).some((key) => {
        if (Object.keys(selectedClusterLabels).includes(key)) {
          const clusterLabelValue = labels![key]
          return selectedClusterLabels[key].includes(clusterLabelValue)
        }
        return false
      })
    }
    return false
  })
}

export function getClusterProviderSummary(filteredClusters: Cluster[]) {
  const providerSums: Record<string, number> = {}
  filteredClusters.forEach((cluster) => {
    const provider = cluster?.provider ?? Provider.other
    const sum = providerSums[provider] > 0 ? providerSums[provider] + 1 : 1
    providerSums[provider] = sum
  })
  // sort alphabetically
  const orderedProviders = Object.keys(providerSums).sort((a, b) =>
    compareStrings(ProviderShortTextMap[a as Provider], ProviderShortTextMap[b as Provider])
  )
  return orderedProviders.map((sum) => ({
    key: ProviderShortTextMap[sum as Provider],
    value: providerSums[sum],
    link: `${NavigationPath.managedClusters}?provider=${sum}`,
  }))
}

export function getClusterVersionSummary(filteredClusters: Cluster[]) {
  const versionSums: Record<string, number> = {}
  filteredClusters.forEach((cluster) => {
    const version = cluster.distribution?.displayVersion?.split('.', 2).join('.') ?? 'unknown'
    const sum = versionSums[version] > 0 ? versionSums[version] + 1 : 1
    versionSums[version] = sum
  })
  // sort alphabetically
  const orderedVersions = Object.keys(versionSums).sort((a, b) => compareStrings(a, b))
  return orderedVersions.map((version) => ({
    key: version,
    value: versionSums[version],
  }))
}

export function getWorkerCoreTotal(workerCoreCountMetric: PrometheusResponse | undefined, filteredClusters: Cluster[]) {
  let totalCoreWorkerCount = 0
  if (workerCoreCountMetric?.data?.result) {
    const clusterIDs = filteredClusters.map((cluster) => {
      // acm_managed_cluster_worker_cores metric uses cluster id if available if not uses cluster name
      return cluster.labels?.['clusterID'] ?? cluster.name
    })
    const filteredCoreWorkerCounts =
      clusterIDs.length === 0
        ? workerCoreCountMetric.data.result
        : workerCoreCountMetric.data.result.filter((alert) => clusterIDs.includes(alert.metric.managed_cluster_id))
    filteredCoreWorkerCounts.forEach((coreWorker) => {
      totalCoreWorkerCount = totalCoreWorkerCount + parseInt(coreWorker?.value?.[1] ?? '0')
    })
  }
  return totalCoreWorkerCount
}

export function getNodeSummary(filteredClusters: Cluster[], t: TFunction<string, undefined>) {
  const nodeSums: Record<string, number> = {
    ready: 0,
    unhealthy: 0,
    unknown: 0,
  }
  filteredClusters.forEach((cluster) => {
    if (cluster.nodes) {
      nodeSums['ready'] = nodeSums['ready'] + cluster.nodes.ready
      nodeSums['unhealthy'] = nodeSums['unhealthy'] + cluster.nodes.unhealthy
      nodeSums['unknown'] = nodeSums['unknown'] + cluster.nodes.unknown
    }
  })
  return {
    mainSection: {
      title: `${nodeSums['ready'] + nodeSums['unhealthy'] + nodeSums['unknown']}`,
      description: t('total nodes'),
    },
    statusSection: [
      {
        title: t('Ready'),
        count: nodeSums['ready'],
        icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
        link: nodeSums['ready'] > 0 ? `${NavigationPath.managedClusters}?nodes=healthy` : undefined,
      },
      {
        title: t('Unhealthy'),
        count: nodeSums['unhealthy'],
        icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
        link: nodeSums['unhealthy'] > 0 ? `${NavigationPath.managedClusters}?nodes=danger` : undefined,
      },
      {
        title: t('Unknown'),
        count: nodeSums['unknown'],
        icon: <UnknownIcon />,
        link: nodeSums['unknown'] > 0 ? `${NavigationPath.managedClusters}?nodes=unknown` : undefined,
      },
    ],
  }
}

export function getAppTypeSummary(requestedCounts: IResultStatuses, t: TFunction<string, undefined>) {
  const { itemCount = 0, filterCounts = { type: {} }, loading } = requestedCounts || {}

  const getAppTypeLabel = (type: string) => {
    switch (type) {
      case 'openshift':
        return 'OpenShift'
      case 'flux':
        return t('Flux')
      case 'subscription':
        return t('Subscription')
      case 'argo':
        return t('Argo CD')
      case 'appset':
        return t('Application set')
      case 'openshift-default':
        return t('System')
      default:
        return t('Application')
    }
  }
  const typeTotals: Record<string, number> = {}
  // type can be undefined just after ACM is installed.
  if (filterCounts.type) {
    Object.keys(filterCounts.type).forEach((type) => {
      typeTotals[getAppTypeLabel(type)] = filterCounts.type[type]
    })
  }
  // sort alphabetically
  const orderedAppTypes = Object.keys(typeTotals).sort((a, b) => compareStrings(a, b))

  const getAppTypeLink = (type: string) => {
    // handle cases from getAppTypeLabel
    switch (type) {
      case 'OpenShift':
        return `${NavigationPath.applications}?type=openshift`
      case t('Flux'):
        return `${NavigationPath.applications}?type=flux`
      case t('Subscription'):
        return `${NavigationPath.applications}?type=subscription`
      case t('Argo CD'):
      case t('Discovered'):
        return `${NavigationPath.applications}?type=argo`
      case t('Application set'):
        return `${NavigationPath.applications}?type=appset`
      case 'System':
        return `${NavigationPath.applications}?type=openshift-default`
      default:
        return NavigationPath.applications
    }
  }

  return {
    mainSection: {
      title: `${itemCount}`,
      description: t('total applications'),
      link: NavigationPath.applications,
    },
    statusSection: orderedAppTypes.map((type) => ({
      title: type,
      count: typeTotals[type],
      link: getAppTypeLink(type),
    })),
    loading,
  }
}

export function getPolicySummary(
  policies: Policy[],
  filteredClusterNames: string[],
  allClustersLength: number,
  t: TFunction<string, undefined>
) {
  let totalPolicies = 0
  let compliant = 0
  let noncompliant = 0
  let pending = 0
  let unknown = 0
  const filteredPolicies = policies.filter((policy: Policy) => {
    if (filteredClusterNames.length === allClustersLength) {
      return true
    }
    return (
      policy.status?.status &&
      policy.status.status.filter((i: { clustername: string }) => {
        return filteredClusterNames.includes(i.clustername)
      }).length > 0
    )
  })
  filteredPolicies.forEach((policy: Policy) => {
    if (!policy.spec.disabled) {
      totalPolicies++
      switch (policy.status?.compliant) {
        case 'Compliant':
          compliant++
          break
        case 'NonCompliant':
          noncompliant++
          break
        case 'Pending':
          pending++
          break
        default:
          unknown++
          break
      }
    }
  })
  return {
    mainSection: {
      title: `${totalPolicies}`,
      description: 'enabled policies',
      link: `${NavigationPath.policies}?enabled=True`,
    },
    statusSection: [
      {
        title: t('With no violations'),
        count: compliant,
        link: `${NavigationPath.policies}?enabled=True&violations=no-violations`,
        icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
      },
      {
        title: t('With violations'),
        count: noncompliant,
        link: `${NavigationPath.policies}?enabled=True&violations=violations`,
        icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
      },
      {
        title: t('No status'),
        count: pending + unknown,
        link: `${NavigationPath.policies}?enabled=True&violations=no-status`,
        icon: <UnknownIcon />,
      },
    ],
  }
}

export function getPolicyReport(policyReports: PolicyReport[], filteredClusters: Cluster[]) {
  let policyReportCriticalCount = 0
  let policyReportImportantCount = 0
  let policyReportModerateCount = 0
  let policyReportLowCount = 0
  let clustersWithIssuesCount = 0
  const policyReportsForFilteredClusters = policyReports.filter((policyReport: PolicyReport) =>
    filteredClusters.find((cluster: Cluster) => cluster.name === policyReport.scope?.name)
  )
  policyReportsForFilteredClusters.forEach((policyReport: PolicyReport) => {
    const insightsFilteredResults = policyReport.results.filter((result) => result.source === 'insights')
    if (insightsFilteredResults.length > 0) {
      clustersWithIssuesCount++
    }
    insightsFilteredResults.forEach((result: PolicyReportResults) => {
      switch (result.properties.total_risk) {
        case '4':
          policyReportCriticalCount++
          break
        case '3':
          policyReportImportantCount++
          break
        case '2':
          policyReportModerateCount++
          break
        case '1':
          policyReportLowCount++
          break
      }
    })
  })

  return {
    policyReportCriticalCount,
    policyReportImportantCount,
    policyReportModerateCount,
    policyReportLowCount,
    clustersWithIssuesCount,
  }
}

export function parseUpgradeRiskPredictions(upgradeRiskPredictions: any) {
  let criticalUpdateCount = 0
  let warningUpdateCount = 0
  let infoUpdateCount = 0
  let clustersWithRiskPredictors = 0

  if (upgradeRiskPredictions.length > 0) {
    upgradeRiskPredictions.forEach((cluster: any) => {
      if (
        cluster.upgrade_risks_predictors &&
        cluster.upgrade_risks_predictors.alerts &&
        cluster.upgrade_risks_predictors.alerts.length > 0
      ) {
        clustersWithRiskPredictors++
        cluster.upgrade_risks_predictors.alerts.forEach((alert: any) => {
          switch (alert.severity) {
            case 'critical':
              criticalUpdateCount++
              break
            case 'warning':
              warningUpdateCount++
              break
            case 'info':
              infoUpdateCount++
              break
          }
        })
      }
    })
  }

  return {
    criticalUpdateCount,
    warningUpdateCount,
    infoUpdateCount,
    clustersWithRiskPredictors,
  }
}

export function getClusterStatus(
  filteredClusters: Cluster[],
  labelSearchString: string | undefined,
  t: TFunction<string, undefined>
) {
  const ready = filteredClusters.filter((cluster) => cluster.status === 'ready').length
  const offline = filteredClusters.filter((cluster) => cluster.status !== 'ready').length

  return [
    {
      key: t('Offline'),
      value: offline,
      link: `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20ManagedClusterConditionAvailable%3A!True${
        labelSearchString ? `%20${labelSearchString}` : ''
      }"}`,
    },
    {
      key: t('Ready'),
      value: ready,
      isPrimary: true,
      link: `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20ManagedClusterConditionAvailable%3ATrue${
        labelSearchString ? `%20${labelSearchString}` : ''
      }"}`,
    },
  ]
}

export function getComplianceData(
  allClusters: Cluster[],
  filteredClusterNames: string[],
  policies: Policy[],
  t: TFunction<string, undefined>
) {
  const tempClusters: string[] =
    filteredClusterNames.length > 0 ? filteredClusterNames : allClusters.map((c) => c.name ?? '')
  const nonCompliantClusters = new Set<string>()
  policies.forEach((c: Policy) => {
    c?.status?.status?.forEach((i: { clustername: string; clusternamespace: string; compliant?: string }) => {
      if (filteredClusterNames.length === 0 || filteredClusterNames.includes(i.clustername)) {
        if (i.compliant === 'NonCompliant') {
          nonCompliantClusters.add(i.clustername)
        }
      }
    })
  })
  const compliantClusters = tempClusters.filter((c) => !nonCompliantClusters.has(c))
  return [
    {
      key: t('Violations'),
      value: nonCompliantClusters.size,
      link: `${NavigationPath.policies}?violations=violations`,
    },
    {
      key: t('No violations'),
      value: compliantClusters.length,
      isPrimary: true,
      link: `${NavigationPath.policies}?violations=no-violations&violations=no-status`,
    },
  ]
}

export function getAddonHealth(
  allAddons: {
    [id: string]: Addon[]
  },
  filteredClusterNames: string[],
  t: TFunction<string, undefined>
) {
  const addonData: Record<string, { count: number; clusters: string[] }> = {
    Degraded: { count: 0, clusters: [] },
    Unknown: { count: 0, clusters: [] },
    Progressing: { count: 0, clusters: [] },
    Available: { count: 0, clusters: [] },
  }
  filteredClusterNames.forEach((clusterName: string) => {
    allAddons[clusterName].forEach(({ status }) => {
      switch (status) {
        case AddonStatus.Available:
          addonData.Available.count = addonData.Available.count + 1
          addonData.Available.clusters.push(clusterName)
          break
        case AddonStatus.Degraded:
          addonData.Degraded.count = addonData.Degraded.count + 1
          addonData.Degraded.clusters.push(clusterName)
          break
        case AddonStatus.Progressing:
          addonData.Progressing.count = addonData.Progressing.count + 1
          addonData.Progressing.clusters.push(clusterName)
          break
        default:
          addonData.Unknown.count = addonData.Unknown.count + 1
          addonData.Unknown.clusters.push(clusterName)
          break
      }
    })
  })
  return [
    {
      key: t('Degraded'),
      value: addonData['Degraded'].count,
      link: `${NavigationPath.managedClusters}?addons=Degraded`,
    },
    {
      key: t('Progressing'),
      value: addonData['Progressing'].count,
      link: `${NavigationPath.managedClusters}?addons=Progressing`,
    },
    {
      key: t('Unknown'),
      value: addonData['Unknown'].count,
      link: `${NavigationPath.managedClusters}?addons=Unknown`,
    },
    {
      key: t('Available'),
      value: addonData['Available'].count,
      isPrimary: true,
      link: `${NavigationPath.managedClusters}?addons=Available`,
    },
  ]
}

export function parseAlertsMetric(
  alertsResult: PrometheusResponse | undefined,
  filteredClusterNames: string[],
  t: TFunction<string, undefined>
) {
  const clustersAffectedAlerts: string[] = []
  const alertSeverity: Record<
    string,
    {
      key: string
      label: string
      alerts: string[]
      icon?: JSX.Element
    }
  > = {
    critical: { key: 'critical', label: t('Critical'), alerts: [], icon: <CriticalRiskIcon /> },
    warning: { key: 'warning', label: t('Warning'), alerts: [], icon: <ImportantRiskIcon /> },
    info: { key: 'info', label: t('Info'), alerts: [], icon: undefined },
    other: { key: 'other', label: t('Other'), alerts: [], icon: undefined },
  }
  if (alertsResult?.data?.result) {
    const filteredAlerts =
      filteredClusterNames.length === 0
        ? alertsResult.data.result
        : alertsResult.data.result.filter((alert) => filteredClusterNames.includes(alert.metric.cluster))
    filteredAlerts.forEach((alert) => {
      const metric = alert.metric ?? {}
      if (metric.cluster && !clustersAffectedAlerts.includes(metric.cluster)) {
        clustersAffectedAlerts.push(metric.cluster)
      }
      if (metric.alertname && metric.alertstate === 'firing') {
        switch (metric.severity?.toLowerCase()) {
          case 'critical':
            alertSeverity.critical.alerts.push(metric.alertname)
            break
          case 'warning':
            alertSeverity.warning.alerts.push(metric.alertname)
            break
          case 'info':
            alertSeverity.info.alerts.push(metric.alertname)
            break
          default:
            alertSeverity.other.alerts.push(metric.alertname)
        }
      }
    })
  }
  return { clustersAffectedAlerts, alertSeverity }
}

export function parseOperatorMetric(operatorResult: PrometheusResponse | undefined, filteredClusterNames: string[]) {
  const clustersAffectedOperator: string[] = []
  const degraded: string[] = []
  const notAvailable: string[] = []
  const other: string[] = []

  if (operatorResult?.data?.result) {
    const filteredOperators =
      filteredClusterNames.length === 0
        ? operatorResult.data.result
        : operatorResult.data.result.filter((operator) => filteredClusterNames.includes(operator.metric.cluster))

    filteredOperators.forEach((operator) => {
      // Use condition mapping from CCX.
      // condition["type"] == "Available" and condition["status"] == "False" -> Not Available
      // condition["type"] == "Degraded" and condition["status"] == "True" -> Degraded
      // condition["type"] == "Progressing" and condition["status"] == "True" -> Other
      // condition["type"] == "Upgradeable" and condition["status"] == "False" -> Other
      // condition["type"] == "Failing" and condition["status"] == "True" -> Other
      if (operator.metric.condition === 'Degraded' && operator?.value?.[1] === '1') {
        // Only add cluster to affected array if operator meets condition
        if (operator.metric?.cluster && !clustersAffectedOperator.includes(operator.metric.cluster)) {
          clustersAffectedOperator.push(operator.metric.cluster)
        }
        degraded.push(operator.metric.name)
      } else if (operator.metric.condition === 'Available' && operator?.value?.[1] === '0') {
        if (operator.metric?.cluster && !clustersAffectedOperator.includes(operator.metric.cluster)) {
          clustersAffectedOperator.push(operator.metric.cluster)
        }
        notAvailable.push(operator.metric.name)
      } else if (
        (operator.metric.condition === 'Failing' && operator?.value?.[1] === '1') ||
        (operator.metric.condition === 'Progressing' && operator?.value?.[1] === '1') ||
        (operator.metric.condition === 'Upgradeable' && operator?.value?.[1] === '0')
      ) {
        if (operator.metric?.cluster && !clustersAffectedOperator.includes(operator.metric.cluster)) {
          clustersAffectedOperator.push(operator.metric.cluster)
        }
        other.push(operator.metric.name)
      }
    })
  }

  return {
    clustersAffectedOperator,
    degraded,
    notAvailable,
    other,
  }
}
