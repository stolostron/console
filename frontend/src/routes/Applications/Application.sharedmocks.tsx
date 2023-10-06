/* Copyright Contributors to the Open Cluster Management project */
import moment from 'moment'
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
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
    ManagedClusterKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    OCPAppResource,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
} from '../../resources'
import { AcmExtension } from '../../plugin-extensions/types'
import { ApplicationActionProps } from '../../plugin-extensions/properties'

export const mockApplication0: Application = {
    apiVersion: ApplicationApiVersion,
    kind: ApplicationKind,
    metadata: {
        name: 'application-0',
        namespace: 'namespace-0',
        creationTimestamp: `${moment().format()}`,
        annotations: {
            'apps.open-cluster-management.io/subscriptions':
                'namespace-0/subscription-0,namespace-0/subscription-0-local',
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
export const mockArgoApplication1: ArgoApplication = {
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
}
export const mockOCPApplication0: OCPAppResource = {
    apiVersion: 'apps/v1',
    kind: 'deployment',
    name: 'authentication-operator',
    namespace: 'authentication-operator-ns',
    label: 'app=authentication-operator',
    status: {
        cluster: 'test-cluster',
    },
}
export const mockFluxApplication0: OCPAppResource = {
    apiVersion: 'apps/v1',
    kind: 'deployment',
    name: 'authentication-operator',
    namespace: 'authentication-operator-ns',
    label: 'kustomize.toolkit.fluxcd.io/name=test-app;kustomize.toolkit.fluxcd.io/namespace=test-app-ns',
    status: {
        cluster: 'test-cluster',
    },
}
const applicationActionProps: ApplicationActionProps = {
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
export const mockApplications: Application[] = [mockApplication0]
export const mockSubscriptions: Subscription[] = [mockSubscription0]
export const mockChannels: Channel[] = [mockChannel0]
export const mockPlacementrules: PlacementRule[] = [mockPlacementrule0]
export const mockManagedClusters: ManagedCluster[] = [mockManagedCluster0]
export const mockManagedClusterInfos = [mockManagedClusterInfo0]
export const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name },
}))
export const mockApplicationSets: ApplicationSet[] = [mockApplicationSet0]
export const mockArgoApplications: ArgoApplication[] = [mockArgoApplication0, mockArgoApplication1]
const mockOCPApplications: OCPAppResource[] = [mockOCPApplication0, mockFluxApplication0]
export const mockSearchQuery = {
    operationName: 'searchResult',
    variables: {
        input: [
            {
                filters: [
                    { property: 'kind', values: ['Application'] },
                    { property: 'apigroup', values: ['argoproj.io'] },
                    { property: 'cluster', values: ['!local-cluster'] },
                ],
                limit: 20000,
            },
        ],
    },
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}
export const mockSearchResponse = {
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
                ],
                limit: 20000,
            },
        ],
    },
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
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
