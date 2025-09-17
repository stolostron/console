// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import i18n from 'i18next'
import {
  addIngressNodeInfo,
  addNodeInfoPerCluster,
  addNodeOCPRouteLocationForCluster,
  addNodeServiceLocation,
  addNodeServiceLocationForCluster,
  addOCPRouteLocation,
  addPropertyToList,
  checkAndObjects,
  checkNotOrObjects,
  computeResourceName,
  createEditLink,
  createResourceSearchLink,
  getNameWithoutChartRelease,
  getNodePropery,
  parseApplicationNodeName,
  processResourceActionLink,
  removeReleaseGeneratedSuffix,
} from './diagram-helpers'
import { nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import type {
  TestNode,
  TestPropertyData,
  TestRouteNode,
  TestSubscriptionNode,
  TestResourceActionLink,
  TestRouteObject,
  TestGenericLink,
  TestArgoLink,
  TestRouteLink,
  TestEditLinkNode,
  Translator,
} from '../model/types'

// Translation function bound to i18n instance
const t: Translator = i18n.t.bind(i18n)

// Mock window.open for testing environment
;(window.open as any) = (): void => {} // provide an empty implementation for window.open

// Test node structure for property path testing
const node: TestNode = {
  specs: {
    raw: {
      metadata: {
        name: 'nodeName',
        namespace: 'nodeNS',
      },
    },
  },
}

// Property path that doesn't exist in the test node
const propPath: string[] = ['specs', 'raw', 'spec', 'clusterSelector', 'matchLabels']
// Property path that exists in the test node
const propPath_found: string[] = ['specs', 'raw', 'metadata', 'namespace']
// Key for property labeling
const key: string = 'nskey'
// Default value when property is not found
const defaultValue: string = 'test'

// Test suite for getNodeProperty function - tests property retrieval from node objects
describe('getNodePropery', () => {
  // Expected result when property is not found but default value is provided
  const result: TestPropertyData = { labelValue: 'nskey', value: 'test' }

  it('get property nodes, not found', () => {
    // Test case: Property path doesn't exist, should return default value
    expect(getNodePropery(node, propPath, key, defaultValue)).toEqual(result)
  })
})

describe('getNodePropery', () => {
  it('get property nodes, not found, no default value', () => {
    // Test case: Property path doesn't exist and no default value provided, should return undefined
    expect(getNodePropery(node, propPath, key)).toEqual(undefined)
  })
})

describe('getNodePropery', () => {
  // Expected result when property is found
  const result: TestPropertyData = { labelValue: 'nskey', value: 'nodeNS' }

  it('get property nodes, found', () => {
    // Test case: Property path exists, should return the found value
    expect(getNodePropery(node, propPath_found, key)).toEqual(result)
  })
})

// Empty list for testing addPropertyToList function
const list: TestPropertyData[] = []

// Test suite for addPropertyToList function - tests adding properties to lists
describe('addPropertyToList', () => {
  // Expected result after adding property to list
  const result: TestPropertyData[] = [{ labelValue: 'nskey', value: 'nodeNS' }]
  const data: TestPropertyData = { labelValue: 'nskey', value: 'nodeNS' }

  it('addPropertyToList', () => {
    // Test case: Add valid property data to valid list
    expect(addPropertyToList(list, data)).toEqual(result)
  })
})

describe('addPropertyToList undefined list', () => {
  const data: TestPropertyData = { labelValue: 'nskey', value: 'nodeNS' }

  it('addPropertyToList', () => {
    // Test case: Try to add to undefined list, should return undefined
    expect(addPropertyToList(undefined, data)).toEqual(undefined)
  })
})

describe('addPropertyToList undefined data', () => {
  it('addPropertyToList', () => {
    // Test case: Try to add undefined data to list, should return original list
    expect(addPropertyToList(list, undefined)).toEqual(list)
  })
})

// Test suite for computeResourceName function - tests resource name computation for pods
describe('computeResourceName node with pods no _hostingDeployable', () => {
  // Pod node without hosting deployable - should generate standard pod resource name
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
    // Test case: Pod without hosting deployable should return "pod-{name}" format
    expect(computeResourceName(node, null, 'redis-secondary', { value: true })).toEqual('pod-redis-secondary')
  })
})

