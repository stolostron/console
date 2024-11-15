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
      [],
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
        _ownedBy: 'Gatekeeper',
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
      [],
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

  test('Should create totalViolations for kyverno policies', () => {
    const mock = [
      {
        _hubClusterResource: 'true',
        _isExternal: 'false',
        _uid: 'local-cluster/870749cb-c62c-4e8c-85dc-045b57a34003',
        admission: 'true',
        apigroup: 'kyverno.io',
        apiversion: 'v1',
        background: 'true',
        cluster: 'local-cluster',
        created: '2024-10-25T15:45:04Z',
        kind: 'ClusterPolicy',
        kind_plural: 'clusterpolicies',
        name: 'require-owner-labels',
        severity: 'medium',
        validationFailureAction: 'Audit',
      },
      {
        _hubClusterResource: 'true',
        _isExternal: 'false',
        _uid: 'local-cluster/bec88a87-f52b-419b-b7ee-b1945c8210ec',
        admission: 'true',
        apigroup: 'kyverno.io',
        apiversion: 'v1',
        background: 'true',
        cluster: 'local-cluster',
        created: '2024-10-25T15:46:46Z',
        kind: 'Policy',
        kind_plural: 'policies',
        name: 'require-team-label',
        namespace: 'open-cluster-management-agent-addon',
        severity: 'critical',
        validationFailureAction: 'Audit',
      },
      {
        _hubClusterResource: 'true',
        _isExternal: 'false',
        _uid: 'local-cluster/bec88a87-f52b-419b-b7ee-b1945c8210ec',
        admission: 'true',
        apigroup: 'kyverno.io',
        apiversion: 'v1',
        background: 'true',
        cluster: 'local-cluster',
        created: '2024-10-25T15:46:46Z',
        kind: 'Policy',
        kind_plural: 'policies',
        name: 'require-team-label',
        namespace: 'open-cluster-management-agent-addon',
        severity: 'critical',
        validationFailureAction: 'Enforce',
      },
    ]

    const relatedMock: any[] = [
      {
        HubAcceptedManagedCluster: 'True',
        ManagedClusterConditionAvailable: 'True',
        ManagedClusterConditionClockSynced: 'True',
        ManagedClusterImportSucceeded: 'True',
        ManagedClusterJoined: 'True',
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/13667d87-7c1b-4117-9688-e4baa987e6d0'],
        _uid: 'cluster__local-cluster',
        addon:
          'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
        apiEndpoint: 'https://api.policy-grc-cp-autoclaims-b5kmf.dev08.red-chesterfield.com:6443',
        apigroup: 'internal.open-cluster-management.io',
        cluster: 'local-cluster',
        consoleURL: 'https://console-openshift-console.apps.policy-grc-cp-autoclaims-b5kmf.dev08.red-chesterfield.com',
        cpu: '24',
        created: '2024-10-30T11:54:28Z',
        kind: 'Cluster',
        kind_plural: 'managedclusterinfos',
        kubernetesVersion: 'v1.30.4',
        label:
          'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=4255e0f3-77e7-4c61-a9a2-8104621e8d49; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.17.0; openshiftVersion-major=4; openshiftVersion-major-minor=4.17; velero.io/exclude-from-backup=true; vendor=OpenShift',
        memory: '96479688Ki',
        name: 'local-cluster',
        nodes: '3',
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/bec88a87-f52b-419b-b7ee-b1945c8210ec'],
        _uid: 'local-cluster/5cba3d93-094b-45fa-85d5-4269dd36b5d6',
        apigroup: 'wgpolicyk8s.io',
        apiversion: 'v1beta1',
        category: '',
        cluster: 'local-cluster',
        created: '2024-10-25T18:02:25Z',
        critical: '0',
        important: '0',
        kind: 'PolicyReport',
        kind_plural: 'policyreports',
        label: 'app.kubernetes.io/managed-by=kyverno',
        low: '0',
        moderate: '0',
        name: 'b121ec75-0839-4dac-965f-a73d26390058',
        namespace: 'open-cluster-management-agent-addon',
        numRuleViolations: '1',
        _policyViolationCounts: 'open-cluster-management-agent-addon/require-team-label=3',
        rules: 'open-cluster-management-agent-addon/require-team-label',
        scope: 'hypershift-install-job-xkhl9',
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/bec88a87-f52b-419b-b7ee-b1945c8210ec'],
        _uid: 'local-cluster/dd0cafab-a64a-4c45-b3b8-3d74f4e87355',
        apigroup: 'wgpolicyk8s.io',
        apiversion: 'v1beta1',
        category: '',
        cluster: 'local-cluster',
        created: '2024-10-25T18:02:25Z',
        critical: '0',
        important: '0',
        kind: 'PolicyReport',
        kind_plural: 'policyreports',
        label: 'app.kubernetes.io/managed-by=kyverno',
        low: '0',
        moderate: '0',
        name: 'd54dc7d8-7f9d-48da-bc3e-1db14cb83bea',
        namespace: 'open-cluster-management-agent-addon',
        numRuleViolations: '1',
        _policyViolationCounts: 'open-cluster-management-agent-addon/require-team-label=1',
        rules: 'open-cluster-management-agent-addon/require-team-label',
        scope: 'hypershift-install-job-xkhl9-cdlwq',
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/870749cb-c62c-4e8c-85dc-045b57a34003'],
        _uid: 'local-cluster/105e2879-02a3-4b08-99be-5493b272e9cd',
        apigroup: 'wgpolicyk8s.io',
        apiversion: 'v1beta1',
        category: '',
        cluster: 'local-cluster',
        created: '2024-10-25T15:45:25Z',
        critical: '0',
        important: '0',
        kind: 'PolicyReport',
        kind_plural: 'policyreports',
        label: 'app.kubernetes.io/managed-by=kyverno',
        low: '0',
        moderate: '0',
        name: '49ebe36b-2115-40fc-a757-c2e38faa4188',
        namespace: 'open-cluster-management',
        numRuleViolations: '1',
        _policyViolationCounts: 'require-owner-labels=1',
        rules: 'require-owner-labels',
        scope: 'mch-image-manifest-2.12.0',
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/870749cb-c62c-4e8c-85dc-045b57a34003'],
        _uid: 'local-cluster/a5b863c1-5613-4c9d-8690-e64e8b97a9a6',
        apigroup: 'wgpolicyk8s.io',
        apiversion: 'v1beta1',
        category: '',
        cluster: 'local-cluster',
        created: '2024-10-25T15:45:22Z',
        critical: '0',
        important: '0',
        kind: 'PolicyReport',
        kind_plural: 'policyreports',
        label: 'app.kubernetes.io/managed-by=kyverno',
        low: '0',
        moderate: '0',
        name: '04bf66b5-2203-4539-b4c0-4de56fc32e45',
        namespace: 'openshift-etcd',
        numRuleViolations: '1',
        _policyViolationCounts: 'require-owner-labels=1',
        rules: 'require-owner-labels',
        scope: 'revision-status-8',
      },
    ]
    const result = createMessage(
      mock,
      relatedMock,
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
        id: 'require-owner-labelsClusterPolicykyverno.io',
        apigroup: 'kyverno.io',
        name: 'require-owner-labels',
        kind: 'ClusterPolicy',
        severity: 'medium',
        responseAction: 'Audit',
        policies: [
          {
            ...parseDiscoveredPolicies(mock[0]),
            severity: 'medium',
            responseAction: 'Audit',
            source: { type: 'Local', parentNs: '', parentName: '' },
            totalViolations: 2,
          },
        ],
        source: { type: 'Local', parentNs: '', parentName: '' },
      },
      {
        id: 'require-team-labelPolicykyverno.io',
        apigroup: 'kyverno.io',
        name: 'require-team-label',
        kind: 'Policy',
        severity: 'critical',
        responseAction: 'Audit/Enforce',
        policies: [
          {
            ...parseDiscoveredPolicies(mock[1]),
            severity: 'critical',
            responseAction: 'Audit',
            source: { type: 'Local', parentNs: '', parentName: '' },
            totalViolations: 4,
          },
          {
            ...parseDiscoveredPolicies(mock[2]),
            severity: 'critical',
            responseAction: 'Enforce',
            source: { type: 'Local', parentNs: '', parentName: '' },
            totalViolations: 4,
          },
        ],
        source: { type: 'Local', parentNs: '', parentName: '' },
      },
    ])
  })

  test('Should create multiple _policyViolationCounts for kyverno policies', () => {
    const mock = [
      {
        _hubClusterResource: 'true',
        _isExternal: 'false',
        _uid: 'local-cluster/801ecf12-8a5b-4c82-8e6a-2a7ee16b4619',
        admission: 'true',
        apigroup: 'kyverno.io',
        apiversion: 'v1',
        background: 'true',
        cluster: 'local-cluster',
        created: '2024-11-07T14:57:49Z',
        kind: 'Policy',
        kind_plural: 'policies',
        name: 'require-team-label',
        namespace: 'open-cluster-management-agent-addon',
        severity: 'critical',
        validationFailureAction: 'Audit',
      },
    ]

    const relatedMock: any[] = [
      {
        _hubClusterResource: 'true',
        _policyViolationCounts: 'open-cluster-management-agent-addon/require-team-label=1; require-owner-labels=1',
        _relatedUids: ['local-cluster/801ecf12-8a5b-4c82-8e6a-2a7ee16b4619'],
        _uid: 'local-cluster/36f465ae-51e1-4d4a-890c-5aed38fa4d34',
        apigroup: 'wgpolicyk8s.io',
        apiversion: 'v1beta1',
        category: '',
        cluster: 'local-cluster',
        created: '2024-11-07T15:10:00Z',
        critical: '0',
        important: '0',
        kind: 'PolicyReport',
        kind_plural: 'policyreports',
        label: 'app.kubernetes.io/managed-by=kyverno',
        low: '0',
        moderate: '0',
        name: '801ecf12-8a5b-4c82-8e6a-2a7ee16b4619',
        namespace: 'open-cluster-management-agent-addon',
        numRuleViolations: '2',
        rules: 'open-cluster-management-agent-addon/require-team-label; require-owner-labels',
        scope: 'require-team-label',
      },
    ]
    const result = createMessage(
      mock,
      relatedMock,
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
        apigroup: 'kyverno.io',
        id: 'require-team-labelPolicykyverno.io',
        kind: 'Policy',
        name: 'require-team-label',
        policies: [
          {
            _hubClusterResource: true,
            _isExternal: false,
            _uid: 'local-cluster/801ecf12-8a5b-4c82-8e6a-2a7ee16b4619',
            admission: 'true',
            apigroup: 'kyverno.io',
            apiversion: 'v1',
            background: 'true',
            cluster: 'local-cluster',
            created: '2024-11-07T14:57:49Z',
            kind: 'Policy',
            kind_plural: 'policies',
            name: 'require-team-label',
            namespace: 'open-cluster-management-agent-addon',
            responseAction: 'Audit',
            severity: 'critical',
            source: {
              parentName: '',
              parentNs: '',
              type: 'Local',
            },
            totalViolations: 1,
            validationFailureAction: 'Audit',
          },
        ],
        responseAction: 'Audit',
        severity: 'critical',
        source: {
          parentName: '',
          parentNs: '',
          type: 'Local',
        },
      },
    ])
  })
})
