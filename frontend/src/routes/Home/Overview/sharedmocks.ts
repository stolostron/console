/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import {
  ApplicationSet,
  ClusterManagementAddOn,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterApiVersion,
  ManagedClusterInfo,
  ManagedClusterKind,
  PlacementDecision,
  Policy,
  PolicyReport,
} from '../../../resources'
import { Addon } from '../../../resources/utils'

export const managedClusterInfos: ManagedClusterInfo[] = [
  {
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterInfo',
    metadata: {
      labels: {
        cloud: 'Amazon',
        env: 'dev',
        name: 'managed-1',
        vendor: 'OpenShift',
      },
      name: 'managed-1',
      namespace: 'managed-1',
    },
    status: {
      cloudVendor: 'Amazon',
      kubeVendor: 'OpenShift',
      loggingPort: { name: 'https', port: 443, protocol: 'TCP' },
      version: 'v1.26.5+7d22122',
    },
  },
  {
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterInfo',
    metadata: {
      labels: {
        cloud: 'Amazon',
        'local-cluster': 'true',
        name: 'local-cluster',
        vendor: 'OpenShift',
      },
      name: 'local-cluster',
      namespace: 'local-cluster',
    },
    status: {
      nodeList: [
        {
          capacity: { cpu: '16', memory: '64453824Ki' },
          conditions: [{ status: 'True', type: 'Ready' }],
          labels: {},
          name: 'ip-10-0-140-19.ec2.internal',
        },
      ],
    },
  },
]

