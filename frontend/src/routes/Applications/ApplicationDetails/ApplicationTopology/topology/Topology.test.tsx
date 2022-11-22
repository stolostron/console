/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
//import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Topology, TopologyProps } from './Topology'
const mockProcessactionlink = jest.fn()
const mockDispatchaction = jest.fn()
const mockHandleerrormsg = jest.fn()
const mockComputenodestatus = jest.fn()
const mockGetnodedescription = jest.fn()
const mockGetnodetitle = jest.fn()
const mockGetsectiontitles = jest.fn()
const mockGetnodedetails = jest.fn()
const mockUpdatenodestatus = jest.fn()
const mockUpdatenodeicons = jest.fn()
const mockGetallfilters = jest.fn()
const mockGetavailablefilters = jest.fn()
const mockGetsearchfilter = jest.fn()
const mockFilternodes = jest.fn()
const mockGetconnectedlayoutoptions = jest.fn()
const mockGetunconnectedlayoutoptions = jest.fn()
const mockSetdrawercontent = jest.fn()

describe('Topology tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('app subscription topology', async () => {
        render(<Topology {...subProps} />)

        expect(
            screen.getByRole('button', {
                name: /how to read topology/i,
            })
        ).toBeInTheDocument()

        // userEvent.click(
        //     screen.getByRole('button', {
        //         name: /how to read topology/i,
        //     })
        // )
        // expect(mockSetdrawercontent).toHaveBeenCalledTimes(1)

        //userEvent.click(screen.getByRole('button', { name: /test3\-subscription\-1/i }))

        await new Promise((resolve) => setTimeout(resolve, 500))
        screen.logTestingPlaygroundURL()

        //     1 make sure channel changer in doc
        //     2 make sure sub2 shape is not in doc
        //     3 change channel
        //     4 make sure shape is in doc
        //     2 click “topology legend” button, make sure in doc
        //     3 make sure app shape in doc

        // https://stackoverflow.com/questions/67060108/test-correct-svg-component-renders-with-jest-and-react-testing-library

        //      4 click and make sure details opens

        // screen.getByRole('button', {
        //     name: /zoom in/i
        //   })

        //userEvent.click(playground)
        //userEvent.type(playground, 'input')
        //userEvent.type(playground, '{esc}')
        //userEvent.tab()

        //fireEvent(playground, new MouseEvent('click', {x: 100, y: 0,}))

        //expect(playground).toHaveValue('value')
        //expect(playground).toBeInTheDocument()
        //expect(playground).not.toBeInTheDocument()
        //expect(playground).toBeVisible()
        //expect(playground).toHaveAttribute('disabled')
        //expect(queryAllByText('Info')).toHaveLength(1)
        //await waitFor(() => expect(playground).toHaveValue('value'))
    })
})

