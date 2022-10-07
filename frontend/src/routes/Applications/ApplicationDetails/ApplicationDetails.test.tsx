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
} from '../../../resources'
import {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    discoveredOCPAppResourcesState,
    managedClusterInfosState,
    managedClustersState,
    namespacesState,
    placementRulesState,
    subscriptionsState,
} from '../../../atoms'
import moment from 'moment'
import { nockIgnoreRBAC, nockSearch } from '../../../lib/nock-util'
import { render, screen } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom'
import { waitForText } from '../../../lib/test-util'
import ApplicationDetailsPage from './ApplicationDetails'
import { GetMessagesDocument, SearchSchemaDocument } from '../../Home/Search/search-sdk/search-sdk'
import { MockedProvider } from '@apollo/client/testing'
import userEvent from '@testing-library/user-event'
import { PluginContext } from '../../../lib/PluginContext'
import { AcmExtension } from '../../../plugin-extensions/types'
import { ApplicationActionProps } from '../../../plugin-extensions/properties'

const mockApplication0: Application = {
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

const mockApplicationSet0: ApplicationSet = {
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

const mockArgoApplication1: ArgoApplication = {
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

const mockOCPApplication0: OCPAppResource = {
    apiVersion: 'apps/v1',
    kind: 'deployment',
    name: 'authentication-operator',
    namespace: 'authentication-operator-ns',
    label: 'app=authentication-operator',
    status: {
        cluster: 'test-cluster',
    },
}

const mockFluxApplication0: OCPAppResource = {
    apiVersion: 'apps/v1',
    kind: 'deployment',
    name: 'authentication-operator',
    namespace: 'authentication-operator-ns',
    label: 'kustomize.toolkit.fluxcd.io/name=test-app;kustomize.toolkit.fluxcd.io/namespace=test-app-ns',
    status: {
        cluster: 'test-cluster',
    },
}

const applicationActionProps: ApplicationActionProps[] = [
    {
        id: 'action1',
        title: 'Action1',
        model: [
            {
                apiVersion: 'app.k8s.io/v1beta1',
                kind: 'Application',
            },
        ],
        component: (props) => <>{props?.resource?.metadata?.name}</>,
    },
    {
        id: 'action2',
        title: 'Action2',
        component: (props) => <>{props?.resource?.metadata?.name}</>,
    },
]

const acmExtension: AcmExtension = {
    applicationAction: applicationActionProps,
}

const mockApplications: Application[] = [mockApplication0]

const mockSubscriptions: Subscription[] = [mockSubscription0]

const mockChannels: Channel[] = [mockChannel0]

const mockPlacementrules: PlacementRule[] = [mockPlacementrule0]

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster0]

const mockManagedClusterInfos = [mockManagedClusterInfo0]

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name },
}))

const mockApplicationSets: ApplicationSet[] = [mockApplicationSet0]

const mockArgoApplications: ArgoApplication[] = [mockArgoApplication0, mockArgoApplication1]

const mockOCPApplications: OCPAppResource[] = [mockOCPApplication0, mockFluxApplication0]

const mockSearchQuery = {
    operationName: 'searchResultRelatedItems',
    variables: {
        input: [
            {
                keywords: [],
                filters: [
                    { property: 'kind', values: ['subscription'] },
                    { property: 'name', values: ['subscription-0'] },
                    { property: 'namespace', values: ['namespace-0'] },
                ],
                relatedKinds: ['application', 'subscription', 'placements', 'cluster'],
            },
        ],
    },
    query: 'query searchResultRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
}