export const managedClusters: ManagedCluster[] = [
  {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      labels: {
        cloud: 'Amazon',
        env: 'dev',
        name: 'local-cluster',
        vendor: 'OpenShift',
      },
      name: 'local-cluster',
    },
    spec: {
      hubAcceptsClient: true,
    },
    status: {
      allocatable: {
        cpu: '42',
        memory: '179120384Ki',
      },
      capacity: {
        memory: '192932096Ki',
        cpu: '48',
      },
      clusterClaims: [
        {
          name: 'id.k8s.io',
          value: 'local-cluster',
        },
      ],
      conditions: [
        {
          message: 'Accepted by hub cluster admin',
          reason: 'HubClusterAdminAccepted',
          status: 'True',
          type: 'HubAcceptedManagedCluster',
        },
        {
          message: 'Managed cluster is available',
          reason: 'ManagedClusterAvailable',
          status: 'True',
          type: 'ManagedClusterConditionAvailable',
        },
      ],
      version: {
        kubernetes: 'v1.20.0+bbbc079',
      },
    },
  },
  {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      labels: {
        cloud: 'Azure',
        region: 'us-east-1',
        name: 'managed-cluster',
        vendor: 'OpenShift',
      },
      name: 'managed-cluster',
    },
    spec: {
      hubAcceptsClient: true,
    },
    status: {
      allocatable: {
        cpu: '42',
        memory: '179120384Ki',
      },
      capacity: {
        memory: '192932096Ki',
        cpu: '48',
      },
      clusterClaims: [
        {
          name: 'id.k8s.io',
          value: 'managed-cluster',
        },
        {
          name: 'platform.open-cluster-management.io',
          value: 'AKS',
        },
      ],
      conditions: [
        {
          message: 'Accepted by hub cluster admin',
          reason: 'HubClusterAdminAccepted',
          status: 'True',
          type: 'HubAcceptedManagedCluster',
        },
        {
          message: 'Managed cluster is available',
          reason: 'ManagedClusterAvailable',
          status: 'True',
          type: 'ManagedClusterConditionAvailable',
        },
      ],
      version: {
        kubernetes: 'v1.20.0+bbbc079',
      },
    },
  },
]
export const mockManagedClusterAddons: Record<string, ManagedClusterAddOn[]> = {
  'local-cluster': [
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        name: 'application-manager',
        namespace: 'managed-cluster-1',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: undefined,
            message: 'application-manager add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        addOnMeta: {
          displayName: '',
          description: '',
        },
        addOnConfiguration: {
          crdName: '',
          crName: '',
        },
      },
    },
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2023-02-08T14:59:17Z',
        name: 'cert-policy-controller',
        namespace: 'local-cluster',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'cert-policy-controller',
            uid: '205ac0e8-20db-4a1f-af81-d24027634a14',
          },
        ],
        resourceVersion: '1739654',
        uid: '963d1d78-5745-4e20-8b9a-96f8b762bdec',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: { crdName: '', crName: '' },
        addOnMeta: { displayName: '', description: '' },
        conditions: [
          {
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            message: 'Registration of the addon agent is configured',
            reason: 'RegistrationConfigured',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            message:
              'client certificate rotated starting from 2023-02-09 13:08:09 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            message: 'cert-policy-controller add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Degraded',
          },
        ],
      },
    },
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2023-02-08T14:58:32Z',
        name: 'cluster-proxy',
        namespace: 'local-cluster',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'cluster-proxy',
            uid: 'a1b690ce-c81d-4a87-af0a-8cc214d4f9e4',
          },
        ],
        resourceVersion: '1725616',
        uid: '3f5e11a9-52a5-46b9-9e8f-c108c3fd4e4d',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: { crdName: '', crName: '' },
        addOnMeta: { displayName: '', description: '' },
        conditions: [
          {
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            message: 'Registration of the addon agent is configured',
            reason: 'RegistrationConfigured',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            message:
              'client certificate rotated starting from 2023-02-09 12:58:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            message: 'cluster-proxy add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Progressing',
          },
        ],
      },
    },
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2023-02-08T14:59:17Z',
        name: 'config-policy-controller',
        namespace: 'local-cluster',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'config-policy-controller',
            uid: 'f45d726e-11c9-41e6-aaf8-a744d8613636',
          },
        ],
        resourceVersion: '1734118',
        uid: '9fb54c01-8b73-45ce-804f-b726e06b733a',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: { crdName: '', crName: '' },
        addOnMeta: { displayName: '', description: '' },
        conditions: [
          {
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            message: 'Registration of the addon agent is configured',
            reason: 'RegistrationConfigured',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            message:
              'client certificate rotated starting from 2023-02-09 13:04:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            message: 'config-policy-controller add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Disabled',
          },
        ],
      },
    },
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2023-02-08T14:59:17Z',
        name: 'governance-policy-framework',
        namespace: 'local-cluster',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'governance-policy-framework',
            uid: '02f62b75-49cd-4d35-85be-25bc5b959701',
          },
        ],
        resourceVersion: '1739647',
        uid: 'e4de7012-c4da-495e-bf2d-914cbea49ba2',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: { crdName: '', crName: '' },
        addOnMeta: { displayName: '', description: '' },
        conditions: [
          {
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            message: 'Registration of the addon agent is configured',
            reason: 'RegistrationConfigured',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            message:
              'client certificate rotated starting from 2023-02-09 13:08:09 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            message: 'governance-policy-framework add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Cool',
          },
        ],
      },
    },
    {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2023-02-08T14:58:32Z',
        name: 'work-manager',
        namespace: 'local-cluster',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'work-manager',
            uid: '3b80aede-f99c-4f53-9f75-a115e736e647',
          },
        ],
        resourceVersion: '1734156',
        uid: 'b753d5a2-f93d-49b1-a921-c54a586c7da0',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: { crdName: '', crName: '' },
        addOnMeta: { displayName: '', description: '' },
        conditions: [
          {
            message: 'Registration of the addon agent is configured',
            reason: 'RegistrationConfigured',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            message:
              'client certificate rotated starting from 2023-02-09 13:04:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            message: 'work-manager add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
      },
    },
  ],
}