const subProps: TopologyProps = {
    elements: {
        activeChannel: 'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        channels: [
            '__ALL__/__ALL__//__ALL__/__ALL__',
            'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            'test/test-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            'test/test-subscription-3//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        ],
        links: [
            {
                source: 'application--test',
                target: 'member--subscription--test--test-subscription-1',
                label: '',
                type: '',
            },
            {
                source: 'member--subscription--test--test-subscription-1',
                target: 'member--clusters----test-subscription-1',
                label: '',
                type: '',
            },
            {
                source: 'member--clusters----test-subscription-1',
                target: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
                label: '',
                type: '',
            },
            {
                source: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
                target: 'member--deployed-resource--member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route--test--helloworld-app-svc--service',
                label: '',
                type: '',
            },
            {
                source: 'member--clusters----test-subscription-1',
                target: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
                label: '',
                type: '',
            },
            {
                source: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
                target: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
                label: '',
                type: '',
            },
            {
                source: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
                target: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
                label: '',
                type: '',
            },
            {
                source: 'application--test',
                target: 'member--subscription--test--test-subscription-2',
                label: '',
                type: '',
            },
            {
                source: 'member--subscription--test--test-subscription-2',
                target: 'member--clusters----test-subscription-2',
                label: '',
                type: '',
            },
        ],
        nodes: [
            {
                name: '',
                namespace: 'test',
                type: 'application',
                id: 'application--test',
                specs: {
                    isDesign: true,
                    raw: {
                        apiVersion: 'app.k8s.io/v1beta1',
                        kind: 'Application',
                        metadata: {
                            annotations: {
                                'apps.open-cluster-management.io/deployables': '',
                                'apps.open-cluster-management.io/subscriptions':
                                    'test/test-subscription-3,test/test-subscription-1-local,test/test-subscription-3-local,test/test-subscription-2-local,test/test-subscription-1,test/test-subscription-2',
                                'open-cluster-management.io/user-group':
                                    'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
                                'open-cluster-management.io/user-identity':
                                    'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
                            },
                            name: 'test',
                            namespace: 'test',
                        },
                        spec: {
                            componentKinds: [
                                {
                                    group: 'apps.open-cluster-management.io',
                                    kind: 'Subscription',
                                },
                            ],
                            descriptor: {},
                            selector: {
                                matchExpressions: [
                                    {
                                        key: 'app',
                                        operator: 'In',
                                        values: ['test'],
                                    },
                                ],
                            },
                        },
                    },
                    activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
                    allSubscriptions: [
                        {
                            apiVersion: 'apps.open-cluster-management.io/v1',
                            kind: 'Subscription',
                            metadata: {
                                annotations: {
                                    'apps.open-cluster-management.io/git-branch': 'main',
                                    'apps.open-cluster-management.io/git-current-commit':
                                        'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                                    'apps.open-cluster-management.io/git-path': 'helloworld',
                                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                                    'open-cluster-management.io/user-group':
                                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                                },
                                labels: {
                                    app: 'test',
                                    'app.kubernetes.io/part-of': 'test',
                                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                                },
                                name: 'test-subscription-1',
                                namespace: 'test',
                            },
                            spec: {
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                placement: {
                                    placementRef: {
                                        kind: 'PlacementRule',
                                        name: 'test-placement-1',
                                    },
                                },
                            },
                            status: {
                                lastUpdateTime: '2022-11-16T14:29:26Z',
                                phase: 'Propagated',
                            },
                            posthooks: [],
                            prehooks: [],
                            channels: [
                                {
                                    apiVersion: 'apps.open-cluster-management.io/v1',
                                    kind: 'Channel',
                                    metadata: {
                                        annotations: {
                                            'apps.open-cluster-management.io/reconcile-rate': 'medium',
                                            'open-cluster-management.io/user-group':
                                                'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                                            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                                        },
                                        name: 'ggithubcom-fxiang1-app-samples',
                                        namespace: 'ggithubcom-fxiang1-app-samples-ns',
                                    },
                                    spec: {
                                        pathname: 'https://github.com/fxiang1/app-samples',
                                        type: 'Git',
                                    },
                                },
                            ],
                            rules: [],
                            report: {
                                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                                kind: 'SubscriptionReport',
                                metadata: {
                                    labels: {
                                        'apps.open-cluster-management.io/hosting-subscription':
                                            'test.test-subscription-1',
                                    },
                                    name: 'test-subscription-1',
                                    namespace: 'test',
                                    ownerReferences: [
                                        {
                                            apiVersion: 'apps.open-cluster-management.io/v1',
                                            blockOwnerDeletion: true,
                                            controller: true,
                                            kind: 'Subscription',
                                            name: 'test-subscription-1',
                                        },
                                    ],
                                },
                                reportType: 'Application',
                                resources: [
                                    {
                                        apiVersion: 'apps/v1',
                                        kind: 'Deployment',
                                        name: 'helloworld-app-deploy',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'route.openshift.io/v1',
                                        kind: 'Route',
                                        name: 'helloworld-app-route',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'Service',
                                        name: 'helloworld-app-svc',
                                        namespace: 'test',
                                    },
                                ],
                                results: [
                                    {
                                        result: 'deployed',
                                        source: 'local-cluster',
                                        timestamp: {
                                            nanos: 0,
                                            seconds: 0,
                                        },
                                    },
                                ],
                                summary: {
                                    clusters: '1',
                                    deployed: '1',
                                    failed: '0',
                                    inProgress: '0',
                                    propagationFailed: '0',
                                },
                            },
                        },
                        {
                            apiVersion: 'apps.open-cluster-management.io/v1',
                            kind: 'Subscription',
                            metadata: {
                                annotations: {
                                    'apps.open-cluster-management.io/git-branch': 'main',
                                    'apps.open-cluster-management.io/git-current-commit':
                                        'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                                    'apps.open-cluster-management.io/git-path': 'large-nb-resource-app',
                                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                                    'open-cluster-management.io/user-group':
                                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                                },
                                labels: {
                                    app: 'test',
                                    'app.kubernetes.io/part-of': 'test',
                                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                                },
                                name: 'test-subscription-2',
                                namespace: 'test',
                            },
                            spec: {
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                placement: {
                                    placementRef: {
                                        kind: 'PlacementRule',
                                        name: 'test-placement-2',
                                    },
                                },
                            },
                            status: {
                                lastUpdateTime: '2022-11-16T14:29:27Z',
                                phase: 'Propagated',
                            },
                            posthooks: [],
                            prehooks: [],
                            channels: [null],
                            rules: [],
                            report: {
                                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                                kind: 'SubscriptionReport',
                                metadata: {
                                    labels: {
                                        'apps.open-cluster-management.io/hosting-subscription':
                                            'test.test-subscription-2',
                                    },
                                    name: 'test-subscription-2',
                                    namespace: 'test',
                                    ownerReferences: [
                                        {
                                            apiVersion: 'apps.open-cluster-management.io/v1',
                                            blockOwnerDeletion: true,
                                            controller: true,
                                            kind: 'Subscription',
                                            name: 'test-subscription-2',
                                        },
                                    ],
                                },
                                reportType: 'Application',
                                resources: [
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-31',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-50',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'Service',
                                        name: 'helloworld-app-svc',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-2222',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-12',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-58',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-61',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'apps/v1',
                                        kind: 'Deployment',
                                        name: 'pause-deploy3',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-10',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'ConfigMap',
                                        name: 'test-configmap-24',
                                        namespace: 'test',
                                    },
                                ],
                                results: [
                                    {
                                        result: 'failed',
                                        source: 'local-cluster',
                                        timestamp: {
                                            nanos: 0,
                                            seconds: 0,
                                        },
                                    },
                                ],
                                summary: {
                                    clusters: '1',
                                    deployed: '0',
                                    failed: '1',
                                    inProgress: '0',
                                    propagationFailed: '0',
                                },
                            },
                        },
                        {
                            apiVersion: 'apps.open-cluster-management.io/v1',
                            kind: 'Subscription',
                            metadata: {
                                annotations: {
                                    'apps.open-cluster-management.io/git-branch': 'main',
                                    'apps.open-cluster-management.io/git-current-commit':
                                        'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                                    'apps.open-cluster-management.io/git-path': 'mortgage',
                                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                                    'open-cluster-management.io/user-group':
                                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                                },
                                labels: {
                                    app: 'test',
                                    'app.kubernetes.io/part-of': 'test',
                                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                                },
                                name: 'test-subscription-3',
                                namespace: 'test',
                            },
                            spec: {
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                placement: {
                                    placementRef: {
                                        kind: 'PlacementRule',
                                        name: 'test-placement-3',
                                    },
                                },
                            },
                            status: {
                                lastUpdateTime: '2022-11-16T14:29:28Z',
                                phase: 'Propagated',
                            },
                            posthooks: [],
                            prehooks: [],
                            channels: [null],
                            rules: [],
                            report: {
                                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                                kind: 'SubscriptionReport',
                                metadata: {
                                    labels: {
                                        'apps.open-cluster-management.io/hosting-subscription':
                                            'test.test-subscription-3',
                                    },
                                    name: 'test-subscription-3',
                                    namespace: 'test',
                                    ownerReferences: [
                                        {
                                            apiVersion: 'apps.open-cluster-management.io/v1',
                                            blockOwnerDeletion: true,
                                            controller: true,
                                            kind: 'Subscription',
                                            name: 'test-subscription-3',
                                        },
                                    ],
                                },
                                reportType: 'Application',
                                resources: [
                                    {
                                        apiVersion: 'apps/v1',
                                        kind: 'Deployment',
                                        name: 'mortgage-app-deploy',
                                        namespace: 'test',
                                    },
                                    {
                                        apiVersion: 'v1',
                                        kind: 'Service',
                                        name: 'mortgage-app-svc',
                                        namespace: 'test',
                                    },
                                ],
                                results: [
                                    {
                                        result: 'deployed',
                                        source: 'local-cluster',
                                        timestamp: {
                                            nanos: 0,
                                            seconds: 0,
                                        },
                                    },
                                ],
                                summary: {
                                    clusters: '1',
                                    deployed: '1',
                                    failed: '0',
                                    inProgress: '0',
                                    propagationFailed: '0',
                                },
                            },
                        },
                    ],
                    allChannels: [null],
                    allClusters: {
                        isLocal: true,
                        remoteCount: 0,
                    },
                    searchClusters: [
                        {
                            _uid: 'cluster__local-cluster',
                            nodes: 6,
                            _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                            kind: 'cluster',
                            name: 'local-cluster',
                            _clusterNamespace: 'local-cluster',
                            apigroup: 'internal.open-cluster-management.io',
                            label: 'cloud=Amazon; cluster.open-cluster-management.io/clusterset=hub; clusterID=70ebe797-4791-4958-be17-f088411a0db5; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.11.0-fc.3; velero.io/exclude-from-backup=true; vendor=OpenShift',
                            ManagedClusterImportSucceeded: 'True',
                            HubAcceptedManagedCluster: 'True',
                            ManagedClusterConditionAvailable: 'True',
                            created: '2022-07-08T13:02:56Z',
                            cpu: 36,
                            kubernetesVersion: 'v1.24.0+284d62a',
                            memory: '144758296Ki',
                            ManagedClusterJoined: 'True',
                            addon: 'application-manager=true; cert-policy-controller=true; iam-policy-controller=true; policy-controller=true; search-collector=false',
                            consoleURL:
                                'https://console-openshift-console.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                            status: 'OK',
                            ClusterCertificateRotated: 'True',
                        },
                    ],
                    pulse: 'green',
                    shapeType: 'application',
                },
            },
            {
                name: 'test-subscription-1',
                namespace: 'test',
                type: 'subscription',
                id: 'member--subscription--test--test-subscription-1',
                specs: {
                    title: 'helloworld',
                    isDesign: true,
                    hasRules: false,
                    isPlaced: false,
                    clustersNames: ['local-cluster'],
                    searchClusters: [null],
                    subscriptionModel: {
                        'test-subscription-1-local-cluster': [
                            {
                                _uid: 'local-cluster/581c0b05-81c3-489f-b733-94892e2aa32b',
                                _gitpath: 'helloworld',
                                _gitbranch: 'main',
                                _hubClusterResource: 'true',
                                apiversion: 'v1',
                                apigroup: 'apps.open-cluster-management.io',
                                localPlacement: 'false',
                                cluster: 'local-cluster',
                                timeWindow: 'none',
                                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                                namespace: 'test',
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                created: '2022-11-16T14:29:26Z',
                                label: 'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                                kind: 'subscription',
                                name: 'test-subscription-1',
                                status: 'Propagated',
                            },
                        ],
                        'test-subscription-1-local-local-cluster': [
                            {
                                _uid: 'local-cluster/452e02f9-0824-4e16-89ba-b0433a997e3c',
                                _hubClusterResource: 'true',
                                apiversion: 'v1',
                                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                                _gitpath: 'helloworld',
                                status: 'Subscribed',
                                apigroup: 'apps.open-cluster-management.io',
                                created: '2022-11-16T14:29:26Z',
                                kind: 'subscription',
                                cluster: 'local-cluster',
                                namespace: 'test',
                                _hostingSubscription: 'test/test-subscription-1',
                                name: 'test-subscription-1-local',
                                timeWindow: 'none',
                                _gitbranch: 'main',
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                localPlacement: 'true',
                                label: 'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                            },
                        ],
                    },
                    pulse: 'green',
                    shapeType: 'subscription',
                },
            },
            {
                name: '',
                namespace: '',
                type: 'cluster',
                id: 'member--clusters----test-subscription-1',
                specs: {
                    title: '',
                    resourceCount: 0,
                    clustersNames: [],
                    clusters: [],
                    sortedClusterNames: [],
                    appClusters: [],
                    searchClusters: [],
                    pulse: 'red',
                    shapeType: 'cluster',
                },
            },
            {
                name: 'helloworld-app-route',
                namespace: 'test',
                type: 'route',
                id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
                specs: {
                    isDesign: false,
                    parent: {
                        parentId: 'member--clusters----test-subscription-1',
                        parentName: '',
                        parentType: 'cluster',
                    },
                    template: {
                        template: {
                            apiVersion: 'route.openshift.io/v1',
                            kind: 'Route',
                            metadata: {
                                annotations: {
                                    'apps.open-cluster-management.io/hosting-subscription':
                                        'test/test-subscription-1-local',
                                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                                    'openshift.io/host.generated': 'true',
                                },
                                labels: {
                                    app: 'helloworld-app',
                                    'app.kubernetes.io/part-of': 'test',
                                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                                },
                                name: 'helloworld-app-route',
                                namespace: 'test',
                            },
                            spec: {
                                host: 'helloworld-app-route-test.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                                port: {
                                    targetPort: 3002,
                                },
                                to: {
                                    kind: 'Service',
                                    name: 'helloworld-app-svc',
                                    weight: 100,
                                },
                                wildcardPolicy: 'None',
                            },
                            status: {
                                ingress: [
                                    {
                                        conditions: [
                                            {
                                                lastTransitionTime: '2022-11-16T14:29:27Z',
                                                status: 'True',
                                                type: 'Admitted',
                                            },
                                        ],
                                        host: 'helloworld-app-route-test.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                                        routerCanonicalHostname:
                                            'router-default.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                                        routerName: 'default',
                                        wildcardPolicy: 'None',
                                    },
                                ],
                            },
                        },
                    },
                    resourceCount: 1,
                    searchClusters: [null],
                    pulse: 'orange',
                    shapeType: 'route',
                },
            },
            {
                name: 'helloworld-app-svc',
                namespace: 'test',
                type: 'service',
                id: 'member--deployed-resource--member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route--test--helloworld-app-svc--service',
                specs: {
                    isDesign: false,
                    parent: {
                        parentId:
                            'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
                        parentName: 'helloworld-app-route',
                        parentType: 'route',
                    },
                    resourceCount: 1,
                    searchClusters: [null],
                    pulse: 'orange',
                    shapeType: 'service',
                },
            },
            {
                name: 'helloworld-app-deploy',
                namespace: 'test',
                type: 'deployment',
                id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
                specs: {
                    isDesign: false,
                    parent: {
                        parentId: 'member--clusters----test-subscription-1',
                        parentName: '',
                        parentType: 'cluster',
                    },
                    template: {
                        related: [
                            {
                                kind: 'pod',
                                items: [
                                    {
                                        _uid: 'local-cluster/b6a53e57-b2e1-4d3e-b61f-e77ce2b20f02',
                                        status: 'Running',
                                        hostIP: '10.0.170.20',
                                        container: 'helloworld-app-container',
                                        _rbac: 'test_null_pods',
                                        name: 'helloworld-app-deploy-6f68457854-w4q2t',
                                        kind: 'pod',
                                        label: 'app=helloworld-app; pod-template-hash=6f68457854',
                                        _hubClusterResource: 'true',
                                        apiversion: 'v1',
                                        startedAt: '2022-11-16T14:29:27Z',
                                        _ownerUID: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                                        restarts: 0,
                                        podIP: '10.131.1.59',
                                        created: '2022-11-16T14:29:27Z',
                                        namespace: 'test',
                                        image: 'quay.io/fxiang1/helloworld:0.0.1',
                                        cluster: 'local-cluster',
                                    },
                                ],
                            },
                            {
                                kind: 'replicaset',
                                items: [
                                    {
                                        _uid: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                                        _hostingSubscription: 'test/test-subscription-1-local',
                                        _rbac: 'test_apps_replicasets',
                                        namespace: 'test',
                                        created: '2022-11-16T14:29:27Z',
                                        apiversion: 'v1',
                                        cluster: 'local-cluster',
                                        name: 'helloworld-app-deploy-6f68457854',
                                        apigroup: 'apps',
                                        current: 1,
                                        desired: 1,
                                        label: 'app=helloworld-app; pod-template-hash=6f68457854',
                                        _hubClusterResource: 'true',
                                        kind: 'replicaset',
                                    },
                                ],
                            },
                        ],
                    },
                    resourceCount: 1,
                    searchClusters: [null],
                    deploymentModel: {
                        'helloworld-app-deploy-local-cluster': [
                            {
                                _uid: 'local-cluster/07aeae15-0e92-4f36-801f-4f0ffb1f3adf',
                                _rbac: 'test_apps_deployments',
                                desired: 1,
                                label: 'app.kubernetes.io/part-of=test; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                                name: 'helloworld-app-deploy',
                                ready: 1,
                                apiversion: 'v1',
                                kind: 'deployment',
                                available: 1,
                                current: 1,
                                _hostingSubscription: 'test/test-subscription-1-local',
                                apigroup: 'apps',
                                namespace: 'test',
                                cluster: 'local-cluster',
                                _hubClusterResource: 'true',
                                created: '2022-11-16T14:29:27Z',
                                resStatus: '1/1',
                                pulse: 'green',
                            },
                        ],
                    },
                    pulse: 'green',
                    shapeType: 'deployment',
                },
            },
            {
                name: 'helloworld-app-deploy',
                namespace: 'test',
                type: 'replicaset',
                id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
                specs: {
                    isDesign: false,
                    resourceCount: 1,
                    replicaCount: 1,
                    parent: {
                        parentId:
                            'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
                        parentName: 'helloworld-app-deploy',
                        parentType: 'deployment',
                    },
                    searchClusters: [null],
                    replicasetModel: {
                        'helloworld-app-deploy-local-cluster': [
                            {
                                _uid: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                                _hostingSubscription: 'test/test-subscription-1-local',
                                _rbac: 'test_apps_replicasets',
                                namespace: 'test',
                                created: '2022-11-16T14:29:27Z',
                                apiversion: 'v1',
                                cluster: 'local-cluster',
                                name: 'helloworld-app-deploy-6f68457854',
                                apigroup: 'apps',
                                current: 1,
                                desired: 1,
                                label: 'app=helloworld-app; pod-template-hash=6f68457854',
                                _hubClusterResource: 'true',
                                kind: 'replicaset',
                                resStatus: '1/1',
                                pulse: 'green',
                            },
                        ],
                    },
                    pulse: 'green',
                    shapeType: 'replicaset',
                },
            },
            {
                name: 'helloworld-app-deploy',
                namespace: 'test',
                type: 'pod',
                id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
                specs: {
                    isDesign: false,
                    resourceCount: 1,
                    replicaCount: 1,
                    parent: {
                        parentId:
                            'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
                        parentName: 'helloworld-app-deploy',
                        parentType: 'replicaset',
                    },
                    searchClusters: [null],
                    podModel: {
                        'helloworld-app-deploy-local-cluster': [
                            {
                                _uid: 'local-cluster/b6a53e57-b2e1-4d3e-b61f-e77ce2b20f02',
                                status: 'Running',
                                hostIP: '10.0.170.20',
                                container: 'helloworld-app-container',
                                _rbac: 'test_null_pods',
                                name: 'helloworld-app-deploy-6f68457854-w4q2t',
                                kind: 'pod',
                                label: 'app=helloworld-app; pod-template-hash=6f68457854',
                                _hubClusterResource: 'true',
                                apiversion: 'v1',
                                startedAt: '2022-11-16T14:29:27Z',
                                _ownerUID: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                                restarts: 0,
                                podIP: '10.131.1.59',
                                created: '2022-11-16T14:29:27Z',
                                namespace: 'test',
                                image: 'quay.io/fxiang1/helloworld:0.0.1',
                                cluster: 'local-cluster',
                                resStatus: 'running',
                                pulse: 'green',
                            },
                        ],
                    },
                    pulse: 'green',
                    shapeType: 'pod',
                },
            },
            {
                name: 'test-subscription-2',
                namespace: 'test',
                type: 'subscription',
                id: 'member--subscription--test--test-subscription-2',
                specs: {
                    title: 'large-nb-resource-app',
                    isDesign: true,
                    hasRules: false,
                    isPlaced: false,
                    clustersNames: ['local-cluster'],
                    searchClusters: [null],
                    subscriptionModel: {
                        'test-subscription-2-local-cluster': [
                            {
                                _uid: 'local-cluster/df5d0e8c-9839-4e24-923d-fb2e12b095dd',
                                apigroup: 'apps.open-cluster-management.io',
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                name: 'test-subscription-2',
                                timeWindow: 'none',
                                _hubClusterResource: 'true',
                                namespace: 'test',
                                kind: 'subscription',
                                _gitbranch: 'main',
                                label: 'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                                apiversion: 'v1',
                                localPlacement: 'false',
                                cluster: 'local-cluster',
                                _gitpath: 'large-nb-resource-app',
                                created: '2022-11-16T14:29:26Z',
                                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                                status: 'Propagated',
                            },
                        ],
                        'test-subscription-2-local-local-cluster': [
                            {
                                _uid: 'local-cluster/2d5756dd-e7bb-4ee4-a129-2db885255085',
                                _hostingSubscription: 'test/test-subscription-2',
                                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                                timeWindow: 'none',
                                kind: 'subscription',
                                namespace: 'test',
                                apiversion: 'v1',
                                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                                cluster: 'local-cluster',
                                label: 'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                                _hubClusterResource: 'true',
                                apigroup: 'apps.open-cluster-management.io',
                                created: '2022-11-16T14:29:28Z',
                                localPlacement: 'true',
                                _gitpath: 'large-nb-resource-app',
                                name: 'test-subscription-2-local',
                                status: 'Subscribed',
                                _gitbranch: 'main',
                            },
                        ],
                    },
                    pulse: 'red',
                    shapeType: 'subscription',
                },
            },
            {
                name: '',
                namespace: '',
                type: 'cluster',
                id: 'member--clusters----test-subscription-2',
                specs: {
                    title: '',
                    resourceCount: 0,
                    clustersNames: [],
                    clusters: [],
                    sortedClusterNames: [],
                    appClusters: [],
                    searchClusters: [],
                    pulse: 'red',
                    shapeType: 'cluster',
                },
            },
        ],
    },
    processActionLink: mockProcessactionlink,
    canUpdateStatuses: true,
    argoAppDetailsContainerControl: {
        argoAppDetailsContainerData: {
            page: 1,
            startIdx: 0,
            argoAppSearchToggle: false,
            expandSectionToggleMap: new Set(),
            selectedArgoAppList: [],
            isLoading: false,
        },
        handleArgoAppDetailsContainerUpdate: mockDispatchaction,
        handleErrorMsg: mockHandleerrormsg,
    },
    clusterDetailsContainerControl: {
        clusterDetailsContainerData: {
            page: 1,
            startIdx: 0,
            clusterSearchToggle: false,
            isSelectOpen: false,
            expandSectionToggleMap: {},
            selectedClusterList: [],
        },
        handleClusterDetailsContainerUpdate: mockDispatchaction,
    },
    channelControl: {
        allChannels: [
            '__ALL__/__ALL__//__ALL__/__ALL__',
            'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            'test/test-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            'test/test-subscription-3//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        ],
        activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
        setActiveChannel: mockDispatchaction,
    },
    options: {
        typeToShapeMap: {
            application: {
                shape: 'application',
                className: 'design',
                nodeRadius: 30,
            },
            applicationset: {
                shape: 'application',
                className: 'design',
                nodeRadius: 30,
            },
            cluster: {
                shape: 'cluster',
                className: 'container',
            },
            clusters: {
                shape: 'cluster',
                className: 'container',
            },
            ansiblejob: {
                shape: 'ansiblejob',
                className: 'container',
            },
            configmap: {
                shape: 'configmap',
                className: 'container',
            },
            container: {
                shape: 'container',
                className: 'container',
            },
            customresource: {
                shape: 'customresource',
                className: 'container',
            },
            daemonset: {
                shape: 'daemonset',
                className: 'daemonset',
            },
            deployable: {
                shape: 'deployable',
                className: 'design',
            },
            deployment: {
                shape: 'deployment',
                className: 'deployment',
            },
            deploymentconfig: {
                shape: 'deploymentconfig',
                className: 'deployment',
            },
            helmrelease: {
                shape: 'chart',
                className: 'container',
            },
            host: {
                shape: 'host',
                className: 'host',
            },
            ingress: {
                shape: 'ingress',
                className: 'host',
            },
            internet: {
                shape: 'cloud',
                className: 'internet',
            },
            namespace: {
                shape: 'namespace',
                className: 'host',
            },
            node: {
                shape: 'node',
                className: 'host',
            },
            other: {
                shape: 'other',
                className: 'default',
            },
            package: {
                shape: 'chart',
                className: 'container',
            },
            placement: {
                shape: 'placement',
                className: 'design',
            },
            pod: {
                shape: 'pod',
                className: 'pod',
            },
            policy: {
                shape: 'policy',
                className: 'design',
                nodeRadius: 30,
            },
            replicaset: {
                shape: 'replicaset',
                className: 'container',
            },
            replicationcontroller: {
                shape: 'replicationcontroller',
                className: 'container',
            },
            route: {
                shape: 'route',
                className: 'container',
            },
            placements: {
                shape: 'placements',
                className: 'design',
            },
            secret: {
                shape: 'secret',
                className: 'service',
            },
            service: {
                shape: 'service',
                className: 'service',
            },
            statefulset: {
                shape: 'statefulset',
                className: 'default',
            },
            storageclass: {
                shape: 'storageclass',
                className: 'default',
            },
            subscription: {
                shape: 'subscription',
                className: 'design',
            },
            subscriptionblocked: {
                shape: 'subscriptionblocked',
                className: 'design',
            },
        },
        diagramOptions: {
            showLineLabels: true,
            showGroupTitles: false,
        },
        computeNodeStatus: mockComputenodestatus,
        getNodeDescription: mockGetnodedescription,
        getNodeTitle: mockGetnodetitle,
        getSectionTitles: mockGetsectiontitles,
        getNodeDetails: mockGetnodedetails,
        updateNodeStatus: mockUpdatenodestatus,
        updateNodeIcons: mockUpdatenodeicons,
        getAllFilters: mockGetallfilters,
        getAvailableFilters: mockGetavailablefilters,
        getSearchFilter: mockGetsearchfilter,
        filterNodes: mockFilternodes,
        getConnectedLayoutOptions: mockGetconnectedlayoutoptions,
        getUnconnectedLayoutOptions: mockGetunconnectedlayoutoptions,
    },
    setDrawerContent: mockSetdrawercontent,
}

//    expect(mockProcessactionlink).toHaveBeenCalledTimes(0)
//    expect(mockDispatchaction).toHaveBeenCalledTimes(0)
//    expect(mockHandleerrormsg).toHaveBeenCalledTimes(0)
//    expect(mockComputenodestatus).toHaveBeenCalledTimes(0)
//    expect(mockGetnodedescription).toHaveBeenCalledTimes(0)
//    expect(mockGetnodetitle).toHaveBeenCalledTimes(0)
//    expect(mockGetsectiontitles).toHaveBeenCalledTimes(0)
//    expect(mockGetnodedetails).toHaveBeenCalledTimes(0)
//    expect(mockUpdatenodestatus).toHaveBeenCalledTimes(0)
//    expect(mockUpdatenodeicons).toHaveBeenCalledTimes(0)
//    expect(mockGetallfilters).toHaveBeenCalledTimes(0)
//    expect(mockGetavailablefilters).toHaveBeenCalledTimes(0)
//    expect(mockGetsearchfilter).toHaveBeenCalledTimes(0)
//    expect(mockFilternodes).toHaveBeenCalledTimes(0)
//    expect(mockGetconnectedlayoutoptions).toHaveBeenCalledTimes(0)
//    expect(mockGetunconnectedlayoutoptions).toHaveBeenCalledTimes(0)

// console.log(mockProcessactionlink.mock.calls.length)
// console.log(mockDispatchaction.mock.calls.length)
// console.log(mockHandleerrormsg.mock.calls.length)
// console.log(mockComputenodestatus.mock.calls.length)
// console.log(mockGetnodedescription.mock.calls.length)
// console.log(mockGetnodetitle.mock.calls.length)
// console.log(mockGetsectiontitles.mock.calls.length)
// console.log(mockGetnodedetails.mock.calls.length)
// console.log(mockUpdatenodestatus.mock.calls.length)
// console.log(mockUpdatenodeicons.mock.calls.length)
// console.log(mockGetallfilters.mock.calls.length)
// console.log(mockGetavailablefilters.mock.calls.length)
// console.log(mockGetsearchfilter.mock.calls.length)
// console.log(mockFilternodes.mock.calls.length)
// console.log(mockGetconnectedlayoutoptions.mock.calls.length)
// console.log(mockGetunconnectedlayoutoptions.mock.calls.length)
