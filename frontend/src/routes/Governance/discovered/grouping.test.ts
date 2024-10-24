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

const mockSearchResults: any[] = [
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
    remediationAction: 'inform',
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
  {
    _hubClusterResource: 'true',
    _isExternal: 'false',
    _uid: 'local-cluster/4cf14a3f-0802-40b8-bf6f-87462d17e9f0',
    annotation: 'policy.open-cluster-management.io/severity=critical; test=value',
    apigroup: 'constraints.gatekeeper.sh',
    apiversion: 'v1beta1',
    cluster: 'local-cluster',
    created: '2024-09-12T18:51:09Z',
    enforcementAction: 'dryrun',
    kind: 'K8sRequiredLabels',
    kind_plural: 'k8srequiredlabels',
    name: 'ns-must-have-gk',
    totalViolations: '85',
  },
  {
    _hubClusterResource: 'true',
    _isExternal: 'false',
    _uid: 'local-cluster/4cf14a3f-0802-40b8-bf6f-87462d17e9f0',
    annotation: 'policy.open-cluster-management.io/severity=high; test=value',
    apigroup: 'constraints.gatekeeper.sh',
    apiversion: 'v1beta1',
    cluster: 'cluster1',
    created: '2024-09-12T18:51:09Z',
    kind: 'K8sRequiredLabels',
    kind_plural: 'k8srequiredlabels',
    name: 'ns-must-have-gk',
    totalViolations: '32',
  },
]
describe('grouping function test', () => {
  const getPolicySource = grouping().getPolicySource
  test.each([
    ['expect Git', mockSearchResults[0], 'Git'],
    ['Managed externally', mockSearchResults[1], 'Managed externally'],
    ['External', mockSearchResults[2], 'External'],
    ['Policy with namespace and name', mockSearchResults[3], 'Policy'],
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
      mockSearchResults,
      helmRelease,
      channels,
      subscriptions,
      resolveSource.toString(),
      getSourceText.toString(),
      parseStringMap.toString(),
      parseDiscoveredPolicies.toString()
    )
    expect(result).toEqual([
      {
        id: 'check-policy-reportsConfigurationPolicypolicy.open-cluster-management.io',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'ConfigurationPolicy',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mockSearchResults[0]),
            responseAction: 'inform',
            source: { type: 'Git', parentNs: '', parentName: '' },
          },
          {
            ...parseDiscoveredPolicies(mockSearchResults[1]),
            responseAction: 'enforce',
            source: { type: 'Managed externally', parentNs: '', parentName: '' },
          },
          {
            ...parseDiscoveredPolicies(mockSearchResults[3]),
            responseAction: 'enforce',
            source: { type: 'Policy', parentNs: 'default', parentName: 'config-policy' },
          },
        ],
        source: { type: 'Multiple', parentNs: '', parentName: '' },
      },
      {
        id: 'check-policy-reportsCertificatePolicypolicy.open-cluster-management.io',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'CertificatePolicy',
        severity: 'unknown',
        responseAction: 'enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mockSearchResults[2]),
            source: { type: 'External', parentNs: '', parentName: '' },
            responseAction: 'enforce',
          },
          {
            ...parseDiscoveredPolicies(mockSearchResults[4]),
            source: { type: 'External', parentNs: '', parentName: '' },
            responseAction: 'enforce',
          },
        ],
        source: { type: 'External', parentNs: '', parentName: '' },
      },
      {
        id: 'op-policyOperatorPolicypolicy.open-cluster-management.io',
        apigroup: 'policy.open-cluster-management.io',
        name: 'op-policy',
        kind: 'OperatorPolicy',
        // One policy omit the severity so the highest severity is high
        severity: 'low',
        responseAction: 'enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mockSearchResults[5]),
            responseAction: 'enforce',
            source: { type: 'Policy', parentNs: 'default', parentName: 'op-1-policy' },
          },
          {
            ...parseDiscoveredPolicies(mockSearchResults[6]),
            responseAction: 'enforce',
            source: { type: 'Policy', parentNs: 'default', parentName: 'op-2-policy' },
          },
        ],
        // All policies has source.type = Policy however parentName are different so type should be `Multiple`
        source: { type: 'Multiple', parentNs: '', parentName: '' },
      },
      {
        apigroup: 'constraints.gatekeeper.sh',
        id: 'ns-must-have-gkK8sRequiredLabelsconstraints.gatekeeper.sh',
        kind: 'K8sRequiredLabels',
        name: 'ns-must-have-gk',
        policies: [
          {
            ...parseDiscoveredPolicies(mockSearchResults[7]),
            responseAction: 'dryrun',
            severity: 'critical',
            source: {
              parentName: '',
              parentNs: '',
              type: 'Local',
            },
          },
          {
            ...parseDiscoveredPolicies(mockSearchResults[8]),
            responseAction: 'deny',
            severity: 'high',
            source: {
              parentName: '',
              parentNs: '',
              type: 'Local',
            },
          },
        ],
        responseAction: 'deny/dryrun',
        severity: 'critical',
        source: {
          parentName: '',
          parentNs: '',
          type: 'Local',
        },
      },
    ])
  })

  test('OnMessage with empty search results', () => {
    const result = createMessage(
      [],
      helmRelease,
      channels,
      subscriptions,
      resolveSource.toString(),
      getSourceText.toString(),
      parseStringMap.toString(),
      parseDiscoveredPolicies.toString()
    )
    expect(result).toEqual([])
  })

  test('Should filter out ValidatingAdmissionPolicyBinding created by Gatekeeper constraints', () => {
    const mock = [
      {
        _hubClusterResource: 'true',
        _ownedByGatekeeper: 'false',
        _uid: 'local-cluster/0',
        apigroup: 'admissionregistration.k8s.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-10-22T11:13:54Z',
        kind: 'ValidatingAdmissionPolicyBinding',
        kind_plural: 'validatingadmissionpolicybindings',
        name: 'machine-configuration-guards-binding',
        policyName: 'machine-configuration-guards',
        validationActions: 'warn; audit',
      },
      {
        _hubClusterResource: 'true',
        _ownedByGatekeeper: 'true',
        _uid: 'local-cluster/1',
        apigroup: 'admissionregistration.k8s.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-10-22T11:13:54Z',
        kind: 'ValidatingAdmissionPolicyBinding',
        kind_plural: 'validatingadmissionpolicybindings',
        name: 'owner-gatekeeper',
        policyName: 'machine-configuration-guards',
        validationActions: 'deny; audit',
      },
      {
        _hubClusterResource: 'true',
        _ownedByGatekeeper: 'false',
        _uid: 'local-cluster/0',
        apigroup: 'admissionregistration.k8s.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-10-22T11:13:54Z',
        kind: 'ValidatingAdmissionPolicyBinding',
        kind_plural: 'validatingadmissionpolicybindings',
        name: 'machine-configuration-guards-binding',
        policyName: 'machine-configuration-guards',
        validationActions: 'deny; audit',
      },
    ]
    const result = createMessage(
      mock,
      helmRelease,
      channels,
      subscriptions,
      resolveSource.toString(),
      getSourceText.toString(),
      parseStringMap.toString(),
      parseDiscoveredPolicies.toString()
    )
    expect(result).toEqual([
      {
        id: 'machine-configuration-guards-bindingValidatingAdmissionPolicyBindingadmissionregistration.k8s.io',
        apigroup: 'admissionregistration.k8s.io',
        name: 'machine-configuration-guards-binding',
        kind: 'ValidatingAdmissionPolicyBinding',
        severity: 'unknown',
        responseAction: 'audit/deny/warn',
        policies: [
          {
            ...parseDiscoveredPolicies(mock[0]),
            severity: '',
            responseAction: 'audit/warn',
            source: { type: 'Local', parentNs: '', parentName: '' },
          },
          {
            ...parseDiscoveredPolicies(mock[2]),
            severity: '',
            responseAction: 'audit/deny',
            source: { type: 'Local', parentNs: '', parentName: '' },
          },
        ],
        source: { type: 'Local', parentNs: '', parentName: '' },
      },
    ])
  })
})
