// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import {
    getNodePropery,
    addPropertyToList,
    createDeployableYamlLink,
    createResourceSearchLink,
    computeNodeStatus,
    setSubscriptionDeployStatus,
    setResourceDeployStatus,
    setApplicationDeployStatus,
    setPodDeployStatus,
    getPulseForData,
    getPulseForNodeWithPodStatus,
    addOCPRouteLocation,
    addNodeServiceLocation,
    processResourceActionLink,
    addNodeServiceLocationForCluster,
    addNodeOCPRouteLocationForCluster,
    computeResourceName,
    addIngressNodeInfo,
    setPlacementRuleDeployStatus,
    addNodeInfoPerCluster,
    getPodState,
    getNameWithoutChartRelease,
    removeReleaseGeneratedSuffix,
    getPulseStatusForCluster,
    checkNotOrObjects,
    checkAndObjects,
} from './diagram-helpers'

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
} from './diagram-helpers.data.js'

import { ansibleSuccess, ansibleError, ansibleError2, ansibleErrorAllClusters } from './TestingData'

const t = (string) => {
    return string
}

window.open = () => {} // provide an empty implementation for window.open

const node = {
    specs: {
        raw: {
            metadata: {
                name: 'nodeName',
                namespace: 'nodeNS',
            },
        },
    },
}

const propPath = ['specs', 'raw', 'spec', 'clusterSelector', 'matchLabels']
const propPath_found = ['specs', 'raw', 'metadata', 'namespace']
const key = 'nskey'
const defaultValue = 'test'

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
    const previousPulse = 'green'
    const available = 1
    const desired = 2
    const podsUnavailable = 0

    it('getPulseForData pulse red pod desired less then available', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('yellow')
    })
})

describe('getPulseForData', () => {
    const previousPulse = 'green'
    const available = 1
    const desired = 0
    const podsUnavailable = 0

    it('getPulseForData pulse yellow pod desired is 0', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('yellow')
    })
})

describe('getPulseForData', () => {
    const previousPulse = 'green'
    const available = 1
    const desired = 1
    const podsUnavailable = 0

    it('getPulseForData pulse green pod desired is equal with available', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('green')
    })
})

describe('getPulseForData', () => {
    const previousPulse = 'yellow'
    const available = 0
    const desired = undefined
    const podsUnavailable = 0

    it('getPulseForData pulse orange pod desired is undefined and no pods available', () => {
        expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('orange')
    })
})

describe('getNodePropery', () => {
    const result = { labelKey: 'nskey', value: 'test' }
    it('get property nodes, not found', () => {
        expect(getNodePropery(node, propPath, key, defaultValue)).toEqual(result)
    })
})

describe('getNodePropery', () => {
    it('get property nodes, not found, no default value', () => {
        expect(getNodePropery(node, propPath, key)).toEqual(undefined)
    })
})

describe('getNodePropery', () => {
    const result = { labelKey: 'nskey', value: 'nodeNS' }

    it('get property nodes, found', () => {
        expect(getNodePropery(node, propPath_found, key)).toEqual(result)
    })
})

const list = []
describe('addPropertyToList', () => {
    const result = [{ labelKey: 'nskey', value: 'nodeNS' }]
    const data = { labelKey: 'nskey', value: 'nodeNS' }
    it('addPropertyToList', () => {
        expect(addPropertyToList(list, data)).toEqual(result)
    })
})

describe('addPropertyToList undefined list', () => {
    const data = { labelKey: 'nskey', value: 'nodeNS' }
    it('addPropertyToList', () => {
        expect(addPropertyToList(undefined, data)).toEqual(undefined)
    })
})

describe('addPropertyToList undefined data', () => {
    it('addPropertyToList', () => {
        expect(addPropertyToList(list, undefined)).toEqual(list)
    })
})

describe('computeResourceName node with pods no _hostingDeployable', () => {
    const node = {
        apiversion: 'v1',
        cluster: 'sharingpenguin',
        container: 'secondary',
        created: '2020-05-26T19:18:21Z',
        kind: 'pod',
        label: 'app; pod-template-hash=5bdcfd74c7; role=secondary; tier=backend',
        name: 'redis-secondary-5bdcfd74c7-22ljj',
        namespace: 'app-guestbook-git-ns',
        restarts: 0,
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
        startedAt: '2020-05-26T19:18:21Z',
        status: 'Running',
    }
    it('nodeMustHavePods POD no _hostingDeployable', () => {
        expect(computeResourceName(node, null, 'redis-secondary', { value: 'true' })).toEqual('pod-redis')
    })
})