describe('computeResourceName node with pods with _hostingDeployable', () => {
  // Pod node with hosting deployable - should still generate standard pod resource name
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
    // Test case: Pod with hosting deployable should still return "pod-{name}" format
    expect(computeResourceName(node, null, 'redis-secondary', { value: true })).toEqual('pod-redis-secondary')
  })
})

// Test suite for getNameWithoutChartRelease function - tests chart release name processing
describe('getNameWithoutChartRelease', () => {
  // Node where the name is the same as the chart release name
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

  // Standard pod node with Helm chart labels
  const node = {
    apiversion: 'v1',
    cluster: 'sharingpenguin',
    container: 'secondary',
    created: '2020-05-26T19:18:21Z',
    kind: 'pod',
    label:
      'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
    name: 'nginx-ingress-edafb-default-backend',
    namespace: 'app-guestbook-git-ns',
    restarts: 0,
    selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
    startedAt: '2020-05-26T19:18:21Z',
    status: 'Running',
  }

  // Pod node with hash in name that should be processed for chart release
  const nodePod = {
    _uid: 'local-cluster/d1332a59-0cdf-4bec-b034-7406e912ef58',
    name: 'nginx-7697f9fd6d-qnf6s',
    selfLink: '/api/v1/namespaces/vb-helm-nginx-ns/pods/nginx-7697f9fd6d-qnf6s',
    kind: 'pod',
    _rbac: 'vb-helm-nginx-ns_null_pods',
    image: ['docker.io/bitnami/nginx:1.19.8-debian-10-r0'],
    _hubClusterResource: 'true',
    restarts: 0,
    label:
      'app.kubernetes.io/instance=nginx; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=nginx; helm.sh/chart=nginx-8.7.1; pod-template-hash=7697f9fd6d',
    status: 'Running',
    cluster: 'local-cluster',
    apiversion: 'v1',
    container: 'nginx',
    namespace: 'vb-helm-nginx-ns',
  }

  // Node where the release name is contained within the resource name
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
    // Test case: When deployable flag is false, should return original name unchanged
    expect(
      getNameWithoutChartRelease(node, 'nginx-ingress-edafb-default-backend', {
        value: false,
      })
    ).toEqual('nginx-ingress-edafb-default-backend')
  })

  it('returns chart name for a related object, name same as the chart release name', () => {
    // Test case: When node name matches chart release name, should return the name as-is
    expect(
      getNameWithoutChartRelease(nodeNameSameAsChartRelease, 'my-redis', {
        value: true,
      })
    ).toEqual('my-redis')
  })

  it('returns last string for a pod object, pod name - without hash - same as the release name', () => {
    // Test case: For pod with hash, should return the last part after removing hash
    expect(
      getNameWithoutChartRelease(nodePod, 'nginx-qnf6s', {
        value: true,
      })
    ).toEqual('qnf6s')
  })

  it('returns name with release for resource with release name- contained by the resource name', () => {
    // Test case: When release name is contained in resource name and deployable is false, return as-is
    expect(
      getNameWithoutChartRelease(nodeWithReleaseNameInTheName, 'redis-main', {
        value: false,
      })
    ).toEqual('redis-main')
  })

  // Pod node without deployable flag for testing non-deployable scenarios
  const nodePodNoDeployable = {
    apiversion: 'v1',
    cluster: 'sharingpenguin',
    container: 'secondary',
    created: '2020-05-26T19:18:21Z',
    kind: 'pod',
    label:
      'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
    name: 'nginx-ingress-edafb-default-backend',
    namespace: 'app-guestbook-git-ns',
    restarts: 0,
    selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
    startedAt: '2020-05-26T19:18:21Z',
    status: 'Running',
  }

  it('getNameWithoutChartRelease for pod with no deployable', () => {
    // Test case: Pod without deployable should return original name unchanged
    expect(
      getNameWithoutChartRelease(nodePodNoDeployable, 'nginx-ingress-edafb-default-backend', {
        value: false,
      })
    ).toEqual('nginx-ingress-edafb-default-backend')
  })
})

