// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import {
    getNodePropery,
    addPropertyToList,
    createDeployableYamlLink,
    createResourceSearchLink,
    addOCPRouteLocation,
    addNodeServiceLocation,
    processResourceActionLink,
    addNodeServiceLocationForCluster,
    addNodeOCPRouteLocationForCluster,
    computeResourceName,
    addIngressNodeInfo,
    addNodeInfoPerCluster,
    getNameWithoutChartRelease,
    removeReleaseGeneratedSuffix,
    checkNotOrObjects,
    checkAndObjects,
} from './diagram-helpers'
import i18n from 'i18next'

const t = i18n.t.bind(i18n)

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
        expect(computeResourceName(node, null, 'redis-secondary', { value: 'true' })).toEqual('pod-redis-secondary')
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addNodeOCPRouteLocationForCluster(node, undefined, [], t)).toEqual(result)
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual([])
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
        expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addIngressNodeInfo(node, [], t)).toEqual(result)
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
        expect(addIngressNodeInfo(node, [], t)).toEqual([])
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
        expect(addNodeServiceLocationForCluster(node, obj, [], t)).toEqual(result)
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
        expect(addNodeServiceLocationForCluster(node, undefined, [], t)).toEqual(result)
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

describe('removeReleaseGeneratedSuffix remove suffix', () => {
    it('should remove generate suffix for the helmrelease', () => {
        expect(removeReleaseGeneratedSuffix('nginx-ingress-66f46')).toEqual('nginx-ingress')
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
