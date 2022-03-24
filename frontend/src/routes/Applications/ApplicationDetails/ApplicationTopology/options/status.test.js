// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { updateNodeStatus, updateNodeIcons } from './status'

const t = (string) => {
    return string
}

const applicationNodes = [
    {
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
            pulse: 'orange',
        },
        topology: null,
        type: 'application',
        uid: 'application--nginx-app-3',
        __typename: 'Resource',
    },
]

const argoApplicationNodes = [
    {
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
            pulse: 'orange',
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
            },
            relatedApps: [],
        },
        topology: null,
        type: 'application',
        uid: 'application--nginx-app-3',
        __typename: 'Resource',
    },
]

const clusterNodes = [
    {
        id: 'member--clusters--cluster1',
        uid: 'member--clusters--cluster1',
        name: 'cluster1',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusters: [],
            cluster: {
                metadata: {
                    name: 'cluster1',
                    namespace: 'cluster1',
                    selfLink: '/apis/clusterregistry.k8s.io/v1alpha1/namespaces/cluster1/clusters/cluster1',
                    uid: '98a0e1b0-519c-11ea-9c87-965ebc50d5a3',
                    resourceVersion: '796601',
                    creationTimestamp: '2020-02-17T15:46:00Z',
                    labels: {
                        cloud: 'IBM',
                        env: 'prod',
                        name: 'cluster1',
                        region: 'paris',
                        vendor: 'RHOCP',
                    },
                },
                usage: {
                    cpu: '2808m',
                    memory: '5543Mi',
                    pods: '65',
                    storage: '20Gi',
                },
                status: 'ok',
            },
            clusterNames: ['cluster1'],
            clusterStatus: {
                isOffline: false,
                hasViolations: false,
                hasFailure: false,
                isRecent: false,
                isDisabled: false,
                hasWarning: true,
            },
            scale: 1,
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
    {
        id: 'member--clusters--cluster2',
        uid: 'member--clusters--cluster2',
        name: 'cluster2',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusters: [],
            cluster: {
                metadata: {
                    name: 'cluster2',
                    namespace: 'cluster2',
                    selfLink: '/apis/clusterregistry.k8s.io/v1alpha1/namespaces/cluster2/clusters/cluster2',
                    uid: '98a0e1b0-519c-11ea-9c87-965ebc50d5a3',
                    resourceVersion: '796601',
                    creationTimestamp: '2020-02-17T15:46:00Z',
                    labels: {
                        cloud: 'IBM',
                        env: 'prod',
                        name: 'cluster2',
                        region: 'paris',
                        vendor: 'RHOCP',
                    },
                },
                usage: {
                    cpu: '2808m',
                    memory: '5543Mi',
                    pods: '65',
                    storage: '20Gi',
                },
                status: 'offline',
            },
            clusterNames: ['cluster2'],
            clusterStatus: {
                isOffline: true,
                hasViolations: true,
                hasFailure: true,
                isRecent: true,
                isDisabled: true,
            },
            scale: 1,
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
    {
        id: 'member--clusters--cluster3',
        uid: 'member--clusters--cluster3',
        name: 'cluster3',
        cluster: null,
        clusterName: null,
        type: 'cluster',
        specs: {
            clusters: [],
            cluster: {
                metadata: {
                    name: 'cluster3',
                    namespace: 'cluster3',
                    selfLink: '/apis/clusterregistry.k8s.io/v1alpha1/namespaces/cluster2/clusters/cluster2',
                    uid: '98a0e1b0-519c-11ea-9c87-965ebc50d5a3',
                    resourceVersion: '796601',
                    creationTimestamp: '2020-02-17T15:46:00Z',
                    labels: {
                        cloud: 'IBM',
                        env: 'prod',
                        name: 'cluster2',
                        region: 'paris',
                        vendor: 'RHOCP',
                    },
                },
                usage: {
                    cpu: '2808m',
                    memory: '5543Mi',
                    pods: '65',
                    storage: '20Gi',
                },
                status: 'offline',
            },
            clusterNames: ['cluster3'],
            scale: 1,
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
]

const podNodes = [
    {
        id: 'member--pod--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit1',
        uid: 'member--pod--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit1',
        name: 'pacmangit',
        cluster: null,
        clusterName: null,
        type: 'pod',
        specs: {
            pulse: 'something else',
        },
    },
    {
        id: 'member--pod--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit',
        uid: 'member--pod--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit',
        name: 'pacmangit',
        cluster: null,
        clusterName: null,
        type: 'pod',
        specs: {
            raw: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    labels: {
                        app: 'pacmangit',
                    },
                    name: 'pacmangit',
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            name: 'pacmangit',
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                name: 'pacmangit',
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    env: [
                                        {
                                            name: 'MONGO_SERVICE_HOST',
                                            value: 'b8eec768-c48d-4022-9c32-b6083afed0c9-0.bngflf7f0ktkmkdl3jhg.databases.appdomain.cloud',
                                        },
                                        {
                                            name: 'MONGO_AUTH_USER',
                                            value: 'ibm_cloud_82d27531_5290_4a59_b1c4_5cbef1154ea3',
                                        },
                                        {
                                            name: 'MONGO_REPLICA_SET',
                                            value: 'replset',
                                        },
                                        {
                                            name: 'MONGO_AUTH_PWD',
                                            value: 'f197cc208307f82e2e0de68b781f7a128cf6a98eed3e38e10fcf2309c6e91455',
                                        },
                                        {
                                            name: 'MONGO_DATABASE',
                                            value: 'admin',
                                        },
                                        {
                                            name: 'MY_MONGO_PORT',
                                            value: '30692',
                                        },
                                        {
                                            name: 'MONGO_USE_SSL',
                                            value: 'true',
                                        },
                                        {
                                            name: 'MONGO_VALIDATE_SSL',
                                            value: 'false',
                                        },
                                        {
                                            name: 'MY_NODE_NAME',
                                            valueFrom: {
                                                fieldRef: {
                                                    fieldPath: 'spec.nodeName',
                                                },
                                            },
                                        },
                                        {
                                            name: 'COLOR',
                                            value: 'rgb(197, 33, 33)',
                                        },
                                        {
                                            name: 'MY_IMAGE',
                                            value: 'RedHat',
                                        },
                                        {
                                            name: 'MESSAGE',
                                            value: 'Initial Version',
                                        },
                                    ],
                                    image: 'docker.io/rfontain/pacman:v1',
                                    imagePullPolicy: 'Always',
                                    name: 'pacmangit',
                                    ports: [
                                        {
                                            containerPort: 8080,
                                        },
                                    ],
                                },
                            ],
                            serviceAccount: 'pacmangit',
                        },
                    },
                },
            },
            row: 984,
            podModel: {
                'pacmangit-668ff55c4d-m2cgt': {
                    name: 'pacmangit-668ff55c4d-m2cgt',
                    namespace: 'pacmangit',
                    status: 'Running',
                    cluster: {
                        metadata: {
                            name: 'az01',
                        },
                    },
                    containers: [
                        {
                            name: 'pacmangit',
                            image: 'docker.io/rfontain/pacman:v1',
                        },
                    ],
                    creationTimestamp: '2020-03-20T13:22:54Z',
                    labels: {
                        name: 'pacmangit',
                        'pod-template-hash': '2249911708',
                    },
                    hostIP: '10.65.71.148',
                    podIP: '172.30.92.237',
                    restarts: 0,
                    startedAt: '2020-03-20T13:22:54Z',
                },
                'pacmangit-668ff55c4d-fmnh4': {
                    name: 'pacmangit-668ff55c4d-fmnh4',
                    namespace: 'pacmangit',
                    status: 'Running',
                    cluster: {
                        metadata: {
                            name: 'cluster1',
                        },
                    },
                    containers: [
                        {
                            name: 'pacmangit',
                            image: 'docker.io/rfontain/pacman:v1',
                        },
                    ],
                    creationTimestamp: '2020-03-19T19:05:58Z',
                    labels: {
                        name: 'pacmangit',
                        'pod-template-hash': '2249911708',
                    },
                    hostIP: '10.126.109.199',
                    podIP: '172.30.167.142',
                    restarts: 0,
                    startedAt: '2020-03-19T19:05:58Z',
                },
            },
            podStatus: {
                hasPending: false,
                hasFailure: false,
                hasRestarts: false,
                hostIPs: ['10.65.71.148', '10.126.109.199'],
            },
            pulse: 'yellow',
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
]

