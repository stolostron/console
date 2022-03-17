// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import {
    computeNodeStatus,
    setSubscriptionDeployStatus,
    setResourceDeployStatus,
    setApplicationDeployStatus,
    setPodDeployStatus,
    getPulseForData,
    getPulseForNodeWithPodStatus,
    setPlacementRuleDeployStatus,
    getPodState,
    getPulseStatusForCluster,
} from './computeStatuses'

import {
    genericNodeYellowNotDefined,
    persVolumePendingStateYellow,
    persVolumePendingStateGreen,
    subscriptionInputRed1,
    subscriptionInputRed,
    subscriptionInputYellow,
    subscriptionGreenNotPlacedYellow,
    subscriptionInputNotPlaced,
    genericNodeInputRed,
    genericNodeInputRed2,
    deploymentNodeYellow3,
    deploymentNodeYellow4,
    deploymentNodeYellow2,
    deploymentNodeNoPODS,
    deploymentNodeNoPODSNoRes,
    deploymentNodeRed3,
    deploymentNodeNoPodModel,
    genericNodeYellow,
    packageNodeOrange,
    ruleNodeRed,
    ruleNodeGreen2,
    appNoChannelRed,
    appNoChannelGreen,
    podCrash,
    persVolumePendingStateGreenRes,
    persVolumePendingStatePendingRes,
} from './computeStatuses.data.js'

import { ansibleSuccess, ansibleError, ansibleError2, ansibleErrorAllClusters } from './TestingData'

const t = (string) => {
    return string
}

window.open = () => {} // provide an empty implementation for window.open

describe('getPulseForNodeWithPodStatus', () => {
    const podItem = {
        id: 'member--member--deployable--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        name: 'mortgage-app-deploy',
        cluster: null,
        clusterName: null,
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
        type: 'deployment',
        specs: {
            clustersNames: ['feng', 'cluster1'],
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-6v9bn': [
                    {
                        cluster: 'feng',
                        namespace: 'default',
                        hostIP: '1.1.1.1',
                        status: 'Error',
                        startedAt: '2020-04-20T22:03:52Z',
                        restarts: 0,
                        podIP: '1.1.1.1',
                    },
                ],
            },
            deploymentModel: {
                'mortgage-app-deploy-feng': [
                    {
                        cluster: 'feng',
                        namespace: 'default',
                        ready: 2,
                        desired: 3,
                        unavailable: 1,
                    },
                ],
                'mortgage-app-deploy-cluster1': [],
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
    }

    it('getPulseForNodeWithPodStatus pulse red', () => {
        expect(getPulseForNodeWithPodStatus(podItem, t)).toEqual('red')
    })
})

describe('getPulseForNodeWithPodStatus controllerrevision type', () => {
    const podItem = {
        id: 'member--member--deployable--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--controllerrevision--mortgage-app-deploy',
        uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--controllerrevision--mortgage-app-deploy',
        name: 'mortgage-app-deploy',
        cluster: null,
        clusterName: null,
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
        type: 'controllerrevision',
        specs: {
            clustersNames: ['feng', 'cluster1'],
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-6v9bn': [
                    {
                        cluster: 'feng',
                        namespace: 'default',
                        hostIP: '1.1.1.1',
                        status: 'Error',
                        startedAt: '2020-04-20T22:03:52Z',
                        restarts: 0,
                        podIP: '1.1.1.1',
                    },
                ],
            },
            controllerrevisionModel: {
                'mortgage-app-deploy-feng': [
                    {
                        cluster: 'feng',
                        namespace: 'default',
                        ready: 2,
                        desired: 3,
                        unavailable: 1,
                    },
                ],
                'mortgage-app-deploy-cluster1': [],
            },
            raw: {
                apiVersion: 'apps/v1',
                kind: 'ControllerRevision',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    namespace: 'default',
                },
                spec: {
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
    }

    it('getPulseForNodeWithPodStatus pulse red controllerrevision type', () => {
        expect(getPulseForNodeWithPodStatus(podItem, t)).toEqual('red')
    })
})

