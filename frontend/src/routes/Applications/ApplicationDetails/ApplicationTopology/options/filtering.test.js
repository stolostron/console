// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import {
    getAllFilters,
    getAvailableFilters,
    getSearchFilter,
    filterNodes,
    processResourceStatus,
    notDesignNode,
    isDesignOrCluster,
    nodeParentExists,
    filterRelationshipNodes,
} from './filtering'

const t = (string) => {
    return string
}

const nodes = [
    {
        id: 'application--nginx-app-3',
        uid: 'application--nginx-app-3',
        name: 'nginx-app-3',
        cluster: null,
        clusterName: null,
        type: 'application',
        specs: {
            isDesign: true,
            raw: {
                apiVersion: 'app.k8s.io/v1beta1',
                kind: 'Application',
                metadata: {
                    annotations: {
                        'apps.open-cluster-management.io/deployables': 'ns-sub-1/example-configmap',
                        'apps.open-cluster-management.io/subscriptions': 'ns-sub-1/nginx',
                    },
                    labels: { app: 'nginx-app-details' },
                    name: 'nginx-app-3',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1487968',
                    selfLink: '/apis/app.k8s.io/v1beta1/namespaces/ns-sub-1/applications/nginx-app-3',
                    uid: '00bb7699-f371-43a6-8edf-5ef10f42f4ff',
                },
                spec: {
                    componentKinds: [{ group: 'apps.open-cluster-management.io', kind: 'Subscription' }],
                    descriptor: {},
                    selector: {
                        matchLabels: { app: 'nginx-app-details' },
                    },
                },
                status: {},
                activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
                channels: ['ns-sub-1/nginx//ns-ch/predev-ch'],
                row: 0,
            },
            namespace: 'ns-sub-1',
            topology: null,
            labels: null,
            __typename: 'Resource',
        },
    },
    {
        id: 'member--subscription--ns-sub-1--nginx',
        uid: 'member--subscription--ns-sub-1--nginx',
        name: 'nginx',
        cluster: null,
        clusterName: null,
        type: 'subscription',
        specs: {
            isDesign: true,
            hasRules: true,
            isPlaced: false,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                metadata: {
                    labels: { app: 'nginx-app-details' },
                    name: 'nginx',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1488006',
                    selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/subscriptions/nginx',
                    uid: '54c0d0fe-9711-462b-85ad-3d7e73e9ab89',
                },
                spec: {
                    channel: 'ns-ch/predev-ch',
                    name: 'nginx-ingress',
                    packageFilter: { version: '1.20.x' },
                    placement: {
                        placementRef: { kind: 'PlacementRule', name: 'towhichcluster' },
                    },
                },
                status: {
                    lastUpdateTime: '2020-03-18T20:06:47Z',
                    message: 'Active',
                    phase: 'Propagated',
                },
            },
            row: 17,
        },
        namespace: 'ns-sub-1',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
    {
        id: 'member--rules--ns-sub-1--towhichcluster--0',
        uid: 'member--rules--ns-sub-1--towhichcluster--0',
        name: 'towhichcluster',
        cluster: null,
        clusterName: null,
        type: 'placements',
        specs: {
            isDesign: true,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                    name: 'towhichcluster',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1487942',
                    selfLink:
                        '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/towhichcluster',
                    uid: '49788e0c-c540-49be-9e65-a1c46e4ac485',
                },
                spec: {
                    clusterSelector: {},
                },
            },
            row: 35,
        },
        namespace: 'ns-sub-1',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
    {
        id: 'deployment1',
        uid: 'deployment1',
        name: 'deployment1',
        cluster: null,
        clusterName: null,
        type: 'deployment',
        specs: {
            isDesign: false,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'deployment',
                metadata: {
                    name: 'deployment',
                    namespace: 'default',
                    resourceVersion: '1487942',
                    selfLink:
                        '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/towhichcluster',
                    uid: '49788e0c-c540-49be-9e65-a1c46e4ac485',
                },
                spec: {
                    clusterSelector: {},
                },
            },
            row: 35,
        },
        namespace: 'default',
        topology: null,
        labels: null,
        __typename: 'Resource',
    },
]

