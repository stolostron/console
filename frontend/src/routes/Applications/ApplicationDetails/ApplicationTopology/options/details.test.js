// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { getNodeDetails } from './details'
import { inflateKubeValue } from '../helpers/diagram-helpers'

const t = (string) => {
    return string
}

describe('getNodeDetails no clusters or violation', () => {
    const clusterNode = {
        id: 'member--clusters--c1',
        uid: 'member--clusters--c1',
        name: 'c2',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusterNames: ['c2', 'local-cluster'],
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
        layout: {
            uid: 'member--clusters--c1',
            type: 'cluster',
            label: 'c1',
            compactLabel: 'c1',
            nodeIcons: {},
            nodeStatus: '',
            isDisabled: false,
            title: '',
            description: '',
            tooltips: [
                {
                    name: 'Cluster',
                    value: 'c1',
                    href: "/search?filters={'textsearch':'kind:cluster name:c1'}",
                },
            ],
            x: 76.5,
            y: 241.5,
            section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
            testBBox: {
                x: -11.6875,
                y: 5,
                width: 23.375,
                height: 13.669,
            },
            lastPosition: { x: 76.5, y: 241.5 },
            selected: true,
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        { labelKey: 'Select a cluster to view details', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Clusters (0)', type: 'label' },
        {
            comboboxdata: {
                clusterID: 'member--clusters--c1',
                clusterList: [],
            },
            type: 'clusterdetailcombobox',
        },
    ]
    it('should process the node, no clusters or violation', () => {
        expect(getNodeDetails(clusterNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails application node', () => {
    const applicationNode = {
        cluster: null,
        clusterName: null,
        id: 'application--nginx-app-3',
        labels: null,
        layout: {
            uid: 'application--nginx-app-3',
            type: 'application',
            label: 'nginx-app-3',
            compactLabel: 'nginx-app-3',
            nodeIcons: {
                classType: 'failure',
                dx: 16,
                dy: -16,
                height: 16,
                icon: 'failure',
                width: 16,
            },
            nodeStatus: '',
            search: '',
            title: '',
            x: 1.5,
            y: 1.5,
        },
        name: 'nginx-app-3',
        namespace: 'ns-sub-1',
        specs: {
            isDesign: true,
            row: 0,
            raw: {
                kind: 'PlacementRule',
                metadata: {
                    namespace: 'ns-sub-1',
                },
            },
        },
        topology: null,
        type: 'application',
        uid: 'application--nginx-app-3',
        __typename: 'Resource',
    }

    const expectedResult = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            indent: undefined,
            labelKey: 'Type',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'Application',
        },
        {
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'ns-sub-1',
        },
        {
            indent: undefined,
            labelKey: 'Labels',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'No labels',
        },
        { type: 'spacer' },
        {
            labelKey: 'Subscription Selector',
            status: true,
            value: 'This application has no subscription match selector (spec.selector.matchExpressions)',
        },
        { type: 'spacer' },
        {
            labelKey: 'Error',
            status: 'failure',
            value: 'This application has no matched subscription. Make sure the subscription match selector spec.selector.matchExpressions exists and matches a Subscription resource created in the {{0}} namespace.',
        },
        {
            type: 'link',
            value: {
                data: {
                    action: 'open_link',
                    targetLink:
                        '/search?filters={"textsearch":"kind%3Asubscription%20namespace%3Ans-sub-1%20cluster%3Alocal-cluster"}',
                },
                id: 'application--nginx-app-3-subscrSearch',
                label: 'View all subscriptions in {{0}} namespace',
            },
        },
    ]

    it('should process the node, application node', () => {
        expect(getNodeDetails(applicationNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails cluster node 1', () => {
    const clusterNode = {
        id: 'member--clusters--feng',
        uid: 'member--clusters--feng',
        name: 'feng',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusters: [
                {
                    consoleURL: 'aaa',
                    consoleip: 'api',
                    metadata: {
                        name: 'feng',
                        namespace: 'ns',
                    },
                },
            ],
            clusterNames: ['feng'],
            cluster: {
                consoleURL: 'aaa',
                consoleip: 'api',
                capacity: {
                    nodes: [],
                    cpu: '10',
                    memory: '32',
                },
                allocatable: {
                    pods: [],
                    cpu: '8',
                    memory: '24',
                },
            },
            violations: [
                {
                    name: 'Violation1',
                },
                {
                    name: 'Violation2',
                },
            ],
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
        layout: {
            uid: 'member--clusters--feng',
            type: 'cluster',
            label: 'feng',
            compactLabel: 'feng',
            nodeIcons: {},
            nodeStatus: '',
            isDisabled: false,
            title: '',
            description: '',
            tooltips: [
                {
                    name: 'Cluster',
                    value: 'feng',
                    href: "/search?filters={'textsearch':'kind:cluster name:feng'}",
                },
            ],
            x: 76.5,
            y: 241.5,
            section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
            testBBox: {
                x: -11.6875,
                y: 5,
                width: 23.375,
                height: 13.669,
            },
            lastPosition: { x: 76.5, y: 241.5 },
            selected: true,
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        {
            labelKey: 'Select a cluster to view details',
            type: 'label',
        },
        { type: 'spacer' },
        {
            labelValue: 'Clusters (1)',
            type: 'label',
        },
        {
            comboboxdata: {
                clusterID: 'member--clusters--feng',
                clusterList: [
                    {
                        allocatable: {
                            cpu: '8',
                            memory: '24',
                            pods: [],
                        },
                        capacity: {
                            cpu: '10',
                            memory: '32',
                            nodes: [],
                        },
                        consoleURL: 'aaa',
                        consoleip: 'api',
                    },
                ],
            },
            type: 'clusterdetailcombobox',
        },
    ]

    it('should process the node, cluster node 2', () => {
        expect(getNodeDetails(clusterNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails clusters node', () => {
    const clusterNode = {
        id: 'member--clusters--braveman',
        uid: 'member--clusters--braveman',
        name: 'braveman',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusters: [
                {
                    metatdata: {
                        name: 'braveman',
                        namespace: 'default',
                        labels: {
                            cloud: 'AWS',
                            env: 'Dev',
                        },
                    },
                    capacity: {
                        nodes: [],
                        cpu: '10',
                        memory: '32Gi',
                        storage: '500Gi',
                    },
                    usage: {
                        pods: [],
                        cpu: '8',
                        memory: '24Ti',
                        storage: '400Ei',
                    },
                },
                {
                    metatdata: {
                        name: 'possiblereptile',
                        namespace: 'default',
                        labels: {
                            cloud: 'AWS',
                            env: 'Dev',
                        },
                    },
                    capacity: {
                        nodes: [],
                        cpu: '10',
                        memory: '32Gi',
                    },
                    allocatable: {
                        pods: [],
                        cpu: '8',
                        memory: '24Ti',
                    },
                },
            ],
            clusterNames: ['braveman', 'possiblereptile'],
            violations: [
                {
                    name: 'Violation1',
                },
                {
                    name: 'Violation2',
                },
            ],
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
        layout: {
            uid: 'member--clusters--feng',
            type: 'cluster',
            label: 'feng',
            compactLabel: 'feng',
            nodeIcons: {},
            nodeStatus: '',
            isDisabled: false,
            title: '',
            description: '',
            tooltips: [
                {
                    name: 'Cluster',
                    value: 'feng',
                    href: "/search?filters={'textsearch':'kind:cluster name:feng'}",
                },
            ],
            x: 76.5,
            y: 241.5,
            section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
            testBBox: {
                x: -11.6875,
                y: 5,
                width: 23.375,
                height: 13.669,
            },
            lastPosition: { x: 76.5, y: 241.5 },
            selected: true,
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        {
            labelKey: 'Select a cluster to view details',
            type: 'label',
        },
        { type: 'spacer' },
        {
            labelValue: 'Clusters (2)',
            type: 'label',
        },
        {
            comboboxdata: {
                clusterID: 'member--clusters--braveman',
                clusterList: [
                    {
                        capacity: {
                            cpu: '10',
                            memory: '32Gi',
                            nodes: [],
                            storage: '500Gi',
                        },
                        metatdata: {
                            labels: {
                                cloud: 'AWS',
                                env: 'Dev',
                            },
                            name: 'braveman',
                            namespace: 'default',
                        },
                        usage: {
                            cpu: '8',
                            memory: '24Ti',
                            pods: [],
                            storage: '400Ei',
                        },
                    },
                    {
                        allocatable: {
                            cpu: '8',
                            memory: '24Ti',
                            pods: [],
                        },
                        capacity: {
                            cpu: '10',
                            memory: '32Gi',
                            nodes: [],
                        },
                        metatdata: {
                            labels: {
                                cloud: 'AWS',
                                env: 'Dev',
                            },
                            name: 'possiblereptile',
                            namespace: 'default',
                        },
                    },
                ],
            },
            type: 'clusterdetailcombobox',
        },
    ]

    it('should process the clusters node', () => {
        expect(getNodeDetails(clusterNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails subscription', () => {
    const subscription = {
        id: 'member--subscription--sahar-test-ns--sahar-test-1234-subscription-1',
        uid: 'member--subscription--sahar-test-ns--sahar-test-1234-subscription-1',
        name: 'sahar-test-1234-subscription-1',
        cluster: null,
        clusterName: null,
        type: 'subscription',
        specs: {
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                metadata: {
                    annotations: {
                        'apps.open-cluster-management.io/git-branch': 'main',
                        'apps.open-cluster-management.io/git-desired-commit': 'a123',
                        'apps.open-cluster-management.io/git-path': 'path1234',
                        'apps.open-cluster-management.io/git-tag': 'b456',
                        'apps.open-cluster-management.io/reconcile-option': 'merge',
                        'apps.open-cluster-management.io/reconcile-rate': 'off',
                    },
                    labels: {
                        app: 'sahar-test-1234',
                    },
                    name: 'sahar-test-1234-subscription-1',
                    namespace: 'sahar-test-ns',
                    resourceVersion: '8213214',
                    selfLink:
                        '/apis/apps.open-cluster-management.io/v1/namespaces/sahar-test-ns/subscriptions/sahar-test-1234-subscription-1',
                    uid: '874128a2-c5fc-4cff-a3c2-5067fa113cf6',
                },
                spec: {
                    channel: 'ggithubcom-fxiang1-app-samples1234-ns/ggithubcom-fxiang1-app-samples1234',
                    placement: {
                        placementRef: {
                            kind: 'PlacementRule',
                            name: 'sahar-test-1234-placement-1',
                        },
                    },
                },
                status: {
                    lastUpdateTime: '2021-04-21T16:23:18Z',
                    phase: 'PropagationFailed',
                    reason: 'failed to initialize Git connection, err: authentication required',
                },
                channels: [],
            },
            row: 43,
            clustersNames: ['local-cluster'],
            pulse: 'orange',
            shapeType: 'subscription',
            isDesign: true,
        },
        namespace: 'sahar-test-ns',
        topology: null,
        labels: null,
    }
    const expectedValue = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            type: 'label',
            labelKey: 'Type',
            labelValue: undefined,
            value: 'Subscription',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'API Version',
            labelValue: undefined,
            value: 'apps.open-cluster-management.io/v1',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Namespace',
            labelValue: undefined,
            value: 'sahar-test-ns',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Labels',
            labelValue: undefined,
            value: 'app=sahar-test-1234',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Channel',
            labelValue: undefined,
            value: 'ggithubcom-fxiang1-app-samples1234-ns/ggithubcom-fxiang1-app-samples1234',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Placement Ref',
            labelValue: undefined,
            value: 'kind=PlacementRule,name=sahar-test-1234-placement-1',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Git branch',
            labelValue: undefined,
            value: 'main',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Git path',
            labelValue: undefined,
            value: 'path1234',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Git tag',
            labelValue: undefined,
            value: 'b456',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Git commit',
            labelValue: undefined,
            value: 'a123',
            indent: undefined,
            status: undefined,
        },
        {
            type: 'label',
            labelKey: 'Reconcile rate',
            labelValue: undefined,
            value: 'off',
            indent: undefined,
            status: undefined,
        },
        { type: 'spacer' },
        { type: 'spacer' },
        { type: 'label', labelKey: 'Cluster deploy status' },
        {
            labelValue: 'Remote subscriptions',
            value: 'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the klusterlet-addon-appmgr pod runs on the managed clusters.',
            status: 'failure',
        },
        {
            type: 'link',
            value: {
                label: 'View all placement rules in {{0}} namespace',
                id: 'member--subscription--sahar-test-ns--sahar-test-1234-subscription-1-subscrSearch',
                data: {
                    action: 'open_link',
                    targetLink:
                        '/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3Asahar-test-ns%20cluster%3Alocal-cluster"}',
                },
            },
        },
        { type: 'spacer' },
    ]

    it('should process the node and show the details', () => {
        expect(
            getNodeDetails(subscription, undefined, ['application', 'cluster', 'placements', 'subscription'], t)
        ).toEqual(expectedValue)
    })
})

describe('getNodeDetails deployment node', () => {
    const deploymentNode = {
        id: 'member--member--deployable--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        name: 'mortgage-app-deploy',
        cluster: null,
        clusterName: null,
        type: 'deployment',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'feng',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'cluster1',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'cluster2',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['feng', 'cluster1', 'cluster2'],
            deploymentModel: {
                'mortgage-app-deploy-feng': [
                    {
                        cluster: 'feng',
                        namespace: 'default',
                        ready: 3,
                        desired: 3,
                    },
                ],
                'mortgage-app-deploy-cluster1': [],
            },
            podModel: {
                'mortgagedc-deploy-1-q9b5r-feng': [
                    {
                        cluster: 'feng',
                        container: 'mortgagedc-mortgage',
                        hostIP: '1.1.1.1',
                        image: 'fxiang/mortgage:0.4.0',
                        kind: 'pod',
                        label: 'app=mortgagedc-mortgage; deployment=mortgagedc-deploy-1; deploymentConfig=mortgagedc-mortgage; deploymentconfig=mortgagedc-deploy',
                        name: 'mortgagedc-deploy-1-q9b5r',
                        namespace: 'default',
                        podIP: '10.128.2.80',
                        restarts: 0,
                        selfLink: '/api/v1/namespaces/default/pods/mortgagedc-deploy-1-q9b5r',
                        status: 'Running',
                    },
                ],
                'mortgagedc-deploy-1-q9b5rr-feng': [
                    {
                        cluster: 'feng',
                        container: 'mortgagedc-mortgage',
                        hostIP: '1.1.1.1',
                        image: 'fxiang/mortgage:0.4.0',
                        kind: 'pod',
                        label: 'app=mortgagedc-mortgage; deployment=mortgagedc-deploy-1; deploymentConfig=mortgagedc-mortgage; deploymentconfig=mortgagedc-deploy',
                        name: 'mortgagedc-deploy-1-q9b5rr',
                        namespace: 'default',
                        podIP: '10.128.2.80',
                        restarts: 0,
                        selfLink: '/api/v1/namespaces/default/pods/mortgagedc-deploy-1-q9b5r',
                        status: 'Running',
                    },
                ],
            },
            raw: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    namespace: 'default',
                },
                spec: {
                    metadata: {
                        labels: { app: 'mortgage-app-mortgage' },
                        name: 'mortgage-app-deploy',
                        namespace: 'default',
                    },
                    replicas: 1,
                    selector: {
                        matchLabels: { app: 'mortgage-app-mortgage' },
                    },
                    template: {
                        metadata: {
                            labels: { app: 'mortgage-app-mortgage' },
                        },
                        spec: {
                            containers: [
                                {
                                    image: 'fxiang/mortgage:0.4.0',
                                    imagePullPolicy: 'Always',
                                    name: 'mortgage-app-mortgage',
                                    ports: [
                                        {
                                            containerPort: 9080,
                                        },
                                    ],
                                    resources: {
                                        limits: { cpu: '200m', memory: '256Mi' },
                                        request: { cpu: '200m', memory: '256Mi' },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            deployStatuses: [
                {
                    phase: 'Subscribed',
                    resourceStatus: {
                        availableReplicas: 1,
                    },
                },
            ],
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
        apiVersion: 'v1',
        layout: {
            hasPods: true,
            uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
            type: 'deployment',
            label: 'mortgage-app-↵deploy',
            apiVersion: 'v1',
            compactLabel: 'mortgage-app-↵deploy',
            nodeStatus: '',
            isDisabled: false,
            title: '',
            description: '',
            tooltips: [
                {
                    name: 'Deployment',
                    value: 'mortgage-app-deploy',
                    href: "/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
                },
            ],
            x: 151.5,
            y: 481.5,
            section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
            textBBox: {
                x: -39.359375,
                y: 5,
                width: 78.71875,
                height: 27.338897705078125,
            },
            lastPosition: { x: 151.5, y: 481.5 },
            selected: true,
            nodeIcons: {
                status: {
                    icon: 'success',
                    classType: 'success',
                    width: 16,
                    height: 16,
                    dx: 16,
                    dy: -16,
                },
            },
            pods: [
                {
                    cluster: 'cluster1',
                    name: 'pod1',
                    namespace: 'default',
                    type: 'pod',
                    apiVersion: 'v1',
                    layout: {
                        type: 'layout1',
                    },
                    specs: {
                        podModel: {
                            'mortgage-app-deploy-55c65b9c8f-6v9bn': [
                                {
                                    cluster: 'cluster1',
                                    hostIP: '1.1.1.1',
                                    status: 'Running',
                                    restarts: 0,
                                    podIP: '1.1.1.1',
                                },
                            ],
                        },
                    },
                },
            ],
        },
    }

    const expectedResult = [
        {
            type: 'spacer',
        },
        {
            type: 'spacer',
        },
        {
            indent: undefined,
            labelKey: 'Type',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'Deployment',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'API Version',
            labelValue: undefined,
            status: undefined,
            value: 'apps/v1',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            value: 'default',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Labels',
            labelValue: undefined,
            status: undefined,
            value: 'app=mortgage-app-mortgage',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Required Replicas',
            labelValue: undefined,
            status: undefined,
            value: '1',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Pod Selector',
            labelValue: undefined,
            status: undefined,
            value: 'app=mortgage-app-mortgage',
        },
        {
            type: 'spacer',
        },
        {
            type: 'spacer',
        },
        {
            type: 'label',
            labelKey: 'Cluster deploy status for pods',
        },
        {
            labelValue: 'Cluster name',
            value: 'feng',
        },
        {
            labelValue: 'default',
            value: 'Not Deployed',
            status: 'pending',
        },
        {
            labelValue: 'Cluster name',
            value: 'cluster1',
        },
        {
            labelValue: '',
            value: 'Not Deployed',
            status: 'pending',
        },
        {
            labelValue: 'Cluster name',
            value: 'cluster2',
        },
        {
            labelValue: '',
            value: 'Not Deployed',
            status: 'pending',
        },
        {
            type: 'spacer',
        },
        {
            type: 'spacer',
        },
        {
            type: 'label',
            labelValue: 'Pod details for {{0}}',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Pod',
            labelValue: undefined,
            status: undefined,
            value: 'mortgagedc-deploy-1-q9b5r',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            value: 'default',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            value: 'Running',
            status: 'checkmark',
        },
        {
            type: 'link',
            value: {
                label: 'View Pod YAML and Logs',
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'feng',
                    editLink: '/resources?cluster=feng&kind=pod&name=mortgagedc-deploy-1-q9b5r&namespace=default',
                },
            },
            indent: true,
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            value: '0',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            value: '1.1.1.1, 10.128.2.80',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            value: '-',
        },
        {
            type: 'spacer',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Pod',
            labelValue: undefined,
            status: undefined,
            value: 'mortgagedc-deploy-1-q9b5rr',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            value: 'default',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            value: 'Running',
            status: 'checkmark',
        },
        {
            type: 'link',
            value: {
                label: 'View Pod YAML and Logs',
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'feng',
                    editLink: '/resources?cluster=feng&kind=pod&name=mortgagedc-deploy-1-q9b5rr&namespace=default',
                },
            },
            indent: true,
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            value: '0',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            value: '1.1.1.1, 10.128.2.80',
        },
        {
            type: 'label',
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            value: '-',
        },
        {
            type: 'spacer',
        },
    ]

    it('should process the node, deployment node', () => {
        expect(getNodeDetails(deploymentNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails helm node', () => {
    const helmreleaseNode = {
        id: 'helmrelease1',
        uid: 'helmrelease1',
        name: 'mortgage-helmrelease',
        cluster: null,
        clusterName: null,
        type: 'helmrelease',
        specs: {
            clustersNames: ['local-cluster'],
            raw: {
                apiVersion: 'app.ibm.com/v1alpha1',
                kind: 'HelmRelease',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    channel: 'demo-ns-helm-git-ch/git-helm-ch',
                    namespace: 'default',
                },
                spec: {
                    chartName: 'mortgage-chart',
                    urls: 'https://mortgage-chart',
                    version: '1.0.0',
                    node: {
                        name: 'node1',
                    },
                },
            },
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            indent: undefined,
            labelKey: 'Type',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'Helmrelease',
        },
        {
            indent: undefined,
            labelKey: 'API Version',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'app.ibm.com/v1alpha1',
        },
        {
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'default',
        },
        {
            indent: undefined,
            labelKey: 'Chart Name',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'mortgage-chart',
        },
        {
            indent: undefined,
            labelKey: 'Version',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '1.0.0',
        },
        {
            indent: undefined,
            labelKey: 'Labels',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'app=mortgage-app-mortgage',
        },
        { type: 'spacer' },
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'local-cluster' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
    ]

    it('should process the node, helm node', () => {
        expect(getNodeDetails(helmreleaseNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails helm node', () => {
    const packageNode = {
        id: 'helmrelease1',
        uid: 'helmrelease1',
        name: 'mortgage-helmrelease',
        cluster: null,
        clusterName: null,
        type: 'package',
        specs: {
            clustersNames: ['local-cluster'],
            raw: {
                apiVersion: 'app.ibm.com/v1alpha1',
                kind: 'Package',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                },
                spec: {
                    chartName: 'mortgage-chart',
                    urls: 'https://mortgage-chart',
                    version: '1.0.0',
                    node: {
                        name: 'node1',
                    },
                },
            },
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            indent: undefined,
            labelKey: 'resource.name',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'mortgage-app-deploy',
        },
        {
            indent: undefined,
            labelKey: 'resource.message',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'There is not enough information in the subscription to retrieve deployed objects data.',
        },
    ]

    it('should process the node, packageNode node', () => {
        expect(getNodeDetails(packageNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails placement rules node with error', () => {
    const rulesNode = {
        id: 'rule1',
        uid: 'rule1',
        name: 'mortgage-rule',
        cluster: null,
        clusterName: null,
        type: 'placements',
        specs: {
            isDesign: true,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    namespace: 'default',
                },
                spec: {
                    clusterSelector: {
                        matchLabels: {
                            environment: 'Dev',
                        },
                    },
                },
            },
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            indent: undefined,
            labelKey: 'Type',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'Placements',
        },
        {
            indent: undefined,
            labelKey: 'API Version',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'apps.open-cluster-management.io/v1',
        },
        {
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'default',
        },
        {
            indent: undefined,
            labelKey: 'Labels',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'app=mortgage-app-mortgage',
        },
        {
            indent: undefined,
            labelKey: 'Cluster Selector',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'environment=Dev',
        },
        {
            indent: undefined,
            labelKey: 'Matched Clusters',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 0,
        },
        { type: 'spacer' },
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.',
        },
    ]
    it('should process the node, placement rules node with error', () => {
        expect(getNodeDetails(rulesNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails placement rules node with success', () => {
    const rulesNode = {
        id: 'rule1',
        uid: 'rule1',
        name: 'mortgage-rule',
        cluster: null,
        clusterName: null,
        type: 'placements',
        specs: {
            isDesign: true,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    namespace: 'default',
                },
                status: {
                    decisions: [{ name: 'cls1', namespace: 'ns' }],
                },
                spec: {
                    clusterSelector: {
                        matchLabels: {
                            environment: 'Dev',
                        },
                    },
                },
            },
        },
    }

    const expectedResult = [
        { type: 'spacer' },
        { type: 'spacer' },
        {
            indent: undefined,
            labelKey: 'Type',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'Placements',
        },
        {
            indent: undefined,
            labelKey: 'API Version',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'apps.open-cluster-management.io/v1',
        },
        {
            indent: undefined,
            labelKey: 'Namespace',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'default',
        },
        {
            indent: undefined,
            labelKey: 'Labels',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'app=mortgage-app-mortgage',
        },
        {
            indent: undefined,
            labelKey: 'Cluster Selector',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'environment=Dev',
        },
        {
            indent: undefined,
            labelKey: 'Matched Clusters',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 1,
        },
        { type: 'spacer' },
    ]

    it('should process the node, placement rules node with success', () => {
        expect(getNodeDetails(rulesNode, undefined, {}, t)).toEqual(expectedResult)
    })
})

describe('getNodeDetails inflateKubeValue', () => {
    it('process empty kube value', () => {
        expect(inflateKubeValue()).toEqual('')
    })

    it('process Ki kube value', () => {
        expect(inflateKubeValue('10Ki')).toEqual(10240)
    })

    it('process Mi kube value', () => {
        expect(inflateKubeValue('10Mi')).toEqual(10485760)
    })

    it('process Gi kube value', () => {
        expect(inflateKubeValue('10Gi')).toEqual(10737418240)
    })

    it('process Ti kube value', () => {
        expect(inflateKubeValue('10Ti')).toEqual(10995116277760)
    })

    it('process Pi kube value', () => {
        expect(inflateKubeValue('10Pi')).toEqual(11258999068426240)
    })

    it('process Ei kube value', () => {
        expect(inflateKubeValue('10Ei')).toEqual(11529215046068470000)
    })

    it('process m kube value', () => {
        expect(inflateKubeValue('10m')).toEqual(0.01)
    })

    it('process k kube value', () => {
        expect(inflateKubeValue('10k')).toEqual(10000)
    })

    it('process M kube value', () => {
        expect(inflateKubeValue('10M')).toEqual(10000000)
    })

    it('process G kube value', () => {
        expect(inflateKubeValue('10G')).toEqual(10000000000)
    })

    it('process T kube value', () => {
        expect(inflateKubeValue('10T')).toEqual(10000000000000)
    })

    it('process P kube value', () => {
        expect(inflateKubeValue('10P')).toEqual(10000000000000000)
    })

    it('process E kube value', () => {
        expect(inflateKubeValue('10E')).toEqual(10000000000000000000)
    })
})