export const mockClusterManagementAddons: ClusterManagementAddOn[] = [
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:05Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'application-manager',
      resourceVersion: '31309',
      uid: 'fe141d28-3335-43be-b725-2d4505e91f01',
    },
    spec: {
      addOnMeta: {
        description: 'Synchronizes application on the managed clusters from the hub',
        displayName: 'Application Manager',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'cert-policy-controller',
      resourceVersion: '33514',
      uid: '205ac0e8-20db-4a1f-af81-d24027634a14',
    },
    spec: {
      addOnMeta: {
        description: 'Monitors certificate expiration based on distributed policies.',
        displayName: 'Certificate Policy Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:17Z',
      labels: {
        'backplaneconfig.name': 'multiclusterengine',
      },
      name: 'cluster-proxy',
      ownerReferences: [
        {
          apiVersion: 'multicluster.openshift.io/v1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'MultiClusterEngine',
          name: 'multiclusterengine',
          uid: 'b54f89c9-87b2-4c69-952d-027509e76214',
        },
      ],
      resourceVersion: '31364',
      uid: 'a1b690ce-c81d-4a87-af0a-8cc214d4f9e4',
    },
    spec: {
      addOnMeta: {
        description: 'cluster-proxy',
        displayName: 'cluster-proxy',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'config-policy-controller',
      resourceVersion: '33502',
      uid: 'f45d726e-11c9-41e6-aaf8-a744d8613636',
    },
    spec: {
      addOnMeta: {
        description: 'Audits k8s resources and remediates violation based on configuration policies.',
        displayName: 'Config Policy Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'governance-policy-framework',
      resourceVersion: '33487',
      uid: '02f62b75-49cd-4d35-85be-25bc5b959701',
    },
    spec: {
      addOnMeta: {
        description: 'Distributes policies and collects policy evaluation results.',
        displayName: 'Governance Policy Framework Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:16Z',
      name: 'search-collector',
      ownerReferences: [
        {
          apiVersion: 'search.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'Search',
          name: 'search-v2-operator',
          uid: '9d07a60a-0de1-41c8-8699-2bd9fb039c33',
        },
      ],
      resourceVersion: '34346',
      uid: 'a72e8123-9cf3-4c1e-ad2a-83d9db5f4825',
    },
    spec: {
      addOnMeta: {
        description: 'Collects cluster data to be indexed by search components on the hub cluster.',
        displayName: 'Search Collector',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'volsync',
      resourceVersion: '33630',
      uid: '9d767376-e5b0-4f19-ab76-79347e2e789e',
    },
    spec: {
      addOnMeta: {
        description: 'VolSync',
        displayName: 'VolSync',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:15Z',
      name: 'work-manager',
      ownerReferences: [
        {
          apiVersion: 'multicluster.openshift.io/v1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'MultiClusterEngine',
          name: 'multiclusterengine',
          uid: 'b54f89c9-87b2-4c69-952d-027509e76214',
        },
      ],
      resourceVersion: '71018',
      uid: '3b80aede-f99c-4f53-9f75-a115e736e647',
    },
    spec: {
      addOnMeta: {
        description: 'work-manager provides action, view and rbac settings',
        displayName: 'work-manager',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      annotations: {
        'console.open-cluster-management.io/launch-link':
          'https://grafana-open-cluster-management-observability.apps.testing.com/d/test',
        'console.open-cluster-management.io/launch-link-text': 'Grafana',
      },
      creationTimestamp: '2023-02-08T14:58:15Z',
      name: 'observability-controller',
      resourceVersion: '1233043',
      uid: '4b8fa75e-4fbb-4d41-ae8c-93e4f8ec9100',
    },
    spec: {
      addOnMeta: {
        description: 'Manages Observability components.',
        displayName: 'Observability Controller',
      },
    },
  },
]

export const parsedAddons: {
  [id: string]: Addon[]
} = {
  managed: [
    {
      name: 'application-manager',
      status: 'Unknown',
      message: 'Registration agent stopped updating its lease.',
      launchLink: undefined,
    },
    {
      name: 'cert-policy-controller',
      status: 'Unknown',
      message: 'Registration agent stopped updating its lease.',
      launchLink: undefined,
    },
    {
      name: 'cluster-proxy',
      status: 'Unknown',
      message: 'Registration agent stopped updating its lease.',
      launchLink: undefined,
    },
    {
      name: 'config-policy-controller',
      status: 'Degraded',
      message: 'Registration agent stopped updating its lease.',
      launchLink: undefined,
    },
    {
      name: 'governance-policy-framework',
      status: 'Progressing',
      message: 'Registration agent stopped updating its lease.',
      launchLink: undefined,
    },
  ],
  'local-cluster': [
    {
      name: 'application-manager',
      status: 'Available',
      message: 'application-manager add-on is available.',
      launchLink: undefined,
    },
    {
      name: 'cert-policy-controller',
      status: 'Available',
      message: 'cert-policy-controller add-on is available.',
      launchLink: undefined,
    },
    {
      name: 'cluster-proxy',
      status: 'Available',
      message: 'cluster-proxy add-on is available.',
      launchLink: undefined,
    },
  ],
}

export const appSets: ApplicationSet[] = [
  {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      name: 'testing',
      namespace: 'openshift-gitops',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: { 'cluster.open-cluster-management.io/placement': 'testing-placement' },
            },
            requeueAfterSeconds: 180,
          },
        },
      ],
      template: {
        metadata: { labels: { 'velero.io/exclude-from-backup': 'true' }, name: 'testing-{{name}}' },
        spec: {
          destination: { namespace: 'default', server: '{{server}}' },
          project: 'default',
          source: { path: '', repoURL: 'http://test.com', targetRevision: '' },
          syncPolicy: {
            automated: { prune: true, selfHeal: true },
            syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
          },
        },
      },
    },
    status: {
      conditions: [],
    },
  },
]

export const placementDecisions: PlacementDecision[] = [
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'PlacementDecision',
    metadata: {
      labels: {
        'cluster.open-cluster-management.io/decision-group-index': '0',
        'cluster.open-cluster-management.io/decision-group-name': '',
        'cluster.open-cluster-management.io/placement': 'testing-placement',
      },
      name: 'testing-placement-decision-0',
      namespace: 'openshift-gitops',
      ownerReferences: [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'Placement',
          name: 'testing-placement',
          uid: '095e147e-d45e-46f7-bba4-1739b829ec70',
        },
      ],
    },
    status: { decisions: [{ clusterName: 'local-cluster', reason: '' }] },
  },
]