const packageNodes = [
    {
        id: 'member--package--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit',
        uid: 'member--package--member--deployable--member--clusters--az01--pacmangitchannel--pacmangitchannel-deployment--pacmangit--pacmangit',
        name: 'packageres',
        cluster: null,
        clusterName: null,
        type: 'package',
        specs: {
            raw: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    labels: {
                        app: 'pacmangit',
                    },
                    name: 'pacmangit',
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            name: 'pacmangit',
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                name: 'pacmangit',
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    env: [
                                        {
                                            name: 'MONGO_SERVICE_HOST',
                                            value: 'b8eec768-c48d-4022-9c32-b6083afed0c9-0.bngflf7f0ktkmkdl3jhg.databases.appdomain.cloud',
                                        },
                                        {
                                            name: 'MONGO_AUTH_USER',
                                            value: 'ibm_cloud_82d27531_5290_4a59_b1c4_5cbef1154ea3',
                                        },
                                        {
                                            name: 'MONGO_REPLICA_SET',
                                            value: 'replset',
                                        },
                                        {
                                            name: 'MONGO_AUTH_PWD',
                                            value: 'f197cc208307f82e2e0de68b781f7a128cf6a98eed3e38e10fcf2309c6e91455',
                                        },
                                        {
                                            name: 'MONGO_DATABASE',
                                            value: 'admin',
                                        },
                                        {
                                            name: 'MY_MONGO_PORT',
                                            value: '30692',
                                        },
                                        {
                                            name: 'MONGO_USE_SSL',
                                            value: 'true',
                                        },
                                        {
                                            name: 'MONGO_VALIDATE_SSL',
                                            value: 'false',
                                        },
                                        {
                                            name: 'MY_NODE_NAME',
                                            valueFrom: {
                                                fieldRef: {
                                                    fieldPath: 'spec.nodeName',
                                                },
                                            },
                                        },
                                        {
                                            name: 'COLOR',
                                            value: 'rgb(197, 33, 33)',
                                        },
                                        {
                                            name: 'MY_IMAGE',
                                            value: 'RedHat',
                                        },
                                        {
                                            name: 'MESSAGE',
                                            value: 'Initial Version',
                                        },
                                    ],
                                    image: 'docker.io/rfontain/pacman:v1',
                                    imagePullPolicy: 'Always',
                                    name: 'pacmangit',
                                    ports: [
                                        {
                                            containerPort: 8080,
                                        },
                                    ],
                                },
                            ],
                            serviceAccount: 'pacmangit',
                        },
                    },
                },
            },
            row: 984,
            podModel: {
                'pacmangit-668ff55c4d-m2cgt': {
                    name: 'pacmangit-668ff55c4d-m2cgt',
                    namespace: 'pacmangit',
                    status: 'Running',
                    cluster: {
                        metadata: {
                            name: 'az01',
                        },
                    },
                    containers: [
                        {
                            name: 'pacmangit',
                            image: 'docker.io/rfontain/pacman:v1',
                        },
                    ],
                    creationTimestamp: '2020-03-20T13:22:54Z',
                    labels: {
                        name: 'pacmangit',
                        'pod-template-hash': '2249911708',
                    },
                    hostIP: '10.65.71.148',
                    podIP: '172.30.92.237',
                    restarts: 0,
                    startedAt: '2020-03-20T13:22:54Z',
                },
                'pacmangit-668ff55c4d-fmnh4': {
                    name: 'pacmangit-668ff55c4d-fmnh4',
                    namespace: 'pacmangit',
                    status: 'Running',
                    cluster: {
                        metadata: {
                            name: 'cluster1',
                        },
                    },
                    containers: [
                        {
                            name: 'pacmangit',
                            image: 'docker.io/rfontain/pacman:v1',
                        },
                    ],
                    creationTimestamp: '2020-03-19T19:05:58Z',
                    labels: {
                        name: 'pacmangit',
                        'pod-template-hash': '2249911708',
                    },
                    hostIP: '10.126.109.199',
                    podIP: '172.30.167.142',
                    restarts: 0,
                    startedAt: '2020-03-19T19:05:58Z',
                },
            },
            podStatus: {
                hasPending: false,
                hasFailure: false,
                hasRestarts: false,
                hostIPs: ['10.65.71.148', '10.126.109.199'],
            },
            pulse: null,
        },
        namespace: '',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
]