// Test suite for getNameWithoutChartRelease with release name plus pod name scenario
describe('getNameWithoutChartRelease node with release name plus pod name', () => {
  // Pod node where name matches the release name exactly
  const node = {
    apiversion: 'v1',
    cluster: 'sharingpenguin',
    container: 'secondary',
    created: '2020-05-26T19:18:21Z',
    kind: 'pod',
    label:
      'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
    name: 'nginx-ingress-edafb',
    namespace: 'app-guestbook-git-ns',
    restarts: 0,
    selfLink: '/api/v1/namespaces/app-guestbook-git-ns/pods/redis-secondary-5bdcfd74c7-22ljj',
    startedAt: '2020-05-26T19:18:21Z',
    status: 'Running',
  }

  it('getNameWithoutChartRelease for pod with release name plus pod name', () => {
    // Test case: When resource name contains release name as prefix, should return the suffix
    expect(
      getNameWithoutChartRelease(node, 'nginx-ingress-edafb-controller', {
        value: true,
      })
    ).toEqual('controller')
  })
})

// Test suite for getNameWithoutChartRelease with helm release without labels
describe('getNameWithoutChartRelease node for helmrelease no label', () => {
  // Helm release node without label field - should process hosting deployable name
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
    // Test case: Helm release without label should extract chart name from hosting deployable
    expect(
      getNameWithoutChartRelease(node, 'ch-git-helm/git-helm-chart1-1.1.1', {
        value: true,
      })
    ).toEqual('chart1-1.1.1')
  })
})

// Test suite for getNameWithoutChartRelease with subscription node that has labels
describe('getNameWithoutChartRelease node for subscription, with label', () => {
  // Subscription node with label field - should return name as-is since it's not a helm release
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

  it('getNameWithoutChartRelease subscription with label', () => {
    // Test case: Subscription with label should return name unchanged
    expect(getNameWithoutChartRelease(node, 'git-helm-sub', { value: true })).toEqual('git-helm-sub')
  })
})