describe('getPulseForNodeWithPodStatus controllerrevision type no desired', () => {
    const podItem = {
        id: 'member--member--deployable--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--controllerrevision--mortgage-app-deploy',
        uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--controllerrevision--mortgage-app-deploy',
        name: 'mortgage-app-deploy',
        cluster: null,
        clusterName: null,
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
        type: 'controllerrevision',
        specs: {
            searchClusters: [
                {
                    name: 'feng',
                    status: 'OK',
                },
            ],
            clustersNames: ['feng', 'cluster1', 'cluster2'],
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-6v9bn': [
                    {
                        namespace: 'default',
                        cluster: 'feng',
                        hostIP: '1.1.1.1',
                        status: 'Error',
                        startedAt: '2020-04-20T22:03:52Z',
                        restarts: 0,
                        podIP: '1.1.1.1',
                    },
                ],
            },
            controllerrevisionModel: {
                'mortgage-app-deploy-feng': [
                    {
                        cluster: 'feng',
                        ready: 2,
                        unavailable: 1,
                        namespace: 'default',
                    },
                ],
                'mortgage-app-deploy-cluster1': [],
            },
            raw: {
                apiVersion: 'apps/v1',
                kind: 'ControllerRevision',
                metadata: {
                    labels: { app: 'mortgage-app-mortgage' },
                    name: 'mortgage-app-deploy',
                    namespace: 'default',
                },
                spec: {
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
    }

    it('getPulseForNodeWithPodStatus pulse red controllerrevision type no desired', () => {
        expect(getPulseForNodeWithPodStatus(podItem, t)).toEqual('red')
    })
})

describe('getPulseForNodeWithPodStatus no replica', () => {
    const podItem = {
        id: 'member--member--deployable--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        name: 'mortgage-app-deploy',
        cluster: null,
        clusterName: null,
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
        type: 'deployment',
        specs: {
            searchClusters: [
                {
                    name: 'feng',
                    status: 'OK',
                },
                {
                    name: 'cluster1',
                    status: 'OK',
                },
            ],
            clustersNames: ['feng', 'cluster1'],
            deploymentModel: {
                'mortgage-app-deploy-feng': [
                    {
                        ready: 2,
                        desired: 3,
                        namespace: 'default',
                    },
                ],
                'mortgage-app-deploy-cluster1': [],
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
    }

    it('getPulseForNodeWithPodStatus pulse no replica', () => {
        expect(getPulseForNodeWithPodStatus(podItem, t)).toEqual('yellow')
    })
})

describe('getPulseForData', () => {
    const previousPulse = 'red'
    const available = 1
    const desired = 2
    const podsUnavailable = 3

    it('getPulseForData pulse red', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('red')
    })
})

describe('getPulseForData', () => {
    const previousPulse = 'green'
    const available = 1
    const desired = 2
    const podsUnavailable = 3

    it('getPulseForData pulse red pod unavailable', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('red')
    })
})

describe('getPulseForData', () => {
    const available = 1
    const desired = 2
    const podsUnavailable = 0

    it('getPulseForData pulse red pod desired less then available', () => {
        expect(getPulseForData(available, desired, podsUnavailable)).toEqual('yellow')
    })
})

describe('getPulseForData', () => {
    const available = 1
    const desired = 0
    const podsUnavailable = 0

    it('getPulseForData pulse yellow pod desired is 0', () => {
        expect(getPulseForData(available, desired, podsUnavailable)).toEqual('yellow')
    })
})

describe('getPulseForData', () => {
    const available = 1
    const desired = 1
    const podsUnavailable = 0

    it('getPulseForData pulse green pod desired is equal with available', () => {
        expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
    })
})

describe('getPulseForData', () => {
    const available = 0
    const desired = undefined
    const podsUnavailable = 0

    it('getPulseForData pulse orange pod desired is undefined and no pods available', () => {
        expect(getPulseForData(available, desired, podsUnavailable)).toEqual('orange')
    })
})

describe('setSubscriptionDeployStatus with time window', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        apiversion: 'apps.open-cluster-management.io/v1',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Failed',
                        _hubClusterResource: 'true',
                    },
                ],
            },
            raw: {
                apiversion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                status: {
                    reason: 'channel v1/2 not found',
                    message: ' local:Blocked, other: Active',
                },
                spec: {
                    placement: {
                        local: true,
                        apiversion: 'apps.open-cluster-management.io/v1',
                        kind: 'Subscription',
                    },
                    timewindow: {
                        location: 'America/Toronto',
                        windowtype: 'blocked',
                        hours: [{ end: '09:18PM', start: '09:18AM' }],
                        daysofweek: ['Monday', 'Tuesday'],
                    },
                },
            },
        },
    }
    const response = [
        { labelKey: 'Time Window', type: 'label' },
        { labelKey: 'Time Window type', value: 'blocked' },
        { labelKey: 'Time Window days', value: '["Monday", "Tuesday"]' },
        { labelKey: 'Time Window hours', value: '09:18AM-09:18PM' },
        { labelKey: 'Time zone', value: 'America/Toronto' },
        { type: 'spacer' },
        { labelKey: 'Subscription deployed on local cluster', value: 'true' },
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { labelValue: 'local', status: 'failure', value: 'Failed' },
        { labelKey: 'Current window status is', value: 'Blocked' },
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'channel v1/2 not found',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatuswith time window', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with local hub subscription error', () => {
    const node = {
        type: 'subscription',
        kind: 'Subscription',
        name: 'name',
        namespace: 'ns',
        apiversion: 'test',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Failed',
                        _hubClusterResource: 'true',
                    },
                ],
            },
            raw: {
                apiVersion: 'test',
                spec: {
                    placement: {
                        local: true,
                    },
                },
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Subscription deployed on local cluster', value: 'true' },
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { labelValue: 'local', status: 'failure', value: 'Failed' },
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'Some resources failed to deploy. Use View resource YAML link below to view the details.',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with local hub subscription error', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with hub error', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Failed',
                        _hubClusterResource: 'true',
                    },
                ],
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { labelValue: 'local', status: 'failure', value: 'Failed' },
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'Some resources failed to deploy. Use View resource YAML link below to view the details.',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with hub error', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with Failed phase subscription statuses', () => {
    const node = {
        type: 'subscription',
        kind: 'Subscription',
        name: 'name',
        namespace: 'ns',
        apiversion: 'test',
        specs: {
            searchClusters: [
                {
                    name: 'local-cluster',
                    status: 'OK',
                },
            ],
            clustersNames: ['local-cluster'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local-cluster',
                        status: 'Subscribed',
                        _hubClusterResource: 'true',
                    },
                ],
            },
            raw: {
                apiVersion: 'test',
                spec: {
                    placement: {
                        local: true,
                    },
                },
                status: {
                    statuses: {
                        'local-cluster': {
                            packages: {
                                'ggithubcom-testrepo-ConfigMap': {
                                    phase: 'Failed',
                                },
                            },
                        },
                    },
                },
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Subscription deployed on local cluster', value: 'true' },
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { labelValue: 'local-cluster', status: 'checkmark', value: 'Subscribed' },
        {
            labelValue: 'Warning',
            status: 'warning',
            value: 'Some resources failed to deploy. Use View resource YAML link below to view the details.',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with Failed phase subscription statuses', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with no sub error', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            subscriptionModel: [],
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        {
            labelValue: 'Remote subscriptions',
            status: 'failure',
            value: 'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the klusterlet-addon-appmgr pod runs on the managed clusters.',
        },
        {
            type: 'link',
            value: {
                data: {
                    action: 'open_link',
                    targetLink:
                        '/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3Ans%20cluster%3Alocal-cluster"}',
                },
                id: 'undefined-subscrSearch',
                label: 'View all placement rules in {{0}} namespace',
            },
        },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with no hub error', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with error', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Failed',
                    },
                ],
                sub2: [
                    {
                        cluster: 'local',
                        status: 'Propagated',
                        _hubClusterResource: true,
                    },
                ],
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { labelValue: 'local', status: 'failure', value: 'Failed' },
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'Some resources failed to deploy. Use View resource YAML link below to view the details.',
        },
        { type: 'spacer' },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with error', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with hub no status', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        _hubClusterResource: 'true',
                    },
                ],
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        {
            labelValue: 'local',
            status: 'warning',
            value: 'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the multicluster-operators-hub-subscription pod is running on hub',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with hub no status', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus with remote no status', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
                {
                    name: 'remote1',
                    status: 'OK',
                },
            ],
            clustersNames: ['local', 'remote1'],
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Propagated',
                        _hubClusterResource: 'true',
                    },
                ],
                sub2: [
                    {
                        cluster: 'remote1',
                    },
                ],
            },
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        {
            labelValue: 'remote1',
            status: 'warning',
            value: 'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the klusterlet-addon-appmgr pod is running on the remote cluster.',
        },
        { type: 'spacer' },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus with remote no status', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus for details yellow', () => {
    const node = {
        type: 'subscription',
        name: 'name',
        namespace: 'ns',
        specs: {
            searchClusters: [
                {
                    name: 'local',
                    status: 'OK',
                },
            ],
            clustersNames: ['local'],
            subscriptionModel: [],
        },
    }
    const response = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        {
            labelValue: 'Remote subscriptions',
            status: 'failure',
            value: 'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the klusterlet-addon-appmgr pod runs on the managed clusters.',
        },
        {
            type: 'link',
            value: {
                data: {
                    action: 'open_link',
                    targetLink:
                        '/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3Ans%20cluster%3Alocal-cluster"}',
                },
                id: 'undefined-subscrSearch',
                label: 'View all placement rules in {{0}} namespace',
            },
        },
        { type: 'spacer' },
    ]
    it('setSubscriptionDeployStatus yellow', () => {
        expect(setSubscriptionDeployStatus(node, [], {}, t)).toEqual(response)
    })
})

