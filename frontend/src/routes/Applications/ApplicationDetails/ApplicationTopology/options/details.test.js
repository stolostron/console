// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { inflateKubeValue } from '../helpers/diagram-helpers'
import { getNodeDetails } from './details'

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
          href: "/multicloud/search?filters={'textsearch':'kind:cluster name:c1'}",
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
    { labelValue: 'Select a cluster to view details', type: 'label' },
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
    expect(getNodeDetails(clusterNode, {}, t)).toEqual(expectedResult)
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
      labelValue: 'Type',
      status: undefined,
      type: 'label',
      value: 'Application',
    },
    {
      indent: undefined,
      labelValue: 'Namespace',
      status: undefined,
      type: 'label',
      value: 'ns-sub-1',
    },
    {
      indent: undefined,
      labelValue: 'Labels',
      status: undefined,
      type: 'label',
      value: 'No labels',
    },
    { type: 'spacer' },
    { type: 'spacer' },
    {
      labelValue: 'Subscription Selector',
      status: true,
      value: 'This application has no subscription match selector (spec.selector.matchExpressions)',
    },
    { type: 'spacer' },
    {
      labelValue: 'Error',
      status: 'failure',
      value:
        'This application has no matched subscription. Make sure the subscription match selector spec.selector.matchExpressions exists and matches a Subscription resource created in the {{0}} namespace.',
    },
    {
      type: 'link',
      value: {
        data: {
          action: 'open_link',
          targetLink:
            '/multicloud/search?filters={"textsearch":"kind%3Asubscription%20namespace%3Ans-sub-1%20cluster%3Alocal-cluster"}',
        },
        id: 'application--nginx-app-3-subscrSearch',
        label: 'View all subscriptions in {{0}} namespace',
      },
    },
  ]

  it('should process the node, application node', () => {
    expect(getNodeDetails(applicationNode, {}, t)).toEqual(expectedResult)
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
          href: "/multicloud/search?filters={'textsearch':'kind:cluster name:feng'}",
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
      labelValue: 'Select a cluster to view details',
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
    expect(getNodeDetails(clusterNode, {}, t)).toEqual(expectedResult)
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
          href: "/multicloud/search?filters={'textsearch':'kind:cluster name:feng'}",
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
      labelValue: 'Select a cluster to view details',
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
    expect(getNodeDetails(clusterNode, {}, t)).toEqual(expectedResult)
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
      labelValue: 'Type',
      value: 'Subscription',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'API Version',
      value: 'apps.open-cluster-management.io/v1',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Namespace',
      value: 'sahar-test-ns',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Labels',
      value: 'app=sahar-test-1234',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Channel',
      value: 'ggithubcom-fxiang1-app-samples1234-ns/ggithubcom-fxiang1-app-samples1234',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Placement Ref',
      value: 'kind=PlacementRule,name=sahar-test-1234-placement-1',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Git branch',
      value: 'main',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Git path',
      value: 'path1234',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Git tag',
      value: 'b456',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Git commit',
      value: 'a123',
      indent: undefined,
      status: undefined,
    },
    {
      type: 'label',
      labelValue: 'Reconcile rate',
      value: 'off',
      indent: undefined,
      status: undefined,
    },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'label', labelValue: 'Cluster deploy status' },
    {
      labelValue: 'Remote subscriptions',
      value:
        'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the application-manager pod runs on the managed clusters.',
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
            '/multicloud/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3Asahar-test-ns%20cluster%3Alocal-cluster"}',
        },
      },
    },
    { type: 'spacer' },
  ]

  it('should process the node and show the details', () => {
    expect(getNodeDetails(subscription, ['application', 'cluster', 'placements', 'subscription'], t)).toEqual(
      expectedValue
    )
  })
})

