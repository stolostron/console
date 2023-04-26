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
  createDeployableYamlLink,
  createResourceSearchLink,
  getNameWithoutChartRelease,
  getNodePropery,
  parseApplicationNodeName,
  processResourceActionLink,
  removeReleaseGeneratedSuffix,
  createEditLink,
} from './diagram-helpers'

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
  const result = { labelValue: 'nskey', value: 'test' }
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
  const result = { labelValue: 'nskey', value: 'nodeNS' }

  it('get property nodes, found', () => {
    expect(getNodePropery(node, propPath_found, key)).toEqual(result)
  })
})

const list = []
describe('addPropertyToList', () => {
  const result = [{ labelValue: 'nskey', value: 'nodeNS' }]
  const data = { labelValue: 'nskey', value: 'nodeNS' }
  it('addPropertyToList', () => {
    expect(addPropertyToList(list, data)).toEqual(result)
  })
})

describe('addPropertyToList undefined list', () => {
  const data = { labelValue: 'nskey', value: 'nodeNS' }
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
    label:
      'app=nginx-ingress; chart=nginx-ingress-1.36.3; component=default-backend; heritage=Helm; release=nginx-ingress-edafb',
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
    label:
      'app.kubernetes.io/instance=nginx; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=nginx; helm.sh/chart=nginx-8.7.1; pod-template-hash=7697f9fd6d',
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
            editLink:
              '/multicloud/home/search/resources/yaml?cluster=local-cluster&kind=application&name=test-1&namespace=test-1-ns',
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
            '/multicloud/home/search/resources/yaml?apiversion=app.k8s.io%2Fv1beta1&cluster=local-cluster&kind=application&name=test&namespace=test-ns',
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

describe('createResourceSearchLink for application node', () => {
  const node = {
    type: 'application',
    id: 'application--app-test',
    name: '',
    namespace: 'ns',
    specs: {
      pulse: 'green',
    },
  }
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
        labelValue: 'Launch Route URL',
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

describe('processResourceActionLink search view2', () => {
  const openSearchView = {
    action: 'show_search',
    kind: 'service',
    name: 'frontend',
    namespace: 'open-cluster-management',
  }
  const result =
    '/multicloud/home/search?filters={"textsearch":"kind:service namespace:open-cluster-management name:frontend"}'

  it('processResourceActionLink opens search view2', () => {
    expect(processResourceActionLink(openSearchView)).toEqual(result)
  })
})

describe('processResourceActionLink openRemoteresourceYaml', () => {
  const openRemoteresourceYaml = {
    action: 'show_resource_yaml',
    cluster: 'possiblereptile',
    editLink:
      '/multicloud/home/search/resources/yaml?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123',
  }
  const result =
    '/multicloud/home/search/resources/yaml?cluster=possiblereptile&apiversion=abc&kind=Application&name=ui-git&namespace=ns-123'
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

describe('parseApplicationNodeName', () => {
  it('can parse app node name from id', () => {
    expect(parseApplicationNodeName('application--app-test')).toEqual('app-test')
  })

  it('returns id without parsing', () => {
    expect(parseApplicationNodeName('app-test')).toEqual('app-test')
  })
})

describe('createEditLink subscriptionstatus', () => {
  const node = {
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
            'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=false; work-manager=true',
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
            'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=ed841d92-934c-4a8e-8df7-3265bc16da1b; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.12.10; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; velero.io/exclude-from-backup=true; vendor=OpenShift',
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
  const kind = 'SubscriptionStatus'
  const cluster = 'local-cluster'
  const apiversion = 'apps.open-cluster-management.io/v1alpha1'

  it('returns subscriptionstatus link', () => {
    expect(createEditLink(node, kind, cluster, apiversion)).toEqual(
      '/multicloud/home/search/resources/yaml?apiversion=apps.open-cluster-management.io%2Fv1alpha1&cluster=local-cluster&kind=SubscriptionStatus&name=feng-wordpress-subscription-1&namespace=feng-wordpress'
    )
  })
})

describe('createEditLink deployment', () => {
  const node = {
    kind: 'deployment',
    apigroup: 'apps',
    apiversion: 'v1',
    cluster: 'local-cluster',
    name: 'mydeploy',
    namespace: 'default',
  }
  it('returns deployment link', () => {
    expect(createEditLink(node)).toEqual(
      '/multicloud/home/search/resources/yaml?apiversion=apps%2Fv1&cluster=local-cluster&kind=deployment&name=mydeploy&namespace=default'
    )
  })
})

describe('createEditLink kind undefined', () => {
  const node = {
    apigroup: 'apps',
    apiversion: 'v1',
    cluster: 'local-cluster',
    name: 'mydeploy',
    namespace: 'default',
  }
  it('returns non-working link', () => {
    expect(createEditLink(node)).toEqual(
      '/multicloud/home/search/resources/yaml?apiversion=apps%2Fv1&cluster=local-cluster&name=mydeploy&namespace=default'
    )
  })
})