describe('computeResourceName node with pods with _hostingDeployable', () => {
    const node = {
        apiversion: 'v1',
        cluster: 'sharingpenguin',
        container: 'secondary',
        created: '2020-05-26T19:18:21Z',
        kind: 'pod',
        label: 'app=redis; pod-template-hash=5bdcfd74c7; role=secondary; tier=backend',
        name: 'redis-secondary-5bdcfd74c7-22ljj',
        namespace: 'app-guestbook-git-ns',
        restarts: 0,
        _hostingDeployable: 'aaa',
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
        startedAt: '2020-05-26T19:18:21Z',
        status: 'Running',
    }
    it('nodeMustHavePods POD with _hostingDeployable', () => {
        expect(computeResourceName(node, null, 'redis-secondary', { value: 'true' })).toEqual('pod-redis-secondary')
    })
})

describe('getNameWithoutChartRelease', () => {
    const nodeNameSameAsChartRelease = {
        _uid: 'ui-dev-remote/679d65a8-8091-4aa9-87c8-0c9a568ca793',
        cluster: 'ui-dev-remote',
        selfLink: '/api/v1/namespaces/val-helm-alias2-ns/secrets/my-redis',
        _clusterNamespace: 'ui-dev-remote',
        created: '2021-03-17',
        kind: 'secret',
        name: 'my-redis',
        namespace: 'val-helm-alias2-ns',
        apiversion: 'v1',
        label: 'app.kubernetes.io/managed-by=Helm; app=redis; chart=redis-12.8.3; heritage=Helm; release=my-redis',
        _rbac: 'ui-dev-remote_null_secrets',
    }

    const node = {
        apiversion: 'v1',
        cluster: 'sharingpenguin',
        container: 'secondary',
        created: '2020-05-26T19:18:21Z',
        kind: 'pod',
        label: 'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
        name: 'nginx-ingress-edafb-default-backend',
        namespace: 'app-guestbook-git-ns',
        restarts: 0,
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
        startedAt: '2020-05-26T19:18:21Z',
        status: 'Running',
    }

    const nodePod = {
        _uid: 'local-cluster/d1332a59-0cdf-4bec-b034-7406e912ef58',
        name: 'nginx-7697f9fd6d-qnf6s',
        selfLink: '/api/v1/namespaces/vb-helm-nginx-ns/pods/nginx-7697f9fd6d-qnf6s',
        kind: 'pod',
        _rbac: 'vb-helm-nginx-ns_null_pods',
        image: ['docker.io/bitnami/nginx:1.19.8-debian-10-r0'],
        _hubClusterResource: 'true',
        restarts: 0,
        label: 'app.kubernetes.io/instance=nginx; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=nginx; helm.sh/chart=nginx-8.7.1; pod-template-hash=7697f9fd6d',
        status: 'Running',
        cluster: 'local-cluster',
        apiversion: 'v1',
        container: 'nginx',
        namespace: 'vb-helm-nginx-ns',
    }

    const nodeWithReleaseNameInTheName = {
        apigroup: 'apps',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2021-03-18T13:08:54Z',
        kind: 'controllerrevision',
        label: 'app=redis; chart=redis-12.2.4; controller.kubernetes.io/hash=7f77dbc994; release=redis; role=main',
        name: 'redis-main-7f77dbc994',
        namespace: 'helm-app2-demo-ns',
        selfLink: '/apis/apps/v1/namespaces/helm-app2-demo-ns/controllerrevisions/redis-main-7f77dbc994',
        _hubClusterResource: 'true',
        _rbac: 'helm-app2-demo-ns_apps_controllerrevisions',
        _uid: 'local-cluster/abb053a5-4e32-4c18-bc09-42af449ffdb2',
    }

    it('returns unchanged name for pod with no deployable', () => {
        expect(
            getNameWithoutChartRelease(node, 'nginx-ingress-edafb-default-backend', {
                value: false,
            })
        ).toEqual('nginx-ingress-edafb-default-backend')
    })

    it('returns chart name for a related object, name same as the chart release name', () => {
        expect(
            getNameWithoutChartRelease(nodeNameSameAsChartRelease, 'my-redis', {
                value: true,
            })
        ).toEqual('my-redis')
    })

    it('returns last string for a pod object, pod name - without hash - same as the release name', () => {
        expect(
            getNameWithoutChartRelease(nodePod, 'nginx-qnf6s', {
                value: true,
            })
        ).toEqual('qnf6s')
    })

    it('returns name with release for resource with release name- contained by the resource name', () => {
        expect(
            getNameWithoutChartRelease(nodeWithReleaseNameInTheName, 'redis-main', {
                value: false,
            })
        ).toEqual('redis-main')
    })

    const nodePodNoDeployable = {
        apiversion: 'v1',
        cluster: 'sharingpenguin',
        container: 'secondary',
        created: '2020-05-26T19:18:21Z',
        kind: 'pod',
        label: 'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
        name: 'nginx-ingress-edafb-default-backend',
        namespace: 'app-guestbook-git-ns',
        restarts: 0,
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
        startedAt: '2020-05-26T19:18:21Z',
        status: 'Running',
    }

    it('getNameWithoutChartRelease for pod with no deployable', () => {
        expect(
            getNameWithoutChartRelease(nodePodNoDeployable, 'nginx-ingress-edafb-default-backend', {
                value: false,
            })
        ).toEqual('nginx-ingress-edafb-default-backend')
    })
})