const podNodes = [
    {
        cluster: null,
        clusterName: null,
        type: 'pod',
        id: 'member--pod--member--deployable--member--clusters--possiblereptile, braveman, sharingpenguin, relievedox--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
        labels: null,
        name: 'frontend',
        namespace: '',
        specs: {
            podStatus: {
                hasFailure: false,
                hasPending: false,
                hasRestarts: true,
                hostIPs: new Set([
                    '10.0.130.141',
                    '10.0.128.168',
                    '10.0.134.47',
                    '10.0.138.193',
                    '10.0.135.12',
                    '10.0.134.43',
                    '10.0.137.176',
                    '10.0.135.243',
                    '10.0.132.29',
                    '10.0.132.99',
                    '10.0.135.34',
                    '10.0.128.64',
                ]),
            },
        },
    },
    {
        cluster: null,
        clusterName: null,
        id: 'member--clusters--possiblereptile, braveman, relievedox, sharingpenguin',
        labels: null,
        name: 'possiblereptile, braveman, relievedox, sharingpenguin',
        namespace: '',
        topology: null,
        type: 'cluster',
        uid: 'member--clusters--possiblereptile, braveman, relievedox, sharingpenguin',
    },
]
const options = {
    filtering: 'application',
    layout: 'application',
    showLineLabels: true,
    showGroupTitles: false,
    scrollOnScroll: true,
}

const activeFilters = {
    type: ['application', 'placements', 'subscription', 'pod', 'cluster'],
}

describe('getAllFilters', () => {
    const mockData = {
        userIsFiltering: null,
    }

    const expectedResults = {
        activeFilters: {
            type: ['application', 'deployment', 'placements', 'subscription'],
        },
        availableFilters: {
            namespaces: {
                availableSet: new Set(['cluster-scoped', 'ns-sub-1', 'default']),
                name: 'Namespaces',
            },
            resourceStatuses: {
                availableSet: new Map([
                    ['green', 'Success'],
                    ['orange', 'Unknown'],
                    ['yellow', 'Warning'],
                    ['red', 'Error'],
                ]),
                name: 'Resource status',
            },
            resourceTypes: {
                availableSet: new Set(['deployment']),
                name: 'Resource Types',
            },
            type: ['application', 'deployment', 'placements', 'subscription'],
        },
        otherTypeFilters: [],
    }

    it('should get all filters', () => {
        expect(
            getAllFilters(
                mockData.isLoaded,
                nodes,
                options,
                activeFilters,
                mockData.knownTypes,
                mockData.userIsFiltering,
                t
            )
        ).toEqual(expectedResults)
    })
})

describe('getAvailableFilters application', () => {
    const expectedResult = {
        namespaces: {
            availableSet: new Set(['cluster-scoped']),
            name: 'Namespaces',
        },
        resourceStatuses: {
            availableSet: new Map([
                ['green', 'Success'],
                ['orange', 'Unknown'],
                ['yellow', 'Warning'],
                ['red', 'Error'],
            ]),
            name: 'Resource status',
        },
        resourceTypes: {
            availableSet: new Set(['pod']),
            name: 'Resource Types',
        },
    }

    it('should get available filters', () => {
        expect(getAvailableFilters(podNodes, options, activeFilters, t)).toEqual(expectedResult)
    })
})

describe('getSearchFilters application', () => {
    const filters = {
        type: ['podStatuses', 'hostIPs'],
    }

    const expectedResult = {
        filters: {
            type: ['podStatuses', 'hostIPs'],
        },
        search: undefined,
    }

    it('should get search filters', () => {
        expect(getSearchFilter(filters)).toEqual(expectedResult)
    })
})

