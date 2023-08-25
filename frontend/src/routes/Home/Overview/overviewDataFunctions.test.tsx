/* Copyright Contributors to the Open Cluster Management project */
import i18next from 'i18next'
import { Cluster, ClusterStatus } from '../../../resources'
import { Provider } from '../../../ui-components'
import {
  getAddonHealth,
  getApplicationCount,
  getApplicationList,
  getAppSets,
  getClustersSummary,
  getClusterStatus,
  getComplianceData,
  getFilteredClusters,
  getNodeCount,
  getPolicyReport,
  parseAlertsMetric,
  parseOperatorMetric,
} from './overviewDataFunctions'
import {
  appSets,
  filteredOCPApps,
  managedClusterInfos,
  mockAlertMetrics,
  mockOperatorMetrics,
  parsedAddons,
  placementDecisions,
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

test('Correctly returns getNodeCount', () => {
  const result = getNodeCount(managedClusterInfos, filteredClusterNames)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getAppSets', () => {
  const result = getAppSets(appSets, placementDecisions, filteredClusterNames)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getApplicationList', () => {
  const result = getApplicationList([], [], clusterData, placementDecisions, [], filteredClusterNames)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getApplicationCount', () => {
  const result = getApplicationCount(filteredClusterNames, appSets, [], filteredOCPApps)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getPolicyReport', () => {
  const result = getPolicyReport(policyReports, clusterData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getClustersSummary', () => {
  const t = i18next.t.bind(i18next)
  const result = getClustersSummary(
    clusterData,
    filteredClusterNames,
    managedClusterInfos,
    [],
    appSets,
    filteredOCPApps,
    t
  )
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