describe('setSubscriptionDeployStatus for node type different then subscription', () => {
    const node = {
        type: 'subscription2',
        name: 'name',
        namespace: 'ns',
        specs: {
            subscriptionModel: {
                sub1: [
                    {
                        cluster: 'local',
                        status: 'Failed',
                    },
                ],
                sub2: [
                    {
                        cluster: 'local-cluster',
                        status: 'Failed',
                        name: 'sub2-local',
                    },
                ],
            },
        },
    }
    it('setSubscriptionDeployStatus for node type different then subscription should return []', () => {
        expect(setSubscriptionDeployStatus(node, [], {})).toEqual([])
    })
})

describe('computeNodeStatus', () => {
    it('return computeNodeStatus generic node green - volume claim bound', () => {
        expect(computeNodeStatus(persVolumePendingStateGreen, true, t)).toEqual('green')
    })

    it('return computeNodeStatus generic node yellow - volume claim in pending state', () => {
        expect(computeNodeStatus(persVolumePendingStateYellow, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus generic node green - res not defined', () => {
        expect(computeNodeStatus(genericNodeYellowNotDefined, true, t)).toEqual('yellow')
    })

    it('return Ansible error', () => {
        expect(computeNodeStatus(ansibleError, true, t)).toEqual('orange')
    })
    it('return Ansible error2', () => {
        expect(computeNodeStatus(ansibleError2, true, t)).toEqual('orange')
    })
    it('return Ansible success', () => {
        expect(computeNodeStatus(ansibleSuccess, true, t)).toEqual('green')
    })
    it('return appNnoChannelRed crash error', () => {
        expect(computeNodeStatus(podCrash, true, t)).toEqual('orange')
    })

    it('return appNnoChannelRed red', () => {
        expect(computeNodeStatus(appNoChannelRed, true, t)).toEqual('red')
    })

    it('return appNoChannelGreen green', () => {
        expect(computeNodeStatus(appNoChannelGreen, true, t)).toEqual('green')
    })
    it('return computeNodeStatus red', () => {
        expect(computeNodeStatus(subscriptionInputRed1, true, t)).toEqual('red')
    })

    it('return computeNodeStatus orange', () => {
        expect(computeNodeStatus(subscriptionInputRed, true, t)).toEqual('orange')
    })

    it('return computeNodeStatus yellow', () => {
        expect(computeNodeStatus(subscriptionInputYellow, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus not places', () => {
        expect(computeNodeStatus(subscriptionInputNotPlaced, true, t)).toEqual('green')
    })

    it('return computeNodeStatus generic node orange', () => {
        expect(computeNodeStatus(genericNodeInputRed, true, t)).toEqual('orange')
    })

    it('return computeNodeStatus generic node orange 2', () => {
        expect(computeNodeStatus(genericNodeInputRed2, true, t)).toEqual('orange')
    })

    it('return computeNodeStatus generic node red', () => {
        expect(computeNodeStatus(deploymentNodeRed3, true, t)).toEqual('red')
    })

    it('return computeNodeStatus generic no  pod', () => {
        expect(computeNodeStatus(deploymentNodeNoPodModel, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus generic node no pods', () => {
        expect(computeNodeStatus(deploymentNodeNoPODS, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus generic node no pods res', () => {
        expect(computeNodeStatus(deploymentNodeNoPODSNoRes, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus generic node yellow', () => {
        expect(computeNodeStatus(genericNodeYellow, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus package node orange', () => {
        expect(computeNodeStatus(packageNodeOrange, true, t)).toEqual('orange')
    })

    it('return computeNodeStatus rules node red', () => {
        expect(computeNodeStatus(ruleNodeRed, true, t)).toEqual('red')
    })

    it('return computeNodeStatus rules node green2', () => {
        expect(computeNodeStatus(ruleNodeGreen2, true, t)).toEqual('green')
    })
    it('return computeNodeStatus deploymentNodeYellow3', () => {
        expect(computeNodeStatus(deploymentNodeYellow3, true, t)).toEqual('yellow')
    })
    it('return computeNodeStatus deploymentNodeYellow4', () => {
        expect(computeNodeStatus(deploymentNodeYellow4, true, t)).toEqual('yellow')
    })
    it('return computeNodeStatus deploymentNodeYellow2', () => {
        expect(computeNodeStatus(deploymentNodeYellow2, true, t)).toEqual('yellow')
    })

    it('return computeNodeStatus subscriptionGreenNotPlacedYellow', () => {
        expect(computeNodeStatus(subscriptionGreenNotPlacedYellow, true, t)).toEqual('yellow')
    })
})

describe('setResourceDeployStatus 1', () => {
    const node = {
        type: 'service',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['braveman', 'possiblereptile', 'sharingpenguin', 'relievedox'],
        },
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'braveman',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'sharingpenguin',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'relievedox',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { type: 'label', labelKey: 'Cluster deploy status' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'braveman' },
        { labelValue: '*', value: 'Not Deployed', status: 'pending' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: '*', value: 'Not Deployed', status: 'pending' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'sharingpenguin' },
        { labelValue: '*', value: 'Not Deployed', status: 'pending' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'relievedox' },
        { labelValue: '*', value: 'Not Deployed', status: 'pending' },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus not deployed 1', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus ansiblejob', () => {
    const node = {
        type: 'ansiblejob',
        name: 'bigjoblaunch',
        namespace: 'default',
        id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
        specs: {
            clustersNames: ['local-cluster'],
            searchClusters: [
                {
                    name: 'local-cluster',
                    status: 'OK',
                },
            ],
            raw: {
                hookType: 'pre-hook',
                metadata: {
                    name: 'bigjoblaunch',
                    namespace: 'default',
                },
                spec: {
                    ansibleJobResult: {
                        url: 'http://ansible_url/job',
                        status: 'successful',
                    },
                    conditions: [
                        {
                            ansibleResult: {},
                            message: 'Success',
                            reason: 'Successful',
                        },
                    ],
                },
            },
            ansiblejobModel: {
                'bigjoblaunch-local-cluster': [
                    {
                        label: 'tower_job_id=999999999',
                        cluster: 'local-cluster',
                        name: 'bigjoblaunch123',
                        namespace: 'default',
                        kind: 'ansiblejob',
                        apigroup: 'tower.ansible.com',
                        apiversion: 'v1alpha1',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'local-cluster' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=tower.ansible.com%2Fv1alpha1&cluster=local-cluster&kind=ansiblejob&name=bigjoblaunch123&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus ansiblejob valid', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus ansiblejob', () => {
    const node = {
        type: 'ansiblejob',
        name: 'bigjoblaunch',
        namespace: 'default',
        id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
        specs: {
            clustersNames: ['local-cluster'],
            searchClusters: [
                {
                    name: 'local-cluster',
                    status: 'OK',
                },
            ],
            raw: {
                hookType: 'pre-hook',
                metadata: {
                    name: 'bigjoblaunch',
                    namespace: 'default',
                },
                spec: {
                    ansibleJobResult: {
                        url: 'http://ansible_url/job',
                        status: 'successful',
                    },
                    conditions: [
                        {
                            ansibleResult: {},
                            message: 'Success',
                            reason: 'Successful',
                        },
                    ],
                },
            },
        },
    }
    const result = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=tower.ansible.com%2Fv1alpha1&cluster=local-cluster&kind=ansiblejob&name=bigjoblaunch&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
    ]
    it('setResourceDeployStatus ansiblejob no resource found by search', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus ansiblejob no specs.raw.spec', () => {
    const node = {
        type: 'ansiblejob',
        name: 'bigjoblaunch',
        namespace: 'default',
        id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
        specs: {
            clustersNames: ['local-cluster'],
            searchClusters: ['local-cluster'],
            raw: {
                hookType: 'pre-hook',
                metadata: {
                    name: 'bigjoblaunch',
                    namespace: 'default',
                },
            },
            ansiblejobModel: {
                'bigjoblaunch-local-cluster': [
                    {
                        label: 'tower_job_id=999999999',
                        cluster: 'local-cluster',
                        namespace: 'default',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=tower.ansible.com%2Fv1alpha1&cluster=local-cluster&kind=ansiblejob&name=bigjoblaunch&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
    ]
    it('setResourceDeployStatus ansiblejob no specs.raw.spec', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus ansiblejob no status', () => {
    const node = {
        type: 'ansiblejob',
        name: 'bigjoblaunch',
        namespace: 'default',
        id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
        specs: {
            clustersNames: ['local-cluster'],
            raw: {
                hookType: 'pre-hook',
                metadata: {
                    name: 'bigjoblaunch',
                    namespace: 'default',
                },
            },
            ansiblejobModel: {
                'bigjoblaunch-local-cluster': [
                    {
                        label: 'tower_job_id=999999999',
                        cluster: 'local-cluster',
                        namespace: 'default',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=tower.ansible.com%2Fv1alpha1&cluster=local-cluster&kind=ansiblejob&name=bigjoblaunch&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
    ]

    const result1 = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=tower.ansible.com%2Fv1alpha1&cluster=local-cluster&kind=ansiblejob&name=bigjoblaunch&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
    ]
    const result2 = [
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.task.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty.err',
        },
        { type: 'spacer' },
        {
            labelValue: 'description.ansible.job.status',
            status: 'pending',
            value: 'description.ansible.job.status.empty',
        },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'local-cluster' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink: '/resources?cluster=local-cluster&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
        { type: 'spacer' },
    ]

    it('setResourceDeployStatus ansiblejob no status', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
    it('setResourceDeployStatus ansiblejob no status 1', () => {
        expect(setResourceDeployStatus(ansibleError, [], {}, t)).toEqual(result1)
    })
    it('setResourceDeployStatus ansiblejob with error status', () => {
        expect(setResourceDeployStatus(ansibleError2, [], {}, t)).toEqual(result2)
    })

    it('getResourceDeployStatus ansiblejob with subscription deployed on all active clusters', () => {
        expect(setResourceDeployStatus(ansibleErrorAllClusters, [], {}, t)).toEqual(result2)
    })
})

describe('setResourceDeployStatus 2', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-svc',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                metadata: {
                    name: 'mortgage-app-svc',
                    namespace: 'default',
                },
            },
            serviceModel: {
                'mortgage-app-svc-possiblereptile': [
                    {
                        cluster: 'possiblereptile',
                        clusterIP: '172.30.140.196',
                        created: '2020-04-20T22:03:01Z',
                        kind: 'service',
                        label: 'app=mortgage-app-mortgage',
                        name: 'mortgage-app-svc',
                        namespace: 'default',
                        port: '9080:31558/TCP',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'checkmark', value: 'Deployed' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&kind=service&name=mortgage-app-svc&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus deployed as green', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })

    it('setResourceDeployStatus deployed as green', () => {
        expect(setResourceDeployStatus(persVolumePendingStateGreen, [], {}, t)).toEqual(persVolumePendingStateGreenRes)
    })

    it('return persistent volume node yellow - volume claim pending', () => {
        expect(setResourceDeployStatus(persVolumePendingStateYellow, [], {}, t)).toEqual(
            persVolumePendingStatePendingRes
        )
    })
})

describe('setResourceDeployStatus 2 with filter green', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-svc',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                metadata: {
                    name: 'mortgage-app-svc',
                    namespace: 'default',
                },
            },
            serviceModel: {
                'mortgage-app-svc-possiblereptile': [
                    {
                        cluster: 'possiblereptile',
                        clusterIP: '172.30.140.196',
                        created: '2020-04-20T22:03:01Z',
                        kind: 'service',
                        label: 'app=mortgage-app-mortgage',
                        name: 'mortgage-app-svc',
                        namespace: 'default',
                        port: '9080:31558/TCP',
                    },
                ],
            },
        },
    }
    const activeFilters = {
        resourceStatuses: new Set(['green']),
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'checkmark', value: 'Deployed' },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&kind=service&name=mortgage-app-svc&namespace=default',
                },
                label: 'View resource YAML',
            },
        },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus deployed 2 - should filter resource', () => {
        expect(setResourceDeployStatus(node, [], activeFilters, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus 2 with filter yellow', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-svc',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-svc',
                },
            },
            serviceModel: {},
        },
    }
    const activeFilters = {
        resourceStatuses: new Set(['yellow']),
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus deployed 2 - should filter resource', () => {
        expect(setResourceDeployStatus(node, [], activeFilters, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus 2 with filter orange', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-svc',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-svc',
                },
            },
            serviceModel: {},
        },
    }
    const activeFilters = {
        resourceStatuses: new Set(['orange']),
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
    ]
    it('setResourceDeployStatus deployed 2 - should filter resource', () => {
        expect(setResourceDeployStatus(node, [], activeFilters, t)).toEqual(result)
    })
})

describe('setResourceDeployStatus 3', () => {
    const node = {
        type: 'service',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'braveman',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'sharingpenguin',
                        },
                        status: 'ok',
                    },
                    {
                        metadata: {
                            name: 'relievedox',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            clustersNames: ['braveman', 'possiblereptile', 'sharingpenguin', 'relievedox'],
            raw: {
                metadata: {
                    namespace: 'default',
                },
            },
            serviceModel: {
                'service1-braveman': [
                    {
                        namespace: 'default',
                        cluster: 'braveman1',
                        status: 'Failed',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status', type: 'label' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'braveman' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'sharingpenguin' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
        { labelValue: 'Cluster name', value: 'relievedox' },
        { labelValue: '*', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
    ]
    it('shows resources as not deployed', () => {
        expect(setResourceDeployStatus(node, [], {}, t)).toEqual(result)
    })
})

describe('setPlacementRuleDeployStatus 1', () => {
    const node = {
        type: 'placements',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            raw: {
                metadata: {
                    namespace: 'default',
                    selfLink: 'aaa',
                },
                spec: {
                    selector: 'test',
                },
            },
        },
    }
    const result = [
        {
            labelValue: 'Error',
            status: 'failure',
            value: 'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.',
        },
    ]
    it('setPlacementRuleDeployStatus deployed 1', () => {
        expect(setPlacementRuleDeployStatus(node, [], t)).toEqual(result)
    })
})

describe('setApplicationDeployStatus for ARGO', () => {
    const nodeWithRelatedApps = {
        type: 'application',
        name: 'cassandra',
        cluster: 'local-cluster',
        namespace: 'default',
        specs: {
            relatedApps: [
                {
                    name: 'app1',
                    namespace: 'app1-ns',
                    destinationCluster: 'local-cluster',
                    cluster: 'remote-cluster',
                    destinationNamespace: 'app1-remote-ns',
                },
                {
                    name: 'app2',
                    namespace: 'app2-ns',
                    cluster: 'local-cluster',
                    destinationCluster: 'remote-cluster2',
                    destinationNamespace: 'app2-remote-ns',
                },
            ],
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
                cluster: 'local-cluster',
                spec: {
                    appURL: 'https://test',
                },
            },
        },
    }
    const resultWithRelatedApps = [
        {
            labelValue: 'Related applications ({{0}})',
            type: 'label',
        },
        {
            type: 'spacer',
        },
        {
            relatedargoappsdata: {
                argoAppList: [
                    {
                        cluster: 'remote-cluster',
                        destinationCluster: 'local-cluster',
                        destinationNamespace: 'app1-remote-ns',
                        name: 'app1',
                        namespace: 'app1-ns',
                    },
                    {
                        cluster: 'local-cluster',
                        destinationCluster: 'remote-cluster2',
                        destinationNamespace: 'app2-remote-ns',
                        name: 'app2',
                        namespace: 'app2-ns',
                    },
                ],
            },
            type: 'relatedargoappdetails',
        },
    ]
    it('setApplicationDeployStatus for argo app with multiple related apps', () => {
        expect(setApplicationDeployStatus(nodeWithRelatedApps, [], t)).toEqual(resultWithRelatedApps)
    })

    const nodeWithNORelatedApps = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        specs: {
            relatedApps: [],
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
                cluster: 'local-cluster',
                spec: {
                    appURL: 'https://test',
                },
            },
        },
    }
    it('setApplicationDeployStatus for argo app with no related apps', () => {
        expect(setApplicationDeployStatus(nodeWithNORelatedApps, [], t)).toEqual([])
    })
})

describe('setApplicationDeployStatus 1', () => {
    const node = {
        type: 'service',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
            serviceModel: {
                service1: {
                    cluster: 'braveman',
                    status: 'Failed',
                },
            },
        },
    }
    it('setApplicationDeployStatus deployed 1', () => {
        expect(setApplicationDeployStatus(node, [], t)).toEqual([])
    })
})

describe('setApplicationDeployStatus 2', () => {
    const node = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
            raw: {
                metadata: {
                    selfLink: 'aaa',
                },
                spec: {
                    selector: 'test',
                },
            },
        },
    }
    const result = [
        {
            labelKey: 'Subscription Selector',
            status: false,
            value: 'test',
        },
        { type: 'spacer' },
    ]
    it('setApplicationDeployStatus deployed application as a deployable', () => {
        expect(setApplicationDeployStatus(node, [], t)).toEqual(result)
    })
})

describe('setApplicationDeployStatus application', () => {
    const node = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--application',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
            raw: {
                metadata: {
                    selfLink: 'aaa',
                },
                spec: {
                    selector: 'test',
                },
            },
        },
    }
    const result = [
        {
            labelKey: 'Subscription Selector',
            status: false,
            value: 'test',
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
                        '/search?filters={"textsearch":"kind%3Asubscription%20namespace%3Adefault%20cluster%3Alocal-cluster"}',
                },
                id: 'member--application-subscrSearch',
                label: 'View all subscriptions in {{0}} namespace',
            },
        },
    ]
    it('setApplicationDeployStatus deployed application', () => {
        expect(setApplicationDeployStatus(node, [], t)).toEqual(result)
    })
})

describe('setApplicationDeployStatus no selector', () => {
    const node = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
        },
    }
    const result = [
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
                        '/search?filters={"textsearch":"kind%3Asubscription%20namespace%3Adefault%20cluster%3Alocal-cluster"}',
                },
                id: 'member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra-subscrSearch',
                label: 'View all subscriptions in {{0}} namespace',
            },
        },
    ]
    it('setApplicationDeployStatus deployed no selector 2', () => {
        expect(setApplicationDeployStatus(node, [], t)).toEqual(result)
    })
})

describe('setApplicationDeployStatus channels', () => {
    const node = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
            channels: ['subsdata'],
        },
    }
    const result = [
        {
            labelKey: 'Subscription Selector',
            status: true,
            value: 'This application has no subscription match selector (spec.selector.matchExpressions)',
        },
        { type: 'spacer' },
    ]
    it('setApplicationDeployStatus channels', () => {
        expect(setApplicationDeployStatus(node, [], t)).toEqual(result)
    })
})

describe('setPodDeployStatus  node does not have pods', () => {
    const node = {
        type: 'application',
        name: 'cassandra',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--braveman, possiblereptile, sharingpenguin, relievedox--default--guestbook-app-cassandra-cassandra-service--service--cassandra',
        specs: {
            clustersNames: ['possiblereptile', 'braveman', 'sharingpenguin'],
            channels: ['subsdata'],
        },
    }
    it('setPodDeployStatus node does not have pods', () => {
        expect(setPodDeployStatus(node, node, [], {}, t)).toEqual([])
    })
})

describe('setPodDeployStatus  with pod less then desired', () => {
    const node = {
        type: 'pod',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        podStatusMap: {
            'possiblereptile-default-pod-mortgage-app-deploy': {
                cluster: 'possiblereptile',
                namespace: 'default',
                ready: 1,
                desired: 3,
                unavailable: 2,
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    replicas: 1,
                    template: {
                        spec: {
                            containers: [{ c1: 'aa' }],
                        },
                    },
                },
            },
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'err',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status for pods', type: 'label' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'failure', value: '1/3' },
        { type: 'spacer' },
        { type: 'spacer' },
        { labelValue: 'Pod details for {{0}}', type: 'label' },
        {
            type: 'label',
            labelKey: 'Namespace',
            labelValue: undefined,
            value: 'default',
            indent: undefined,
            status: undefined,
        },
        {
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            status: 'failure',
            type: 'label',
            value: 'err',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&namespace=default',
                },
                label: 'View Pod YAML and Logs',
            },
        },
        {
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined',
        },
        {
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined, undefined',
        },
        {
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '-',
        },
        { type: 'spacer' },
    ]
    it('setPodDeployStatus with pod less then desired', () => {
        expect(setPodDeployStatus(node, node, [], {}, t)).toEqual(result)
    })
})