const expectedFilterAppWeaveNodeResult = [
    {
        cluster: null,
        clusterName: null,
        id: 'application--nginx-app-3',
        name: 'nginx-app-3',
        specs: {
            __typename: 'Resource',
            isDesign: true,
            labels: null,
            namespace: 'ns-sub-1',
            raw: {
                activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
                apiVersion: 'app.k8s.io/v1beta1',
                channels: ['ns-sub-1/nginx//ns-ch/predev-ch'],
                kind: 'Application',
                metadata: {
                    annotations: {
                        'apps.open-cluster-management.io/deployables': 'ns-sub-1/example-configmap',
                        'apps.open-cluster-management.io/subscriptions': 'ns-sub-1/nginx',
                    },
                    labels: {
                        app: 'nginx-app-details',
                    },
                    name: 'nginx-app-3',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1487968',
                    selfLink: '/apis/app.k8s.io/v1beta1/namespaces/ns-sub-1/applications/nginx-app-3',
                    uid: '00bb7699-f371-43a6-8edf-5ef10f42f4ff',
                },
                row: 0,
                spec: {
                    componentKinds: [
                        {
                            group: 'apps.open-cluster-management.io',
                            kind: 'Subscription',
                        },
                    ],
                    descriptor: {},
                    selector: {
                        matchLabels: {
                            app: 'nginx-app-details',
                        },
                    },
                },
                status: {},
            },
            topology: null,
        },
        type: 'application',
        uid: 'application--nginx-app-3',
    },
    {
        __typename: 'Resource',
        cluster: null,
        clusterName: null,
        id: 'member--subscription--ns-sub-1--nginx',
        labels: null,
        name: 'nginx',
        namespace: 'ns-sub-1',
        specs: {
            hasRules: true,
            isDesign: true,
            isPlaced: false,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                metadata: {
                    labels: {
                        app: 'nginx-app-details',
                    },
                    name: 'nginx',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1488006',
                    selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/subscriptions/nginx',
                    uid: '54c0d0fe-9711-462b-85ad-3d7e73e9ab89',
                },
                spec: {
                    channel: 'ns-ch/predev-ch',
                    name: 'nginx-ingress',
                    packageFilter: {
                        version: '1.20.x',
                    },
                    placement: {
                        placementRef: {
                            kind: 'PlacementRule',
                            name: 'towhichcluster',
                        },
                    },
                },
                status: {
                    lastUpdateTime: '2020-03-18T20:06:47Z',
                    message: 'Active',
                    phase: 'Propagated',
                },
            },
            row: 17,
        },
        topology: null,
        type: 'subscription',
        uid: 'member--subscription--ns-sub-1--nginx',
    },
    {
        __typename: 'Resource',
        cluster: null,
        clusterName: null,
        id: 'member--rules--ns-sub-1--towhichcluster--0',
        labels: null,
        name: 'towhichcluster',
        namespace: 'ns-sub-1',
        specs: {
            isDesign: true,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                    name: 'towhichcluster',
                    namespace: 'ns-sub-1',
                    resourceVersion: '1487942',
                    selfLink:
                        '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/towhichcluster',
                    uid: '49788e0c-c540-49be-9e65-a1c46e4ac485',
                },
                spec: {
                    clusterSelector: {},
                },
            },
            row: 35,
        },
        topology: null,
        type: 'placements',
        uid: 'member--rules--ns-sub-1--towhichcluster--0',
    },
    {
        __typename: 'Resource',
        cluster: null,
        clusterName: null,
        id: 'deployment1',
        labels: null,
        name: 'deployment1',
        namespace: 'default',
        specs: {
            isDesign: false,
            raw: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'deployment',
                metadata: {
                    name: 'deployment',
                    namespace: 'default',
                    resourceVersion: '1487942',
                    selfLink:
                        '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/towhichcluster',
                    uid: '49788e0c-c540-49be-9e65-a1c46e4ac485',
                },
                spec: {
                    clusterSelector: {},
                },
            },
            row: 35,
        },
        topology: null,
        type: 'deployment',
        uid: 'deployment1',
    },
]

describe('filterNodes application', () => {
    it('should filter application nodes', () => {
        expect(filterNodes(nodes, activeFilters)).toEqual(expectedFilterAppWeaveNodeResult)
    })
})

