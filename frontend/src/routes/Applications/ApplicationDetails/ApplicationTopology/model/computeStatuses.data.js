// Copyright Contributors to the Open Cluster Management project

export const genericNodeYellowNotDefined = {
  id: 'member--member--service--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
  uid: 'member--member--service--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
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
  type: 'service',
  specs: {
    clustersNames: ['feng'],
    raw: {
      apiVersion: 'apps/v1',
      kind: 'Service',
      metadata: {
        labels: { app: 'mortgage-app-mortgage' },
        name: 'mortgage-app-deploy',
      },
      spec: {
        selector: {
          matchLabels: { app: 'mortgage-app-mortgage' },
        },
        template: {
          metadata: {
            labels: { app: 'mortgage-app-mortgage' },
          },
        },
      },
    },
  },
}

export const persVolumePending = {
  accessMode: ['ReadWriteOnce'],
  apiversion: 'v1',
  cluster: 'feng',
  kind: 'persistentvolumeclaim',
  name: 'minio',
  namespace: 'default',
  request: '8Gi',
  status: 'Pending',
  storageClassName: 'gp2',
}
export const persVolumeBound = {
  accessMode: ['ReadWriteOnce'],
  apiversion: 'v1',
  cluster: 'feng',
  kind: 'persistentvolumeclaim',
  name: 'minio',
  namespace: 'default',
  request: '8Gi',
  status: 'Bound',
  storageClassName: 'gp2',
}

export const persVolumePendingStateYellow = {
  id: 'member--member--service--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--persistentvolumeclaim--mortgage-app-deploy',
  uid: 'member--member--service--member--clusters--feng--default--mortgage-app-deployable--persistentvolumeclaim--mortgage-app-deploy',
  name: 'minio',
  cluster: null,
  clusterName: null,
  clusters: {
    specs: {
      targetNamespaces: {
        feng: ['default'],
      },
      clusters: [
        {
          metadata: {
            name: 'feng',
          },
          status: 'ok',
        },
      ],
    },
  },
  type: 'persistentvolumeclaim',
  specs: {
    clustersNames: ['feng'],
    persistentvolumeclaimModel: {
      'minio-persistentvolumeclaim-feng': [persVolumePending],
    },
    raw: {},
  },
  namespace: 'default',
}

export const persVolumePendingStatePendingRes = [
  {
    type: 'spacer',
  },
  {
    labelValue: 'Cluster deploy status',
    type: 'label',
  },
  {
    type: 'spacer',
  },
  {
    labelValue: 'Cluster name',
    value: 'feng',
  },
  {
    labelValue: 'default',
    status: 'warning',
    value: 'Pending',
  },
  {
    indent: true,
    type: 'link',
    value: {
      data: {
        action: 'show_resource_yaml',
        cluster: 'feng',
        editLink:
          '/multicloud/home/search/resources/yaml?apiversion=v1&cluster=feng&kind=persistentvolumeclaim&name=minio&namespace=default',
      },
      label: 'View resource YAML',
    },
  },
  {
    type: 'spacer',
  },
]

export const persVolumePendingStateGreenRes = [
  {
    type: 'spacer',
  },
  {
    labelValue: 'Cluster deploy status',
    type: 'label',
  },
  {
    type: 'spacer',
  },
  {
    labelValue: 'Cluster name',
    value: 'feng',
  },
  {
    labelValue: 'default',
    status: 'checkmark',
    value: 'Bound',
  },
  {
    indent: true,
    type: 'link',
    value: {
      data: {
        action: 'show_resource_yaml',
        cluster: 'feng',
        editLink:
          '/multicloud/home/search/resources/yaml?apiversion=v1&cluster=feng&kind=persistentvolumeclaim&name=minio&namespace=default',
      },
      label: 'View resource YAML',
    },
  },
  {
    type: 'spacer',
  },
]
export const persVolumePendingStateGreen = {
  id: 'member--member--service--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--persistentvolumeclaim--mortgage-app-deploy',
  uid: 'member--member--service--member--clusters--feng--default--mortgage-app-deployable--persistentvolumeclaim--mortgage-app',
  name: 'mortgage-app',
  cluster: null,
  clusterName: null,
  clusters: {
    specs: {
      targetNamespaces: {
        feng: ['default'],
      },
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
      ],
    },
  },
  type: 'persistentvolumeclaim',
  specs: {
    clustersNames: ['feng'],
    persistentvolumeclaimModel: {
      'mortgage-app-persistentvolumeclaim-feng': [persVolumeBound],
    },
    raw: {},
  },
  namespace: 'default',
}