describe('getNodeDetails helm node', () => {
  const helmreleaseNode = {
    id: 'helmrelease1',
    uid: 'helmrelease1',
    name: 'mortgage-helmrelease',
    namespace: 'default',
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
      labelValue: 'Type',
      status: undefined,
      type: 'label',
      value: 'Helmrelease',
    },
    {
      indent: undefined,
      labelValue: 'API Version',
      status: undefined,
      type: 'label',
      value: 'app.ibm.com/v1alpha1',
    },
    {
      indent: undefined,
      labelValue: 'Namespace',
      status: undefined,
      type: 'label',
      value: 'default',
    },
    {
      indent: undefined,
      labelValue: 'Chart Name',
      status: undefined,
      type: 'label',
      value: 'mortgage-chart',
    },
    {
      indent: undefined,
      labelValue: 'Version',
      status: undefined,
      type: 'label',
      value: '1.0.0',
    },
    {
      indent: undefined,
      labelValue: 'Labels',
      status: undefined,
      type: 'label',
      value: 'app=mortgage-app-mortgage',
    },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },
    { labelValue: 'Cluster deploy status', type: 'label' },
    { type: 'spacer' },
    { labelValue: 'Cluster name', value: 'local-cluster' },
    { labelValue: '*', status: 'pending', value: 'Not Deployed' },
    { type: 'spacer' },
  ]

  it('should process the node, helm node', () => {
    expect(getNodeDetails(helmreleaseNode, {}, t)).toEqual(expectedResult)
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
      labelValue: 'resource.name',
      status: undefined,
      type: 'label',
      value: 'mortgage-app-deploy',
    },
    {
      indent: undefined,
      labelValue: 'resource.message',
      status: undefined,
      type: 'label',
      value: 'There is not enough information in the subscription to retrieve deployed objects data.',
    },
  ]

  it('should process the node, packageNode node', () => {
    expect(getNodeDetails(packageNode, {}, t)).toEqual(expectedResult)
  })
})

describe('getNodeDetails placement rules node with error', () => {
  const rulesNode = {
    id: 'rule1',
    uid: 'rule1',
    name: 'mortgage-rule',
    namespace: 'default',
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
      labelValue: 'Type',
      status: undefined,
      type: 'label',
      value: 'Placements',
    },
    {
      indent: undefined,
      labelValue: 'API Version',
      status: undefined,
      type: 'label',
      value: 'apps.open-cluster-management.io/v1',
    },
    {
      indent: undefined,
      labelValue: 'Namespace',
      status: undefined,
      type: 'label',
      value: 'default',
    },
    {
      indent: undefined,
      labelValue: 'Labels',
      status: undefined,
      type: 'label',
      value: 'app=mortgage-app-mortgage',
    },
    {
      indent: undefined,
      labelValue: 'Cluster Selector',
      status: undefined,
      type: 'label',
      value: 'environment=Dev',
    },
    {
      indent: undefined,
      labelValue: 'Matched Clusters',
      status: undefined,
      type: 'label',
      value: 0,
    },
    {
      indent: undefined,
      labelValue: 'ClusterSet',
      status: undefined,
      type: 'label',
      value: 'Not defined',
    },
    {
      indent: undefined,
      labelValue: 'LabelSelector',
      status: undefined,
      type: 'label',
      value: '',
    },
    { type: 'spacer' },
    { type: 'spacer' },
    {
      labelValue: 'Error',
      status: 'failure',
      value:
        'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.',
    },
  ]
  it('should process the node, placement rules node with error', () => {
    expect(getNodeDetails(rulesNode, {}, t)).toEqual(expectedResult)
  })
})

describe('getNodeDetails placement rules node with success', () => {
  const rulesNode = {
    id: 'rule1',
    uid: 'rule1',
    name: 'mortgage-rule',
    namespace: 'default',
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
      labelValue: 'Type',
      status: undefined,
      type: 'label',
      value: 'Placements',
    },
    {
      indent: undefined,
      labelValue: 'API Version',
      status: undefined,
      type: 'label',
      value: 'apps.open-cluster-management.io/v1',
    },
    {
      indent: undefined,
      labelValue: 'Namespace',
      status: undefined,
      type: 'label',
      value: 'default',
    },
    {
      indent: undefined,
      labelValue: 'Labels',
      status: undefined,
      type: 'label',
      value: 'app=mortgage-app-mortgage',
    },
    {
      indent: undefined,
      labelValue: 'Cluster Selector',
      status: undefined,
      type: 'label',
      value: 'environment=Dev',
    },
    {
      indent: undefined,
      labelValue: 'Matched Clusters',
      status: undefined,
      type: 'label',
      value: 1,
    },
    {
      indent: undefined,
      labelValue: 'ClusterSet',
      status: undefined,
      type: 'label',
      value: 'Not defined',
    },
    {
      indent: undefined,
      labelValue: 'LabelSelector',
      status: undefined,
      type: 'label',
      value: '',
    },
    { type: 'spacer' },
    { type: 'spacer' },
  ]

  it('should process the node, placement rules node with success', () => {
    expect(getNodeDetails(rulesNode, {}, t)).toEqual(expectedResult)
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