describe('processResourceStatus', () => {
    const resourceStatuses = new Set(['green', 'yellow', 'orange', 'red'])
    it('green', () => {
        expect(processResourceStatus(resourceStatuses, 'green')).toEqual(true)
    })

    it('yellow', () => {
        expect(processResourceStatus(resourceStatuses, 'yellow')).toEqual(true)
    })

    it('orange', () => {
        expect(processResourceStatus(resourceStatuses, 'orange')).toEqual(true)
    })

    it('red', () => {
        expect(processResourceStatus(resourceStatuses, 'red')).toEqual(true)
    })

    it('no match', () => {
        expect(processResourceStatus(new Set(), 'yellow')).toEqual(false)
    })
})

describe('notDesignNode', () => {
    it('match', () => {
        expect(notDesignNode('application')).toEqual(false)
    })

    it('no match', () => {
        expect(notDesignNode('deployment')).toEqual(true)
    })
})

describe('isDesignOrCluster', () => {
    it('design and cluster', () => {
        expect(isDesignOrCluster(true, 'cluster')).toEqual(true)
    })

    it('not design but cluster', () => {
        expect(isDesignOrCluster(false, 'cluster')).toEqual(true)
    })

    it('not design nor cluster', () => {
        expect(isDesignOrCluster(false, 'deployment')).toEqual(false)
    })
})

describe('nodeParentExists', () => {
    const nodeParent = {
        parentId: 'test',
    }
    const includedNodes = new Set(['test'])

    it('nodeParent undefined', () => {
        expect(nodeParentExists(undefined, new Set())).toEqual(false)
    })

    it('nodeParent exists', () => {
        expect(nodeParentExists(nodeParent, includedNodes)).toEqual(false)
    })

    it('nodeParent exists', () => {
        expect(nodeParentExists(nodeParent, new Set())).toEqual(true)
    })
})

describe('filterRelationshipNodes', () => {
    const mockDataRelationshipNodes = {
        nodes: [
            {
                id: 'member--deployable--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
                type: 'deployment',
                namespace: 'default',
                specs: {
                    clustersNames: ['braveman'],
                    isDesign: false,
                    pulse: 'green',
                    parent: {
                        parentId: 'member-cluster',
                    },
                },
            },
            {
                id: 'member--replicaset--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
                type: 'replicaset',
                namespace: 'default',
                specs: {
                    clustersNames: ['braveman'],
                    isDesign: false,
                    pulse: 'green',
                    parent: {
                        parentId:
                            'member--deployable--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
                        type: 'deployment',
                        name: 'deployment1',
                    },
                },
            },
        ],
        activeFilters: {
            resourceStatuses: new Set(['green']),
            clusterNames: new Set(['braveman']),
            type: ['application', 'deployment', 'placements', 'subscription', 'replicaset'],
        },
        availableFilters: {
            type: ['application', 'deployment', 'placements', 'subscription', 'replicaset'],
        },
        mode: 'application',
    }

    const expectedValue = [
        {
            id: 'member--deployable--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
            namespace: 'default',
            specs: {
                clustersNames: ['braveman'],
                isDesign: false,
                parent: {
                    parentId: 'member-cluster',
                },
                pulse: 'green',
            },
            type: 'deployment',
        },
        {
            id: 'member--replicaset--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
            namespace: 'default',
            specs: {
                clustersNames: ['braveman'],
                isDesign: false,
                parent: {
                    name: 'deployment1',
                    parentId:
                        'member--deployable--member--deployable--member--clusters--braveman--open-cluster-management--guestbook-app-guestbook-frontend-deployment--frontend',
                    type: 'deployment',
                },
                pulse: 'green',
            },
            type: 'replicaset',
        },
    ]
    it('filter node by cluster name', () => {
        expect(
            filterRelationshipNodes(mockDataRelationshipNodes.nodes, mockDataRelationshipNodes.activeFilters)
        ).toEqual(expectedValue)
    })
})