// Test suite for createResourceSearchLink function - tests search link generation
describe('createResourceSearchLink for undefined details', () => {
  // Node with minimal specs that lacks required details for search link generation
  const node = {
    id: 'id',
    specs: {
      row: 20,
      pulse: 'orange',
    },
  }
  // Expected result when node lacks sufficient details
  const result = { type: 'link', value: null }

  it('createResourceSearchLink for undefined details', () => {
    // Test case: Node without sufficient details should return null value
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

describe('createResourceSearchLink for cluster node no name', () => {
  // Cluster node without a name property
  const node = {
    id: 'id',
    type: 'cluster',
    specs: {
      clusters: [],
    },
  }
  // Expected search link result for cluster without name
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
    // Test case: Cluster node without name should generate search link with 'undefined' name
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

describe('createResourceSearchLink for cluster node w name', () => {
  // Cluster node with comma-separated names that should be normalized
  const node = {
    id: 'id',
    type: 'cluster',
    name: 'a, b, c',
    specs: {
      clusters: [],
    },
  }
  // Expected result with normalized cluster names (spaces removed)
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
    // Test case: Cluster names with spaces should be normalized (spaces removed)
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

describe('createResourceSearchLink for cluster', () => {
  // Cluster node with multiple cluster names and namespace
  const node = {
    type: 'cluster',
    name: 'cls1, cls2, cls3',
    namespace: 'ns',
    specs: {
      clusters: [],
    },
  }
  // Expected result for cluster search link without ID
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
    // Test case: Multiple cluster names should be normalized and ID should be undefined
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

describe('createResourceSearchLink for PR', () => {
  // Placement rule node for testing placement decision search links
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
  // Expected search link for placement rule (searches for PlacementDecision)
  const result = {
    type: 'link',
    value: {
      data: {
        action: 'show_search',
        kind: 'PlacementDecision',
        name: 'rule1',
        namespace: 'ns',
      },
      id: undefined,
      indent: true,
      label: 'Launch resource in Search',
    },
  }

  it('createResourceSearchLink for PR', () => {
    // Test case: Placement rule should generate search link for PlacementDecision kind
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

describe('createResourceSearchLink for details', () => {
  // Standard deployment node for testing basic resource search links
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
  // Expected search link for deployment resource
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
    // Test case: Standard deployment should generate basic search link
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

describe('createResourceSearchLink for application node', () => {
  // Application node with ID that contains the app name
  const node = {
    type: 'application',
    id: 'application--app-test',
    name: '',
    namespace: 'ns',
    specs: {
      pulse: 'green',
    },
  }
  // Expected search link with app name extracted from ID
  const result = {
    type: 'link',
    value: {
      data: {
        action: 'show_search',
        kind: 'application',
        name: 'app-test',
        namespace: '',
      },
      id: 'application--app-test',
      indent: true,
      label: 'Launch resource in Search',
    },
  }

  it('createResourceSearchLink for app node', () => {
    // Test case: Application node should extract name from ID when name is empty
    expect(createResourceSearchLink(node, t)).toEqual(result)
  })
})

// Test suite for addNodeOCPRouteLocationForCluster function - tests route location processing
describe('addNodeOCPRouteLocationForCluster no host spec', () => {
  // Route node without host specification in raw spec
  const node: TestRouteNode = {
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
  // Route object with minimal ID
  const obj: TestRouteObject = {
    id: 'objID',
    cluster: 'possiblereptile',
  }
  // Expected result for route without host spec
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
        labelValue: 'Launch Route URL',
      },
    },
  ]

  it('addNodeOCPRouteLocationForCluster no host spec', () => {
    // Test case: Route without host spec should generate launch route URL link
    expect(addNodeOCPRouteLocationForCluster(node, obj, [], t)).toEqual(result)
  })
})

describe('addOCPRouteLocation spec no tls', () => {
  // Route node with host but no TLS configuration
  const node: TestRouteNode = {
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
  // Expected empty result for route without TLS
  const result: unknown[] = []

  it('addOCPRouteLocation no tls', () => {
    // Test case: Route with host but no TLS should return empty array
    expect(addOCPRouteLocation(node, 'possiblereptile', 'default', [], t)).toEqual(result)
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
      template: {
        template: {
          kind: 'Route',
          spec: {
            metadata: {
              namespace: 'default',
            },
            host: '1.1.1',
          },
        },
      },
    },
  }
  const result = [{ type: 'spacer' }]
  it('addNodeOCPRouteLocationForCluster no route', () => {
    expect(addNodeOCPRouteLocationForCluster(node, null, [], t)).toEqual(result)
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
    expect(addOCPRouteLocation(node, 'possiblereptile', 'default', [], t)).toEqual([])
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
      template: {
        template: {
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
    },
  }

  const result = [{ type: 'spacer' }]
  it('addNodeOCPRouteLocationForCluster with tls and host', () => {
    expect(addNodeOCPRouteLocationForCluster(node, null, [], t)).toEqual(result)
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
      template: {
        template: {
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
    },
  }

  const result = [{ type: 'spacer' }]
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
        labelValue: 'Launch Route URL',
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
        labelValue: 'Launch Route URL',
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
    { labelValue: 'Location', type: 'label' },
    { labelValue: 'Host', value: 'aaa' },
    { labelValue: 'Service Name', value: 'n1' },
    { labelValue: 'Service Port', value: 'p1' },
    { labelValue: 'Service Name', value: 'n2' },
    { labelValue: 'Service Port', value: 'p2' },
    { type: 'spacer' },
    { labelValue: 'Host', value: 'bbb' },
    { labelValue: 'Service Name', value: 'bn1' },
    { labelValue: 'Service Port', value: 'bp1' },
    { labelValue: 'Service Name', value: 'bn2' },
    { labelValue: 'Service Port', value: 'bp2' },
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
        'mortgage-app-deploy-possiblereptile-default': [
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
  const result = [{ labelValue: 'Location', value: '1.1:80' }]
  it('addNodeServiceLocation 1', () => {
    expect(addNodeServiceLocation(node, 'possiblereptile', 'default', [], t)).toEqual(result)
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
  const testFn = jest.fn(() => {
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
  const result = [{ labelValue: 'Location', value: '172.30.129.147:80' }]
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

// Test suite for processResourceActionLink function - tests resource action link processing
describe('processResourceActionLink search view2', () => {
  // Search action link configuration
  const openSearchView: TestResourceActionLink = {
    action: 'show_search',
    kind: 'service',
    name: 'frontend',
    namespace: 'open-cluster-management',
  }
  // Expected search URL with encoded filters
  const result: string =
    '/multicloud/search?filters={"textsearch":"kind:service namespace:open-cluster-management name:frontend"}'

  it('processResourceActionLink opens search view2', () => {
    // Test case: Search action should generate properly formatted search URL
    expect(processResourceActionLink(openSearchView)).toEqual(result)
  })
})

describe('processResourceActionLink openRemoteresourceYaml', () => {
  // YAML editor action link configuration
  const openRemoteresourceYaml: TestResourceActionLink = {
    action: 'show_resource_yaml',
    cluster: 'possiblereptile',
    editLink:
      '/multicloud/search/resources/yaml?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123',
  }
  // Expected YAML editor URL
  const result: string =
    '/multicloud/search/resources/yaml?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123'

  it('processResourceActionLink openRemoteresourceYaml', () => {
    // Test case: YAML editor action should return the edit link directly
    expect(processResourceActionLink(openRemoteresourceYaml)).toEqual(result)
  })
})

describe('processResourceActionLink search view3', () => {
  // Generic link action configuration
  const genericLink: TestGenericLink = {
    action: 'open_link',
    targetLink: 'http://www.example.com',
  }
  // Expected target URL
  const result: string = 'http://www.example.com'

  it('processResourceActionLink opens search view3', () => {
    // Test case: Generic link action should return the target link directly
    expect(processResourceActionLink(genericLink)).toEqual(result)
  })
})

describe('processResourceActionLink dummy link', () => {
  // Invalid link action with wrong property name
  const genericLink: TestGenericLink = {
    action: 'open_link',
    targetLink1: 'http://www.example.com', // Wrong property name (should be targetLink)
  }
  // Expected empty result for invalid link
  const result: string = ''

  it('processResourceActionLink dummy link', () => {
    // Test case: Invalid link action should return empty string
    expect(processResourceActionLink(genericLink)).toEqual(result)
  })
})

describe('processResourceActionLink open argo editor', () => {
  beforeEach(() => {
    // Mock API paths for testing
    nockIgnoreApiPaths()
  })

  // Argo editor action configuration
  const genericLink: TestArgoLink = {
    action: 'open_argo_editor',
    name: 'argo_test',
    namespace: 'argo_test',
    cluster: 'local-cluster',
  }
  // Expected empty result (action handled internally)
  const result: string = ''

  it('processResourceActionLink open argo editor', () => {
    // Test case: Argo editor action should return empty string (handled by callback)
    expect(processResourceActionLink(genericLink, () => {}, t, 'local-cluster')).toEqual(result)
  })
})

describe('processResourceActionLink open route url', () => {
  beforeEach(() => {
    // Mock API paths for testing
    nockIgnoreApiPaths()
  })

  // Route URL action configuration
  const genericLink: TestRouteLink = {
    action: 'open_route_url',
    name: 'route_test',
    namespace: 'route_test',
    cluster: 'local-cluster',
  }
  // Expected empty result (action handled internally)
  const result: string = ''

  it('processResourceActionLink open route url', () => {
    // Test case: Route URL action should return empty string (handled by callback)
    expect(processResourceActionLink(genericLink, () => {}, t, 'local-cluster')).toEqual(result)
  })
})

// Test suite for removeReleaseGeneratedSuffix function - tests suffix removal from helm releases
describe('removeReleaseGeneratedSuffix remove suffix', () => {
  it('should remove generate suffix for the helmrelease', () => {
    // Test case: Should remove generated suffix (hash) from helm release name
    expect(removeReleaseGeneratedSuffix('nginx-ingress-66f46')).toEqual('nginx-ingress')
  })
})

// Test suite for checkNotOrObjects function - tests logical NOT OR operation on objects
describe('checkNotOrObjects', () => {
  // Test objects for logical operations
  const definedObj1 = {}
  const definedObj2 = {}
  const undefinedObj = undefined

  it('should return false', () => {
    // Test case: Both objects defined should return false (NOT (obj1 OR obj2) = false)
    expect(checkNotOrObjects(definedObj1, definedObj2)).toEqual(false)
  })

  it('should return true', () => {
    // Test case: One object undefined should return true (NOT (obj1 OR undefined) = true)
    expect(checkNotOrObjects(definedObj1, undefinedObj)).toEqual(true)
  })
})

// Test suite for checkAndObjects function - tests logical AND operation on objects
describe('checkAndObjects', () => {
  // Test objects with properties for logical operations
  const definedObj1 = { name: 'mortgage' }
  const definedObj2 = { name: 'mortgage' }
  const undefinedObj = undefined

  it('should return false when one object is undefined', () => {
    // Test case: One undefined object should return false (obj1 AND undefined = false)
    expect(checkAndObjects(definedObj1, undefinedObj)).toEqual(false)
  })

  it('should check objects', () => {
    // Test case: Both objects defined should return true (obj1 AND obj2 = true)
    expect(checkAndObjects(definedObj1, definedObj2)).toEqual(true)
  })
})

// Test suite for parseApplicationNodeName function - tests application name parsing from node IDs
describe('parseApplicationNodeName', () => {
  it('can parse app node name from id', () => {
    // Test case: Should extract app name from application node ID format
    expect(parseApplicationNodeName('application--app-test')).toEqual('app-test')
  })

  it('returns id without parsing', () => {
    // Test case: Should return input unchanged if not in application ID format
    expect(parseApplicationNodeName('app-test')).toEqual('app-test')
  })
})

// Test suite for createEditLink function - tests edit link generation for resources
describe('createEditLink subscriptionstatus', () => {
  // Large subscription node with complete metadata for testing edit link generation
  const node: TestSubscriptionNode = {
    name: 'feng-wordpress-subscription-1',
    namespace: 'feng-wordpress',
    type: 'subscription',
    id: 'member--subscription--feng-wordpress--feng-wordpress-subscription-1',
    uid: 'member--subscription--feng-wordpress--feng-wordpress-subscription-1',
    specs: {
      title: 'wordpress',
      isDesign: true,
      hasRules: false,
      isPlaced: true,
      raw: {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          creationTimestamp: '2023-04-18T15:43:49Z',
          generation: 1,
          labels: {
            app: 'feng-wordpress',
            'app.kubernetes.io/part-of': 'feng-wordpress',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'feng-wordpress-subscription-1',
          namespace: 'feng-wordpress',
          resourceVersion: '4173353',
          uid: '5a6ce590-c6ab-4131-befe-c494706834c8',
        },
        spec: {
          channel: 'hchartsbitnamicom-bitnami-ns/hchartsbitnamicom-bitnami',
          name: 'wordpress',
          packageOverrides: [
            {
              packageAlias: 'wordpress',
              packageName: 'wordpress',
            },
          ],
          placement: {
            placementRef: {
              kind: 'Placement',
              name: 'feng-wordpress-placement-1',
            },
          },
        },
        status: {
          lastUpdateTime: '2023-04-18T15:43:52Z',
          message: 'Active',
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
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2023-04-18T15:43:49Z',
              generation: 1,
              name: 'hchartsbitnamicom-bitnami',
              namespace: 'hchartsbitnamicom-bitnami-ns',
              resourceVersion: '4173223',
              uid: '8f6a4116-6f7b-40d6-b2ca-ff8a5040a2a5',
            },
            spec: {
              pathname: 'https://charts.bitnami.com/bitnami',
              type: 'HelmRepo',
            },
          },
        ],
        decisions: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'PlacementDecision',
            metadata: {
              creationTimestamp: '2023-04-18T15:43:49Z',
              generation: 1,
              labels: {
                'cluster.open-cluster-management.io/placement': 'feng-wordpress-placement-1',
              },
              name: 'feng-wordpress-placement-1-decision-1',
              namespace: 'feng-wordpress',
              ownerReferences: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Placement',
                  name: 'feng-wordpress-placement-1',
                  uid: '08697165-c8d6-4d6d-a42d-3bcb47ccd106',
                },
              ],
              resourceVersion: '9217370',
              uid: 'd385dad4-1d60-40e6-9405-109f827982f7',
            },
            status: {
              decisions: [
                {
                  clusterName: 'feng-managed',
                  reason: '',
                },
                {
                  clusterName: 'local-cluster',
                  reason: '',
                },
              ],
            },
          },
        ],
        placements: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            metadata: {
              creationTimestamp: '2023-04-18T15:43:49Z',
              generation: 1,
              labels: {
                app: 'feng-wordpress',
              },
              name: 'feng-wordpress-placement-1',
              namespace: 'feng-wordpress',
              resourceVersion: '9217374',
              uid: '08697165-c8d6-4d6d-a42d-3bcb47ccd106',
            },
            spec: {
              clusterSets: ['default'],
              predicates: [
                {
                  requiredClusterSelector: {
                    labelSelector: {},
                  },
                },
              ],
            },
            status: {
              conditions: [
                {
                  lastTransitionTime: '2023-04-18T15:43:49Z',
                  message: 'Placement configurations check pass',
                  reason: 'Succeedconfigured',
                  status: 'False',
                  type: 'PlacementMisconfigured',
                },
                {
                  lastTransitionTime: '2023-04-25T13:38:36Z',
                  message: 'All cluster decisions scheduled',
                  reason: 'AllDecisionsScheduled',
                  status: 'True',
                  type: 'PlacementSatisfied',
                },
              ],
              numberOfSelectedClusters: 2,
            },
          },
        ],
        report: {
          apiVersion: 'apps.open-cluster-management.io/v1alpha1',
          kind: 'SubscriptionReport',
          metadata: {
            creationTimestamp: '2023-04-18T15:43:51Z',
            generation: 133,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-wordpress.feng-wordpress-subscription-1',
            },
            name: 'feng-wordpress-subscription-1',
            namespace: 'feng-wordpress',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-wordpress-subscription-1',
                uid: '5a6ce590-c6ab-4131-befe-c494706834c8',
              },
            ],
            resourceVersion: '9226643',
            uid: '309be373-4f53-422c-a43f-390287d164d9',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: '/v1',
              kind: 'ServiceAccount',
              name: 'wordpress-mariadb',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'Secret',
              name: 'wordpress-mariadb',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'Secret',
              name: 'wordpress',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'ConfigMap',
              name: 'wordpress-mariadb',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'PersistentVolumeClaim',
              name: 'wordpress',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'Service',
              name: 'wordpress-mariadb',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: '/v1',
              kind: 'Service',
              name: 'wordpress',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              name: 'wordpress',
              namespace: 'feng-wordpress',
            },
            {
              apiVersion: 'apps/v1',
              kind: 'StatefulSet',
              name: 'wordpress-mariadb',
              namespace: 'feng-wordpress',
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
            clusters: '2',
            deployed: '0',
            failed: '1',
            inProgress: '1',
            propagationFailed: '0',
          },
        },
      },
      clustersNames: ['feng-managed', 'local-cluster'],
      searchClusters: [
        {
          HubAcceptedManagedCluster: 'True',
          ManagedClusterConditionAvailable: 'True',
          ManagedClusterImportSucceeded: 'True',
          ManagedClusterJoined: 'True',
          _hubClusterResource: 'true',
          _uid: 'cluster__local-cluster',
          addon:
            'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; observability-controller=false; search-collector=false; work-manager=true',
          apigroup: 'internal.open-cluster-management.io',
          cluster: 'local-cluster',
          consoleURL:
            'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
          cpu: '24',
          created: '2023-04-07T21:42:28Z',
          kind: 'Cluster',
          kind_plural: 'managedclusterinfos',
          kubernetesVersion: 'v1.25.7+eab9cc9',
          label:
            'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=ed841d92-934c-4a8e-8df7-3265bc16da1b; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.12.10; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; velero.io/exclude-from-backup=true; vendor=OpenShift',
          memory: '96432376Ki',
          name: 'local-cluster',
          nodes: '6',
        },
      ],
      subscriptionModel: {
        'feng-wordpress-subscription-1-local-local-cluster-feng-wordpress': [
          {
            _clusterNamespace: '',
            _hostingSubscription: 'feng-wordpress/feng-wordpress-subscription-1',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/3be89a94-4391-433a-99bb-9484fdd8d534',
            apigroup: 'apps.open-cluster-management.io',
            apiversion: 'v1',
            channel: 'hchartsbitnamicom-bitnami-ns/hchartsbitnamicom-bitnami',
            cluster: 'local-cluster',
            created: '2023-04-18T15:43:51Z',
            kind: 'Subscription',
            kind_plural: 'subscriptions',
            label:
              'app=feng-wordpress; app.kubernetes.io/part-of=feng-wordpress; apps.open-cluster-management.io/reconcile-rate=medium',
            localPlacement: 'true',
            name: 'feng-wordpress-subscription-1-local',
            namespace: 'feng-wordpress',
            package: 'wordpress',
            status: 'Subscribed',
            timeWindow: 'none',
          },
        ],
        'feng-wordpress-subscription-1-local-cluster-feng-wordpress': [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/5a6ce590-c6ab-4131-befe-c494706834c8',
            apigroup: 'apps.open-cluster-management.io',
            apiversion: 'v1',
            channel: 'hchartsbitnamicom-bitnami-ns/hchartsbitnamicom-bitnami',
            cluster: 'local-cluster',
            created: '2023-04-18T15:43:49Z',
            kind: 'Subscription',
            kind_plural: 'subscriptions',
            label:
              'app=feng-wordpress; app.kubernetes.io/part-of=feng-wordpress; apps.open-cluster-management.io/reconcile-rate=medium',
            localPlacement: 'false',
            name: 'feng-wordpress-subscription-1',
            namespace: 'feng-wordpress',
            package: 'wordpress',
            status: 'Propagated',
            timeWindow: 'none',
          },
        ],
      },
      pulse: 'red',
      shapeType: 'subscription',
    },
    report: {
      apiVersion: 'apps.open-cluster-management.io/v1alpha1',
      kind: 'SubscriptionReport',
      metadata: {
        creationTimestamp: '2023-04-18T15:43:51Z',
        generation: 133,
        labels: {
          'apps.open-cluster-management.io/hosting-subscription': 'feng-wordpress.feng-wordpress-subscription-1',
        },
        name: 'feng-wordpress-subscription-1',
        namespace: 'feng-wordpress',
        ownerReferences: [
          {
            apiVersion: 'apps.open-cluster-management.io/v1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'Subscription',
            name: 'feng-wordpress-subscription-1',
            uid: '5a6ce590-c6ab-4131-befe-c494706834c8',
          },
        ],
        resourceVersion: '9226643',
        uid: '309be373-4f53-422c-a43f-390287d164d9',
      },
      reportType: 'Application',
      resources: [
        {
          apiVersion: '/v1',
          kind: 'ServiceAccount',
          name: 'wordpress-mariadb',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'Secret',
          name: 'wordpress-mariadb',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'Secret',
          name: 'wordpress',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'ConfigMap',
          name: 'wordpress-mariadb',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'PersistentVolumeClaim',
          name: 'wordpress',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'Service',
          name: 'wordpress-mariadb',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: '/v1',
          kind: 'Service',
          name: 'wordpress',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'wordpress',
          namespace: 'feng-wordpress',
        },
        {
          apiVersion: 'apps/v1',
          kind: 'StatefulSet',
          name: 'wordpress-mariadb',
          namespace: 'feng-wordpress',
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
        clusters: '2',
        deployed: '0',
        failed: '1',
        inProgress: '1',
        propagationFailed: '0',
      },
    },
  }
  // Edit link parameters for subscription status
  const kind: string = 'SubscriptionStatus'
  const cluster: string = 'local-cluster'
  const apiversion: string = 'apps.open-cluster-management.io/v1alpha1'

  it('returns subscriptionstatus link', () => {
    // Test case: Should generate properly encoded edit link for subscription status
    expect(createEditLink(node, 'local-cluster', kind, cluster, apiversion)).toEqual(
      '/multicloud/search/resources/yaml?apiversion=apps.open-cluster-management.io%2Fv1alpha1&cluster=local-cluster&kind=SubscriptionStatus&name=feng-wordpress-subscription-1&namespace=feng-wordpress'
    )
  })
})

describe('createEditLink deployment', () => {
  // Simple deployment node for testing basic edit link generation
  const node: TestEditLinkNode = {
    kind: 'deployment',
    apigroup: 'apps',
    apiversion: 'v1',
    cluster: 'local-cluster',
    name: 'mydeploy',
    namespace: 'default',
  }

  it('returns deployment link', () => {
    // Test case: Should generate edit link for deployment with proper URL encoding
    expect(createEditLink(node, 'local-cluster')).toEqual(
      '/multicloud/search/resources/yaml?apiversion=apps%2Fv1&cluster=local-cluster&kind=deployment&name=mydeploy&namespace=default'
    )
  })
})

describe('createEditLink kind undefined', () => {
  // Node without kind property for testing edge case
  const node: TestEditLinkNode = {
    apigroup: 'apps',
    apiversion: 'v1',
    cluster: 'local-cluster',
    name: 'mydeploy',
    namespace: 'default',
  }

  it('returns non-working link', () => {
    // Test case: Should generate edit link without kind parameter when kind is undefined
    expect(createEditLink(node, 'local-cluster')).toEqual(
      '/multicloud/search/resources/yaml?apiversion=apps%2Fv1&cluster=local-cluster&name=mydeploy&namespace=default'
    )
  })
})
