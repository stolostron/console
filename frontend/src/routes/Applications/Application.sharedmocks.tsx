/* Copyright Contributors to the Open Cluster Management project */
import {
  Application,
  ApplicationApiVersion,
  ApplicationKind,
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  Channel,
  ChannelApiVersion,
  ChannelKind,
  IResource,
  IUIResource,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterInfo,
  ManagedClusterInfoApiVersion,
  ManagedClusterInfoKind,
  ManagedClusterKind,
  ManagedClusterSet,
  ManagedClusterSetApiVersion,
  ManagedClusterSetKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  OCPAppResource,
  PlacementDecision,
  PlacementDecisionApiVersion,
  PlacementDecisionKind,
  PlacementRule,
  PlacementRuleApiVersion,
  PlacementRuleKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../resources'
import { AcmExtension } from '../../plugin-extensions/types'
import { ActionExtensionProps } from '../../plugin-extensions/properties'
import { IResultStatuses } from '../../lib/useAggregates'

export const mockArgoCD: IResource = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ArgoCD',
  metadata: {
    name: 'openshift-gitops',
    namespace: 'openshift-gitops',
  },
}

export const mockClusterSet0: ManagedClusterSet = {
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

export const gitOpsOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'openshift-gitops',
    namespace: 'openshift-operators',
  },
  spec: { name: 'openshift-gitops-operator' },
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
}

export const mockApplication0: Application & IUIResource = {
  apiVersion: ApplicationApiVersion,
  kind: ApplicationKind,
  metadata: {
    name: 'application-0',
    namespace: 'namespace-0',
    creationTimestamp: '2024-02-20T15:30:00Z',
    annotations: {
      'apps.open-cluster-management.io/subscriptions': 'namespace-0/subscription-0,namespace-0/subscription-0-local',
    },
  },
  spec: {
    componentKinds: [
      {
        group: 'apps.open-cluster-management.io',
        kind: 'Subscription',
      },
    ],
    selector: {
      matchExpressions: [
        {
          key: 'app',
          operator: 'In',
          values: ['application-0-app'],
        },
      ],
    },
  },
  uidata: {
    appSetRelatedResources: ['', []],
    clusterList: ['local-cluster'],
    appSetApps: [],
  },
}

export const uidata = {
  appSetRelatedResources: ['', []],
  clusterList: ['local-cluster'],
  appSetApps: [],
}

const mockSubscription0: Subscription = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
  metadata: {
    name: 'subscription-0',
    namespace: 'namespace-0',
    labels: {
      app: 'application-0-app',
    },
  },
  spec: {
    channel: 'ch-namespace-0/channel-0',
    placement: {
      placementRef: {
        kind: PlacementRuleKind,
        name: 'placementrule-0',
      },
    },
  },
}
const mockChannel0: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    name: 'channel-0',
    namespace: 'ch-namespace-0',
  },
  spec: {
    pathname: 'https://test.com/test.git',
    type: 'Git',
  },
}

const mockPlacementrule0: PlacementRule = {
  apiVersion: PlacementRuleApiVersion,
  kind: PlacementRuleKind,
  metadata: {
    name: 'placementrule-0',
    namespace: 'namespace-0',
    labels: {
      app: 'application-0-app',
    },
  },
  spec: {
    clusterReplicas: 1,
    clusterSelector: {
      matchLabels: {
        name: 'local-cluster',
      },
    },
  },
  status: {
    decisions: [
      {
        clusterName: 'local-cluster',
        clusterNamespace: 'local-cluster',
      },
    ],
  },
}

const mockPlacementDecision0: PlacementDecision = {
  apiVersion: PlacementDecisionApiVersion,
  kind: PlacementDecisionKind,
  metadata: {
    labels: { 'cluster.open-cluster-management.io/placementrule': mockPlacementrule0.metadata.name! },
    name: 'placementrule-0-decision-1',
    namespace: mockPlacementrule0.metadata.namespace,
  },
  status: {
    decisions: [
      {
        clusterName: 'local-cluster',
        reason: '',
      },
    ],
  },
}

