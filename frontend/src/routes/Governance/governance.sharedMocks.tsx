/* Copyright Contributors to the Open Cluster Management project */

import {
  Policy,
  PolicyApiVersion,
  PolicyKind,
  PolicySet,
  Secret,
  SecretApiVersion,
  SecretKind,
  AnsibleTowerJobTemplateList,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
  SubscriptionOperator,
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  AnsibleJob,
  PolicyAutomation,
  Placement,
  PlacementBinding,
  PlacementDecision,
  PlacementRule,
  NamespaceApiVersion,
  NamespaceKind,
  Namespace,
  ManagedCluster,
  ManagedClusterSet,
  ManagedClusterSetApiVersion,
  ManagedClusterSetKind,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBinding,
  ManagedClusterSetBindingKind,
} from '../../resources'
import { Provider } from '../../ui-components/AcmProvider'

export const mockNamespaces: Namespace[] = [
  {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test' },
  },
]

export const mockLocalCluster: ManagedCluster = {
  apiVersion: 'cluster.open-cluster-management.io/v1',
  kind: 'ManagedCluster',
  metadata: {
    labels: {
      cloud: 'Amazon',
      name: 'local-cluster',
      openshiftVersion: '4.9.7',
      vendor: 'OpenShift',
    },
    name: 'local-cluster',
  },
}

export const mockClusterSet: ManagedClusterSet = {
  apiVersion: ManagedClusterSetApiVersion,
  kind: ManagedClusterSetKind,
  metadata: {
    name: 'cluster-set-01',
    namespace: 'argo-server-1',
  },
  spec: {
    clusterSet: 'cluster-set-01',
  },
}

export const mockClusterSetBinding: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    name: 'cluster-set-binding-01',
    namespace: 'argo-server-1',
  },
  spec: {
    clusterSet: 'cluster-set-01',
  },
}

// ******
// POLICY
// ******

const rootPolicy: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'policy-set-with-1-placement-policy',
    namespace: 'test',
    uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Compliant',
    placement: [
      {
        placement: 'policy-set-with-1-placement',
        placementBinding: 'policy-set-with-1-placement',
        policySet: 'policy-set-with-1-placement',
      },
    ],
    status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Compliant' }],
  },
}

const policy0: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'test.policy-set-with-1-placement-policy',
    namespace: 'local-cluster',
    labels: {
      'policy.open-cluster-management.io/cluster-name': 'local-cluster',
      'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
      'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-policy',
    },
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Compliant',
    details: [
      {
        compliant: 'Compliant',
        history: [
          {
            eventName: 'test.policy-set-with-1-placement-policy.16d459c516462fbf',
            lastTimestamp: '2022-02-16T19:07:46Z',
            message:
              'Compliant; notification - namespaces [test] found as specified, therefore this Object template is compliant',
          },
        ],
        templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
      },
    ],
  },
}

const policy1: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'policy1',
    namespace: 'test',
    annotations: {
      'policy.open-cluster-management.io/categories': 'CM Configuration Management',
      'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
      'policy.open-cluster-management.io/controls': 'CM-2 Baseline Configuration',
      'policy.open-cluster-management.io/description': 'Test policy description',
    },
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: {
            name: 'test-policy-namespace',
          },
          spec: {
            remediationAction: 'inform',
            severity: 'low',
            namespaceSelector: {
              exclude: ['kube-*'],
              include: ['default'],
            },
            'object-templates': [
              {
                complianceType: 'musthave',
                objectDefinition: {
                  kind: 'Namespace',
                  apiVersion: 'v1',
                  metadata: {
                    name: 'test',
                  },
                },
              },
            ],
            pruneObjectBehavior: 'DeleteIfCreated',
          },
        },
      },
    ],
  },
}

const pendingPolicy: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'policy-set-with-1-placement-policy',
    namespace: 'test',
    uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Pending',
    placement: [
      {
        placement: 'policy-set-with-1-placement',
        placementBinding: 'policy-set-with-1-placement',
        policySet: 'policy-set-with-1-placement',
      },
    ],
    status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Pending' }],
  },
}