describe('setPodDeployStatus  with pod but no pod model and no podStatusMap', () => {
    const node = {
        type: 'pod',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        specs: {
            searchClusters: [],
            clustersNames: ['possiblereptile'],
            raw: {
                spec: {
                    metadata: 'default',
                    replicas: 1,
                    template: {
                        spec: {
                            containers: [{ c1: 'aa' }],
                        },
                    },
                },
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status for pods', type: 'label' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'pending', value: 'Not Deployed' },
        { type: 'spacer' },
    ]
    it('setPodDeployStatus with pod but no pod podStatusMap', () => {
        expect(setPodDeployStatus(node, node, [], {}, t)).toEqual(result)
    })
})

describe('setPodDeployStatus  with pod as desired', () => {
    const node = {
        type: 'pod',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        podStatusMap: {
            'possiblereptile-default-pod-mortgage-app-deploy': {
                namespace: 'default',
                cluster: 'possiblereptile',
                ready: 3,
                desired: 3,
            },
        },
        specs: {
            clustersNames: ['possiblereptile'],
            raw: {
                spec: {
                    template: {
                        spec: {
                            containers: [{ c1: 'aa' }],
                        },
                    },
                },
            },
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'Running',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile2': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'Pending',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile3': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'CrashLoopBackOff',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile4': [
                    {
                        cluster: 'possiblereptile4',
                        namespace: 'default',
                        status: 'CrashLoopBackOff',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status for pods', type: 'label' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'checkmark', value: '3/3' },
        { type: 'spacer' },
        { type: 'spacer' },
        { labelValue: 'Pod details for {{0}}', type: 'label' },
        {
            type: 'label',
            labelKey: 'Namespace',
            labelValue: undefined,
            value: 'default',
            indent: undefined,
            status: undefined,
        },
        {
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            status: 'checkmark',
            type: 'label',
            value: 'Running',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&namespace=default',
                },
                label: 'View Pod YAML and Logs',
            },
        },
        {
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined',
        },
        {
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined, undefined',
        },
        {
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '-',
        },
        { type: 'spacer' },
        {
            type: 'label',
            labelKey: 'Namespace',
            labelValue: undefined,
            value: 'default',
            indent: undefined,
            status: undefined,
        },
        {
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            status: 'warning',
            type: 'label',
            value: 'Pending',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&namespace=default',
                },
                label: 'View Pod YAML and Logs',
            },
        },
        {
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined',
        },
        {
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined, undefined',
        },
        {
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '-',
        },
        { type: 'spacer' },
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
            labelKey: 'Status',
            labelValue: undefined,
            status: 'failure',
            type: 'label',
            value: 'CrashLoopBackOff',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&namespace=default',
                },
                label: 'View Pod YAML and Logs',
            },
        },
        {
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined',
        },
        {
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined, undefined',
        },
        {
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '-',
        },
        {
            type: 'spacer',
        },
    ]
    it('setPodDeployStatus with pod as desired', () => {
        expect(setPodDeployStatus(node, node, [], {}, t)).toEqual(result)
    })
})