export const filteredOCPApps: Record<string, any> = {
  'openshift-monitoring-openshift-monitoring-local-cluster': {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/f23c746c-ba29-4f92-8280-6f0e05bc1038',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:31:12Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label:
      'app.kubernetes.io/component=metrics-adapter; app.kubernetes.io/managed-by=cluster-monitoring-operator; app.kubernetes.io/name=prometheus-adapter; app.kubernetes.io/part-of=openshift-monitoring; app.kubernetes.io/version=0.10.0',
    name: 'prometheus-adapter',
    namespace: 'openshift-monitoring',
    ready: '1',
  },
  'package-server-manager-openshift-operator-lifecycle-manager-local-cluster': {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/08d13f35-0323-4487-9588-35414e8538bb',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:29:23Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label: 'app=package-server-manager',
    name: 'package-server-manager',
    namespace: 'openshift-operator-lifecycle-manager',
    ready: '1',
  },
  'argocd-openshift-gitops-local-cluster': {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/dac8211e-0a27-4efb-bcef-20ecd068a517',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-24T16:40:09Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label:
      'app.kubernetes.io/component=dex-server; app.kubernetes.io/managed-by=openshift-gitops; app.kubernetes.io/name=openshift-gitops-dex-server; app.kubernetes.io/part-of=argocd',
    name: 'openshift-gitops-dex-server',
    namespace: 'openshift-gitops',
    ready: '1',
  },
}