describe('getNameWithoutChartRelease node with release name plus pod name', () => {
    const node = {
        apiversion: 'v1',
        cluster: 'sharingpenguin',
        container: 'secondary',
        created: '2020-05-26T19:18:21Z',
        kind: 'pod',
        label: 'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
        name: 'nginx-ingress-edafb',
        namespace: 'app-guestbook-git-ns',
        restarts: 0,
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
        startedAt: '2020-05-26T19:18:21Z',
        status: 'Running',
    }

    it('getNameWithoutChartRelease for pod with release name plus pod name', () => {
        expect(
            getNameWithoutChartRelease(node, 'nginx-ingress-edafb-controller', {
                value: true,
            })
        ).toEqual('controller')
    })
})

describe('getNameWithoutChartRelease node for helmrelease no label', () => {
    const node = {
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        branch: 'main',
        chartPath: 'test/github/helmcharts/chart1',
        cluster: 'sharingpenguin',
        created: '2020-07-07T00:11:41Z',
        kind: 'helmrelease',
        name: 'chart1-5a9ac',
        namespace: 'git-sub-ns-helm',
        selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/git-sub-ns-helm/helmreleases/chart1-5a9ac',
        sourceType: 'git',
        url: 'https://github.com/stolostron/multicloud-operators-subscription',
        _clusterNamespace: 'sharingpenguin',
        _hostingDeployable: 'ch-git-helm/git-helm-chart1-1.1.1',
        _hostingSubscription: 'git-sub-ns-helm/git-helm-sub',
        _rbac: 'sharingpenguin_apps.open-cluster-management.io_helmreleases',
        _uid: 'sharingpenguin/c1e81dd9-6c12-443c-9300-b8da955370dc',
    }

    it('getNameWithoutChartRelease helm release  no no label', () => {
        expect(
            getNameWithoutChartRelease(node, 'ch-git-helm/git-helm-chart1-1.1.1', {
                value: true,
            })
        ).toEqual('chart1-1.1.1')
    })
})

describe('getNameWithoutChartRelease node for subscription, with label', () => {
    const node = {
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ch-git-helm/git-helm',
        cluster: 'local-cluster',
        kind: 'subscription',
        label: 'app=gbapp; release=app01',
        name: 'git-helm-sub',
        namespace: 'git-sub-ns-helm',
        selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/git-sub-ns-helm/subscriptions/git-helm-sub',
        status: 'Propagated',
        _hubClusterResource: 'true',
    }

    it('getNameWithoutChartRelease helm release  no no label', () => {
        expect(getNameWithoutChartRelease(node, 'git-helm-sub', { value: true })).toEqual('git-helm-sub')
    })
})

describe('createDeployableYamlLink for application no selflink', () => {
    const details = []
    const node = {
        type: 'application',
        name: 'test-1',
        namespace: 'test-1-ns',
        id: 'id',
        specs: {
            row: 20,
            isDesign: true,
            raw: {
                kind: 'Application',
            },
        },
    }
    it('createDeployableYamlLink for application editLink', () => {
        expect(createDeployableYamlLink(node, details, t)).toEqual([
            {
                type: 'link',
                value: {
                    data: {
                        action: 'show_resource_yaml',
                        cluster: 'local-cluster',
                        editLink: '/resources?cluster=local-cluster&kind=application&name=test-1&namespace=test-1-ns',
                    },
                    label: 'View resource YAML',
                },
            },
        ])
    })
})