const mockManagedCluster0: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'local-cluster',
    labels: {
      cloud: 'Nozama',
      vendor: 'OpenShift',
    },
  },
  spec: {
    hubAcceptsClient: true,
    managedClusterClientConfigs: [
      {
        url: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
      },
    ],
  },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}
const readyManagedClusterConditions = [
  { type: 'ManagedClusterConditionAvailable', reason: 'ManagedClusterConditionAvailable', status: 'True' },
  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
]
const mockManagedClusterInfo0: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'local-cluster', namespace: 'local-cluster' },
  status: {
    conditions: readyManagedClusterConditions,
    version: '1.17',
    distributionInfo: {
      type: 'ocp',
      ocp: {
        version: '1.2.3',
        availableUpdates: [],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
      },
    },
  },
}
export const mockApplicationSet0: ApplicationSet = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
  metadata: {
    name: 'applicationset-0',
    namespace: 'openshift-gitops',
  },
  spec: {
    generators: [
      {
        clusterDecisionResource: {
          configMapRef: 'acm-placement',
          labelSelector: {
            matchLabels: {
              'cluster.open-cluster-management.io/placement': 'fengappset2-placement',
            },
          },
          requeueAfterSeconds: 180,
        },
      },
    ],
    template: {
      metadata: {
        name: 'applicationset-0-{{name}}',
      },
      spec: {
        destination: {
          namespace: 'applicationset-0-ns',
          server: '{{server}}',
        },
        project: 'default',
        source: {
          path: 'testapp',
          repoURL: 'https://test.com/test.git',
          targetRevision: 'main',
        },
        syncPolicy: {},
      },
    },
  },
  uidata: {
    appSetRelatedResources: ['', []],
  },
}

export const mockApplicationSet1: ApplicationSet = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
  metadata: {
    name: 'applicationset-1',
    namespace: 'openshift-gitops',
  },
  spec: {
    generators: [
      {
        clusterDecisionResource: {
          configMapRef: 'acm-placement',
          labelSelector: {
            matchLabels: {
              'cluster.open-cluster-management.io/placement': 'fengappset2-placement',
            },
          },
          requeueAfterSeconds: 180,
        },
      },
    ],
    template: {
      metadata: {
        name: 'applicationset-1-{{name}}',
      },
      spec: {
        destination: {
          namespace: 'applicationset-0-ns',
          server: '{{server}}',
        },
        project: 'default',
        sources: [
          {
            path: 'testapp',
            repoURL: 'https://test.com/test.git',
            targetRevision: 'main',
          },
        ],
        syncPolicy: {},
      },
    },
  },
}

const mockArgoApplication0: ArgoApplication = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
  metadata: {
    name: 'applicationset-0-local-cluster',
    namespace: 'openshift-gitops',
    ownerReferences: [
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: ApplicationSetKind,
        name: 'applicationset-0',
      },
    ],
  },
  spec: {
    destination: {
      namespace: 'applicationset-0-ns',
      server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
    },
    project: 'default',
    source: {
      path: 'foo',
      repoURL: 'https://test.com/test.git',
      targetRevision: 'HEAD',
    },
    syncPolicy: {},
  },
  status: {},
}
export const mockArgoApplication1: ArgoApplication & IUIResource = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
  metadata: {
    name: 'argoapplication-1',
    namespace: 'openshift-gitops',
  },
  spec: {
    destination: {
      namespace: 'argoapplication-1-ns',
      server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
    },
    project: 'default',
    source: {
      path: 'foo',
      repoURL: 'https://test.com/test.git',
      targetRevision: 'HEAD',
    },
    syncPolicy: {},
  },
  status: {},
  uidata: {
    clusterList: ['None'],
    appSetRelatedResources: ['', []],
    appSetApps: [],
  },
}
export const mockArgoApplication2: ArgoApplication = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
  metadata: {
    name: 'feng-remote-argo8',
    namespace: 'openshift-gitops',
  },
  spec: {
    destination: {
      namespace: 'argoapplication-1-ns',
      server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
    },
    project: 'default',
    source: {
      path: 'foo',
      repoURL: 'https://test.com/test.git',
      targetRevision: 'HEAD',
    },
    syncPolicy: {},
  },
  status: {
    cluster: 'feng-managed',
  },
}