const pendingPolicy0: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'test.policy-set-with-1-placement-policy',
    namespace: 'local-cluster',
    labels: {
      'policy.open-cluster-management.io/cluster-name': 'local-cluster',
      'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
      'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-policy',
    },
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Pending',
    details: [
      {
        compliant: 'Pending',
        history: [
          {
            eventName: 'test.policy-set-with-1-placement-policy.16d459c516462fbf',
            lastTimestamp: '2022-02-16T19:07:46Z',
            message:
              'Pending; template-error; Dependencies were not satisfied: 1 dependencies are still pending (Policy default.policy-pod)',
          },
        ],
        templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
      },
    ],
  },
}

const policyWithoutStatus: Policy = {
  apiVersion: PolicyApiVersion,
  kind: PolicyKind,
  metadata: {
    name: 'policy-0',
    namespace: 'policy-0-ns',
  },
  spec: {
    disabled: false,
    remediationAction: '',
  },
}

// ******
// POLICYSET
// ******
const policySet0: PolicySet = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicySet',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PolicySet","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"description":"Policy set with a single Placement and PlacementBinding.","policies":["policy-set-with-1-placement-policy-1","policy-set-with-1-placement-policy-2"]}}\n',
    },
    creationTimestamp: '2022-02-23T12:34:35Z',
    name: 'policy-set-with-1-placement',
    namespace: 'test',
    uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
  },
  spec: {
    description: 'Policy set with a single Placement and PlacementBinding.',
    policies: ['policy-set-with-1-placement-policy'],
  },
  status: {
    compliant: 'Compliant',
    placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
  },
}

const policySet1: PolicySet = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicySet',
  metadata: {
    name: 'policy-set-with-1-placement',
    namespace: 'test',
  },
  spec: {
    description: 'Policy set with a single Placement and PlacementBinding.',
    policies: ['policy-set-with-1-placement-policy-1', 'policy-set-with-1-placement-policy-2'],
  },
  status: {
    compliant: 'Compliant',
    placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
  },
}

const policySet2: PolicySet = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicySet',
  metadata: { name: 'policy-set-with-1-placement', namespace: 'test' },
  spec: { description: '', policies: ['policy-set-with-1-placement-policy'] },
}

// ******
// PLACEMENT
// ******
const placement1: Placement = {
  apiVersion: 'cluster.open-cluster-management.io/v1alpha1',
  kind: 'Placement',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"cluster.open-cluster-management.io/v1alpha1","kind":"Placement","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"clusterSets":["cluster-set"],"numberOfClusters":1,"predicates":[{"requiredClusterSelector":{"labelSelector":{"matchLabels":{"local-cluster":"true"}}}}]}}\n',
    },
    creationTimestamp: '2022-03-02T14:45:53Z',
    name: 'policy-set-with-1-placement',
    namespace: 'test',
    resourceVersion: '307980',
    uid: '8258c5bb-dd06-4934-94ad-0774c0608abb',
  },
  spec: {
    clusterSets: ['cluster-set'],
    numberOfClusters: 1,
    predicates: [{ requiredClusterSelector: { labelSelector: { matchLabels: { 'local-cluster': 'true' } } } }],
  },
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2022-03-02T14:45:53Z'),
        message: 'All ManagedClusterSets [cluster-set] have no member ManagedCluster',
        reason: 'AllManagedClusterSetsEmpty',
        status: 'False',
        type: 'PlacementSatisfied',
      },
    ],
    numberOfSelectedClusters: 1,
  },
}

// ******
// PLACEMENTRULE
// ******