describe('createDeployableYamlLink for application with editLink', () => {
    const details = []
    const node = {
        type: 'application',
        id: 'id',
        name: 'test',
        namespace: 'test-ns',
        apiversion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        specs: {
            isDesign: true,
            raw: {
                metadata: {
                    selfLink: 'appLink',
                },
            },
        },
    }
    const result = [
        {
            type: 'link',
            value: {
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=app.k8s.io%2Fv1beta1&cluster=local-cluster&kind=application&name=test&namespace=test-ns',
                },
                label: 'View resource YAML',
            },
        },
    ]
    it('createDeployableYamlLink for application with selflink', () => {
        expect(createDeployableYamlLink(node, details, t)).toEqual(result)
    })
})

describe('createDeployableYamlLink for child application', () => {
    const details = []
    const node = {
        type: 'application',
        id: 'id',
        name: 'test',
        namespace: 'test-ns',
        apiversion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        specs: {
            raw: {
                metadata: {
                    selfLink: 'appLink',
                },
            },
        },
    }
    const result = []
    it('does not add a link', () => {
        expect(createDeployableYamlLink(node, details)).toEqual(result)
    })
})

describe('createDeployableYamlLink for other', () => {
    const details = []
    const node = {
        id: 'id',
        specs: {
            row_foo: 20,
        },
    }
    it('createDeployableYamlLink for other', () => {
        expect(createDeployableYamlLink(node, details)).toEqual([])
    })
})