export const mockOCPApplication0: OCPAppResource = {
  apiVersion: 'apps/v1',
  kind: 'deployment',
  label: 'app=authentication-operator',
  metadata: {
    name: 'authentication-operator',
    namespace: 'authentication-operator-ns',
  },
  name: 'authentication-operator',
  namespace: 'authentication-operator-ns',
  status: {
    cluster: 'test-cluster',
  },
}

export const mockFluxApplication0: OCPAppResource = {
  apiVersion: 'apps/v1',
  kind: 'deployment',
  metadata: {
    name: 'authentication-operatorf',
    namespace: 'authentication-operator-ns',
  },
  name: 'authentication-operatorf',
  namespace: 'authentication-operator-ns',
  label: 'kustomize.toolkit.fluxcd.io/name=test-app;kustomize.toolkit.fluxcd.io/namespace=test-app-ns',
  status: {
    cluster: 'test-cluster',
  },
}
const applicationActionProps: ActionExtensionProps = {
  id: 'failover',
  title: 'Failover application',
  model: [
    {
      apiVersion: 'app.k8s.io/v1beta1',
      kind: 'Application',
    },
  ],
  component: (props) => <>{props?.close()}</>,
}
export const acmExtension: AcmExtension = {
  applicationAction: [applicationActionProps],
}
export const gitOpsOperators: SubscriptionOperator[] = [gitOpsOperator]
export const mockApplications: Application[] = [mockApplication0]
export const mockClusterSets: ManagedClusterSet[] = [mockClusterSet0]
export const mockSubscriptions: Subscription[] = [mockSubscription0]
export const mockChannels: Channel[] = [mockChannel0]
export const mockPlacementsDecisions: PlacementDecision[] = [mockPlacementDecision0]
export const mockPlacementrules: PlacementRule[] = [mockPlacementrule0]
export const mockManagedClusters: ManagedCluster[] = [mockManagedCluster0]
export const mockManagedClusterInfos = [mockManagedClusterInfo0]
export const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))
export const mockRequestedCounts: IResultStatuses = {
  itemCount: 123,
  filterCounts: {
    type: {
      argo: 4,
    },
  },
  refresh: () => {},
  systemAppNSPrefixes: [],
  loading: false,
}
export const mockApplicationSets: ApplicationSet[] = [mockApplicationSet0, mockApplicationSet1]
export const mockArgoApplications: ArgoApplication[] = [mockArgoApplication0, mockArgoApplication1]
export const mockOCPApplications: OCPAppResource[] = [mockOCPApplication0, mockFluxApplication0]
const mockSearchDisabledCluster = {
  HubAcceptedManagedCluster: 'True',
  ManagedClusterConditionAvailable: 'True',
  ManagedClusterImportSucceeded: 'True',
  ManagedClusterJoined: 'True',
  addon:
    'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; observability-controller=false; search-collector=false; work-manager=true',
  apigroup: 'internal.open-cluster-management.io',
  cluster: 'magchen-vm',
  consoleURL: 'https://console-openshift-console.apps.magchen-vm.dev06.red-chesterfield.com',
  cpu: '24',
  created: '2023-02-08T20:53:44Z',
  kind: 'Cluster',
  kind_plural: 'managedclusterinfos',
  kubernetesVersion: 'v1.25.4+a34b9e9',
  label:
    'cloud=vSphere; cluster.open-cluster-management.io/clusterset=default; clusterID=3a52b073-29b1-4b01-8679-7a1e3dc2345b; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-work-manager=available; name=magchen-vm; openshiftVersion=4.12.2; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; vendor=OpenShift',
  memory: '97962348Ki',
  name: 'magchen-vm',
  nodes: '6',
  _hubClusterResource: 'true',
}