export const ocpApps: any[] = [
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/015f3ba1-7d44-4b46-bbd1-7daac1874d41',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-24T12:58:16Z',
    current: '1',
    desired: '1',
    kind: 'deployment',
    kind_plural: 'deployments',
    label:
      'olm.deployment-spec-hash=7f8d958d6b; olm.owner=advanced-cluster-management.v2.9.0; olm.owner.kind=ClusterServiceVersion; olm.owner.namespace=open-cluster-management; operators.coreos.com/advanced-cluster-management.open-cluster-management=',
    name: 'multicluster-observability-operator',
    namespace: 'open-cluster-management',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/02dbb88d-9bb5-4bf2-91a7-9f282a75c5b4',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:31:10Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label:
      'app.kubernetes.io/component=exporter; app.kubernetes.io/managed-by=cluster-monitoring-operator; app.kubernetes.io/name=openshift-state-metrics; app.kubernetes.io/part-of=openshift-monitoring',
    name: 'openshift-state-metrics',
    namespace: 'openshift-monitoring',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/04f8eea4-95b4-432d-9102-bd34099f838c',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:31:10Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label:
      'app.kubernetes.io/component=exporter; app.kubernetes.io/managed-by=cluster-monitoring-operator; app.kubernetes.io/name=kube-state-metrics; app.kubernetes.io/part-of=openshift-monitoring; app.kubernetes.io/version=2.8.1',
    name: 'kube-state-metrics',
    namespace: 'openshift-monitoring',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/077905d6-4280-45da-9750-3395916a8142',
    apigroup: 'batch',
    apiversion: 'v1',
    cluster: 'local-cluster',
    completions: '1',
    created: '2023-07-22T00:00:00Z',
    kind: 'Job',
    kind_plural: 'jobs',
    label: 'created-by=image-pruner',
    name: 'image-pruner-28166400',
    namespace: 'openshift-image-registry',
    parallelism: '1',
    successful: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/08d13f35-0323-4487-9588-35414e8538bb',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:29:23Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label: 'app=package-server-manager',
    name: 'package-server-manager',
    namespace: 'openshift-operator-lifecycle-manager',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/0b0a6c3b-b94c-4f9c-b9a8-0666e12a05e7',
    apigroup: 'apps',
    apiversion: 'v1',
    cluster: 'local-cluster',
    created: '2023-07-24T16:40:09Z',
    current: '1',
    desired: '1',
    kind: 'StatefulSet',
    kind_plural: 'statefulsets',
    label:
      'app.kubernetes.io/component=application-controller; app.kubernetes.io/managed-by=openshift-gitops; app.kubernetes.io/name=openshift-gitops-application-controller; app.kubernetes.io/part-of=argocd',
    name: 'openshift-gitops-application-controller',
    namespace: 'openshift-gitops',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/0b53d1a8-b8dd-497c-a10a-303bcddab62c',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:29:04Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    name: 'marketplace-operator',
    namespace: 'openshift-marketplace',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/0e8894bc-753d-4f65-9a27-9ab3700a1e71',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:37:54Z',
    current: '1',
    desired: '1',
    kind: 'DaemonSet',
    kind_plural: 'daemonsets',
    name: 'node-ca',
    namespace: 'openshift-image-registry',
    ready: '1',
    updated: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/0ebc08c2-21ee-4699-b069-5966cc92a8c3',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '2',
    cluster: 'local-cluster',
    created: '2023-07-24T13:01:09Z',
    current: '2',
    desired: '2',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label: 'app=hiveadmission; hiveadmission=true',
    name: 'hiveadmission',
    namespace: 'hive',
    ready: '2',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/0f3aaba3-db70-467d-b8e1-77af9c6647ae',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:30:44Z',
    current: '1',
    desired: '1',
    kind: 'DaemonSet',
    kind_plural: 'daemonsets',
    name: 'node-resolver',
    namespace: 'openshift-dns',
    ready: '1',
    updated: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/11210249-55bc-4d77-9b9e-022d4a60a3a4',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-24T13:06:19Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label: 'app=cluster-proxy-service-proxy',
    name: 'cluster-proxy-service-proxy',
    namespace: 'open-cluster-management-agent-addon',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/11b6336b-6d8c-49e2-9531-60e1d795572e',
    apigroup: 'batch',
    apiversion: 'v1',
    cluster: 'local-cluster',
    completions: '1',
    created: '2023-08-01T20:00:00Z',
    kind: 'Job',
    kind_plural: 'jobs',
    label: 'controller-uid=11b6336b-6d8c-49e2-9531-60e1d795572e; job-name=collect-profiles-28182000',
    name: 'collect-profiles-28182000',
    namespace: 'openshift-operator-lifecycle-manager',
    parallelism: '1',
    successful: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/12905f9c-abf8-479b-b2c3-cb9104a65c77',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-13T21:47:21Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label: 'app=oauth-openshift',
    name: 'oauth-openshift',
    namespace: 'openshift-authentication',
    ready: '1',
  },
  {
    _clusterNamespace: '',
    _hubClusterResource: 'true',
    _uid: 'local-cluster/1457dba0-dc2c-4d8b-976e-56fb28b0a48a',
    apigroup: 'apps',
    apiversion: 'v1',
    available: '1',
    cluster: 'local-cluster',
    created: '2023-07-24T13:06:43Z',
    current: '1',
    desired: '1',
    kind: 'Deployment',
    kind_plural: 'deployments',
    label:
      'addon.open-cluster-management.io/hosted-manifest-location=hosting; app=config-policy-controller; chart=config-policy-controller-2.2.0; heritage=Helm; release=config-policy-controller',
    name: 'config-policy-controller',
    namespace: 'open-cluster-management-agent-addon',
    ready: '1',
  },
]