describe('updateNodeStatus application nodes', () => {
    it('should update application node', () => {
        expect(updateNodeStatus(applicationNodes, t)).toEqual(undefined)
    })
})

describe('updateNodeStatus cluster nodes', () => {
    it('should update cluster node', () => {
        expect(updateNodeStatus(clusterNodes, t)).toEqual(undefined)
    })
})

describe('updateNodeStatus cluster nodes', () => {
    it('should update pod node', () => {
        expect(updateNodeStatus(podNodes, t)).toEqual(undefined)
    })
})

describe('updateNodeIcons cluster nodes', () => {
    it('should update cluster node', () => {
        expect(updateNodeIcons(clusterNodes)).toEqual(undefined)
    })
})

describe('updateNodeIcons application nodes', () => {
    it('should update application node icon', () => {
        expect(updateNodeIcons(applicationNodes)).toEqual(undefined)
    })
})

describe('updateNodeIcons cluster nodes', () => {
    it('should update cluster node icon', () => {
        expect(updateNodeIcons(clusterNodes)).toEqual(undefined)
    })
})

describe('updateNodeIcons pod nodes', () => {
    it('should update pod node icon', () => {
        expect(updateNodeIcons(podNodes)).toEqual(undefined)
    })
})

describe('updateNodeIcons package nodes', () => {
    it('should update package node icon', () => {
        expect(updateNodeIcons(packageNodes)).toEqual(undefined)
    })
})