describe('setPodDeployStatus - pod as desired with green filter', () => {
    const node = {
        type: 'pod',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        podStatusMap: {
            'possiblereptile-default-pod-mortgage-app-deploy': {
                namespace: 'default',
                ready: 3,
                desired: 3,
            },
        },
        specs: {
            searchClusters: [
                {
                    name: 'possiblereptile',
                    ManagedClusterConditionAvailable: 'True',
                },
            ],
            clustersNames: ['possiblereptile'],
            raw: {
                kind: 'Pod',
                apiVersion: 'v1',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    template: {
                        spec: {
                            containers: [{ c1: 'aa' }],
                        },
                    },
                },
            },
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'Running',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile2': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'Pending',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile3': [
                    {
                        cluster: 'possiblereptile',
                        namespace: 'default',
                        status: 'CrashLoopBackOff',
                    },
                ],
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile4': [
                    {
                        cluster: 'possiblereptile4',
                        namespace: 'default',
                        status: 'CrashLoopBackOff',
                    },
                ],
            },
        },
    }
    const activeFilters = {
        resourceStatuses: new Set(['green']),
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status for pods', type: 'label' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: 'default', status: 'checkmark', value: '3/3' },
        { type: 'spacer' },
        { type: 'spacer' },
        { labelValue: 'Pod details for {{0}}', type: 'label' },
        {
            type: 'label',
            labelKey: 'Namespace',
            labelValue: undefined,
            value: 'default',
            indent: undefined,
            status: undefined,
        },
        {
            indent: undefined,
            labelKey: 'Status',
            labelValue: undefined,
            status: 'checkmark',
            type: 'label',
            value: 'Running',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'possiblereptile',
                    editLink: '/resources?cluster=possiblereptile&namespace=default',
                },
                label: 'View Pod YAML and Logs',
            },
        },
        {
            indent: undefined,
            labelKey: 'Restarts',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined',
        },
        {
            indent: undefined,
            labelKey: 'Host and Pod IP',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'undefined, undefined',
        },
        {
            indent: undefined,
            labelKey: 'Created',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: '-',
        },
        { type: 'spacer' },
    ]
    it('setPodDeployStatus - pod as desired green filter', () => {
        expect(setPodDeployStatus(node, node, [], activeFilters, t)).toEqual(result)
    })
})