describe('createResourceSearchLink for undefined details', () => {
    const node = {
        id: 'id',
        specs: {
            row: 20,
            pulse: 'orange',
        },
    }
    const result = { type: 'link', value: null }
    it('createResourceSearchLink for undefined details', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for cluster node no name', () => {
    const node = {
        id: 'id',
        type: 'cluster',
        specs: {
            clusters: [],
        },
    }
    const result = {
        type: 'link',
        value: {
            data: { action: 'show_search', kind: 'cluster', name: 'undefined' },
            id: 'id',
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for cluster node no name', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for cluster node w name', () => {
    const node = {
        id: 'id',
        type: 'cluster',
        name: 'a, b, c',
        specs: {
            clusters: [],
        },
    }
    const result = {
        type: 'link',
        value: {
            data: { action: 'show_search', kind: 'cluster', name: 'a,b,c' },
            id: 'id',
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for cluster node w name', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for cluster', () => {
    const node = {
        type: 'cluster',
        name: 'cls1, cls2, cls3',
        namespace: 'ns',
        specs: {
            clusters: [],
        },
    }
    const result = {
        type: 'link',
        value: {
            data: { action: 'show_search', kind: 'cluster', name: 'cls1,cls2,cls3' },
            id: undefined,
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for cluster', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for PR', () => {
    const node = {
        type: 'placements',
        name: 'rule1',
        namespace: 'ns',
        specs: {
            raw: {
                metadata: {
                    namespace: 'ns',
                },
            },
        },
    }
    const result = {
        type: 'link',
        value: {
            data: {
                action: 'show_search',
                kind: 'placementrule',
                name: 'rule1',
                namespace: 'ns',
            },
            id: undefined,
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for PR', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for details', () => {
    const node = {
        type: 'deployment',
        name: 'name',
        namespace: 'ns',
        specs: {
            raw: {
                metadata: {
                    namespace: 'ns',
                },
            },
        },
    }
    const result = {
        type: 'link',
        value: {
            data: {
                action: 'show_search',
                kind: 'deployment',
                name: 'name',
                namespace: 'ns',
            },
            id: undefined,
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for details', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for details with model info, unique names', () => {
    const node = {
        type: 'deployment',
        name: 'name',
        namespace: 'ns',
        specs: {
            deploymentModel: {
                obj1_cls1: {
                    name: 'obj1',
                    namespace: 'ns1',
                },
                obj2_cls1: {
                    name: 'obj2',
                    namespace: 'ns2',
                },
            },
        },
    }
    const result = {
        type: 'link',
        value: {
            data: {
                action: 'show_search',
                kind: 'deployment',
                name: 'obj1,obj2',
                namespace: 'ns1,ns2',
            },
            id: undefined,
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for details with model info, unique names', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
    })
})

describe('createResourceSearchLink for details with model info, same names', () => {
    const node = {
        type: 'deployment',
        name: 'name',
        namespace: 'ns',
        specs: {
            deploymentModel: {
                obj1_cls1: {
                    name: 'name',
                    namespace: 'ns1',
                },
                obj2_cls1: {
                    name: 'name',
                    namespace: 'ns',
                },
            },
        },
    }
    const result = {
        type: 'link',
        value: {
            data: {
                action: 'show_search',
                kind: 'deployment',
                name: 'name',
                namespace: 'ns1,ns',
            },
            id: undefined,
            indent: true,
            label: 'Launch resource in Search',
        },
    }
    it('createResourceSearchLink for details with model info, same names', () => {
        expect(createResourceSearchLink(node, t)).toEqual(result)
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
            'possiblereptile-default': {
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
            'possiblereptile-default': {
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
            'possiblereptile-default': {
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

describe('addNodeOCPRouteLocationForCluster no host spec', () => {
    const node = {
        type: 'route',
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
                        clusterip: 'aaa',
                    },
                ],
            },
        },
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                metadata: {
                    namespace: 'default',
                },
            },
        },
    }
    const obj = {
        id: 'objID',
    }
    const result = [
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'open_route_url',
                    routeObject: {
                        id: 'objID',
                    },
                },
                id: '0',
                labelKey: 'Launch Route URL',
            },
        },
    ]
    it('addNodeOCPRouteLocationForCluster no host spec', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addOCPRouteLocation spec no tls', () => {
    const node = {
        type: 'route',
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
                        clusterip: 'aaa',
                    },
                ],
            },
        },
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        kind: 'route',
                        namespace: 'default',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    host: '1.1.1',
                },
            },
        },
    }
    const result = []
    it('addOCPRouteLocation no tls', () => {
        expect(addOCPRouteLocation(node, 'possiblereptile', 'default', [])).toEqual(result)
    })
})

describe('addNodeOCPRouteLocationForCluster spec no route', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',

        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    host: '1.1.1',
                },
            },
        },
    }
    const obj = {
        id: 'objID',
    }
    const result = []
    it('addNodeOCPRouteLocationForCluster no route', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addOCPRouteLocation spec with tls', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }
    it('addOCPRouteLocation with tls', () => {
        expect(addOCPRouteLocation(node, 'possiblereptile', 'default', [])).toEqual([])
    })
})

describe('addNodeOCPRouteLocationForCluster', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }

    const obj = {
        id: 'objID',
    }
    const result = []
    it('addNodeOCPRouteLocationForCluster with tls and host', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addNodeOCPRouteLocationForCluster', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }

    const result = [
        { type: 'spacer' },
        { labelKey: 'Location', type: 'label' },
        {
            indent: true,
            type: 'link',
            value: {
                data: { action: 'open_link', targetLink: 'https://1.1.1/' },
                id: '0-location',
                label: 'https://1.1.1/',
            },
        },
        { type: 'spacer' },
    ]
    it('addNodeOCPRouteLocationForCluster with tls and no obj', () => {
        expect(addNodeOCPRouteLocationForCluster(node, undefined, [])).toEqual(result)
    })
})

describe('addNodeOCPRouteLocationForCluster', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        consoleURL: 'https://console-openshift-console.222',
                        metadata: {
                            name: 'possiblereptile',
                        },
                    },
                ],
            },
        },
        specs: {
            searchClusters: [
                {
                    consoleURL: 'https://console-openshift-console.222',
                    metadata: {
                        name: 'possiblereptile',
                    },
                },
            ],
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    tls: {},
                },
            },
        },
    }

    const obj = {
        _uid: 'objID',
        cluster: 'possiblereptile',
    }
    const result = [
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'open_route_url',
                    routeObject: {
                        cluster: 'possiblereptile',
                        _uid: 'objID',
                    },
                },
                id: 'objID',
                labelKey: 'Launch Route URL',
            },
        },
    ]

    it('addNodeOCPRouteLocationForCluster with tls and no host', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addNodeOCPRouteLocationForCluster', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        consoleURL: 'https://console-openshift-console.222',
                        metadata: {
                            name: 'possiblereptile',
                        },
                    },
                ],
            },
        },
        specs: {
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    rules: [{}, {}],
                },
            },
        },
    }

    const obj = {
        id: 'objID',
        cluster: 'possiblereptile',
    }
    it('tests Routes generated from Ingress with 2 route rules', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual([])
    })
})

