/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk'
import { TFunction } from 'react-i18next'

import { CubesIcon, DatabaseIcon, MapPinIcon } from '@patternfly/react-icons'
import { NavigationPath } from '../../../NavigationPath'
import {
  Addon,
  AddonStatus,
  Application,
  ApplicationSet,
  ArgoApplication,
  Cluster,
  ManagedClusterInfo,
  PlacementDecision,
  Policy,
  PolicyReport,
  PolicyReportResults,
  Subscription,
} from '../../../resources'
import { getClusterList } from '../../Applications/helpers/resource-helper'
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

export function getNodeCount(managedClusterInfos: ManagedClusterInfo[], filteredClusterNames: string[]) {
  let count = 0
  managedClusterInfos.forEach((managedClusterInfo: ManagedClusterInfo) => {
    if (
      filteredClusterNames.length === 0 ||
      (managedClusterInfo.metadata.name && filteredClusterNames.includes(managedClusterInfo.metadata.name))
    ) {
      count = count + (managedClusterInfo.status?.nodeList?.length ?? 0)
    }
  })
  return count
}

export function getAppCount(
  applications: Application[],
  applicationSets: ApplicationSet[],
  argoApps: ArgoApplication[],
  discoveredApps: ArgoApplication[],
  ocpAppResources: any[],
  filteredClusterNames: string[],
  argoApplications: ArgoApplication[],
  allClusters: Cluster[],
  placementDecisions: PlacementDecision[],
  subscriptions: Subscription[]
) {
  const apps = [...applications, ...applicationSets, ...argoApps, ...discoveredApps, ...ocpAppResources]
  // If no cluster labels are selected we default to the filteredClusterNames containing all cluster names
  if (allClusters.length > filteredClusterNames.length) {
    // filter apps by clusters from label selection.
    return apps.filter((app) => {
      const localCluster = allClusters.find((cls) => cls.name === 'local-cluster')
      const clusterList = getClusterList(
        app,
        argoApplications,
        placementDecisions,
        subscriptions,
        localCluster,
        allClusters
      )

      return filteredClusterNames.some((value) => {
        return clusterList.includes(value)
      })
    }).length
  }
  return apps.length
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
    insightsFilteredResults.length > 0 && clustersWithIssuesCount++
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

export function getClustersSummary(
  filteredClusters: Cluster[],
  filteredClusterNames: string[],
  managedClusterInfos: ManagedClusterInfo[],
  applicationCount: number,
  t: TFunction<string, undefined>
) {
  const kubernetesTypes = new Set()
  const regions = new Set()
  filteredClusters.forEach((curr: Cluster) => {
    kubernetesTypes.add(curr.labels?.vendor ?? 'Other')
    regions.add(curr.labels?.region ?? 'Other')
  })
  const nodeCount = getNodeCount(managedClusterInfos, filteredClusterNames)

  return [
    {
      id: 'total-clusters',
      title: t('Clusters'),
      icon: undefined,
      count: filteredClusterNames.length,
      link: NavigationPath.managedClusters, // *Clusters table does not have ability to filter by labels - could nav to search with the label filter
    },
    {
      id: 'apps-count',
      title: t('Applications'),
      icon: undefined,
      count: applicationCount,
      link: NavigationPath.applications, // *Apps table has cluster name filter - select the matches.
    },
    {
      id: 'kube-types',
      title: t('Kubernetes type'),
      icon: <DatabaseIcon />,
      count: kubernetesTypes.size,
      link: undefined, // No where to route for kube types
    },
    {
      id: 'cluster-regions',
      title: t('Region'),
      icon: <MapPinIcon />,
      count: regions.size,
      link: undefined, // No where to route for regions
    },
    {
      id: 'nodes-count',
      title: t('Nodes'),
      icon: <CubesIcon />,
      count: nodeCount,
      link: `${NavigationPath.search}?filters={"textsearch":"kind%3ANode"}`, // add cluster label filter
    },
  ]
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
      key: t('With violations'),
      value: nonCompliantClusters.size,
      link: `${NavigationPath.policies}?violations=with-violations`,
    },
    {
      key: t('Without violations'),
      value: compliantClusters.length,
      isPrimary: true,
      link: `${NavigationPath.policies}?violations=without-violations&violations=no-status`,
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
      switch (metric.severity?.toLowerCase()) {
        case 'critical':
          if (metric.alertstate === 'firing') {
            metric.alertname && alertSeverity.critical.alerts.push(metric.alertname)
          }
          break
        case 'warning':
          if (metric.alertstate === 'firing') {
            metric.alertname && alertSeverity.warning.alerts.push(metric.alertname)
          }
          break
        case 'info':
          if (metric.alertstate === 'firing') {
            metric.alertname && alertSeverity.info.alerts.push(metric.alertname)
          }
          break
        default:
          if (metric.alertstate === 'firing') {
            metric.alertname && alertSeverity.other.alerts.push(metric.alertname)
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