export const subscriptionInputRed1 = {
  id: 'member--subscription--default--mortgagedc-subscription',
  name: 'mortgagedc',
  specs: {
    isDesign: true,
    clustersNames: ['braveman', 'braveman2'],
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    subscriptionModel: {
      'mortgagedc-subscription-braveman': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'Subscribed',
          _clusterNamespace: 'braveman-ns',
        },
      ],
      'mortgagedc-subscription-braveman2': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman2',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'SubscribedFailed',
          _clusterNamespace: 'braveman-ns',
        },
      ],
    },
    row: 12,
  },
  type: 'subscription',
}
export const subscriptionInputRed = {
  id: 'member--subscription--default--mortgagedc-subscription',
  name: 'mortgagedc',
  specs: {
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    row: 12,
  },
  type: 'subscription',
}
export const subscriptionInputYellow = {
  id: 'member--subscription--default--mortgagedc-subscription',
  name: 'mortgagedc',
  specs: {
    isDesign: true,
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    subscriptionModel: {
      'mortgagedc-subscription-braveman': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'Subscribed',
          _clusterNamespace: 'braveman-ns',
        },
      ],
      'mortgagedc-subscription-braveman2': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman2',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'SomeOtherState',
          _clusterNamespace: 'braveman-ns',
        },
      ],
    },
    row: 12,
  },
  type: 'subscription',
}

export const subscriptionGreenNotPlacedYellow = {
  id: 'member--subscription--default--mortgagedc-subscription',
  name: 'mortgagedc',
  specs: {
    isDesign: true,
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    subscriptionModel: [],
    row: 12,
  },
  type: 'subscription',
}

export const appSetDeployable = {
  id: 'member--member--deployable--member--clusters--cluster1--default--appSet1--applicationset--appSet1',
  name: 'appSet1',
  namespace: 'default',
  specs: {
    applicationsetModel: [],
  },
  type: 'applicationset',
}

export const appSetDesignFalse = {
  id: 'member--applicationset--default--appSet1',
  name: 'appSet2',
  namespace: 'default',
  specs: {
    design: false,
    applicationsetModel: [],
  },
  type: 'applicationset',
}

export const subscriptionInputNotPlaced = {
  id: 'member--subscription--default--mortgagedc-subscription',
  name: 'mortgagedc',
  specs: {
    searchClusters: [
      {
        name: 'braveman',
        status: 'OK',
      },
      {
        name: 'braveman2',
        ManagedClusterConditionAvailable: 'True',
      },
    ],
    clustersNames: ['braveman', 'braveman2'],
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    subscriptionModel: {
      'mortgagedc-subscription-braveman': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'Subscribed',
          _clusterNamespace: 'braveman-ns',
        },
      ],
      'mortgagedc-subscription-braveman2': [
        {
          apigroup: 'apps.open-cluster-management.io',
          apiversion: 'v1',
          channel: 'mortgagedc-ch/mortgagedc-channel',
          cluster: 'braveman2',
          created: '2020-04-20T22:02:46Z',
          kind: 'subscription',
          label: 'app=mortgagedc; hosting-deployable-name=mortgagedc-subscription-deployable; subscription-pause=false',
          name: 'mortgagedc-subscription',
          namespace: 'default',
          status: 'Propagated',
          _clusterNamespace: 'braveman-ns',
        },
      ],
    },
    row: 12,
  },
  type: 'subscription',
}

export const genericNodeInputRed = {
  id: 'member--pod--default--mortgagedc-subscription',
  name: 'mortgagedc',
  clusters: {
    specs: {
      clusters: [],
    },
  },
  specs: {
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    row: 12,
  },
  type: 'pod',
}

export const genericNodeInputRed2 = {
  id: 'member--pod--default--mortgagedc-subscription',
  name: 'mortgagedc',
  clusters: {
    specs: {
      clusters: [],
    },
  },
  specs: {
    raw: {
      spec: { template: { spec: { containers: [{ name: 'c1' }] } } },
    },
    pulse: 'red',
    row: 12,
  },
  type: 'pod',
}

