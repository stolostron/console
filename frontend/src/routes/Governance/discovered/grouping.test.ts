/* Copyright Contributors to the Open Cluster Management project */
import { Channel, HelmRelease, Subscription } from '../../../resources'
import { parseDiscoveredPolicies, resolveSource, getSourceText, parseStringMap } from '../common/util'
import { grouping } from './grouping'

const helmRelease: HelmRelease[] = [
  {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'HelmRelease',
    metadata: {
      name: 'helm',
      namespace: 'helmns',
      annotations: {
        'apps.open-cluster-management.io/hosting-subscription': 'myns/myname',
      },
    },
  },
]

const channels: Channel[] = [
  {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'Channel',
    metadata: {
      name: 'mychannel',
      namespace: 'mychannel-ns',
    },
    spec: {
      pathname: 'https://github.com/my/myrepo',
      type: 'Git',
    },
  },
  {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'Channel',
    metadata: {
      name: 'no-type',
      namespace: 'no-type-ns',
    },
    spec: {
      pathname: '',
      type: '',
    },
  },
]

const subscriptions: Subscription[] = [
  {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'Subscription',
    metadata: {
      name: 'mysub',
      namespace: 'mysub-ns',
    },
    spec: {
      channel: 'mychannel-ns/mychannel',
    },
  },
  {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'Subscription',
    metadata: {
      name: 'no-type-sub',
      namespace: 'no-type-sub-ns',
    },
    spec: {
      channel: 'no-type-ns/no-type',
    },
  },
]

const mockpolicy: any[] = [
  {
    _hubClusterResource: true,
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed1',
    created: '2024-08-15T14:01:52Z',
    kind: 'ConfigurationPolicy',
    kind_plural: 'configurationpolicies',
    label: '',
    name: 'check-policy-reports',
    namespace: 'managed1',
    compliant: 'NonCompliant',
    remediationAction: 'enforce',
    // remediationAction is empty. The default is inform
    severity: 'low',
    disabled: 'false',
    _isExternal: 'true',
    annotation: 'apps.open-cluster-management.io/hosting-subscription=mysub-ns/mysub; cluster-namespace=local-cluster',
  },
  {
    _hubClusterResource: true,
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed2',
    created: '2024-08-15T14:01:52Z',
    kind: 'ConfigurationPolicy',
    kind_plural: 'configurationpolicies',
    label: '',
    name: 'check-policy-reports',
    namespace: 'managed2',
    compliant: 'Compliant',
    remediationAction: 'enforce',
    severity: 'critical',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind; cluster-namespace=managed2',
  },
  {
    _hubClusterResource: 'true',
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed2',
    created: '2024-08-15T14:01:52Z',
    kind: 'CertificatePolicy',
    kind_plural: 'certificationpolicies',
    label: 'cluster-name=local-cluster; cluster-namespace=local-cluster',
    name: 'check-policy-reports',
    namespace: 'managed2',
    compliant: 'NonCompliant',
    remediationAction: 'enforce',
    severity: '',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=no-type-sub-ns/no-type-sub; cluster-namespace=managed2',
  },
  {
    _hubClusterResource: true,
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed3',
    created: '2024-08-15T14:01:52Z',
    kind: 'ConfigurationPolicy',
    kind_plural: 'configurationpolicies',
    label:
      'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=default.config-policy',
    name: 'check-policy-reports',
    namespace: 'managed2',
    compliant: 'NonCompliant',
    remediationAction: 'enforce',
    severity: 'high',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=no-type-sub-ns/no-type-sub; cluster-namespace=managed3',
  },
  {
    _hubClusterResource: 'true',
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed3',
    created: '2024-08-15T14:01:52Z',
    kind: 'CertificatePolicy',
    kind_plural: 'certificationpolicies',
    label: 'cluster-name=local-cluster; cluster-namespace=local-cluster',
    name: 'check-policy-reports',
    namespace: 'managed2',
    compliant: 'NonCompliant',
    remediationAction: 'enforce',
    severity: '',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=no-type-sub-ns/no-type-sub; cluster-namespace=managed3',
  },
  {
    _hubClusterResource: 'true',
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed3',
    created: '2024-08-15T14:01:52Z',
    kind: 'OperatorPolicy',
    kind_plural: 'operatorpolicies',
    label:
      'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=default.op-1-policy',
    name: 'op-policy',
    namespace: 'managed3',
    compliant: 'Compliant',
    remediationAction: 'enforce',
    severity: 'low',
    deploymentAvailable: 'false',
    upgradeAvailable: 'false',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=no-type-sub-ns/no-type-sub; cluster-namespace=managed3',
  },
  {
    _hubClusterResource: 'true',
    _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'managed2',
    created: '2024-08-15T14:01:52Z',
    kind: 'OperatorPolicy',
    kind_plural: 'operatorpolicies',
    label:
      'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=default.op-2-policy',
    name: 'op-policy',
    namespace: 'managed2',
    compliant: 'Compliant',
    deploymentAvailable: 'true',
    upgradeAvailable: 'false',
    remediationAction: 'enforce',
    severity: '',
    disabled: 'false',
    _isExternal: 'true',
    annotation:
      'apps.open-cluster-management.io/hosting-subscription=no-type-sub-ns/no-type-sub; cluster-namespace=managed2',
  },
]
describe('grouping function test', () => {
  const getPolicySource = grouping().getPolicySource
  test.each([
    ['expect Git', mockpolicy[0], 'Git'],
    ['Managed externally', mockpolicy[1], 'Managed externally'],
    ['External', mockpolicy[2], 'External'],
    ['Policy with namespace and name', mockpolicy[3], 'Policy'],
  ])('%s', (_name, policy, expected) => {
    expect(
      getPolicySource(policy, helmRelease, channels, subscriptions, resolveSource, getSourceText, parseStringMap).type
    ).toEqual(expected)
  })
})