export const mockSearchQueryArgoApps = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['!local-cluster'] },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryArgoAppsCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['!local-cluster'] },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchQueryArgoAppsStatusSummary = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['test-cluster'] },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryArgoAppsStatusSummaryFilteredCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['test-cluster'] },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchQueryArgoAppsClusterOverview = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['feng-hypershift-test'] },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryArgoAppsClusterOverviewFilteredCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Application'] },
          { property: 'apigroup', values: ['argoproj.io'] },
          { property: 'cluster', values: ['feng-hypershift-test'] },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchResponseArgoApps = {
  data: {
    searchResult: [
      {
        items: [
          {
            apigroup: 'argoproj.io',
            apiversion: 'v1alpha1',
            cluster: 'feng-managed',
            created: '2021-12-03T18:55:47Z',
            destinationName: 'in-cluster',
            destinationNamespace: 'feng-remote-namespace',
            kind: 'application',
            name: 'feng-remote-argo8',
            namespace: 'openshift-gitops',
            path: 'helloworld-perf',
            repoURL: 'https://github.com/fxiang1/app-samples',
            status: 'Healthy',
            targetRevision: 'HEAD',
            _clusterNamespace: 'feng-managed',
            _rbac: 'feng-managed_argoproj.io_applications',
            _uid: 'feng-managed/9896aad3-6789-4350-876c-bd3749c85b5d',
          },
        ],
      },
    ],
  },
}

export const mockSearchResponseArgoAppsCount = {
  data: {
    searchResult: [
      {
        count: 1,
      },
    ],
  },
}

export const mockSearchResponseArgoApps1 = {
  data: {
    searchResult: [
      {
        items: [
          {
            apigroup: 'argoproj.io',
            apiversion: 'v1alpha1',
            cluster: 'test-cluster',
            created: '2021-12-03T18:55:47Z',
            destinationName: 'in-cluster',
            destinationNamespace: 'feng-remote-namespace',
            kind: 'application',
            name: 'feng-remote-argo8',
            namespace: 'openshift-gitops',
            path: 'helloworld-perf',
            repoURL: 'https://github.com/fxiang1/app-samples',
            status: 'Healthy',
            targetRevision: 'HEAD',
            _clusterNamespace: 'feng-managed',
            _rbac: 'feng-managed_argoproj.io_applications',
            _uid: 'feng-managed/9896aad3-6789-4350-876c-bd3749c85b5d',
          },
        ],
      },
    ],
  },
}
export const mockSearchResponseArgoAppsCount1 = {
  data: {
    searchResult: [
      {
        count: 1,
      },
    ],
  },
}

export const mockSearchQueryOCPApplications = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryOCPApplicationsCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchQueryOCPApplicationsFiltered = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: ['app=*', 'app.kubernetes.io/part-of=*'],
          },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryOCPApplicationsFilteredCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: ['app=*', 'app.kubernetes.io/part-of=*'],
          },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchQueryOCPApplicationsStatusSummary = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
          {
            property: 'cluster',
            values: ['test-cluster'],
          },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryOCPApplicationsStatusSummaryFilteredCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
          {
            property: 'cluster',
            values: ['test-cluster'],
          },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchQueryOCPApplicationsClusterOverview = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
          {
            property: 'cluster',
            values: ['feng-hypershift-test'],
          },
        ],
        limit: 1000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchQueryOCPApplicationsClusterOverviewFilteredCount = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
          },
          {
            property: 'label',
            values: [
              'app=*',
              'app.kubernetes.io/part-of=*',
              'kustomize.toolkit.fluxcd.io/name=*',
              'helm.toolkit.fluxcd.io/name=*',
            ],
          },
          {
            property: 'cluster',
            values: ['feng-hypershift-test'],
          },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}',
}

export const mockSearchResponseOCPApplications = {
  data: {
    searchResult: [
      {
        items: mockOCPApplications,
      },
    ],
  },
}

export const mockSearchResponseOCPApplicationsCount = {
  data: {
    searchResult: [
      {
        count: mockOCPApplications.length,
      },
    ],
  },
}

export const mockSearchQuerySearchDisabledManagedClusters = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'kind', values: ['Cluster'] },
          { property: 'addon', values: ['search-collector=false'] },
          { property: 'name', values: ['!local-cluster'] },
        ],
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export const mockSearchResponseSearchDisabledManagedClusters = {
  data: {
    searchResult: [
      {
        items: mockSearchDisabledCluster,
      },
    ],
  },
}