export const policyReports: PolicyReport[] = [
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'local-cluster-policyreport',
      namespace: 'local-cluster',
    },
    results: [
      {
        category: 'service_availability',
        message: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
        policy: 'PROMETHEUS_DB_VOLUME_IS_EMPTY',
        properties: {
          component: 'ccx_rules_ocp.external.rules.empty_prometheus_db_volume.report',
          created_at: '2020-11-17 11:47:00',
          extra_data: '{"error_key":"PROMETHEUS_DB_VOLUME_IS_EMPTY","ocp_branch":"4.13","type":"rule"}',
          total_risk: '1',
        },
        result: 'fail',
        source: 'insights',
      },
      {
        category: 'service_availability',
        message: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
        policy: 'PROMETHEUS_DB_VOLUME_IS_EMPTY',
        properties: {
          component: 'ccx_rules_ocp.external.rules.empty_prometheus_db_volume.report',
          created_at: '2020-11-17 11:47:00',
          extra_data: '{"error_key":"PROMETHEUS_DB_VOLUME_IS_EMPTY","ocp_branch":"4.13","type":"rule"}',
          total_risk: '2',
        },
        result: 'fail',
        source: 'insights',
      },
      {
        category: 'service_availability',
        message: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
        policy: 'PROMETHEUS_DB_VOLUME_IS_EMPTY',
        properties: {
          component: 'ccx_rules_ocp.external.rules.empty_prometheus_db_volume.report',
          created_at: '2020-11-17 11:47:00',
          extra_data: '{"error_key":"PROMETHEUS_DB_VOLUME_IS_EMPTY","ocp_branch":"4.13","type":"rule"}',
          total_risk: '3',
        },
        result: 'fail',
        source: 'insights',
      },
      {
        category: 'service_availability',
        message: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
        policy: 'PROMETHEUS_DB_VOLUME_IS_EMPTY',
        properties: {
          component: 'ccx_rules_ocp.external.rules.empty_prometheus_db_volume.report',
          created_at: '2020-11-17 11:47:00',
          extra_data: '{"error_key":"PROMETHEUS_DB_VOLUME_IS_EMPTY","ocp_branch":"4.13","type":"rule"}',
          total_risk: '4',
        },
        result: 'fail',
        source: 'insights',
      },
    ],
    scope: { kind: 'cluster', name: 'local-cluster', namespace: 'local-cluster' },
    summary: { error: 0, fail: 2, pass: 0, skip: 0, warn: 0 },
  },
]

export const policies: Policy[] = [
  {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      annotations: {
        'policy.open-cluster-management.io/categories': 'AC Access Control',
        'policy.open-cluster-management.io/controls': 'AC-3 Access Enforcement',
        'policy.open-cluster-management.io/description': '',
        'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
      },
      name: 'amazon-role',
      namespace: 'open-cluster-management',
      resourceVersion: '2541990',
      uid: '72c0c8ef-1170-4625-8dbb-b438f1171504',
    },
    spec: {
      disabled: false,
      remediationAction: 'inform',
    },
    status: {
      compliant: 'NonCompliant',
      placement: [{ placementBinding: 'binding-amazon-role', placementRule: 'placement-amazon-role' }],
      status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'NonCompliant' }],
    },
  },
  {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      annotations: {
        'policy.open-cluster-management.io/categories': 'AC Access Control',
        'policy.open-cluster-management.io/controls': 'AC-3 Access Enforcement',
        'policy.open-cluster-management.io/description': '',
        'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
      },
      name: 'policy-role',
      namespace: 'open-cluster-management',
      resourceVersion: '2532697',
      uid: '608916ae-1df4-4979-94a2-cff336bd11cc',
    },
    spec: {
      disabled: false,
      remediationAction: 'inform',
    },
    status: { placement: [{ placementBinding: 'binding-policy-role', placementRule: 'placement-policy-role' }] },
  },
]