describe('addNodeOCPRouteLocationForCluster', () => {
    const node = {
        type: 'route',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-route--route--mortgage-app-deploy',
        clusters: {
            specs: {
                clusters: [
                    {
                        consoleURL: 'https://console-openshift-console.222',
                        metadata: {
                            name: 'possiblereptile',
                        },
                    },
                ],
            },
        },
        specs: {
            searchClusters: [
                {
                    consoleURL: 'https://console-openshift-console.222',
                    metadata: {
                        name: 'possiblereptile',
                    },
                },
            ],
            routeModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        kind: 'route',
                        cluster: 'possiblereptile',
                    },
                ],
            },
            raw: {
                kind: 'Route',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    rules: [
                        {
                            route: 'aaa',
                        },
                    ],
                },
            },
        },
    }

    const obj = {
        cluster: 'possiblereptile',
        _uid: 'objID',
    }
    const result = [
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'open_route_url',
                    routeObject: {
                        cluster: 'possiblereptile',
                        _uid: 'objID',
                    },
                },
                id: 'objID',
                labelKey: 'Launch Route URL',
            },
        },
    ]

    it('tests Routes generated from Ingress with one route rules', () => {
        expect(addNodeOCPRouteLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addIngressNodeInfo 1', () => {
    const node = {
        type: 'ingress',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            raw: {
                kind: 'Ingress',
                spec: {
                    metadata: {
                        namespace: 'default',
                    },
                    rules: [
                        {
                            host: 'aaa',
                            http: {
                                paths: [
                                    {
                                        backend: {
                                            serviceName: 'n1',
                                            servicePort: 'p1',
                                        },
                                    },
                                    {
                                        backend: {
                                            serviceName: 'n2',
                                            servicePort: 'p2',
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            host: 'bbb',
                            http: {
                                paths: [
                                    {
                                        backend: {
                                            serviceName: 'bn1',
                                            servicePort: 'bp1',
                                        },
                                    },
                                    {
                                        backend: {
                                            serviceName: 'bn2',
                                            servicePort: 'bp2',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                    host: '1.1.1',
                },
            },
        },
    }
    const result = [
        { labelKey: 'Location', type: 'label' },
        { labelKey: 'Host', value: 'aaa' },
        { labelKey: 'Service Name', value: 'n1' },
        { labelKey: 'Service Port', value: 'p1' },
        { labelKey: 'Service Name', value: 'n2' },
        { labelKey: 'Service Port', value: 'p2' },
        { type: 'spacer' },
        { labelKey: 'Host', value: 'bbb' },
        { labelKey: 'Service Name', value: 'bn1' },
        { labelKey: 'Service Port', value: 'bp1' },
        { labelKey: 'Service Name', value: 'bn2' },
        { labelKey: 'Service Port', value: 'bp2' },
        { type: 'spacer' },
    ]
    it('addIngressNodeInfo 1', () => {
        expect(addIngressNodeInfo(node, [])).toEqual(result)
    })
})

describe('addIngressNodeInfo other node type', () => {
    const node = {
        type: 'ingress22',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            raw: {
                metadata: {
                    namespace: 'default',
                },
                kind: 'Ingress22',
            },
        },
    }
    it('addIngressNodeInfo 1', () => {
        expect(addIngressNodeInfo(node, [])).toEqual([])
    })
})

describe('addNodeServiceLocation 1', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            serviceModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        clusterIP: '1.1',
                        port: '80:65/TCP',
                    },
                ],
            },
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-deploy',
                },
                kind: 'Service',
                spec: {
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }
    const result = []
    it('addNodeServiceLocation 1', () => {
        expect(addNodeServiceLocation(node, 'possiblereptile', 'default', [])).toEqual(result)
    })
})

describe('addNodeInfoPerCluster 1', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            serviceModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        clusterIP: '1.1',
                        port: '80:65/TCP',
                    },
                ],
            },
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-deploy',
                },
                kind: 'Service',
                spec: {
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }
    const testFn = (jest.fn = () => {
        return {
            type: 'label',
            labelValue: 'clusterName',
            value: 'location',
        }
    })
    it('addNodeInfoPerCluster 1', () => {
        expect(addNodeInfoPerCluster(node, 'possiblereptile', 'default', [], testFn)).toEqual([])
    })
})