export const deploymentNodeYellow = {
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
    clustersNames: ['feng'],
    raw: {
      spec: {
        replicas: 3,
      },
    },
    deploymentModel: {
      'mortgage-app-deploy-feng': {
        ready: 2,
        desired: 3,
      },
      'mortgage-app-deploy-cluster1': {
        desired: 1,
      },
    },
  },
}

export const deploymentNodeRed = {
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
    clustersNames: ['feng'],
    pulse: 'red',
  },
}

export const deploymentNodeYellow4 = {
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
    clustersNames: ['feng'],
    pulse: 'green',
    raw: {
      metadata: {
        namespace: 'default',
      },
    },
  },
}

export const deploymentNodeYellow2 = {
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
    clustersNames: ['feng'],
    raw: {
      spec: {
        metadata: {
          namespace: 'default',
        },
        replicas: 3,
      },
    },
  },
}

export const deploymentNodeNoPODS = {
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
    clustersNames: ['feng'],
    raw: {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        labels: { app: 'mortgage-app-mortgage' },
        namespace: 'default',
        name: 'mortgage-app-deploy',
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
  namespace: '',
  topology: null,
  labels: null,
  __typename: 'Resource',
  layout: {
    hasPods: true,
    uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
    type: 'deployment',
    label: 'mortgage-app-↵deploy',
    compactLabel: 'mortgage-app-↵deploy',
    nodeStatus: '',
    isDisabled: false,
    title: '',
    description: '',
    tooltips: [
      {
        name: 'Deployment',
        value: 'mortgage-app-deploy',
        href: "/multicloud/home/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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
        layout: {
          type: 'layout1',
        },
        specs: {
          podModel: {
            'mortgage-app-deploy-55c65b9c8f-6v9bn': [
              {
                namespace: 'default',
                cluster: 'cluster1',
                hostIP: '1.1.1.1',
                status: 'Running',
                startedAt: '2020-04-20T22:03:52Z',
                restarts: 0,
                podIP: '1.1.1.1',
                //startedAt: 'Monday',
              },
            ],
          },
        },
      },
    ],
  },
}

export const deploymentNodeNoPODSNoRes = {
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
    clustersNames: ['feng4', 'cluster1', 'cluster2'],
    raw: {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        labels: { app: 'mortgage-app-mortgage' },
        namespace: 'default',
        name: 'mortgage-app-deploy',
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
  namespace: '',
  topology: null,
  labels: null,
  __typename: 'Resource',
  layout: {
    hasPods: true,
    uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
    type: 'deployment',
    label: 'mortgage-app-↵deploy',
    compactLabel: 'mortgage-app-↵deploy',
    nodeStatus: '',
    isDisabled: false,
    title: '',
    description: '',
    tooltips: [
      {
        name: 'Deployment',
        value: 'mortgage-app-deploy',
        href: "/multicloud/home/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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
        layout: {
          type: 'layout1',
        },
        specs: {
          podModel: {
            'mortgage-app-deploy-55c65b9c8f-6v9bn': {
              cluster: 'cluster1',
              hostIP: '1.1.1.1',
              status: 'Running',
              startedAt: '2020-04-20T22:03:52Z',
              restarts: 0,
              podIP: '1.1.1.1',
              //startedAt: 'Monday',
            },
          },
        },
      },
    ],
  },
}

export const deploymentNodeRed3 = {
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
    clustersNames: ['feng'],
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
          created: '2020-04-20T22:03:52Z',
          hostIP: '1.1.1.1',
          image: 'fxiang/mortgage:0.4.0',
          kind: 'pod',
          label:
            'app=mortgagedc-mortgage; deployment=mortgagedc-deploy-1; deploymentConfig=mortgagedc-mortgage; deploymentconfig=mortgagedc-deploy',
          name: 'mortgagedc-deploy-1-q9b5r',
          namespace: 'default',
          podIP: '10.128.2.80',
          restarts: 0,
          selfLink: '/api/v1/namespaces/default/pods/mortgagedc-deploy-1-q9b5r',
          startedAt: '2020-04-20T22:03:52Z',
          status: 'CrashLoopBackOff',
        },
      ],
      'mortgagedc-deploy-1-q9b5rr-feng': [
        {
          cluster: 'feng',
          container: 'mortgagedc-mortgage',
          created: '2020-04-20T22:03:52Z',
          hostIP: '1.1.1.1',
          image: 'fxiang/mortgage:0.4.0',
          kind: 'pod',
          label:
            'app=mortgagedc-mortgage; deployment=mortgagedc-deploy-1; deploymentConfig=mortgagedc-mortgage; deploymentconfig=mortgagedc-deploy',
          name: 'mortgagedc-deploy-1-q9b5rr',
          namespace: 'default',
          podIP: '10.128.2.80',
          restarts: 0,
          selfLink: '/api/v1/namespaces/default/pods/mortgagedc-deploy-1-q9b5r',
          startedAt: '2020-04-20',
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
  namespace: 'test-app',
  topology: null,
  labels: null,
  __typename: 'Resource',
  layout: {
    hasPods: true,
    uid: 'member--member--deployable--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
    type: 'deployment',
    label: 'mortgage-app-↵deploy',
    compactLabel: 'mortgage-app-↵deploy',
    nodeStatus: '',
    isDisabled: false,
    title: '',
    description: '',
    tooltips: [
      {
        name: 'Deployment',
        value: 'mortgage-app-deploy',
        href: "/multicloud/home/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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
        layout: {
          type: 'layout1',
        },
        specs: {
          podModel: {
            'mortgage-app-deploy-55c65b9c8f-6v9bn': {
              cluster: 'cluster1',
              hostIP: '1.1.1.1',
              status: 'Running',
              startedAt: '2020-04-20T22:03:52Z',
              restarts: 0,
              podIP: '1.1.1.1',
              //startedAt: 'Monday',
            },
          },
        },
      },
    ],
  },
}

export const deploymentNodeNoPodModel = {
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
    clustersNames: ['feng'],
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
  namespace: '',
  topology: null,
  labels: null,
  __typename: 'Resource',
}

export const genericNodeYellow = {
  id: 'member--member--service--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
  uid: 'member--member--service--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
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
  type: 'service',
  specs: {
    clustersNames: ['feng'],
    raw: {
      apiVersion: 'apps/v1',
      kind: 'Service',
      metadata: {
        labels: { app: 'mortgage-app-mortgage' },
        name: 'mortgage-app-deploy',
      },
      spec: {
        selector: {
          matchLabels: { app: 'mortgage-app-mortgage' },
        },
        template: {
          metadata: {
            labels: { app: 'mortgage-app-mortgage' },
          },
        },
      },
    },
  },
}

export const packageNodeOrange = {
  id: 'member--member--package--member--clusters--feng, cluster1, cluster2--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
  uid: 'member--member--package--member--clusters--feng--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
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
  type: 'package',
  specs: {
    clustersNames: ['feng'],
  },
}

export const ruleNodeRed = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'placements',
  specs: {},
}

export const ruleNodeGreen2 = {
  name: 'mortgage-app-deploy2',
  cluster: null,
  clusterName: null,
  type: 'placements',
  specs: {
    raw: {
      status: {
        decisions: {
          cls1: {},
        },
      },
    },
  },
}

export const appNoChannelRed = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'application',
  specs: {
    isDesign: true,
  },
}

export const appNoChannelGreen = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'application',
  specs: {
    isDesign: true,
    channels: ['aaa'],
  },
}

export const podCrash = {
  id: 'member--deployable--member--clusters--possiblereptile, braveman, sharingpenguin, relievedox--deployment--frontend',
  uid: 'member--deployable--member--clusters--possiblereptile, braveman, sharingpenguin, relievedox--deployment--frontend',
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
    podModel: {
      'frontend-6cb7f8bd65-g25j6-possiblereptile': {
        apiversion: 'v1',
        cluster: 'braveman',
        kind: 'pod',
        label: 'app=guestbook; pod-template-hash=6cb7f8bd65; tier=frontend',
        name: 'frontend-6cb7f8bd65-8d9x2',
        namespace: 'open-cluster-management',
        status: 'CrashLoopBackOff',
      },
    },
    raw: {
      spec: {
        replicas: 1,
      },
    },
  },
}