describe('updateNodeIcons application nodes green', () => {
    const applicationNodesGreen = [
        {
            labels: null,
            name: 'nginx-app-3',
            namespace: 'ns-sub-1',
            specs: {
                isDesign: true,
                row: 0,
                pulse: 'green',
            },
            type: 'application',
        },
    ]
    it('should update application node', () => {
        expect(updateNodeIcons(applicationNodesGreen)).toEqual(undefined)
    })
})

describe('updateNodeIcons application nodes green2', () => {
    const applicationNodesGreen2 = [
        {
            id: 'application--nginx-app-3',
            name: 'nginx-app-3',
            namespace: 'ns-sub-1',
            specs: {
                isDesign: true,
                row: 0,
                pulse: 'green2',
            },
            type: 'application',
        },
    ]
    it('should update application node', () => {
        expect(updateNodeIcons(applicationNodesGreen2)).toEqual(undefined)
    })
})

describe('updateNodeIcons application nodes red', () => {
    const applicationNodesRed = [
        {
            id: 'application--nginx-app-3',
            name: 'nginx-app-3',
            namespace: 'ns-sub-1',
            specs: {
                isDesign: true,
                row: 0,
                pulse: 'red',
            },
            type: 'application',
        },
    ]
    it('should update application node', () => {
        expect(updateNodeIcons(applicationNodesRed)).toEqual(undefined)
    })
})

describe('updateNodeIcons test Argo application', () => {
    it('should update the Argo application node', () => {
        expect(updateNodeIcons(argoApplicationNodes)).toEqual(undefined)
    })
})