describe('addNodeServiceLocationForCluster 1', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            serviceModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        clusterIP: '1.1',
                        port: '80:65/TCP',
                    },
                ],
            },
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-deploy',
                },
                kind: 'Service',
                spec: {
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }
    const obj = {
        cluster: 'possiblereptile',
        clusterIP: '172.30.129.147',
        created: '2020-05-26T19:18:18Z',
        kind: 'service',
        label: 'app=guestbook; tier=frontend',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        port: '80:31021/TCP',
        selfLink: '/api/v1/namespaces/app-guestbook-git-ns/services/frontend',
        type: 'NodePort',
    }
    const result = [{ labelKey: 'Location', value: '172.30.129.147:80' }]
    it('addNodeServiceLocationForCluster 1', () => {
        expect(addNodeServiceLocationForCluster(node, obj, [])).toEqual(result)
    })
})

describe('addNodeServiceLocationForCluster 1', () => {
    const node = {
        type: 'service',
        name: 'mortgage-app-deploy',
        namespace: 'default',
        id: 'member--member--deployable--member--clusters--possiblereptile--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-service--service--mortgage-app-deploy',
        specs: {
            serviceModel: {
                'mortgage-app-deploy-possiblereptile': [
                    {
                        namespace: 'default',
                        clusterIP: '1.1',
                        port: '80:65/TCP',
                    },
                ],
            },
            raw: {
                metadata: {
                    namespace: 'default',
                    name: 'mortgage-app-deploy',
                },
                kind: 'Service',
                spec: {
                    tls: {},
                    host: '1.1.1',
                },
            },
        },
    }
    const result = []
    it('addNodeServiceLocationForCluster no obj', () => {
        expect(addNodeServiceLocationForCluster(node, undefined, [])).toEqual(result)
    })
})

describe('processResourceActionLink search view2', () => {
    const openSearchView = {
        action: 'show_search',
        kind: 'service',
        name: 'frontend',
        namespace: 'open-cluster-management',
    }
    const result = '/search?filters={"textsearch":"kind:service namespace:open-cluster-management name:frontend"}'

    it('processResourceActionLink opens search view2', () => {
        expect(processResourceActionLink(openSearchView)).toEqual(result)
    })
})

describe('processResourceActionLink openRemoteresourceYaml', () => {
    const openRemoteresourceYaml = {
        action: 'show_resource_yaml',
        cluster: 'possiblereptile',
        editLink: '/resources?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123',
    }
    const result = '/resources?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123'
    it('processResourceActionLink openRemoteresourceYaml', () => {
        expect(processResourceActionLink(openRemoteresourceYaml)).toEqual(result)
    })
})

describe('processResourceActionLink search view3', () => {
    const genericLink = {
        action: 'open_link',
        targetLink: 'http://www.example.com',
    }
    const result = 'http://www.example.com'
    it('processResourceActionLink opens search view3', () => {
        expect(processResourceActionLink(genericLink)).toEqual(result)
    })
})

describe('processResourceActionLink dummy link', () => {
    const genericLink = {
        action: 'open_link',
        targetLink1: 'http://www.example.com',
    }
    const result = ''
    it('processResourceActionLink dummy link', () => {
        expect(processResourceActionLink(genericLink)).toEqual(result)
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

describe('removeReleaseGeneratedSuffix remove suffix', () => {
    it('should remove generate suffix for the helmrelease', () => {
        expect(removeReleaseGeneratedSuffix('nginx-ingress-66f46')).toEqual('nginx-ingress')
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

describe('checkNotOrObjects', () => {
    const definedObj1 = {}
    const definedObj2 = {}
    const undefinedObj = undefined

    it('should return false', () => {
        expect(checkNotOrObjects(definedObj1, definedObj2)).toEqual(false)
    })

    it('should return true', () => {
        expect(checkNotOrObjects(definedObj1, undefinedObj)).toEqual(true)
    })
})

describe('checkAndObjects', () => {
    const definedObj1 = { name: 'mortgage' }
    const definedObj2 = { name: 'mortgage' }
    const undefinedObj = undefined

    it('should check objects', () => {
        expect(checkAndObjects(definedObj1, undefinedObj)).toEqual(undefinedObj)
    })

    it('should check objects', () => {
        expect(checkAndObjects(definedObj1, definedObj2)).toEqual(definedObj1)
    })
})