const placementRule1: PlacementRule = {
  apiVersion: 'apps.open-cluster-management.io/v1',
  kind: 'PlacementRule',
  metadata: { name: 'policy1-placement', namespace: 'test' },
  spec: {
    clusterSelector: { matchExpressions: [{ key: 'cloud', operator: 'In', values: ['Amazon'] }] },
    clusterConditions: [],
  },
}
const placementRule2: PlacementRule = {
  apiVersion: 'apps.open-cluster-management.io/v1',
  kind: 'PlacementRule',
  metadata: { name: 'policy-set-with-1-placement-placement', namespace: 'test' },
  spec: {
    clusterSelector: { matchExpressions: [{ key: 'cloud', operator: 'In', values: ['Amazon'] }] },
    clusterConditions: [],
  },
}
// ******
// PLACEMENTBINDING
// ******
const placementBinding1: PlacementBinding = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'PlacementBinding',
  metadata: { name: 'policy1-placement', namespace: 'test' },
  placementRef: { apiGroup: 'apps.open-cluster-management.io', kind: 'PlacementRule', name: 'policy1-placement' },
  subjects: [{ apiGroup: 'policy.open-cluster-management.io', kind: 'Policy', name: 'policy1' }],
}

const placementBinding2: PlacementBinding = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'PlacementBinding',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PlacementBinding","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"placementRef":{"apiGroup":"cluster.open-cluster-management.io","kind":"Placement","name":"policy-set-with-1-placement"},"subjects":[{"apiGroup":"policy.open-cluster-management.io","kind":"PolicySet","name":"policy-set-with-1-placement"}]}\n',
    },
    creationTimestamp: '2022-03-02T14:45:53Z',
    name: 'policy-set-with-1-placement',
    namespace: 'test',
    resourceVersion: '307982',
    uid: 'aff1ea59-7f6d-4ff7-ba2e-e9bc7bd1dca1',
  },
  placementRef: {
    apiGroup: 'cluster.open-cluster-management.io',
    kind: 'Placement',
    name: 'policy-set-with-1-placement',
  },
  subjects: [{ apiGroup: 'policy.open-cluster-management.io', kind: 'PolicySet', name: 'policy-set-with-1-placement' }],
}

const placementBinding3: PlacementBinding = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'PlacementBinding',
  metadata: { name: 'policy-set-with-1-placement-placement', namespace: 'test' },
  placementRef: {
    apiGroup: 'apps.open-cluster-management.io',
    kind: 'PlacementRule',
    name: 'policy-set-with-1-placement-placement',
  },
  subjects: [{ apiGroup: 'policy.open-cluster-management.io', kind: 'PolicySet', name: 'policy-set-with-1-placement' }],
}

// ******
// PLACEMENTDECISION
// ******
const placementDecision: PlacementDecision = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'PlacementDecision',
  metadata: {
    resourceVersion: '379369',
    name: 'policy-set-with-1-placement-decision-1',
    uid: 'b6151850-a636-4aa0-b803-66776fec511c',
    creationTimestamp: '2022-03-02T15:20:53Z',
    namespace: 'test',
    ownerReferences: [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        blockOwnerDeletion: true,
        controller: true,
        kind: 'Placement',
        name: 'policy-set-with-1-placement',
        uid: '8258c5bb-dd06-4934-94ad-0774c0608abb',
      },
    ],
    labels: { 'cluster.open-cluster-management.io/placement': 'policy-set-with-1-placement' },
  },
  status: { decisions: [{ clusterName: 'local-cluster', reason: '' }] },
}

// ******
// AUTOMATION TESTS
// ******
const secret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'ansible-test-secret',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/type': Provider.ansible,
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  data: {
    host: 'aHR0cHM6Ly9hbnNpYmxlLXRvd2VyLXdlYi1zdmMtdG93ZXIuY29t',
    token: 'YWJjZA==',
  },
}

export const mockAnsibleCredential = {
  towerHost: 'https://ansible-tower-web-svc-tower.com/api/v2/job_templates/',
  token: 'abcd',
}
export const mockAnsibleCredentialWorkflow = {
  towerHost: 'https://ansible-tower-web-svc-tower.com/api/v2/workflow_job_templates/',
  token: 'abcd',
}

export const mockTemplateWorkflowList: AnsibleTowerJobTemplateList = {
  results: [
    {
      name: 'test-job-pre-install-ii',
      type: 'workflow_job_template',
      id: '1',
    },
  ],
}