describe('setPodDeployStatus  with pod as desired', () => {
    const node = {
        type: 'pod1',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        metadata: {
                            name: 'possiblereptile',
                        },
                        status: 'ok',
                    },
                ],
            },
        },
        podStatusMap: {
            'possiblereptile-default2': {
                cluster: 'possiblereptile2',
                namespace: 'default',
                ready: 1,
                desired: 1,
            },
        },
        specs: {
            searchClusters: [
                {
                    name: 'local-cluster',
                    status: 'OK',
                },
                {
                    name: 'possiblereptile',
                    ManagedClusterConditionAvailable: 'Unkown',
                },
            ],
            clustersNames: ['possiblereptile'],
            raw: {
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    template: {
                        spec: {
                            containers: [{ c1: 'aa' }],
                        },
                    },
                },
            },
            podModel: {
                'mortgage-app-deploy-55c65b9c8f-r84f4-possiblereptile': [
                    {
                        cluster: 'possiblereptile2',
                        namespace: 'default',
                        status: 'Running',
                    },
                ],
            },
        },
    }
    const result = [
        { type: 'spacer' },
        { labelKey: 'Cluster deploy status for pods', type: 'label' },
        { labelValue: 'Cluster name', value: 'possiblereptile' },
        { labelValue: '*', value: 'Not deployed', status: 'pending' },
        { type: 'spacer' },
    ]
    it('setPodDeployStatus with pod as desired but no matched cluster', () => {
        expect(setPodDeployStatus(node, node, [], {}, t)).toEqual(result)
    })
})

