/* Copyright Contributors to the Open Cluster Management project */
import i18next from 'i18next'
import { Cluster, ClusterStatus } from '../../../resources'
import { Provider } from '../../../ui-components'
import { mockRequestedCounts } from '../../Applications/Application.sharedmocks'
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
import {
  mockAlertMetrics,
  mockOperatorMetrics,
  mockWorkerCoreCountMetrics,
  parsedAddons,
  policies,
  policyReports,
} from './sharedmocks'

const filteredClusterNames: string[] = ['managed', 'local-cluster']
const clusterData: Cluster[] = [
  {
    name: 'managed-1',
    displayName: 'managed-1',
    namespace: 'managed-1',
    uid: 'd75e89bc-29d7-45ca-b057-bb84dc095200',
    status: ClusterStatus.unknown,
    statusMessage: 'Registration agent stopped updating its lease.',
    provider: Provider.aws,
    labels: {
      cloud: 'Amazon',
      'cluster.open-cluster-management.io/clusterset': 'default',
      env: 'dev',
      name: 'managed-1',
      openshiftVersion: '4.13.4',
      'openshiftVersion-major': '4',
      'openshiftVersion-major-minor': '4.13',
      vendor: 'OpenShift',
    },
    nodes: { nodeList: [], ready: 0, unhealthy: 0, unknown: 0 },
    isHive: false,
    isHypershift: false,
    isManaged: true,
    isCurator: false,
    hasAutomationTemplate: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    hive: { isHibernatable: false, secrets: {} },
    clusterSet: 'default',
    owner: {},
  },
  {
    name: 'local-cluster',
    displayName: 'local-cluster',
    namespace: 'local-cluster',
    uid: 'a23a4032-0ba7-42fd-9439-f7b7667c9f77',
    status: ClusterStatus.ready,
    provider: Provider.aws,
    distribution: {
      isManagedOpenShift: false,
      displayVersion: 'OpenShift 4.15.19',
    },
    labels: {
      cloud: 'Amazon',
      'cluster.open-cluster-management.io/clusterset': 'default',
      'local-cluster': 'true',
      name: 'local-cluster',
      openshiftVersion: '4.13.4',
      'openshiftVersion-major': '4',
      'openshiftVersion-major-minor': '4.13',
      'velero.io/exclude-from-backup': 'true',
      vendor: 'OpenShift',
      clusterID: 'local-cluster',
    },
    nodes: {
      nodeList: [
        {
          capacity: { cpu: '16', memory: '64453824Ki' },
          conditions: [{ status: 'True', type: 'Ready' }],
          labels: {
            'beta.kubernetes.io/instance-type': 'm6a.4xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-1',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
            'node-role.kubernetes.io/control-plane': '',
            'node-role.kubernetes.io/master': '',
            'node-role.kubernetes.io/worker': '',
            'node.kubernetes.io/instance-type': 'm6a.4xlarge',
          },
          name: 'ip-10-0-140-19.ec2.internal',
        },
      ],
      ready: 1,
      unhealthy: 0,
      unknown: 0,
    },
    kubeApiServer: 'https://api.sno-4xlarge-413-j4tls.dev07.red-chesterfield.com:6443',
    consoleURL: 'https://console-openshift-console.apps.sno-4xlarge-413-j4tls.dev07.red-chesterfield.com',
    isHive: false,
    isHypershift: false,
    isManaged: true,
    isCurator: false,
    hasAutomationTemplate: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    hive: { isHibernatable: false, secrets: {} },
    clusterSet: 'default',
    owner: {},
    creationTimestamp: '2023-07-24T13:00:53Z',
  },
]

test('Correctly returns getFilteredClusters', () => {
  const result = getFilteredClusters(clusterData, { env: ['dev'] })
  expect(result).toMatchSnapshot()
})

test('Correctly returns getClusterProviderSummary', () => {
  const result = getClusterProviderSummary(clusterData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getClusterVersionSummary', () => {
  const result = getClusterVersionSummary(clusterData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getAppTypeSummary', () => {
  const t = i18next.t.bind(i18next)
  const result = getAppTypeSummary(mockRequestedCounts, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getPolicySummary', () => {
  const t = i18next.t.bind(i18next)
  const result = getPolicySummary(policies, filteredClusterNames, 2, t)
  expect(result).toMatchSnapshot()
})
test('Correctly returns getPolicySummary with filtered clusters', () => {
  const t = i18next.t.bind(i18next)
  const result = getPolicySummary(policies, [filteredClusterNames[1]], 2, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getNodeSummary', () => {
  const t = i18next.t.bind(i18next)
  const result = getNodeSummary(clusterData, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getWorkerCoreTotal', () => {
  const result = getWorkerCoreTotal(mockWorkerCoreCountMetrics, clusterData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getPolicyReport', () => {
  const result = getPolicyReport(policyReports, clusterData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns parseUpgradeRiskPredictions with no predictions', () => {
  const result = parseUpgradeRiskPredictions([])
  expect(result).toMatchSnapshot()
})

test('Correctly returns parseUpgradeRiskPredictions with predictions', () => {
  const result = parseUpgradeRiskPredictions([
    {
      cluster_id: 'test-cluster-id-1',
      prediction_status: 'ok',
      upgrade_recommended: true,
      upgrade_risks_predictors: {
        alerts: [],
        operator_conditions: [],
      },
      last_checked_at: '2024-03-27T14:00:19.137279+00:00',
    },
    {
      cluster_id: 'test-cluster-id-2',
      upgrade_recommended: false,
      upgrade_risks_predictors: {
        alerts: [
          {
            name: 'ClusterOperatorDown',
            namespace: 'openshift-cluster-version',
            severity: 'critical',
            url: 'https://console-openshift-console.com/testing',
          },
          {
            name: 'NodeClockNotSynchronising',
            namespace: 'openshift-monitoring',
            severity: 'warning',
            url: 'https://console-openshift-console.com/testing',
          },
        ],
        operator_conditions: [],
      },
      last_checked_at: '2024-03-27T14:00:19.137279+00:00',
    },
    {
      cluster_id: 'test-cluster-id-3',
      prediction_status: 'No data for the cluster',
    },
    {
      cluster_id: 'test-cluster-id-4',
      upgrade_recommended: false,
      upgrade_risks_predictors: {
        alerts: [
          {
            name: 'ClusterOperatorDown',
            namespace: 'openshift-cluster-version',
            severity: 'info',
            url: 'https://console-openshift-console.com/testing',
          },
        ],
        operator_conditions: [],
      },
      last_checked_at: '2024-03-27T14:00:19.137279+00:00',
    },
  ])
  expect(result).toMatchSnapshot()
})

test('Correctly returns getClusterStatus', () => {
  const t = i18next.t.bind(i18next)
  const result = getClusterStatus(clusterData, 'label%3Acloud%3DAmazon', t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getComplianceData', () => {
  const t = i18next.t.bind(i18next)
  const result = getComplianceData(clusterData, filteredClusterNames, policies, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getAddonHealth', () => {
  const t = i18next.t.bind(i18next)
  const result = getAddonHealth(parsedAddons, filteredClusterNames, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns parseAlertsMetric', () => {
  const t = i18next.t.bind(i18next)
  const result = parseAlertsMetric(mockAlertMetrics, [], t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns parseOperatorMetric', () => {
  const result = parseOperatorMetric(mockOperatorMetrics, [])
  expect(result).toMatchSnapshot()
})