export const mockAnsibleJob: AnsibleJob = {
  apiVersion: AnsibleJobApiVersion,
  kind: AnsibleJobKind,
  metadata: {
    name: 'ansible-job',
    namespace: 'test',
    annotations: {
      jobtype: 'prehook',
    },
  },
  status: {
    ansibleJobResult: {
      changed: true,
      failed: false,
      status: 'pending',
      url: '/ansible/url',
      finished: '2021-06-08T16:43:09.023018Z',
      started: '2021-06-08T16:43:01.853019Z',
    },
  },
}

export const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator',
    namespace: 'test',
    resourceVersion: '',
  },
  spec: {
    install: {
      towerAuthSecret: 'ansible-test-secret',
      prehook: [{ name: 'test-job-pre-install', extra_vars: {} }],
      posthook: [{ name: 'test-job-post-install', extra_vars: {} }],
    },
    upgrade: {
      towerAuthSecret: 'ansible-test-secret',
      prehook: [{ name: 'test-job-pre-upgrade', extra_vars: {} }],
      posthook: [{ name: 'test-job-post-upgrade', extra_vars: {} }],
    },
  },
}

export const mockTemplateList: AnsibleTowerJobTemplateList = {
  results: [
    {
      name: 'test-job-pre-install',
      type: 'job_template',
      id: '1',
    },
    {
      name: 'test-job-post-install',
      type: 'job_template',
      id: '2',
    },
    {
      name: 'test-job-pre-upgrade',
      type: 'job_template',
      id: '3',
    },
    {
      name: 'test-job-post-upgrade',
      type: 'job_template',
      id: '4',
    },
  ],
}

export const mockSubscriptionOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'ansible-automation-platform-operator',
    namespace: 'ansible-automation-platform-operator',
  },
  status: {
    conditions: [
      {
        reason: 'AllCatalogSourcesHealthy',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'False',
      },
    ],
  },
  spec: {},
}

export const mockPolicyAutomation: PolicyAutomation = {
  kind: 'PolicyAutomation',
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  metadata: {
    name: 'policy-set-with-1-placement-policy-policy-automation',
    namespace: 'test',
    annotations: { 'policy.open-cluster-management.io/rerun': 'false' },
  },
  spec: {
    policyRef: 'policy-set-with-1-placement-policy',
    mode: 'once',
    automationDef: { name: 'test-job-pre-install', secret: 'ansible-test-secret', type: 'AnsibleJob' },
  },
}

export const mockEditedPolicyAutomation: PolicyAutomation = {
  kind: 'PolicyAutomation',
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  metadata: {
    name: 'policy-set-with-1-placement-policy-policy-automation',
    namespace: 'test',
    annotations: {
      'policy.open-cluster-management.io/rerun': 'true',
    },
  },
  spec: {
    policyRef: 'policy-set-with-1-placement-policy',
    mode: 'disabled',
    automationDef: { name: 'test-job-post-install', secret: 'ansible-test-secret', type: 'AnsibleJob' },
  },
}

export const mockEmptyPolicy: Policy[] = []
export const mockPolicy: Policy[] = [rootPolicy, policy0, policy1]
export const mockPendingPolicy: Policy[] = [pendingPolicy, pendingPolicy0]

export const mockPolicyNoStatus: Policy = policyWithoutStatus

export const mockEmptyPolicySet: PolicySet[] = []
export const mockPolicySets: PolicySet[] = [policySet0, policySet1, policySet2]
export const mockPlacements: Placement[] = [placement1]
export const mockPlacementRules: PlacementRule[] = [placementRule1, placementRule2]
export const mockPlacementBindings: PlacementBinding[] = [placementBinding1, placementBinding2, placementBinding3]
export const mockPlacementDecision: PlacementDecision[] = [placementDecision]

export const mockSecret: Secret = secret
export const mockManagedClusters: ManagedCluster[] = [mockLocalCluster]