describe('getPodState pod', () => {
    const podItem = {
        apiversion: 'v1',
        cluster: 'relievedox',
        container: 'mortgagecm-mortgage',
        created: '2020-06-01T19:09:00Z',
        hostIP: '10.0.135.243',
        image: 'fxiang/mortgage:0.4.0',
        kind: 'pod',
        label: 'app=mortgagecm-mortgage; pod-template-hash=b8d75b48f',
        name: 'mortgagecm-deploy-b8d75b48f-mjsfg',
        namespace: 'default',
        podIP: '10.129.2.224',
        restarts: 3,
        selfLink: '/api/v1/namespaces/default/pods/mortgagecm-deploy-b8d75b48f-mjsfg',
        startedAt: '2020-06-01T19:09:00Z',
        status: 'Running',
        _clusterNamespace: 'relievedox-ns',
        _rbac: 'relievedox-ns_null_pods',
        _uid: 'relievedox/20239a36-560a-4240-85ae-1663f48fec55',
    }
    const clusterName = 'relievedox'
    const types = ['err', 'off', 'invalid', 'kill']

    const result = 0

    it('should return getPodState pod', () => {
        expect(getPodState(podItem, clusterName, types)).toEqual(result)
    })
})

describe('getPodState pod 1', () => {
    const podItem = {
        apiversion: 'v1',
        cluster: 'relievedox',
        container: 'mortgagecm-mortgage',
        created: '2020-06-01T19:09:00Z',
        hostIP: '10.0.135.243',
        image: 'fxiang/mortgage:0.4.0',
        kind: 'pod',
        label: 'app=mortgagecm-mortgage; pod-template-hash=b8d75b48f',
        name: 'mortgagecm-deploy-b8d75b48f-mjsfg',
        namespace: 'default',
        podIP: '10.129.2.224',
        restarts: 3,
        selfLink: '/api/v1/namespaces/default/pods/mortgagecm-deploy-b8d75b48f-mjsfg',
        startedAt: '2020-06-01T19:09:00Z',
        status: 'Running',
        _clusterNamespace: 'relievedox-ns',
        _rbac: 'relievedox-ns_null_pods',
        _uid: 'relievedox/20239a36-560a-4240-85ae-1663f48fec55',
    }
    const types = ['err', 'off', 'invalid', 'kill']

    const result = 0

    it('should return getPodState pod 1', () => {
        expect(getPodState(podItem, undefined, types)).toEqual(result)
    })
})

