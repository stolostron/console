/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import moment from 'moment'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    managedClustersState,
    placementRulesState,
    subscriptionsState,
    managedClusterInfosState,
} from '../../atoms'
import { nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { waitForText } from '../../lib/test-util'
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
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
} from '../../resources'
import ApplicationsOverview from './Overview'

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

const mockApplications: Application[] = [mockApplication0]

const mockSubscriptions: Subscription[] = [mockSubscription0]

const mockChannels: Channel[] = [mockChannel0]

const mockPlacementrules: PlacementRule[] = [mockPlacementrule0]

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster0]

const mockManagedClusterInfos = [mockManagedClusterInfo0]

const mockApplicationSets: ApplicationSet[] = [mockApplicationSet0]

const mockArgoApplications: ArgoApplication[] = [mockArgoApplication0, mockArgoApplication1]

const mockSearchQuery = {
    operationName: 'searchResult',
    variables: {
        input: [
            {
                filters: [
                    { property: 'kind', values: ['application'] },
                    { property: 'apigroup', values: ['argoproj.io'] },
                    { property: 'cluster', values: ['!local-cluster'] },
                ],
            },
        ],
    },
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

const mockSearchResponse = {
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
                        destinationNamespace: 'feng-remote-argo8',
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

describe('Applications Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockSearch(mockSearchQuery, mockSearchResponse)
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
                }}
            >
                <MemoryRouter>
                    <ApplicationsOverview />
                </MemoryRouter>
            </RecoilRoot>
        )
        // wait for page to load
        await waitForText(mockApplication0.metadata.name!)
    })

    test('should display app info', async () => {
        expect(screen.getByText(SubscriptionKind)).toBeTruthy()
        expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
        expect(screen.getAllByText('Local')).toBeTruthy()
        expect(screen.getAllByText('Git')).toBeTruthy()
        expect(screen.getByText('a few seconds ago')).toBeTruthy()
    })

    test('should display appset', async () => {
        expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
        expect(screen.getByText(ApplicationSetKind)).toBeTruthy()
    })

    test('should display argoapp', async () => {
        expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
        expect(screen.getByText('Discovered')).toBeTruthy()
    })

    test('should filter subscription apps', async () => {
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('application.app.k8s.io/v1beta1')).toBeTruthy()
        userEvent.click(screen.getByTestId('application.app.k8s.io/v1beta1'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const subscriptionCheckBox = screen.queryByTestId('application.app.k8s.io/v1beta1')
        expect(subscriptionCheckBox).toBeNull()
        const applicationSetType = screen.queryByText(ApplicationSetKind)
        expect(applicationSetType).toBeNull()
        const discoveredType = screen.queryByText('Discovered')
        expect(discoveredType).toBeNull()
        expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()
    })

    test('should filter argo apps', async () => {
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('application.argoproj.io/v1alpha1')).toBeTruthy()
        userEvent.click(screen.getByTestId('application.argoproj.io/v1alpha1'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const argoCheckBox = screen.queryByTestId('application.argoproj.io/v1alpha1')
        expect(argoCheckBox).toBeNull()
        const applicationType = screen.queryByText(ApplicationKind)
        expect(applicationType).toBeNull()
        const applicationSetType = screen.queryByText(ApplicationSetKind)
        expect(applicationSetType).toBeNull()
        expect(screen.getAllByText('Discovered')).toBeTruthy()
    })

    test('should filter appset apps', async () => {
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('applicationset.argoproj.io/v1alpha1')).toBeTruthy()
        userEvent.click(screen.getByTestId('applicationset.argoproj.io/v1alpha1'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const argoCheckBox = screen.queryByTestId('applicationset.argoproj.io/v1alpha1')
        expect(argoCheckBox).toBeNull()
        const applicationType = screen.queryByText(ApplicationKind)
        expect(applicationType).toBeNull()
        const discoveredType = screen.queryByText('Discovered')
        expect(discoveredType).toBeNull()
        expect(screen.getAllByText(ApplicationSetKind)).toBeTruthy()
    })
})