describe('OnMessage test', () => {
  const createMessage = grouping().createMessage

  test('OnMessage should create result properly', () => {
    const result = createMessage(
      mockpolicy,
      helmRelease,
      channels,
      subscriptions,
      resolveSource.toString(),
      getSourceText.toString(),
      parseStringMap.toString(),
      parseDiscoveredPolicies.toString()
    )
    // All policies name are same
    expect(result).toEqual([
      {
        id: 'check-policy-reportsConfigurationPolicypolicy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'ConfigurationPolicy',
        severity: 'critical',
        responseAction: 'enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mockpolicy[0]),
            remediationAction: 'enforce',
            source: { type: 'Git', parentNs: '', parentName: '' },
          },
          {
            ...parseDiscoveredPolicies(mockpolicy[1]),
            source: { type: 'Managed externally', parentNs: '', parentName: '' },
          },
          {
            ...parseDiscoveredPolicies(mockpolicy[3]),
            source: { type: 'Policy', parentNs: 'default', parentName: 'config-policy' },
          },
        ],
        source: { type: 'Multiple', parentNs: '', parentName: '' },
      },
      {
        id: 'check-policy-reportsCertificatePolicypolicy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'CertificatePolicy',
        severity: 'unknown',
        responseAction: 'enforce',
        policies: [
          { ...parseDiscoveredPolicies(mockpolicy[2]), source: { type: 'External', parentNs: '', parentName: '' } },
          { ...parseDiscoveredPolicies(mockpolicy[4]), source: { type: 'External', parentNs: '', parentName: '' } },
        ],
        source: { type: 'External', parentNs: '', parentName: '' },
      },
      {
        id: 'op-policyOperatorPolicypolicy.open-cluster-management.io',
        name: 'op-policy',
        kind: 'OperatorPolicy',
        // One policy omit the severity so the highest severity is high
        severity: 'low',
        responseAction: 'enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mockpolicy[5]),
            source: { type: 'Policy', parentNs: 'default', parentName: 'op-1-policy' },
          },
          {
            ...parseDiscoveredPolicies(mockpolicy[6]),
            source: { type: 'Policy', parentNs: 'default', parentName: 'op-2-policy' },
          },
        ],
        // All policies has source.type = Policy however parentName are different so type should be `Multiple`
        source: { type: 'Multiple', parentNs: '', parentName: '' },
      },
    ])
  })
})