const mockSearchResponse = {
    data: {
        searchResult: [
            {
                items: [
                    {
                        _uid: 'local-cluster/86f54fc2-9565-48b6-a6c8-9bce8ad10942',
                        created: '2022-08-05T18:06:55Z',
                        _rbac: 'namespace_apps.open-cluster-management.io_subscriptions',
                        kind: 'subscription',
                        _gitbranch: 'main',
                        namespace: 'namespace-0',
                        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                        _hubClusterResource: 'true',
                        cluster: 'local-cluster',
                        apiversion: 'v1',
                        label: 'app.kubernetes.io/part-of=application; app=application; apps.open-cluster-management.io/reconcile-rate=medium',
                        name: 'subscription-0',
                        _gitpath: 'helloworld',
                        localPlacement: 'false',
                        timeWindow: 'none',
                        apigroup: 'apps.open-cluster-management.io',
                        kind_plural: 'subscriptions',
                        status: 'Propagated',
                    },
                ],
                related: [
                    {
                        kind: 'cluster',
                        items: [
                            {
                                _uid: 'cluster__local-cluster',
                                memory: '97683300Ki',
                                _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                                label: 'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=unreachable; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
                                name: 'local-cluster',
                                cpu: 24,
                                created: '2022-08-03T17:50:15Z',
                                _clusterNamespace: 'local-cluster',
                                ManagedClusterImportSucceeded: 'True',
                                apigroup: 'internal.open-cluster-management.io',
                                ManagedClusterConditionAvailable: 'True',
                                ManagedClusterJoined: 'True',
                                HubAcceptedManagedCluster: 'True',
                                kind: 'cluster',
                                kubernetesVersion: 'v1.23.5+3afdacb',
                                addon: 'application-manager=true; cert-policy-controller=true; iam-policy-controller=true; policy-controller=true; search-collector=false',
                                consoleURL:
                                    'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                                nodes: 3,
                                status: 'OK',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'application',
                        items: [
                            {
                                _uid: 'local-cluster/fc9496f0-7236-4dd5-8cca-2dc003556a41',
                                kind_plural: 'applications',
                                name: 'application-0',
                                _rbac: 'namespace_app.k8s.io_applications',
                                _hubClusterResource: 'true',
                                apigroup: 'app.k8s.io',
                                kind: 'application',
                                created: '2022-08-05T18:06:55Z',
                                namespace: 'namespace-0',
                                cluster: 'local-cluster',
                                apiversion: 'v1beta1',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'pod',
                        items: [
                            {
                                _uid: 'local-cluster/d821661c-61c6-4b71-9d78-2c5045b8f038',
                                _hubClusterResource: 'true',
                                hostIP: '10.0.156.177',
                                kind: 'pod',
                                label: 'app=helloworld-app; pod-template-hash=7998d94b96',
                                status: 'Running',
                                restarts: 0,
                                startedAt: '2022-08-05T18:06:56Z',
                                image: 'quay.io/fxiang1/helloworld:0.0.1',
                                apiversion: 'v1',
                                _ownerUID: 'local-cluster/a668c477-0f98-4eda-94c2-4f4609d86ed6',
                                container: 'helloworld-app-container',
                                kind_plural: 'pods',
                                cluster: 'local-cluster',
                                namespace: 'namespace-0',
                                created: '2022-08-05T18:06:56Z',
                                _rbac: 'namespace_null_pods',
                                name: 'helloworld-app-deploy-7998d94b96-wl8tp',
                                podIP: '10.128.0.158',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'deployment',
                        items: [
                            {
                                _uid: 'local-cluster/4fb438fd-8355-4185-8669-cc8856edd222',
                                _hostingSubscription: 'namespace/application-subscription-1-local',
                                ready: 1,
                                available: 1,
                                current: 1,
                                kind: 'deployment',
                                apigroup: 'apps',
                                _rbac: 'namespace_apps_deployments',
                                namespace: 'namespace-0',
                                name: 'helloworld-app-deploy',
                                kind_plural: 'deployments',
                                apiversion: 'v1',
                                created: '2022-08-05T18:06:56Z',
                                desired: 1,
                                cluster: 'local-cluster',
                                label: 'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                                _hubClusterResource: 'true',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'replicaset',
                        items: [
                            {
                                _uid: 'local-cluster/a668c477-0f98-4eda-94c2-4f4609d86ed6',
                                _hubClusterResource: 'true',
                                desired: 1,
                                _rbac: 'namespace_apps_replicasets',
                                apiversion: 'v1',
                                cluster: 'local-cluster',
                                current: 1,
                                name: 'helloworld-app-deploy-7998d94b96',
                                namespace: 'namespace-0',
                                label: 'app=helloworld-app; pod-template-hash=7998d94b96',
                                kind: 'replicaset',
                                _hostingSubscription: 'namespace/application-subscription-1-local',
                                created: '2022-08-05T18:06:56Z',
                                apigroup: 'apps',
                                kind_plural: 'replicasets',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'route',
                        items: [
                            {
                                _uid: 'local-cluster/78a6045a-052e-4668-bed5-2d4bd6c55bc5',
                                cluster: 'local-cluster',
                                _rbac: 'namespace_route.openshift.io_routes',
                                apiversion: 'v1',
                                namespace: 'namespace-0',
                                apigroup: 'route.openshift.io',
                                kind: 'route',
                                created: '2022-08-05T18:06:56Z',
                                label: 'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                                kind_plural: 'routes',
                                name: 'helloworld-app-route',
                                _hostingSubscription: 'namespace/application-subscription-1-local',
                                _hubClusterResource: 'true',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'service',
                        items: [
                            {
                                _uid: 'local-cluster/96ae003d-6be6-45aa-98f3-0f61c3d0bdcd',
                                kind_plural: 'services',
                                _hubClusterResource: 'true',
                                _rbac: 'namespace_null_services',
                                type: 'NodePort',
                                label: 'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                                name: 'helloworld-app-svc',
                                port: '3002:32314/TCP',
                                _hostingSubscription: 'namespace/application-subscription-1-local',
                                namespace: 'namespace-0',
                                clusterIP: '172.30.32.158',
                                created: '2022-08-05T18:06:56Z',
                                kind: 'service',
                                apiversion: 'v1',
                                cluster: 'local-cluster',
                            },
                        ],
                        __typename: 'SearchRelatedResult',
                    },
                    {
                        kind: 'subscription',
                        items: [
                            {
                                _uid: 'local-cluster/b67c1760-e9d9-4edc-a526-9f36ae55aa10',
                                _hostingSubscription: 'namespace/subscription-0',
                                name: 'subscription-0-local',
                                _gitpath: 'helloworld',
                                timeWindow: 'none',
                                kind: 'subscription',
                                label: 'app.kubernetes.io/part-of=application; app=application; apps.open-cluster-management.io/reconcile-rate=medium',
                                apigroup: 'apps.open-cluster-management.io',
                                apiversion: 'v1',
                                cluster: 'local-cluster',
                                _hubClusterResource: 'true',
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                localPlacement: 'true',
                                kind_plural: 'subscriptions',
                                namespace: 'namespace-0',
                                status: 'Subscribed',
                                _gitbranch: 'main',
                                _rbac: 'namespace_apps.open-cluster-management.io_subscriptions',
                                created: '2022-08-05T18:06:56Z',
                            },
                        ],
                    },
                ],
            },
        ],
    },
}

describe('Applications Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockSearch(mockSearchQuery, mockSearchResponse)
        const props: any = {
            name: 'application-0',
            namespace: 'namespace-0',
            match: {
                params: {
                    name: 'application-0',
                    namespace: 'namespace-0',
                },
            },
            history: {
                replace: jest.fn(),
            },
        }
        const mocks = [
            {
                request: {
                    query: SearchSchemaDocument,
                },
                result: {
                    data: {
                        searchSchema: {
                            allProperties: ['cluster', 'kind', 'label', 'name', 'namespace'],
                        },
                    },
                },
            },
            {
                request: {
                    query: GetMessagesDocument,
                },
                result: {
                    data: {
                        messages: [],
                    },
                },
            },
        ]
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(applicationsState, mockApplications)
                    snapshot.set(subscriptionsState, mockSubscriptions)
                    snapshot.set(channelsState, mockChannels)
                    snapshot.set(placementRulesState, mockPlacementrules)
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(applicationSetsState, mockApplicationSets)
                    snapshot.set(argoApplicationsState, mockArgoApplications)
                    snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
                    snapshot.set(namespacesState, mockNamespaces)
                    snapshot.set(discoveredOCPAppResourcesState, mockOCPApplications)
                }}
            >
                <MemoryRouter>
                    <MockedProvider mocks={mocks}>
                        <PluginContext.Provider value={{ acmExtensions: acmExtension }}>
                            <ApplicationDetailsPage {...props} />
                        </PluginContext.Provider>
                    </MockedProvider>
                </MemoryRouter>
            </RecoilRoot>
        )
        // wait for page to load
        await waitForText(mockApplication0.metadata.name!, true)
    })

    test('Render ApplicationDetailsPage', async () => {
        expect(screen.getByText('Overview')).toBeTruthy()
        expect(screen.getByText('Topology')).toBeTruthy()
        expect(screen.getByText('Actions')).toBeTruthy()
        userEvent.click(screen.getByText('Actions'))
        userEvent.click(screen.getByText('Action1'))
    })
})