export const mockAlertMetrics: any = {
  status: 'success',
  data: {
    resultType: 'vector',
    result: [
      {
        metric: {
          __name__: 'ALERTS',
          cluster: 'local-cluster',
          alertname: 'AlertmanagerReceiversNotConfigured',
          alertstate: 'firing',
          namespace: 'openshift-monitoring',
          prometheus: 'openshift-monitoring/k8s',
          severity: 'warning',
        },
        value: [1690924359.704, '1'],
      },
      {
        metric: {
          __name__: 'ALERTS',
          cluster: 'local-cluster',
          alertname: 'InsightsRecommendationActive',
          alertstate: 'firing',
          container: 'insights-operator',
          description: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
          endpoint: 'https',
          instance: '10.128.0.144:8443',
          job: 'metrics',
          namespace: 'openshift-insights',
          pod: 'insights-operator-6c4799dc96-46nrg',
          prometheus: 'openshift-monitoring/k8s',
          service: 'metrics',
          severity: 'info',
          total_risk: 'Low',
        },
        value: [1690924359.704, '1'],
      },
      {
        metric: {
          __name__: 'ALERTS',
          cluster: 'managed-1',
          alertname: 'InsightsRecommendationActive',
          alertstate: 'firing',
          container: 'insights-operator',
          description: 'Prometheus metrics data will be lost when the Prometheus pod is restarted or recreated',
          endpoint: 'https',
          instance: '10.128.0.144:8443',
          job: 'metrics',
          namespace: 'openshift-insights',
          pod: 'insights-operator-6c4799dc96-46nrg',
          prometheus: 'openshift-monitoring/k8s',
          service: 'metrics',
          severity: 'info',
          total_risk: 'Low',
        },
        value: [1690924359.704, '1'],
      },
      {
        metric: {
          __name__: 'ALERTS',
          cluster: 'local-cluster',
          alertname: 'TelemeterClientFailures',
          alertstate: 'pending',
          namespace: 'openshift-monitoring',
          prometheus: 'openshift-monitoring/k8s',
          severity: 'warning',
        },
        value: [1690924359.704, '1'],
      },
    ],
  },
}

export const mockOperatorMetrics: any = {
  status: 'success',
  data: {
    resultType: 'vector',
    result: [
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Available',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'authentication',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'AsExpected',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '1'],
      },
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Available',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'baremetal',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'WaitingForProvisioningCR',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '0'],
      },
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Upgradeable',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'cloud-controller-manager',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'AsExpected',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '0'],
      },
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Failing',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'cloud-credential',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'AsExpected',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '1'],
      },
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Progressing',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'cloud-credential',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'AsExpected',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '1'],
      },
      {
        metric: {
          __name__: 'cluster_operator_conditions',
          condition: 'Degraded',
          endpoint: 'metrics',
          instance: '10.0.140.19:9099',
          job: 'cluster-version-operator',
          name: 'etcd',
          namespace: 'openshift-cluster-version',
          pod: 'cluster-version-operator-9495566b8-tfcst',
          prometheus: 'openshift-monitoring/k8s',
          reason: 'AsExpected',
          service: 'cluster-version-operator',
        },
        value: [1690903659.115, '1'],
      },
    ],
  },
}

export const mockWorkerCoreCountMetrics: any = {
  status: 'success',
  data: {
    resultType: 'vector',
    result: [
      {
        metric: {
          __name__: 'acm_managed_cluster_worker_cores',
          endpoint: 'https',
          hub_cluster_id: '1234-abcd',
          instance: '10.130.2.160:8443',
          job: 'clusterlifecycle-state-metrics-v2',
          managed_cluster_id: 'local-cluster',
          namespace: 'multicluster-engine',
          pod: 'clusterlifecycle-state-metrics-v2',
          service: 'clusterlifecycle-state-metrics-v2',
        },
        value: [1724872986.629, '2'],
      },
      {
        metric: {
          __name__: 'acm_managed_cluster_worker_cores',
          endpoint: 'https',
          hub_cluster_id: '1234-abcd',
          instance: '10.130.2.160:8443',
          job: 'clusterlifecycle-state-metrics-v2',
          managed_cluster_id: 'managed-1',
          namespace: 'multicluster-engine',
          pod: 'clusterlifecycle-state-metrics-v2',
          service: 'clusterlifecycle-state-metrics-v2',
        },
        value: [1724872986.629, '6'],
      },
    ],
  },
}