describe('getPodState pod 2', () => {
    const podItem = {
        apiversion: 'v1',
        cluster: 'relievedox',
        container: 'mortgagecm-mortgage',
        created: '2020-06-01T19:09:00Z',
        hostIP: '10.0.135.243',
        image: 'fxiang/mortgage:0.4.0',
        kind: 'pod',
        label: 'app=mortgagecm-mortgage; pod-template-hash=b8d75b48f',
        name: 'mortgagecm-deploy-b8d75b48f-mjsfg',
        namespace: 'default',
        podIP: '10.129.2.224',
        restarts: 3,
        selfLink: '/api/v1/namespaces/default/pods/mortgagecm-deploy-b8d75b48f-mjsfg',
        startedAt: '2020-06-01T19:09:00Z',
        status: 'OOMKill',
        _clusterNamespace: 'relievedox-ns',
        _rbac: 'relievedox-ns_null_pods',
        _uid: 'relievedox/20239a36-560a-4240-85ae-1663f48fec55',
    }
    const types = ['err', 'off', 'invalid', 'kill']
    const clusterName = 'relievedox'

    const result = 1

    it('should return getPodState pod 2', () => {
        expect(getPodState(podItem, clusterName, types)).toEqual(result)
    })
})

describe('getPulseStatusForCluster all ok', () => {
    const clusterNode = {
        specs: {
            clusters: [{ status: 'ok' }, { status: 'ok' }],
        },
    }
    it('should process cluster node', () => {
        expect(getPulseStatusForCluster(clusterNode)).toEqual('green')
    })
})

describe('getPulseStatusForCluster all some offline', () => {
    const clusterNode = {
        specs: {
            clusters: [{ status: 'ok' }, { status: 'offline' }],
        },
    }
    it('should process cluster node', () => {
        expect(getPulseStatusForCluster(clusterNode)).toEqual('red')
    })
})

describe('getPulseStatusForCluster all pending', () => {
    const clusterNode = {
        specs: {
            clusters: [{ status: 'pendingimport' }, { status: 'pendingimport' }],
        },
    }
    it('should process cluster node', () => {
        expect(getPulseStatusForCluster(clusterNode)).toEqual('orange')
    })
})

describe('getPulseStatusForCluster all some ok', () => {
    const clusterNode = {
        specs: {
            clusters: [{ status: 'ok' }, { status: 'pending' }],
        },
    }
    it('should process cluster node', () => {
        expect(getPulseStatusForCluster(clusterNode)).toEqual('yellow')
    })
})
