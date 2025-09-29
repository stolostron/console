// Copyright Contributors to the Open Cluster Management project

import {
  TopologyNodeWithStatus,
  ResourceItemWithStatus,
  DetailItem,
  ClusterInfo,
  NodeSpecs,
  ResourceMap,
  StatusType,
  ResourceAction,
  ArgoApplication,
  AppSetCluster,
} from '../types'

export const genericNodeYellowNotDefined: TopologyNodeWithStatus = {
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

export const persVolumePending: ResourceItemWithStatus = {
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
export const persVolumeBound: ResourceItemWithStatus = {
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

export const persVolumePendingStateYellow: TopologyNodeWithStatus = {
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

export const persVolumePendingStatePendingRes: DetailItem[] = [
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
          '/multicloud/search/resources/yaml?apiversion=v1&cluster=feng&kind=persistentvolumeclaim&name=minio&namespace=default',
      },
      label: 'View resource YAML',
    },
  },
  {
    type: 'spacer',
  },
]

export const persVolumePendingStateGreenRes: DetailItem[] = [
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
          '/multicloud/search/resources/yaml?apiversion=v1&cluster=feng&kind=persistentvolumeclaim&name=minio&namespace=default',
      },
      label: 'View resource YAML',
    },
  },
  {
    type: 'spacer',
  },
]
export const persVolumePendingStateGreen: TopologyNodeWithStatus = {
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

export const subscriptionInputRed1: TopologyNodeWithStatus = {
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
export const subscriptionInputRed: TopologyNodeWithStatus = {
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
export const subscriptionInputYellow: TopologyNodeWithStatus = {
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

export const subscriptionGreenNotPlacedYellow: TopologyNodeWithStatus = {
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

export const appSetDeployable: TopologyNodeWithStatus = {
  id: 'member--member--deployable--member--clusters--cluster1--default--appSet1--applicationset--appSet1',
  name: 'appSet1',
  namespace: 'default',
  specs: {
    applicationsetModel: [],
  },
  type: 'applicationset',
}

export const appSubDeployable: TopologyNodeWithStatus = {
  id: 'member--member--deployable--member--clusters--cluster1--default--appSet1--application--appSub1',
  name: 'appSub1',
  namespace: 'default',
  specs: {
    applicationModel: [],
  },
  type: 'application',
}

export const placementsDeployable: TopologyNodeWithStatus = {
  id: 'member--member--deployable--member--clusters--cluster1--default--appSet1--placements--placementrule1',
  name: 'placementrule1',
  namespace: 'default',
  specs: {
    placementsModel: [],
  },
  type: 'placements',
}

export const placementDeployable: TopologyNodeWithStatus = {
  id: 'member--member--deployable--member--clusters--cluster1--default--appSet1--placement--placement1',
  name: 'placement1',
  namespace: 'default',
  specs: {
    placementModel: [],
  },
  type: 'placement',
}

export const clusterNode: TopologyNodeWithStatus = {
  name: 'local-cluster',
  namespace: '',
  type: 'cluster',
  id: 'member--clusters--local-cluster--feng-hello-subscription-1',
  uid: 'member--clusters--local-cluster--feng-hello-subscription-1',
  specs: {
    title: '',
    subscription: {
      apiVersion: 'apps.open-cluster-management.io/v1',
      kind: 'Subscription',
      metadata: {
        annotations: {
          'apps.open-cluster-management.io/cluster-admin': 'true',
          'apps.open-cluster-management.io/git-branch': 'main',
          'apps.open-cluster-management.io/git-current-commit': '714d7bf955b0b47eaf52fc942cb1b2dfec2a2322',
          'apps.open-cluster-management.io/git-path': 'helloworld',
          'apps.open-cluster-management.io/reconcile-option': 'merge',
          'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
          'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
        },
        creationTimestamp: '2024-11-17T21:52:18Z',
        generation: 1,
        labels: {
          app: 'feng-hello',
          'app.kubernetes.io/part-of': 'feng-hello',
          'apps.open-cluster-management.io/reconcile-rate': 'medium',
        },
        name: 'feng-hello-subscription-1',
        namespace: 'feng-hello',
        resourceVersion: '20248186',
        uid: '0784b94b-ddb6-4234-bc1b-d07d641d7a0c',
      },
      spec: {
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        placement: {
          placementRef: {
            kind: 'Placement',
            name: 'feng-hello-placement-1',
          },
        },
      },
      status: {
        lastUpdateTime: '2024-11-17T21:52:19Z',
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
            creationTimestamp: '2024-11-17T21:52:18Z',
            generation: 1,
            name: 'ggithubcom-fxiang1-app-samples',
            namespace: 'ggithubcom-fxiang1-app-samples-ns',
            resourceVersion: '20248119',
            uid: 'c2252315-eb7f-4860-b7a5-0f96996cca18',
          },
          spec: {
            pathname: 'https://github.com/fxiang1/app-samples',
            type: 'Git',
          },
        },
      ],
      decisions: [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'PlacementDecision',
          metadata: {
            creationTimestamp: '2024-11-17T21:52:18Z',
            generation: 1,
            labels: {
              'cluster.open-cluster-management.io/decision-group-index': '0',
              'cluster.open-cluster-management.io/decision-group-name': '',
              'cluster.open-cluster-management.io/placement': 'feng-hello-placement-1',
            },
            name: 'feng-hello-placement-1-decision-1',
            namespace: 'feng-hello',
            ownerReferences: [
              {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Placement',
                name: 'feng-hello-placement-1',
                uid: '4706f964-ed70-4e26-a589-1fa600f3f9b3',
              },
            ],
            resourceVersion: '20248139',
            uid: '9a9492e2-3b56-43df-8b6a-ea3bf180e613',
          },
          status: {
            decisions: [
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
            creationTimestamp: '2024-11-17T21:52:18Z',
            generation: 1,
            labels: {
              app: 'feng-hello',
            },
            name: 'feng-hello-placement-1',
            namespace: 'feng-hello',
            resourceVersion: '20248140',
            uid: '4706f964-ed70-4e26-a589-1fa600f3f9b3',
          },
          spec: {
            clusterSets: ['default'],
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      {
                        key: 'local-cluster',
                        operator: 'In',
                        values: ['true'],
                      },
                    ],
                  },
                },
              },
            ],
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2024-11-17T21:52:18Z',
                message: 'Placement configurations check pass',
                reason: 'Succeedconfigured',
                status: 'False',
                type: 'PlacementMisconfigured',
              },
              {
                lastTransitionTime: '2024-11-17T21:52:19Z',
                message: 'All cluster decisions scheduled',
                reason: 'AllDecisionsScheduled',
                status: 'True',
                type: 'PlacementSatisfied',
              },
            ],
            decisionGroups: [
              {
                clusterCount: 1,
                decisionGroupIndex: 0,
                decisionGroupName: '',
                decisions: ['feng-hello-placement-1-decision-1'],
              },
            ],
            numberOfSelectedClusters: 1,
          },
        },
      ],
      report: {
        apiVersion: 'apps.open-cluster-management.io/v1alpha1',
        kind: 'SubscriptionReport',
        metadata: {
          creationTimestamp: '2024-11-17T21:52:19Z',
          generation: 4,
          labels: {
            'apps.open-cluster-management.io/hosting-subscription': 'feng-hello.feng-hello-subscription-1',
          },
          name: 'feng-hello-subscription-1',
          namespace: 'feng-hello',
          ownerReferences: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'Subscription',
              name: 'feng-hello-subscription-1',
              uid: '0784b94b-ddb6-4234-bc1b-d07d641d7a0c',
            },
          ],
          resourceVersion: '20248466',
          uid: 'e72fc8f5-124a-4989-a338-23cfc5c36cab',
        },
        reportType: 'Application',
        resources: [
          {
            apiVersion: 'route.openshift.io/v1',
            kind: 'Route',
            name: 'helloworld-app-route',
            namespace: 'feng-hello',
          },
          {
            apiVersion: 'v1',
            kind: 'Service',
            name: 'helloworld-app-svc',
            namespace: 'feng-hello',
          },
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'helloworld-app-deploy',
            namespace: 'feng-hello',
          },
        ],
        results: [
          {
            result: 'deployed',
            source: 'local-cluster',
            timestamp: {
              nanos: 0,
              seconds: 0,
            },
          },
        ],
        summary: {
          clusters: '1',
          deployed: '1',
          failed: '0',
          inProgress: '0',
          propagationFailed: '0',
        },
      },
    },
    resourceCount: 1,
    clustersNames: ['local-cluster'],
    clusters: [
      {
        name: 'local-cluster',
        displayName: 'local-cluster',
        namespace: 'local-cluster',
        uid: '773bc5f7-0ef8-4cd1-97e4-aaa2e5fa99e7',
        status: 'ready',
        provider: 'aws',
        distribution: {
          k8sVersion: 'v1.29.9+5865c5b',
          ocp: {
            availableUpdates: ['4.16.21', '4.16.23', '4.17.4', '4.17.5'],
            channel: 'candidate-4.17',
            desired: {
              channels: ['candidate-4.16', 'candidate-4.17', 'eus-4.16', 'fast-4.16', 'fast-4.17', 'stable-4.16'],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:cce4ab8f53523c13c3b4f3549b85e512398aa40d202a55908de31a9b8bf6a2cb',
              url: 'https://access.redhat.com/errata/RHSA-2024:8683',
              version: '4.16.20',
            },
            desiredVersion: '4.16.20',
            lastAppliedAPIServerURL: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
            managedClusterClientConfig: {
              caBundle:
                'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJRDBLWk0vMzFTY013RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpRd09USXpNVGt3TWpFMFdoY05NelF3T1RJeE1Ua3dNakUwV2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTXJDZkZtS2p2Ri9tcUY4TTNpSTc5N1lXLzNqa0t5KwpvSkRYTkV4ZHRtbjZ3Q2xNbUxYcDd6amVCZ2VmWE5ZUXN4LzNCcG5FcnNiVG90RW1FMWJLaHJZQjRnc3dsUG8xCk5Ha015QlVZTFNoTGszSkdqemMxczBqUm1qU1pVMTlyd3dqN1RpZU5qb1BhZlcrNXk4QzM1aFR3dEJZeVB4dzYKQ1cxVmRvUUljVFNVOWRPUUxRS1VIb2RhN2JSSUZNeFRCOG1NUDZQWDhLeG5GYXpaWHIrR3hBQzdvZFlIdmcxRgpLM1RnbitHWTVsSnNCNGd4ME5RN0VnSnJ5YWRBWWgzSUpHMC9heks4VUNkSlJ5NjNNOXJndTdocDMxQ3JDNWYyCms5b1V6U09yY1ZnY1FaeFMrUFVjK3B3c0hQS3FIOVJ2VVFmd3lIZmZBT2ozQ0xsSEZpVWFZazhDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRklRdwpSV25xcnBYYUU0dzByVDR2SlowbGxVRWFNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUF0VC93S1Zpek0yTTZQCkY1OGI5Vk0rN0FQeHhHU1dVb1gxWjVqTDdmVWIxREtIS0xxczNJQlpwRlVYYTRUM0ErUy9yNDZDY3QrWjJmNUUKRU84ODBEZDhTUlpieFE0emlZN0JaN2dmQXYyeENaS2sxWm04ZFhSWlpoelBtWGhocWxFeFhTMDhTMk9maWI5YQpkZGd4S3BKclpZS3QveC90Yk9hUHhveGxwYmxyV21kbEpiLzdKdHJtZHhWN3Q0WE1GNlpvUGNwYkE2SlEwcWhnCjlUcGpvdGJRazRYa2dpczFLK2pPRXFaT0I3emc2Y2gxbGF0L1FYMU5GY1V4YXZodmJhZEdkVVgxSWRVTU9KSzUKZUs5TzByTnRyK09VUUJ6dWxob1RXU1FzN1lTNGxobFBYenVqRUZIeU02M3JtZ1hBMVlEM1JPQ1E0ajJYMnlqQgpTYk13MUJpUQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSWVPeDdwZUxLZGRFd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJME1Ea3lNekU1TURJeE5Gb1hEVE0wTURreU1URTVNREl4TkZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0aGtaY3lZdEN0Zk8KMTl2LzBxdEVLTW1oeG13cXZEVHRrbFUrT1JkNThEU2N5N3lMd2F4K1hkTmN1RXBBcUNQSzVEbEc5dlQzSWw0ZApMcTQwYzBpdmVYRmZsMzlvbXJKYXJFQ3BSMFJZQTRHL1lVOENlTWpPM0NIWUQrcHROa2M3RlhhWnZtUzg3YWl5CjRyeklIOVdKNWF5SHE5UEo1T0Z3VDJDajNUdDhjLzN5Wmc0RTVOU0hiYXdtNVE4MUp3eTFHNHNuY1pXREtEVFcKTGxRVEtCOHErOHdBSGxucGJkNis5b1l5aytmLzlubDI5WlNrZnVsMjdGMzVHeWYxN0F3UTFIS2NaeXI0SEo3aApSOGdoN3YzcjNicjlFREo4WW91L1BFTWwzUmFjN3VhVEpiUE9ERHFFaWcxdnlld2pYS3dkZzZmNy96UXZPbDc5CjF0MkM5akNXZlFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVTh4T0dXSVZ1eThJSTJEOFI1OEJ6L2pncm9pY3dEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUtNaVk3OGFZd2hZN1B5R1diQkI5Wm1vclFyZ04xc3E1S0N0U2JiRWQ4UkVoZ2djYUplV2paSHg5ZnkrCkRrb2Y3OTM4SVpjWFloZjkyRm02UVBaL0dWbVU3VUQ5NFJTdzBPVDlITVRMczRQQldRb1dtVWozcUZmdkVxWUwKUVMvQmNFZzRQZVJpWkk5T1NNbmJMUXVyd3BqcHZyYUVrMnJCMkZtdUVtTFpYQUhELzVOTG8yVUZFRUdMVk56NQpuQ2pjazMra2ZBY00wN01TUUdvS0VqUDNWS29Nd1hSV3NacHJNOElKVm84TnNSdDluRmdCdTEyQjJneWpuUkFGCjQrTmtxdWpkdGZyVHlyc2hzQWJ4M0JiKzdZVks0NTFSTjREZlROTGFZYmlEcnJWQzcrb3lIWVdWUEwzWStjbHAKcFNRRHFZc2FraXJNUjNpeEJnTUNGbTlGRDFvPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSVJBVjVkTDZKNHlVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEkwTURreU16RTVNREl4TkZvWERUTTBNRGt5TVRFNU1ESXhORm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQW5mcDBzOGVMczUwbVlTcm85QXl0cFpUek5NM1EvOXMzbGZSWVZCN2d3K3BvWGQ2UFVrdzE3ak9ZUlRLdgovWnRwL1JBWmVhWkhLQ2FHRG1UKzhtRVl2czlNQW5RVENqSE1tZnpUdk1rdE9HbHNGMjdRRnJGN3FST2hRR0hPCnNKTmN4M0I3R2NnbE90Y0VoM1lBK0V4QitVTXBQVTA0bG9RT1RDZ1EyWk1tTDFndWZsUmxLNDNMZVBtZk5SRG4KZktCYUlCMkNCN2FWdnhRUEJlbko3d1c2T0pHQnBEWDg1WEg3cTBqdktqZkUvZlRiNER0TnR5dklhdEU1cFZVaAppTFhZRmVXa3psSG9QTGlGbWxJT3NGRm1FMjF3Rlo5MG93eWFmY1ArSVJaSXVPRFNzTzJRUURNV2Nyekl5V1MrCjQwRHVHSXd2MUJhRnhFeDJHcmx2ODVmUWJ3SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVU4Y0VmYlB1TE45UGhaV1hEbll4V1ZWNEMrL0F3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFJZVp1ZzNhRjNTckptUFZtWGpwclhVY2VMSDFmT0pFQ3lkc29pOHFESkhvCk13YURFOWs3aSs1UlBQZTRtV2RZVVdvcjdOZE9ZNGMvejZtdXJIQ2thbzJ1YXJ0MFNFMDhSZkphQzlBemlZNzgKR3ZCSDJET3h3d0oxMnQrcitpVEVJMWRlNUw0WTI2MytlY2wrWWZlTklJYWNsbDZZeWc4SmxXdS9oNzhXeWNQOApadk5sNmlrOGhOSjFhU0pqMW9XNHR4RG5TNm42a2RFem11UFY2ZVp6empaakc2dVV3dDV2RFhzOWl0b2tHdFJWCnArS3c3eDFqWXkrbFVlMlFta3ZPMTN1SnJlbmszbUh1dXVlSHEySjdtWlBrazBEekl3dWswQS9wcm0yVTZXUVIKU25nenNDNWIxOEp4cWJrOHFDak1kVzdvTlhUK01GNXJaTlg5SUlia1ZmTT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlXT25MZlBFT3pKd3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TnpJM01URTRPRGMxTUI0WERUSTBNRGt5TXpFNU1UUXoKTkZvWERUTTBNRGt5TVRFNU1UUXpOVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOekkzTVRFNE9EYzFNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXRyZ0MKM2lPVFE1OGZNN0pTZ0crTGxEbi83TTZkSVVYRXJQclg4TERlV3QyQUdyQUpXYytZOHdoekF2NVFVWlZ1RGxFZApjejB3SnRraW1CdDJOeC81OEVEN2JLbGZRdDZUUC83WVRmMmdyQ1hWbXhOd0JmZTR1WkpVS2NxZnp4bVN4Q1VGCkVXdnpONUpEd1hBbFdiZUpYM1ZDRG9SM3JmUkNpMVMwTUduWXRUcEg0YWNPYWFGQm9GY2dEM3dzbzhXUEc4czUKT1pzVmpnUUZvbUpNUk5tWXRpQ3VlUk0vaURKcDZxMUNuR0hBN1pScVpLMXVGY2lPU3BoOE4xR1FQczBnZUJ0bwpxUzY5YWVrVmgxVEF5dWNzcnRIelRkeWNFeGVLOHAxR2JRWUtvVVlVQ1FMeGptaXN6NmJSK2d0WS9OUzZoZXdICnZ0MG8xQklROXd1eldDb3RoUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVY29jVTl5WXF3d0M5N3VnbkhpREVLMkVPUE1Rd0h3WURWUjBqQkJndwpGb0FVY29jVTl5WXF3d0M5N3VnbkhpREVLMkVPUE1Rd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCNExiK2lpCllRWnNjT2lKd2ZONjRnbGtpdEhCUGZKY1YzSDY4UUpvT2NSSjM5UjljWjlqUVhET3hDNDJTWWdtRWQ5a3NSWlMKektVSDNHY2l1V2NZZSt3ZmFOQytEOUpRSTF1VGpxUWtJVE9mQ2V2cmUxRWxHVVY2WUx0aXhqVUdrMnBQdTJUUgpzRG5ZdlgrUm9hOENSQkZOcGR0TmwwL0gyYXJ1VEl2Y2FGYW9VVk9FTDVycDRQQ3ZQRkR2ZmNteGphQkl5Z0NJCnRzbDI0S0NVL0RvMytFUy9odW5qWWUvV2ZUdGtydVhwbW1MQTFHOEpzQXVOS0R1OElPcGtUMEwzcFdhaDcyU1QKbVpoRjZTb3pEMnVWTTB6T1dQM3NPci9nVVpBek13eGJoaEJzTzVjTWppdlY1OUZHZVB1OGhBUnhWSVIzcjNGNgpvQVZuTkVpazVSbFllbmM9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURzVENDQXBtZ0F3SUJBZ0lJZHFqM3d6a0Z0Um93RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE56STNNVEl3TURJd01CNFhEVEkwTURreU16RTVNek0wTVZvWApEVEkyTURreU16RTVNek0wTWxvd1NERkdNRVFHQTFVRUF3dzlLaTVoY0hCekxtRndjQzFoZDNNdFpXRnpkREl0Ck5ERTFMV2gxWWkxeU5YWmlkeTVrWlhZeE1TNXlaV1F0WTJobGMzUmxjbVpwWld4a0xtTnZiVENDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBS09FYXdNZHpvS1NsOHIzc3k2amFJaFp3c1lRSWRaWgpiSVNaYXRhVnJHdVhDMit1Yml3MlpyempHN1VzeGdGZ2hmdEJJK0M5bGJwWm9jRm1PMEE5cm8vYjZRVmdGM3h5Clo4YTR6RlFTSUlpb3RWNS9QWVpIbEFkT0lnQXpHWmVTL3JQVTRicWRMUlRuS2hVR3c4emlScE51MU5kbjZJVWkKL25NUDNkWFRKaDZuOEF6dDZ6ekg3TFlUb3VkaEZxUnJXR2xWLy8rY20yN29CUkNVWktGeGdqSy9MZndhQTZLVwp5WUJvdUc5ZTBkNFhGaE5FQ00zakFpT2JCY1dUMGJ1YW5HdW91REU1dXZkamhtNmZlUFRrTXZzUXFCdmpKN3lBCjc0NXBFdHhzQ3NNWEc5TjE5N2dzWjN5ejFtMmI1Qks1RkZjczlUZnpsU2FVT1Z4bDlEY3k1NzBDQXdFQUFhT0IKd0RDQnZUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVlRFd5bTNhVFh4bGZ3SHI2dFAxeFFtT1VTZFl3SHdZRFZSMGpCQmd3CkZvQVU1M2ErbkV3WTNveE1LdFA1dXAzTTU2eVFSZW93U0FZRFZSMFJCRUV3UDRJOUtpNWhjSEJ6TG1Gd2NDMWgKZDNNdFpXRnpkREl0TkRFMUxXaDFZaTF5TlhaaWR5NWtaWFl4TVM1eVpXUXRZMmhsYzNSbGNtWnBaV3hrTG1OdgpiVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBdnhUS1pWWFlTNCsra0dZdHhWKzRmODZKQkNhUktndFViY0UwCkI2bTB3d2lRWitPRDdSbkFtekFFaUtQamhpSHNhd1lDWGpYTmp4MTZ1TDV6bTdPSFZ2eGlvcXQram5Oc0I4MnMKWTBiQzZGRGlUMFNyd2hkd01wQmZNemVwV1g3elVWNGVrWmE0dHlBM04xRWpGVmxkbWEzWFhwaTFJOWtyRkl6RwpiOVVCRWNxV2hVZEFCSW5iUUkvNkl0alJtNHlhTS9IaWNlLzhTbVZTOCtlajQ0c3pGV3lZdy81MWFwVkVtUU9sCjhFZ0lDUjliQlN5a3JIZ1ZlSWpvakljK2w2UmFvOWRsMFY2SEhSZi9nUWVHb1pFZFhiV3lFTHRuTzhpOVRWYUgKVWJNUHllS0xBUHBzK3VHNTNWSFdtV01rTGVUVjF6Ly83ZW5BVDJUbGptaWtkdVlYOXc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUzTWpjeE1qQXdNakF3SGhjTk1qUXdPVEl6TVRrek16UXdXaGNOTWpZd09USXoKTVRrek16UXhXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFM01qY3hNakF3TWpBdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFEanlkNjhrZTY0bzVubzF6RFJ2b3FQCkdjNGtUTkNzSTVIaTBLVzA2ajlmSTlHQVNiV0h5cmcvcW1Vb3BVU1hJNEd2TzN1ZEppUitpa2QydDR6dDRmeGQKZCs3bUJzOG9meUo4ZEFOL05IckJwNm5ucG1VQlZNb2lMbnlMN01oeFlJY3NSb3U0bW1ZUTgxOWNPZVVlQU1LVgp5Q1dBUmh4S050SktiR2prMnVjSmdZeTAxcjkzbnlqemhzeXRvaTcwbkNtMjhTUWhCalFqQlNZKzZ4ZUl3dGdzCk13YTBoY0tQNHdXUHJ2ZGFlQUcvTzJ1dHZBVlYyV1BvcFNDdGdLNzRWWEZXWkZEeEcwWDI2NkdCNnhCNDVob1MKOUpYYlRIMWh6L2l3cU0rQ2t6SnpDYm5zVlo5YldjcEh3V3VxbEM4YlhoaGNkd1BWUE54K05yUGNIb2Q5MWU4OQpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJUbmRyNmNUQmplakV3cTAvbTZuY3puckpCRjZqQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKMWZxQXNIZXlZSTNzbDNIMWg3NEJ1RXA2NXRjd0xyUFk0TDdjNzUxOXZYNTMrYjJ4YklrL09EWE9UUldFdHFUdgo3dGxObGZuL2NZejlBRW9OMDZVTStyMmxlY1AzVUxmUEdxRzBrc3BLREh1bGozUkVzYnZQQWNhbWJ4b0dPV1FSCnUzRGJhRlE1K2JSdFJLZUhNN0Izb296YmpvVVRTc2drem9Pd3V0bkVsMVlEeHc5RDRXbSs5ZWp5UnZjNHUzQUgKOVNQTjNmQkI1OTUweVViVXFLaWtSM0dFRk1SRGpuSldKeFVZdHhaZEs5N0Zmb1MwUEdncWhiNFZhbXlGMUJhVgp0dGpWdWY4YmhIOXJ5Ym5HeUhkc2wzejI3NWNTL0p4L3JVTDBwL2JhODJhMWRNTXpVYm5WYWJqTHJVckdIeXBECkd5Qk5QN3JZSzFheEd0OEFuOXVBcUE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
              url: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
            },
            version: '4.16.20',
            versionAvailableUpdates: [
              {
                channels: ['candidate-4.16', 'candidate-4.17', 'fast-4.16', 'fast-4.17'],
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:8d31e15cf82eac30e629190d5d8f542a7861451b032f2688d5f0c0e394ce29e9',
                url: 'https://access.redhat.com/errata/RHBA-2024:8986',
                version: '4.16.21',
              },
              {
                channels: ['candidate-4.16', 'candidate-4.17'],
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:a4a014415420ee4146717842fb104c248bbc4e56456774087b8723ed244c4b46',
                url: 'https://access.redhat.com/errata/RHSA-2024:9615',
                version: '4.16.23',
              },
              {
                channels: ['candidate-4.17', 'candidate-4.18', 'fast-4.17'],
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:e6487ca1e630152977392bbcf0ad1318217d539d2b641ad4ece92d6ba25444a3',
                url: 'https://access.redhat.com/errata/RHSA-2024:8981',
                version: '4.17.4',
              },
              {
                channels: ['candidate-4.17', 'candidate-4.18'],
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:529fbe37da40215883391ff99e13afcbfee31649f838292076c670b7bc127898',
                url: 'https://access.redhat.com/errata/RHSA-2024:9610',
                version: '4.17.5',
              },
            ],
            versionHistory: [
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:412cb889a50812978da822fb33801f6ce974df546a527739e3ec8c7dc5594a8b',
                state: 'Completed',
                verified: false,
                version: '4.15.33',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:1cd793ffcbdf5681324b6d425ea77887d449663430c572d75efb8ab9e9772136',
                state: 'Completed',
                verified: true,
                version: '4.15.34',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:0c786b9f68a48dc2759456430182ba8682aab5e9109a44f2fa85a995c7ea3eb7',
                state: 'Completed',
                verified: true,
                version: '4.15.35',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:16bb239b5d4f0d74132104efb32f021fb7e14157ee4ac90d66440702b4ea39a4',
                state: 'Completed',
                verified: true,
                version: '4.15.36',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:01089232c32886407806f3693bdb69e7f028bb70d5fe6fed0b3488664b7c9518',
                state: 'Completed',
                verified: true,
                version: '4.16.16',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:044310bcca3ad8c8f6c2c9e8130f7a25e1e8cb2bd77567d213d89b9ae7696709',
                state: 'Completed',
                verified: true,
                version: '4.16.17',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:c41b4d4e8d7c6cb28e39479c0965f61baeb3e80b02ac278e0115992877d5edc1',
                state: 'Completed',
                verified: true,
                version: '4.16.18',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:0f3964684f2852ee145081d65b89fd34c4aa79b1d279fda391ea96a20806c240',
                state: 'Completed',
                verified: true,
                version: '4.16.19',
              },
              {
                image:
                  'quay.io/openshift-release-dev/ocp-release@sha256:cce4ab8f53523c13c3b4f3549b85e512398aa40d202a55908de31a9b8bf6a2cb',
                state: 'Completed',
                verified: true,
                version: '4.16.20',
              },
            ],
          },
          displayVersion: 'OpenShift 4.16.20',
          isManagedOpenShift: false,
          upgradeInfo: {
            isUpgrading: false,
            isReadyUpdates: true,
            upgradePercentage: '',
            upgradeFailed: false,
            hooksInProgress: false,
            hookFailed: false,
            latestJob: {
              conditionMessage: '',
              step: 'prehook-ansiblejob',
            },
            currentVersion: '4.16.20',
            desiredVersion: '4.16.20',
            isReadySelectChannels: true,
            isSelectingChannel: false,
            isUpgradeCuration: false,
            currentChannel: 'candidate-4.17',
            desiredChannel: 'candidate-4.17',
            availableUpdates: ['4.16.21', '4.16.23', '4.17.4', '4.17.5'],
            availableChannels: [
              'candidate-4.16',
              'candidate-4.17',
              'eus-4.16',
              'fast-4.16',
              'fast-4.17',
              'stable-4.16',
            ],
            prehooks: {
              hasHooks: false,
              inProgress: false,
              success: false,
              failed: false,
            },
            posthooks: {
              hasHooks: false,
              inProgress: false,
              success: false,
              failed: false,
            },
            posthookDidNotRun: false,
          },
        },
        acmDistribution: {},
        microshiftDistribution: {},
        addons: {
          addonList: [
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:39:17Z',
                generation: 1,
                name: 'application-manager',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'application-manager',
                    uid: 'fe5f16fd-2cc3-4ea0-8fc5-4987436d1511',
                  },
                ],
                resourceVersion: '19701591',
                uid: '0f7f0d1b-cf75-4e5d-b9f7-d2344efb8bc4',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:40:08Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:17Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:41:00Z',
                    message: 'application-manager add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:08Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:08Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:35:08 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:08Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:application-manager',
                        'system:open-cluster-management:addon:application-manager',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:application-manager:agent:application-manager',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:39:17Z',
                generation: 1,
                name: 'cert-policy-controller',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'cert-policy-controller',
                    uid: 'b7e3733b-804c-4b15-9913-e64f1e98a1d3',
                  },
                ],
                resourceVersion: '19700264',
                uid: 'bfc8f32c-b47d-485f-b9d7-b689f6c831c9',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:39:18Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:29Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:28Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:28Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:34:28 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:29Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:00Z',
                    message: 'cert-policy-controller add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:cert-policy-controller',
                        'system:open-cluster-management:addon:cert-policy-controller',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:cert-policy-controller:agent:cert-policy-controller',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:42:39Z',
                generation: 1,
                name: 'cluster-proxy',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'cluster-proxy',
                    uid: '17e25283-e396-446c-80f5-7aef1a73a9ca',
                  },
                ],
                resourceVersion: '19704171',
                uid: 'e0b63a56-e66c-4ce8-8a7d-bec185c43bc1',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:42:41Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:40Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:37:40 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:41Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:43:00Z',
                    message: 'cluster-proxy add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                configReferences: [
                  {
                    desiredConfig: {
                      name: 'cluster-proxy',
                      specHash: 'bcc047be526305750d31e156f2830b534330996ea99cd2835ccfc9980395838f',
                    },
                    group: 'proxy.open-cluster-management.io',
                    lastAppliedConfig: {
                      name: 'cluster-proxy',
                      specHash: 'bcc047be526305750d31e156f2830b534330996ea99cd2835ccfc9980395838f',
                    },
                    lastObservedGeneration: 1,
                    name: 'cluster-proxy',
                    resource: 'managedproxyconfigurations',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: ['open-cluster-management:cluster-proxy'],
                      user: 'open-cluster-management:cluster-proxy:addon-agent',
                    },
                  },
                  {
                    signerName: 'open-cluster-management.io/proxy-agent-signer',
                    subject: {
                      groups: ['open-cluster-management:cluster-proxy'],
                      organizationUnit: [
                        'signer-6b4d57397755587256586330767a584d6633684d724f316263786237374a6959344b6255542b4e4a5637673d',
                      ],
                      user: 'open-cluster-management:cluster-proxy:proxy-agent',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'proxy.open-cluster-management.io',
                    resource: 'managedproxyconfigurations',
                  },
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:39:17Z',
                finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
                generation: 1,
                name: 'config-policy-controller',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'config-policy-controller',
                    uid: 'faf30964-83cb-4129-8f03-4a78c9e8bd8d',
                  },
                ],
                resourceVersion: '19700273',
                uid: 'a751b14d-1d1d-4be2-b04c-81a1e0723f19',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:39:17Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:30Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:28Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:29Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:34:28 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:30Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:01Z',
                    message: 'config-policy-controller add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:config-policy-controller',
                        'system:open-cluster-management:addon:config-policy-controller',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:config-policy-controller:agent:config-policy-controller',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:39:17Z',
                generation: 1,
                name: 'governance-policy-framework',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'governance-policy-framework',
                    uid: '714f85c8-3779-4b3a-a04f-5b4211f802d2',
                  },
                ],
                resourceVersion: '19700266',
                uid: '5f26848c-4d31-41f0-81f1-41d73c75a1d9',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:39:18Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:31Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:29Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:29Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:34:29 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:30Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:40:00Z',
                    message: 'governance-policy-framework add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:governance-policy-framework',
                        'system:open-cluster-management:addon:governance-policy-framework',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:governance-policy-framework:agent:governance-policy-framework',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:42:39Z',
                generation: 1,
                name: 'managed-serviceaccount',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'managed-serviceaccount',
                    uid: '98a8a151-d72d-41d6-9f74-66d2c9898440',
                  },
                ],
                resourceVersion: '20068041',
                uid: 'b828352f-6636-4053-9b2d-1349c3c0e2c5',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:42Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:40Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:40Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:37:40 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:41Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:43:02Z',
                    message: 'managed-serviceaccount add-on is available.',
                    reason: 'ProbeAvailable',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                configReferences: [
                  {
                    desiredConfig: {
                      name: 'managed-serviceaccount-2.8',
                      specHash: 'a3eb3dcdd45b539fc4fbd21b5cf6ab7383ec74327ed4e6046005183bf72a35e7',
                    },
                    group: 'addon.open-cluster-management.io',
                    lastAppliedConfig: {
                      name: 'managed-serviceaccount-2.8',
                      specHash: 'a3eb3dcdd45b539fc4fbd21b5cf6ab7383ec74327ed4e6046005183bf72a35e7',
                    },
                    lastObservedGeneration: 1,
                    name: 'managed-serviceaccount-2.8',
                    resource: 'addontemplates',
                  },
                ],
                healthCheck: {
                  mode: 'Customized',
                },
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:managed-serviceaccount',
                        'system:open-cluster-management:addon:managed-serviceaccount',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:managed-serviceaccount:agent:managed-serviceaccount-agent',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addontemplates',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                creationTimestamp: '2024-11-14T18:42:39Z',
                generation: 1,
                name: 'work-manager',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'work-manager',
                    uid: '22f73361-bad2-417c-abe9-953da3fccaaa',
                  },
                ],
                resourceVersion: '19704173',
                uid: '2a5f0036-8fb7-4244-8eb2-54cf191451a3',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:40Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:39Z',
                    message:
                      'client certificate rotated starting from 2024-11-14 18:37:39 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:42:40Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:43:00Z',
                    message: 'work-manager add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:work-manager',
                        'system:open-cluster-management:addon:work-manager',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:work-manager:agent:work-manager',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
            {
              apiVersion: 'addon.open-cluster-management.io/v1alpha1',
              kind: 'ManagedClusterAddOn',
              metadata: {
                annotations: {
                  'installer.multicluster.openshift.io/release-version': '2.8.0',
                },
                creationTimestamp: '2024-11-14T18:38:16Z',
                finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
                generation: 1,
                labels: {
                  'backplaneconfig.name': 'multiclusterengine',
                },
                name: 'hypershift-addon',
                namespace: 'local-cluster',
                ownerReferences: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'ClusterManagementAddOn',
                    name: 'hypershift-addon',
                    uid: '637e9059-7f02-4265-a9a8-f68f3005978c',
                  },
                ],
                resourceVersion: '20134558',
                uid: '653398d7-3d49-433d-996d-e46f467e79dc',
              },
              spec: {
                installNamespace: 'open-cluster-management-agent-addon',
              },
              status: {
                addOnConfiguration: {},
                addOnMeta: {},
                conditions: [
                  {
                    lastTransitionTime: '2024-11-14T18:38:16Z',
                    message: 'Configurations configured',
                    reason: 'ConfigurationsConfigured',
                    status: 'True',
                    type: 'Configured',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:38:16Z',
                    message: 'completed with no errors.',
                    reason: 'Completed',
                    status: 'False',
                    type: 'Progressing',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:38:16Z',
                    message: 'Registration of the addon agent is configured',
                    reason: 'SetPermissionApplied',
                    status: 'True',
                    type: 'RegistrationApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:38:22Z',
                    message:
                      'client certificate rotated starting from 2024-11-17 20:00:56 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                    reason: 'ClientCertificateUpdated',
                    status: 'True',
                    type: 'ClusterCertificateRotated',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:38:23Z',
                    message: 'manifests of addon are applied successfully',
                    reason: 'AddonManifestApplied',
                    status: 'True',
                    type: 'ManifestApplied',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:38:30Z',
                    message: 'OperatorNotFound',
                    reason: 'HypershiftDeployed',
                    status: 'True',
                    type: 'Degraded',
                  },
                  {
                    lastTransitionTime: '2024-11-14T18:39:00Z',
                    message: 'hypershift-addon add-on is available.',
                    reason: 'ManagedClusterAddOnLeaseUpdated',
                    status: 'True',
                    type: 'Available',
                  },
                ],
                configReferences: [
                  {
                    desiredConfig: {
                      name: 'hypershift-addon-deploy-config',
                      namespace: 'multicluster-engine',
                      specHash: '673989f990db2503cf3115ec915ac4d02b1182f6bfaf6350d861ae30d10d0489',
                    },
                    group: 'addon.open-cluster-management.io',
                    lastAppliedConfig: {
                      name: 'hypershift-addon-deploy-config',
                      namespace: 'multicluster-engine',
                      specHash: '673989f990db2503cf3115ec915ac4d02b1182f6bfaf6350d861ae30d10d0489',
                    },
                    lastObservedGeneration: 1,
                    name: 'hypershift-addon-deploy-config',
                    namespace: 'multicluster-engine',
                    resource: 'addondeploymentconfigs',
                  },
                ],
                healthCheck: {
                  mode: 'Lease',
                },
                namespace: 'open-cluster-management-agent-addon',
                registrations: [
                  {
                    signerName: 'kubernetes.io/kube-apiserver-client',
                    subject: {
                      groups: [
                        'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon',
                        'system:open-cluster-management:addon:hypershift-addon',
                        'system:authenticated',
                      ],
                      user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:6pb6g',
                    },
                  },
                ],
                supportedConfigs: [
                  {
                    group: 'addon.open-cluster-management.io',
                    resource: 'addondeploymentconfigs',
                  },
                ],
              },
            },
          ],
          available: 7,
          progressing: 0,
          degraded: 1,
          unknown: 0,
        },
        labels: {
          cloud: 'Amazon',
          'cluster.open-cluster-management.io/clusterset': 'default',
          clusterID: '352d46c7-8d43-418a-8e9b-505437a1a330',
          'feature.open-cluster-management.io/addon-application-manager': 'available',
          'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
          'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
          'feature.open-cluster-management.io/addon-managed-serviceaccount': 'available',
          'feature.open-cluster-management.io/addon-work-manager': 'available',
          'local-cluster': 'true',
          name: 'local-cluster',
          openshiftVersion: '4.16.20',
          'openshiftVersion-major': '4',
          'openshiftVersion-major-minor': '4.16',
          'velero.io/exclude-from-backup': 'true',
          vendor: 'OpenShift',
        },
        nodes: {
          nodeList: [
            {
              capacity: {
                cpu: '4',
                memory: '16073904Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
                'node-role.kubernetes.io/control-plane': '',
                'node-role.kubernetes.io/master': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2b',
              },
              name: 'ip-10-0-34-43.us-east-2.compute.internal',
            },
            {
              capacity: {
                cpu: '4',
                memory: '16073908Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                'node-role.kubernetes.io/control-plane': '',
                'node-role.kubernetes.io/master': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2a',
              },
              name: 'ip-10-0-4-156.us-east-2.compute.internal',
            },
            {
              capacity: {
                cpu: '4',
                memory: '16073896Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2b',
              },
              name: 'ip-10-0-60-179.us-east-2.compute.internal',
            },
            {
              capacity: {
                cpu: '4',
                memory: '16073908Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2a',
              },
              name: 'ip-10-0-9-190.us-east-2.compute.internal',
            },
            {
              capacity: {
                cpu: '4',
                memory: '15901872Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
                'node-role.kubernetes.io/control-plane': '',
                'node-role.kubernetes.io/master': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2c',
              },
              name: 'ip-10-0-94-201.us-east-2.compute.internal',
            },
            {
              capacity: {
                cpu: '4',
                memory: '16073908Ki',
                socket: '1',
              },
              conditions: [
                {
                  status: 'True',
                  type: 'Ready',
                },
              ],
              labels: {
                'beta.kubernetes.io/instance-type': 'm5.xlarge',
                'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm5.xlarge',
                'topology.kubernetes.io/region': 'us-east-2',
                'topology.kubernetes.io/zone': 'us-east-2c',
              },
              name: 'ip-10-0-94-60.us-east-2.compute.internal',
            },
          ],
          ready: 6,
          unhealthy: 0,
          unknown: 0,
        },
        kubeApiServer: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
        consoleURL: 'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
        isHive: false,
        isHypershift: false,
        isManaged: true,
        isCurator: false,
        hasAutomationTemplate: false,
        isHostedCluster: false,
        isSNOCluster: false,
        isRegionalHubCluster: false,
        hive: {
          isHibernatable: false,
          secrets: {},
        },
        clusterSet: 'default',
        owner: {},
        creationTimestamp: '2024-11-14T18:38:14Z',
      },
    ],
    sortedClusterNames: ['local-cluster'],
    appClusters: [],
    searchClusters: [
      {
        HubAcceptedManagedCluster: 'True',
        ManagedClusterConditionAvailable: 'True',
        ManagedClusterConditionClockSynced: 'True',
        ManagedClusterImportSucceeded: 'True',
        ManagedClusterJoined: 'True',
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/0784b94b-ddb6-4234-bc1b-d07d641d7a0c'],
        _uid: 'cluster__local-cluster',
        addon:
          'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
        apiEndpoint: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
        apigroup: 'internal.open-cluster-management.io',
        cluster: 'local-cluster',
        consoleURL: 'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
        cpu: '24',
        created: '2024-11-14T18:38:14Z',
        kind: 'Cluster',
        kind_plural: 'managedclusterinfos',
        kubernetesVersion: 'v1.29.9+5865c5b',
        label:
          'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=352d46c7-8d43-418a-8e9b-505437a1a330; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.16.20; openshiftVersion-major=4; openshiftVersion-major-minor=4.16; velero.io/exclude-from-backup=true; vendor=OpenShift',
        memory: '96271396Ki',
        name: 'local-cluster',
        nodes: '6',
      },
    ],
  },
}

export const appSetDesignFalse: TopologyNodeWithStatus = {
  id: 'member--applicationset--default--appSet1',
  name: 'appSet2',
  namespace: 'default',
  specs: {
    design: false,
    applicationsetModel: [],
  },
  type: 'applicationset',
}

export const subscriptionInputNotPlaced: TopologyNodeWithStatus = {
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

export const genericNodeInputRed: TopologyNodeWithStatus = {
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

export const genericNodeInputRed2: TopologyNodeWithStatus = {
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

export const deploymentNodeYellow: TopologyNodeWithStatus = {
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

export const deploymentNodeRed: TopologyNodeWithStatus = {
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

export const deploymentNodeYellow4: TopologyNodeWithStatus = {
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

export const deploymentNodeYellow2: TopologyNodeWithStatus = {
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

export const deploymentNodeNoPODS: TopologyNodeWithStatus = {
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
        href: "/multicloud/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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

export const deploymentNodeNoPODSNoRes: TopologyNodeWithStatus = {
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
        href: "/multicloud/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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

export const deploymentNodeRed3: TopologyNodeWithStatus = {
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
        href: "/multicloud/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
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

export const deploymentNodeNoPodModel: TopologyNodeWithStatus = {
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

export const genericNodeYellow: TopologyNodeWithStatus = {
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

export const packageNodeOrange: TopologyNodeWithStatus = {
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

export const ruleNodeRed: TopologyNodeWithStatus = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'placements',
  specs: {},
}

export const ruleNodeGreen2: TopologyNodeWithStatus = {
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

export const appNoChannelRed: TopologyNodeWithStatus = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'application',
  specs: {
    isDesign: true,
  },
}

export const appNoChannelGreen: TopologyNodeWithStatus = {
  name: 'mortgage-app-deploy',
  cluster: null,
  clusterName: null,
  type: 'application',
  specs: {
    isDesign: true,
    channels: ['aaa'],
  },
}

export const podCrash: ResourceItemWithStatus = {
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
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
export const ansibleSuccess: TopologyNodeWithStatus = {
  type: 'ansiblejob',
  name: 'bigjoblaunch',
  namespace: 'default',
  id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
  specs: {
    clustersNames: ['local-cluster'],
    searchClusters: ['local-cluster'],
    raw: {
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
          namespace: 'default',
          cluster: 'local-cluster',
        },
      ],
    },
  },
}
export const ansibleError: TopologyNodeWithStatus = {
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
      'bigjoblaunch-local-cluster': {
        label: 'tower_job_id=999999999',
      },
    },
  },
}
export const ansibleError2: TopologyNodeWithStatus = {
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
      spec: {
        conditions: [
          {
            ansibleResult: {
              failures: 0,
            },
            message: 'Awaiting next reconciliation',
            reason: 'Failed',
          },
        ],
        k8sJob: {
          message: 'some message',
        },
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

export const ansibleErrorAllClusters: TopologyNodeWithStatus = {
  type: 'ansiblejob',
  name: 'bigjoblaunch',
  namespace: 'default',
  id: 'member--member--deployable--member--clusters--fxiang-eks,local-cluster,ui-remote--vb-ansible-2--prehook-test-1-c0b22a--ansiblejob--prehook-test-1-c0b22a',
  specs: {
    clustersNames: ['local-cluster', 'ui-remote', 'fxiang-eks'],
    searchClusters: ['local-cluster'],
    raw: {
      hookType: 'pre-hook',
      metadata: {
        name: 'bigjoblaunch',
        namespace: 'default',
      },
      spec: {
        conditions: [
          {
            ansibleResult: {
              failures: 0,
            },
            message: 'Awaiting next reconciliation',
            reason: 'Failed',
          },
        ],
        k8sJob: {
          message: 'some message',
        },
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

export const serverProps: Record<string, any> = {
  context: {
    locale: 'en-US',
  },
  xsrfToken: 'test',
}

export const selectedApp: Record<string, any> = {
  isSingleApplicationView: true,
  selectedAppName: 'mortgage-app',
  selectedAppNamespace: 'default',
}

export const resourceType: Record<string, string> = {
  name: 'QueryApplications',
  list: 'QueryApplicationList',
}

export const appNormalizedItems: Record<string, any> = {
  items: [
    'mortgage-app-default',
    'samplebook-gbapp-sample',
    'stocktrader-app-stock-trader',
    'subscribed-guestbook-application-kube-system',
  ],
  totalResults: 4,
  totalPages: 1,
  normalizedItems: {
    'mortgage-app-default': {
      _uid: 'local-cluster/5cd1d4c7-52aa-11ea-bf05-00000a102d26',
      name: 'mortgage-app',
      namespace: 'default',
      cluster: 'local-cluster',
      dashboard:
        'https://localhost:443/grafana/dashboard/db/mortgage-app-dashboard-via-federated-prometheus?namespace=default',
      clusterCount: { remoteCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
          status: 'Propagated',
          channel: 'default/mortgage-channel',
          __typename: 'Subscription',
        },
      ],
      created: '2018-02-18T23:57:04Z',
      __typename: 'Application',
    },
    'samplebook-gbapp-sample': {
      _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
      name: 'samplebook-gbapp',
      namespace: 'sample',
      dashboard:
        'https://localhost:443/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
      clusterCount: { remoteCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/42d9ec27-52b9-11ea-bf05-00000a102d26',
          status: 'Propagated',
          channel: 'gbook-ch/guestbook',
          __typename: 'Subscription',
        },
      ],
      created: '2018-02-19T01:43:43Z',
      __typename: 'Application',
    },
    'stocktrader-app-stock-trader': {
      _uid: 'local-cluster/8f4799db-4cf4-11ea-a229-00000a102d26',
      name: 'stocktrader-app',
      namespace: 'stock-trader',
      dashboard: null,
      clusterCount: { remoteCount: 0, localCount: 0 },
      hubSubscriptions: [],
      created: '2019-02-11T17:33:04Z',
      __typename: 'Application',
    },
    'subscribed-guestbook-application-kube-system': {
      _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a102d26',
      name: 'subscribed-guestbook-application',
      namespace: 'kube-system',
      dashboard: null,
      clusterCount: { remoteCount: 2, localCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26',
          status: 'Propagated',
          channel: 'default/hub-local-helm-repo',
          __typename: 'Subscription',
        },
      ],
      created: '2019-02-11T23:26:18Z',
      __typename: 'Application',
    },
  },
}
export const QueryApplicationList: Record<string, any> = {
  status: 'DONE',
  page: 1,
  search: 'mortgage',
  sortDirection: 'asc',
  sortColumn: 1,
  mutateStatus: 'DONE',
  deleteStatus: 'DONE',
  responseTime: 1530518207007 - 15000,
  deleteMsg: 'app123',
  items: [
    {
      _uid: 'local-cluster/96218695-3798-4dac-b3d3-179fb86b6715',
      name: 'mortgage-app',
      namespace: 'default',
      cluster: 'local-cluster',
      dashboard:
        'https://localhost:443/grafana/dashboard/db/mortgage-app-dashboard-via-federated-prometheus?namespace=default',
      clusterCount: { remoteCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
          status: 'Propagated',
          channel: 'default/mortgage-channel',
          __typename: 'Subscription',
        },
      ],
      created: '2018-02-18T23:57:04Z',
      __typename: 'Application',
    },
    {
      _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
      name: 'samplebook-gbapp',
      namespace: 'sample',
      dashboard:
        'https://localhost:443/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
      clusterCount: { remoteCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
          status: 'Propagated',
          channel: 'gbook-ch/guestbook',
          __typename: 'Subscription',
        },
      ],
      created: '2018-02-19T01:43:43Z',
      __typename: 'Application',
    },
    {
      _uid: 'local-cluster/8f4799db-4cf4-11ea-a229-00000a102d26',
      name: 'stocktrader-app',
      namespace: 'stock-trader',
      dashboard: null,
      clusterCount: { remoteCount: 0, localCount: 0 },
      hubSubscriptions: [],
      created: '2019-02-11T17:33:04Z',
      __typename: 'Application',
    },
    {
      _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a102d26',
      name: 'subscribed-guestbook-application',
      namespace: 'kube-system',
      dashboard: null,
      clusterCount: { remoteCount: 2, localCount: 1 },
      hubSubscriptions: [
        {
          _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
          status: 'Propagated',
          channel: 'default/hub-local-helm-repo',
          __typename: 'Subscription',
        },
      ],
      created: '2019-02-11T23:26:18Z',
      __typename: 'Application',
    },
    {
      _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a100',
      name: 'app-no-channel',
      namespace: 'default',
      dashboard: null,
      clusterCount: { remoteCount: 0, localCount: 0 },
      created: '2019-02-11T23:26:18Z',
      __typename: 'Application',
      hubSubscriptions: [],
    },
  ],
}

export const QuerySubscriptionList: Record<string, any> = {
  status: 'DONE',
  page: 1,
  search: 'aa',
  sortDirection: 'asc',
  sortColumn: 1,
  mutateStatus: 'DONE',
  deleteStatus: 'DONE',
  deleteMsg: 'app123',
  items: [
    {
      _uid: 'local-cluster/91bc6cd2-eb00-4104-9f2a-a53fa32ef72e',
      name: 'ansible-hook',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/subscriptions/ansible-hook',
      namespace: 'ansible',
      appCount: 1,
      clusterCount: { localCount: 0, remoteCount: 0 },
      localPlacement: false,
      timeWindow: null,
      status: 'Propagated',
      channel: 'ansible/git',
      created: '2019-09-24T21:06:23Z',
      __typename: 'Subscription',
    },
    {
      _uid: 'local-cluster/7bfcf0d6-9ecf-4910-89e3-93dc904c7745',
      name: 'app123-subscription-0',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/subscriptions/app123-subscription-0',
      namespace: 'ansible',
      appCount: 1,
      clusterCount: { localCount: 0, remoteCount: 2 },
      localPlacement: false,
      timeWindow: null,
      status: 'Propagated',
      channel: 'val-test-create-resource-ns-0/val-test-create-resource-0',
      created: '2019-09-28T20:03:59Z',
      __typename: 'Subscription',
    },
    {
      _uid: 'local-cluster/8c115e07-3440-4152-bb72-25909b470537',
      name: 'app123-subscription-0',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/subscriptions/app123-subscription-0',
      namespace: 'ns-sub-1',
      appCount: 0,
      clusterCount: { localCount: 0, remoteCount: 2 },
      localPlacement: false,
      timeWindow: null,
      status: 'Propagated',
      channel: 'val-test-create-resource-ns-0/val-test-create-resource-0',
      created: '2019-09-28T16:31:51Z',
      __typename: 'Subscription',
    },
    {
      _uid: 'local-cluster/4808d505-1edf-478a-bc96-dd1621ccc810',
      name: 'application-chart-sub',
      selfLink:
        '/apis/apps.open-cluster-management.io/v1/namespaces/open-cluster-management/subscriptions/application-chart-sub',
      namespace: 'open-cluster-management',
      appCount: 0,
      clusterCount: { localCount: 1, remoteCount: 0 },
      localPlacement: true,
      timeWindow: null,
      status: 'Subscribed',
      channel: 'open-cluster-management/charts-v1',
      created: '2019-09-24T02:11:39Z',
      __typename: 'Subscription',
    },
  ],
}

export const QueryPlacementRuleList: Record<string, any> = {
  status: 'DONE',
  page: 1,
  search: 'aa',
  sortDirection: 'asc',
  sortColumn: 1,
  mutateStatus: 'DONE',
  deleteStatus: 'DONE',
  deleteMsg: 'app123',
  items: [
    {
      _uid: 'local-cluster/29bd08d9-c33f-4bd1-a820-f399020f66d5',
      name: 'app123-placement-0',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/placementrules/app123-placement-0',
      namespace: 'ansible',
      clusterCount: { localCount: 0, remoteCount: 2 },
      replicas: null,
      created: '2019-09-28T20:03:59Z',
      __typename: 'PlacementRule',
    },
    {
      _uid: 'local-cluster/6c133c4c-749d-4649-8208-442f07309649',
      name: 'app123-placement-0',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/app123-placement-0',
      namespace: 'ns-sub-1',
      clusterCount: { localCount: 0, remoteCount: 2 },
      replicas: null,
      created: '2019-09-28T16:31:51Z',
      __typename: 'PlacementRule',
    },
    {
      _uid: 'local-cluster/e10c41ac-3d0f-43f9-8187-ea864b0fcdbf',
      name: 'cassandra-app-placement',
      selfLink:
        '/apis/apps.open-cluster-management.io/v1/namespaces/cassandra-app-ns/placementrules/cassandra-app-placement',
      namespace: 'cassandra-app-ns',
      clusterCount: { localCount: 0, remoteCount: 2 },
      replicas: 2,
      created: '2019-09-24T21:34:33Z',
      __typename: 'PlacementRule',
    },
    {
      _uid: 'local-cluster/31cc3d22-18ce-43c9-9b47-056a0a16e1b1',
      name: 'demo-saude-digital',
      selfLink:
        '/apis/apps.open-cluster-management.io/v1/namespaces/demo-saude-digital/placementrules/demo-saude-digital',
      namespace: 'demo-saude-digital',
      clusterCount: { localCount: 0, remoteCount: 2 },
      replicas: 2,
      created: '2019-09-24T21:34:35Z',
      __typename: 'PlacementRule',
    },
  ],
}

export const QueryChannelList: Record<string, any> = {
  status: 'DONE',
  page: 1,
  search: 'aa',
  sortDirection: 'asc',
  sortColumn: 1,
  mutateStatus: 'DONE',
  deleteStatus: 'DONE',
  responseTime: 1530518207007 - 15000,
  deleteMsg: 'app123',
  items: [
    {
      _uid: 'local-cluster/9891b8d3-8d2f-4533-bf07-26e1b918fb55',
      name: 'cassandra-channel',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/cassandra-ch/channels/cassandra-channel',
      namespace: 'cassandra-ch',
      subscriptionCount: 1,
      clusterCount: { localCount: 0, remoteCount: 2 },
      type: 'GitHub',
      pathname: 'https://github.com/kubernetes/examples.git',
      localPlacement: false,
      created: '2019-09-24T21:34:33Z',
      __typename: 'Channel',
    },
    {
      _uid: 'local-cluster/41828117-d4e1-44c9-b3b3-ce0e628b1c6d',
      name: 'charts-v1',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/open-cluster-management/channels/charts-v1',
      namespace: 'open-cluster-management',
      subscriptionCount: 11,
      clusterCount: { localCount: 1, remoteCount: 0 },
      type: 'HelmRepo',
      pathname: 'http://multiclusterhub-repo.open-cluster-management.svc.cluster.local:3000/charts',
      localPlacement: true,
      created: '2019-09-24T02:11:07Z',
      __typename: 'Channel',
    },
    {
      _uid: 'local-cluster/d47103af-8717-4b55-864c-78365b160e3d',
      name: 'gbchn',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/gbchn/channels/gbchn',
      namespace: 'gbchn',
      subscriptionCount: 1,
      clusterCount: { localCount: 0, remoteCount: 2 },
      type: 'Namespace',
      pathname: 'gbchn',
      localPlacement: false,
      created: '2019-09-24T21:34:36Z',
      __typename: 'Channel',
    },
    {
      _uid: 'local-cluster/e3a1dc76-0864-4c97-929b-c01a0477a83b',
      name: 'git',
      selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/channels/git',
      namespace: 'ansible',
      subscriptionCount: 1,
      clusterCount: { localCount: 0, remoteCount: 0 },
      type: 'git',
      pathname: 'https://github.com/ianzhang366/acm-applifecycle-samples.git',
      localPlacement: false,
      created: '2019-09-24T19:26:11Z',
      __typename: 'Channel',
    },
  ],
}

export const QueryApplicationList_INCEPTION: Record<string, any> = {
  status: 'INCEPTION',
  page: 1,
  search: 'aa',
  sortDirection: 'asc',
  sortColumn: 1,
  items: [],
}
export const HCMChannelList: Record<string, any> = {
  status: 'DONE',
  items: [
    {
      kind: 'channel',
      name: 'mortgage-channel',
      namespace: 'default',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/mortgage-channel',
      created: '2019-02-18T23:56:15Z',
      cluster: 'local-cluster',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'default_app.ibm.com_channels',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
      pathname: 'default',
      label: 'app=mortgage-channel-mortgage; chart=mortgage-channel-1.0.0; heritage=Tiller; release=mortgage-channel',
      type: 'Namespace',
      data: {},
      related: [
        {
          kind: 'subscription',
          items: [
            {
              kind: 'subscription',
              name: 'mortgage-app-subscription',
              namespace: 'default',
              status: 'Propagated',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              channel: 'default/mortgage-channel',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_subscriptions',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
              packageFilterVersion: '>=1.x',
              label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
            },
            {
              kind: 'subscription',
              name: 'orphan',
              namespace: 'default',
              status: 'Propagated',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              channel: 'default/mortgage-channel',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_subscriptions',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26orphan',
              packageFilterVersion: '>=1.x',
              label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
            },
          ],
          __typename: 'SearchRelatedResult',
        },
      ],
    },
    {
      kind: 'channel',
      name: 'hub-local-helm-repo',
      namespace: 'default',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/hub-local-helm-repo',
      created: '2019-02-19T01:38:29Z',
      cluster: 'local-cluster',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'default_app.ibm.com_channels',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/87f95c96-52b8-11ea-bf05-00000a102d26',
      pathname: 'https://localhost:8443/helm-repo/charts',
      type: 'HelmRepo',
      related: [
        {
          kind: 'subscription',
          items: [
            {
              kind: 'subscription',
              name: 'guestbook-subscription',
              namespace: 'kube-system',
              status: 'Propagated',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/subscriptions/guestbook-subscription',
              created: '2019-02-19T01:38:58Z',
              cluster: 'local-cluster',
              channel: 'default/hub-local-helm-repo',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'kube-system_app.ibm.com_subscriptions',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26',
              package: 'gbapp',
              packageFilterVersion: '0.1.0',
              label: 'app=subscribed-guestbook-application',
            },
          ],
          __typename: 'SearchRelatedResult',
        },
      ],
    },
    {
      kind: 'channel',
      name: 'guestbook',
      namespace: 'gbook-ch',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/gbook-ch/channels/guestbook',
      created: '2019-02-19T01:43:38Z',
      cluster: 'local-cluster',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'gbook-ch_app.ibm.com_channels',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/4019f8d8-52b9-11ea-bf05-00000a102d26',
      pathname: 'gbook-ch',
      label: 'app=gbchn; chart=gbchn-0.1.0; heritage=Tiller; release=guestbook',
      type: 'Namespace',
      related: [
        {
          kind: 'subscription',
          items: [
            {
              kind: 'subscription',
              name: 'samplebook-gbapp-guestbook',
              namespace: 'sample',
              status: 'Propagated',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/sample/subscriptions/samplebook-gbapp-guestbook',
              created: '2018-02-19T01:43:43Z',
              cluster: 'local-cluster',
              channel: 'gbook-ch/guestbook',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'sample_app.ibm.com_subscriptions',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/42d9ec27-52b9-11ea-bf05-00000a102d26',
              label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
            },
          ],
        },
      ],
    },
  ],
}

export const HCMChannelListEmpty: Record<string, any> = {
  status: 'DONE',
  items: [],
}

export const HCMApplication: Record<string, any> = {
  name: 'samplebook-gbapp',
  namespace: 'sample',
  dashboard: 'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
  selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
  _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
  created: '2018-02-19T01:43:43Z',
  apigroup: 'app.k8s.io',
  cluster: 'local-cluster',
  kind: 'application',
  label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
  _hubClusterResource: 'true',
  _rbac: 'sample_app.k8s.io_applications',
}

export const HCMChannel: Record<string, any> = {
  name: 'samplebook-gbapp',
  namespace: 'sample',
  dashboard: 'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
  selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
  _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
  created: '2018-02-19T01:43:43Z',
  apigroup: 'app.k8s.io',
  cluster: 'local-cluster',
  kind: 'channel',
  label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
  _hubClusterResource: 'true',
  _rbac: 'sample_app.k8s.io_applications',
}

export const HCMApplicationList: Record<string, any> = {
  forceReload: false,
  items: [
    {
      apigroup: 'app.k8s.io',
      cluster: 'local-cluster',
      created: '2018-08-13T19:23:00Z',
      dashboard: '',
      kind: 'application',
      label: '',
      name: 'mortgage-app',
      namespace: 'default',
      related: [
        {
          items: [
            {
              kind: 'cluster',
              kubernetesVersion: '',
              name: 'local-cluster',
              status: 'OK',
            },
          ],
          kind: 'cluster',
          __typename: 'SearchRelatedResult',
        },
        {
          items: [
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              channel: 'mortgage-ch/mortgage-channel',
              cluster: 'kcormier-cluster',
              created: '2019-09-18T21:20:00Z',
              kind: 'subscription',
              label:
                'app=mortgage-app-mortgage; hosting-deployable-name=mortgage-app-subscription-deployable; subscription-pause=false',
              localPlacement: 'true',
              name: 'mortgage-app-subscription',
              namespace: 'default',
              selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/default/subscriptions/mortgage-app-subscription',
              status: 'Failed',
              timeWindow: 'none',
              _clusterNamespace: 'kcormier-cluster',
              _gitbranch: 'main',
              _gitpath: 'mortgage',
              _hostingDeployable: 'kcormier-cluster/mortgage-app-subscription-deployable-w2qpd',
              _hostingSubscription: 'default/mortgage-app-subscription',
              _rbac: 'kcormier-cluster_apps.open-cluster-management.io_subscriptions',
              _uid: 'kcormier-cluster/727109c7-0742-44b2-bc19-37eccc63508b',
            },
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              channel: 'mortgage-ch/mortgage-channel',
              cluster: 'local-cluster',
              created: '2018-08-13T19:23:01Z',
              kind: 'subscription',
              label: 'app=mortgage-app-mortgage',
              name: 'mortgage-app-subscription',
              namespace: 'default',
              selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/default/subscriptions/mortgage-app-subscription',
              status: 'Propagated',
              timeWindow: 'active',
              _gitbranch: 'main',
              _gitpath: 'mortgage',
              _gitcommit: '0660bd66c02d09a4c8813d3ae2e711fc98b6426b',
              _hubClusterResource: 'true',
              _rbac: 'default_apps.open-cluster-management.io_subscriptions',
              _uid: 'local-cluster/e5a9d3e2-a5df-43de-900c-c15a2079f760',
            },
          ],
          kind: 'subscription',
          __typename: 'SearchRelatedResult',
        },
        {
          items: [
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2019-08-15T09:11:11Z',
              kind: 'deployable',
              label:
                'apps.open-cluster-management.io/channel-type=GitHub; apps.open-cluster-management.io/channel=mortgage-channel; apps.open-cluster-management.io/subscription=default-mortgage-app-subscription',
              name: 'mortgage-app-subscription-mortgage-mortgage-app-svc-service',
              namespace: 'default',
              selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/default/deployables/mortgage-app-subscription-mortgage-mortgage-app-svc-service',
              _hubClusterResource: 'true',
              _rbac: 'default_apps.open-cluster-management.io_deployables',
              _uid: 'local-cluster/96551002-3e14-41fc-ad28-3912b51dd958',
            },
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2019-08-15T09:11:11Z',
              kind: 'deployable',
              label:
                'apps.open-cluster-management.io/channel-type=GitHub; apps.open-cluster-management.io/channel=mortgage-channel; apps.open-cluster-management.io/subscription=default-mortgage-app-subscription',
              name: 'mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment',
              namespace: 'default',
              selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/default/deployables/mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment',
              _hubClusterResource: 'true',
              _rbac: 'default_apps.open-cluster-management.io_deployables',
              _uid: 'local-cluster/c2e1cc72-3ae9-4b4a-acaa-e87ca5247a73',
            },
          ],
          kind: 'deployable',
          __typename: 'SearchRelatedResult',
        },
        {
          items: [
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2018-08-13T19:23:00Z',
              kind: 'placementrule',
              label: 'app=mortgage-app-mortgage',
              name: 'mortgage-app-placement',
              namespace: 'default',
              selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/default/placementrules/mortgage-app-placement',
              _hubClusterResource: 'true',
              _rbac: 'default_apps.open-cluster-management.io_placementrules',
              _uid: 'local-cluster/0533baf0-e272-4db6-ae00-b99f1d4e2e1c',
            },
          ],
          kind: 'placementrule',
          __typename: 'SearchRelatedResult',
        },
        {
          items: [
            {
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2018-08-13T19:23:00Z',
              kind: 'channel',
              name: 'mortgage-channel',
              namespace: 'mortgage-ch',
              pathname: 'https://github.com/fxiang1/app-samples.git',
              selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/mortgage-ch/channels/mortgage-channel',
              type: 'GitHub',
              _hubClusterResource: 'true',
              _rbac: 'mortgage-ch_apps.open-cluster-management.io_channels',
              _uid: 'local-cluster/54bb2ff5-7545-49fa-9020-6ea14b47f346',
            },
          ],
          kind: 'channel',
          __typename: 'SearchRelatedResult',
        },
      ],
      selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
      _hubClusterResource: 'true',
      _rbac: 'default_app.k8s.io_applications',
      _uid: 'local-cluster/dc9499ab-d23f-4dac-ba9d-9232218a383f',
    },
  ],
  page: 1,
  pendingActions: [],
  postErrorMsg: '',
  putErrorMsg: '',
  resourceVersion: undefined,
  search: '',
  sortDirection: 'asc',
  responseTime: 1530518207007 - 15000,
  status: 'DONE',
}

export const HCMSubscriptionList: Record<string, any> = {
  status: 'DONE',
  items: [
    {
      kind: 'subscription',
      name: 'orphan',
      namespace: 'default',
      status: 'Propagated',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
      created: '2018-02-18T23:57:04Z',
      cluster: 'local-cluster',
      channel: 'default/mortgage-channel',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'default_app.ibm.com_subscriptions',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26orphan',
      packageFilterVersion: '>=1.x',
      label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
      related: [],
    },
    {
      kind: 'subscription',
      name: 'mortgage-app-subscription',
      namespace: 'default',
      status: 'Propagated',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
      created: '2018-02-18T23:57:04Z',
      cluster: 'local-cluster',
      channel: 'default/mortgage-channel',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'default_app.ibm.com_subscriptions',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
      packageFilterVersion: '>=1.x',
      label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
      related: [
        {
          kind: 'placementrule',
          items: [
            {
              kind: 'placementrule',
              name: 'guestbook-placementrule',
              namespace: 'kube-system',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/placementrules/guestbook-placementrule',
              created: '2019-02-11T23:26:17Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'kube-system_app.ibm.com_placementrules',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e72e6c06-4d25-11ea-a229-00000a102d26',
              label: 'app=subscribed-guestbook-application',
            },
          ],
          __typename: 'SearchRelatedResult',
        },
        {
          kind: 'application',
          items: [
            {
              kind: 'application',
              name: 'samplebook-gbapp',
              namespace: 'sample',
              dashboard:
                'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
              selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
              _uid: 'local-cluster/96218695-3798-4dac-b3d3-179fb86b6715',
              created: '2018-02-19T01:43:43Z',
              apigroup: 'app.k8s.io',
              cluster: 'local-cluster',
              label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
              _hubClusterResource: 'true',
              _rbac: 'sample_app.k8s.io_applications',
            },
          ],
        },
        {
          kind: 'deployable',
          items: [
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable2',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable3',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable4',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable5',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable6',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
            {
              kind: 'deployable',
              name: 'mortgage-app-subscription-deployable7',
              namespace: 'default',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
              created: '2018-02-18T23:57:04Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'default_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
            },
          ],
        },
      ],
    },
    {
      kind: 'subscription',
      name: 'guestbook-subscription',
      namespace: 'kube-system',
      status: 'Propagated',
      selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/subscriptions/guestbook-subscription',
      created: '2019-02-19T01:38:58Z',
      cluster: 'local-cluster',
      channel: 'default/hub-local-helm-repo',
      apigroup: 'app.ibm.com',
      apiversion: 'v1alpha1',
      _rbac: 'kube-system_app.ibm.com_subscriptions',
      _hubClusterResource: 'true',
      _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
      package: 'gbapp',
      packageFilterVersion: '0.1.0',
      label: 'app=subscribed-guestbook-application',
      related: [
        {
          kind: 'deployable',
          items: [
            {
              kind: 'deployable',
              name: 'guestbook-subscription-deployable',
              namespace: 'kube-system',
              status: 'Propagated',
              selfLink:
                '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/deployables/guestbook-subscription-deployable',
              created: '2019-02-19T01:38:58Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'kube-system_app.ibm.com_deployables',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/98df502a-52b8-11ea-bf05-00000a102d26',
            },
          ],
          __typename: 'SearchRelatedResult',
        },
        {
          kind: 'placementrule',
          items: [
            {
              kind: 'placementrule',
              name: 'guestbook-placementrule',
              namespace: 'kube-system',
              selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/placementrules/guestbook-placementrule',
              created: '2019-02-11T23:26:17Z',
              cluster: 'local-cluster',
              apigroup: 'app.ibm.com',
              apiversion: 'v1alpha1',
              _rbac: 'kube-system_app.ibm.com_placementrules',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/e72e6c06-4d25-11ea-a229-00000a102d26',
              label: 'app=subscribed-guestbook-application',
            },
          ],
          __typename: 'SearchRelatedResult',
        },
      ],
    },
  ],
}

export const HCMPlacementRuleList: Record<string, any> = {
  items: [],
  page: 1,
  search: '',
  sortDirection: 'asc',
  status: 'INCEPTION',
  putErrorMsg: '',
  postErrorMsg: '',
  pendingActions: [],
  forceReload: false,
}

export const topologyNoChannel: Record<string, any> = {
  activeFilters: {
    application: {
      channel: '__ALL__/__ALL__//__ALL__/__ALL__',
      name: 'mortgage-app',
      namespace: 'default',
    },
  },
  availableFilters: {
    clusters: [],
    labels: [],
    namespaces: [],
    types: [],
  },
  detailsLoaded: true,
  detailsReloading: false,
  diagramFilters: [],
  fetchFilters: {
    application: {
      channel: '__ALL__/__ALL__//__ALL__/__ALL__',
      name: 'mortgage-app',
      namespace: 'default',
    },
  },
  links: [
    {
      from: { uid: 'application--mortgage-app', __typename: 'Resource' },
      specs: { isDesign: true },
      to: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      specs: { isDesign: true },
      to: {
        uid: 'member--rules--default--mortgage-app-placement--0',
        __typename: 'Resource',
      },
      type: 'uses',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      specs: { isDesign: true },
      to: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxia…rtgage-app-svc-service--service--mortgage-app-svc',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
        __typename: 'Resource',
      },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
  ],
  loaded: true,
  nodes: [
    {
      cluster: null,
      clusterName: null,
      id: 'application--mortgage-app',
      labels: null,
      name: 'mortgage-app',
      namespace: 'default',
      specs: {
        allChannels: [],
        allClusters: {
          isLocal: false,
          remoteCount: 1,
        },
        allSubscriptions: [
          {
            kind: 'Subscription',
            metadata: {
              name: 'mortgage-app-subscription',
              namespace: 'default',
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-path': 'mortgage',
              },
            },
            spec: {
              channel: 'mortgage-ch/mortgage-channel',
              timewindow: {
                hours: [{ end: '09:10PM', start: '8:00AM' }],
                location: 'America/Toronto',
                daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                windowtype: 'active',
              },
            },
          },
        ],
        activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
        channels: ['default/mortgage-app-subscription//mortgage-ch/mortgage-channel'],
        isDesign: true,
        pulse: 'green',
        raw: {
          apiVersion: 'app.k8s.io/v1beta1',
          kind: 'Application',
          metadata: {
            creationTimestamp: '2018-08-13T19:23:00Z',
            generation: 2,
            name: 'mortgage-app',
            namespace: 'default',
            resourceVersion: '2349939',
            selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
            uid: 'dc9499ab-d23f-4dac-ba9d-9232218a383f',
          },
          spec: {
            componentKinds: [
              {
                group: 'apps.open-cluster-management.io',
                kind: 'Subscription',
              },
            ],
            descriptor: {},
            selector: {
              matchExpressions: [
                {
                  key: 'app',
                  operator: 'In',
                  values: ['mortgage-app-mortgage'],
                },
              ],
            },
          },
        },
        row: 0,
      },
      topology: null,
      type: 'application',
      uid: 'application--mortgage-app',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--subscription--default--mortgage-app-subscription',
      labels: null,
      name: 'mortgage-app-subscription',
      namespace: 'default',
      specs: {
        hasRules: true,
        isDesign: true,
        isPlaced: true,
        pulse: 'yellow',
        raw: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          channels: [],
          kind: 'Subscription',
          metadata: {
            annotations: {
              'apps.open-cluster-management.io/github-branch': 'main',
              'apps.open-cluster-management.io/github-path': 'mortgage',
            },
            creationTimestamp: '2018-08-13T19:23:01Z',
            generation: 2,
            name: 'mortgage-app-subscription',
          },
          spec: {
            channel: 'mortgage-ch/mortgage-channel',
            timewindow: {
              hours: [{ end: '09:10PM', start: '8:00AM' }],
              location: 'America/Toronto',
              daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
              windowtype: 'active',
            },
          },
          status: {
            lastUpdateTime: '2019-08-15T09:11:11Z',
            phase: 'Propagated',
          },
        },
        row: 18,
      },
      topology: null,
      type: 'subscription',
      uid: 'member--subscription--default--mortgage-app-subscription',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--rules--default--mortgage-app-placement--0',
      labels: null,
      name: 'mortgage-app-placement',
      namespace: 'default',
      specs: {
        isDesign: true,
        pulse: 'green',
        raw: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          kind: 'PlacementRule',
        },
        row: 34,
      },
      topology: null,
      type: 'placements',
      uid: 'member--rules--default--mortgage-app-placement--0',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--clusters--fxiang',
      labels: null,
      name: 'fxiang',
      namespace: '',
      specs: {
        cluster: {
          allocatable: { cpu: '33', memory: '137847Mi' },
          capacity: { cpu: '36', memory: '144591Mi' },
          consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
          metadata: {
            creationTimestamp: '2019-08-13T18:17:34Z',
            finalizers: Array(5),
            generation: 1,
            name: 'fxiang',
          },
          rawCluster: {
            apiVersion: 'cluster.open-cluster-management.io/v1',
            kind: 'ManagedCluster',
          },
          rawStatus: {
            apiVersion: 'internal.open-cluster-management.io/v1beta1',
            kind: 'ManagedClusterInfo',
          },
          status: 'ok',
        },
        clusterNames: ['fxiang'],
        clusters: [
          {
            allocatable: { cpu: '33', memory: '137847Mi' },
            capacity: { cpu: '36', memory: '144591Mi' },
            consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
            metadata: {
              creationTimestamp: '2019-08-13T18:17:34Z',
              finalizers: Array(5),
              generation: 1,
              name: 'fxiang',
            },
            rawCluster: {
              apiVersion: 'cluster.open-cluster-management.io/v1',
              kind: 'ManagedCluster',
            },
            rawStatus: {
              apiVersion: 'internal.open-cluster-management.io/v1beta1',
              kind: 'ManagedClusterInfo',
            },
            status: 'ok',
          },
        ],
        pulse: 'orange',
      },
      topology: null,
      type: 'cluster',
      uid: 'member--clusters--fxiang',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
      labels: null,
      name: 'mortgage-app-svc',
      namespace: 'default',
      specs: {
        deployStatuses: [],
        isDesign: false,
        parent: {
          parentId: 'member--clusters--fxiang',
          parentName: 'fxiang',
          parentType: 'cluster',
        },
        pulse: 'orange',
        raw: { apiVersion: 'v1', kind: 'Service' },
        row: 48,
      },
      topology: null,
      type: 'service',
      uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
      labels: null,
      name: 'mortgage-app-deploy',
      namespace: 'default',
      specs: {
        deployStatuses: [],
        isDesign: false,
        parent: {
          parentId: 'member--clusters--fxiang',
          parentName: 'fxiang',
          parentType: 'cluster',
        },
        pulse: 'orange',
        raw: { apiVersion: 'apps/v1', kind: 'Deployment' },
        row: 63,
      },
      topology: null,
      type: 'deployment',
      uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
      labels: null,
      name: 'mortgage-app-deploy',
      namespace: 'default',
      specs: {
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
          parentName: 'mortgage-app-deploy',
          parentType: 'deployment',
        },
        pulse: 'orange',
        raw: { kind: 'replicaset' },
        row: 93,
      },
      topology: null,
      type: 'replicaset',
      uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
      __typename: 'Resource',
    },
  ],
  otherTypeFilters: [],
  reloading: false,
  status: 'DONE',
  willLoadDetails: false,
}

export const topology: Record<string, any> = {
  activeFilters: {
    application: {
      channel: '__ALL__/__ALL__//__ALL__/__ALL__',
      name: 'mortgage-app',
      namespace: 'default',
    },
  },
  availableFilters: {
    clusters: [],
    labels: [],
    namespaces: [],
    types: [],
  },
  detailsLoaded: true,
  detailsReloading: false,
  diagramFilters: [],
  fetchFilters: {
    application: {
      channel: '__ALL__/__ALL__//__ALL__/__ALL__',
      name: 'mortgage-app',
      namespace: 'default',
    },
  },
  links: [
    {
      from: { uid: 'application--mortgage-app', __typename: 'Resource' },
      specs: { isDesign: true },
      to: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      specs: { isDesign: true },
      to: {
        uid: 'member--rules--default--mortgage-app-placement--0',
        __typename: 'Resource',
      },
      type: 'uses',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        __typename: 'Resource',
      },
      specs: { isDesign: true },
      to: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxia…rtgage-app-svc-service--service--mortgage-app-svc',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
        __typename: 'Resource',
      },
      specs: null,
      to: {
        uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
        __typename: 'Resource',
      },
      type: '',
      __typename: 'Relationship',
    },
  ],
  loaded: true,
  nodes: [
    {
      cluster: null,
      clusterName: null,
      id: 'application--mortgage-app',
      labels: null,
      name: 'mortgage-app',
      namespace: 'default',
      specs: {
        //allChannels: [],
        allClusters: {
          isLocal: false,
          remoteCount: 1,
        },
        allChannels: [
          {
            kind: 'Channel',
            metadata: {
              name: 'mortgage-channel',
              namespace: 'mortgage-ch',
            },
            spec: {
              pathname: 'https://github.com/fxiang1/app-samples.git',
              type: 'GitHub',
            },
          },
        ],
        allSubscriptions: [
          {
            kind: 'Subscription',
            metadata: {
              name: 'mortgage-app-subscription',
              namespace: 'default',
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-path': 'mortgage',
                'apps.open-cluster-management.io/manual-refresh-time': '2020-09-13T18:25:01Z',
              },
            },
            spec: {
              channel: 'mortgage-ch/mortgage-channel',
              timewindow: {
                hours: [{ end: '09:10PM', start: '8:00AM' }],
                location: 'America/Toronto',
                daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                windowtype: 'active',
              },
            },
          },
        ],
        activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
        channels: ['default/mortgage-app-subscription//mortgage-ch/mortgage-channel'],
        isDesign: true,
        pulse: 'green',
        raw: {
          apiVersion: 'app.k8s.io/v1beta1',
          kind: 'Application',
          metadata: {
            creationTimestamp: '2018-08-13T19:23:00Z',
            generation: 2,
            name: 'mortgage-app',
            namespace: 'default',
            resourceVersion: '2349939',
            selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
            uid: 'dc9499ab-d23f-4dac-ba9d-9232218a383f',
          },
          spec: {
            componentKinds: [
              {
                group: 'apps.open-cluster-management.io',
                kind: 'Subscription',
              },
            ],
            descriptor: {},
            selector: {
              matchExpressions: [
                {
                  key: 'app',
                  operator: 'In',
                  values: ['mortgage-app-mortgage'],
                },
              ],
            },
          },
        },
        row: 0,
      },
      topology: null,
      type: 'application',
      uid: 'application--mortgage-app',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--subscription--default--mortgage-app-subscription',
      labels: null,
      name: 'mortgage-app-subscription',
      namespace: 'default',
      specs: {
        hasRules: true,
        isDesign: true,
        isPlaced: true,
        pulse: 'yellow',
        raw: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          channels: [],
          kind: 'Subscription',
          metadata: {
            annotations: {
              'apps.open-cluster-management.io/github-branch': 'main',
              'apps.open-cluster-management.io/github-path': 'mortgage',
            },
            creationTimestamp: '2018-08-13T19:23:01Z',
            generation: 2,
            name: 'mortgage-app-subscription',
          },
          spec: {
            channel: 'mortgage-ch/mortgage-channel',
            timewindow: {
              hours: [{ end: '09:10PM', start: '8:00AM' }],
              location: 'America/Toronto',
              daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
              windowtype: 'active',
            },
          },
          status: {
            lastUpdateTime: '2019-08-15T09:11:11Z',
            phase: 'Propagated',
          },
        },
        row: 18,
      },
      topology: null,
      type: 'subscription',
      uid: 'member--subscription--default--mortgage-app-subscription',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--rules--default--mortgage-app-placement--0',
      labels: null,
      name: 'mortgage-app-placement',
      namespace: 'default',
      specs: {
        isDesign: true,
        pulse: 'green',
        raw: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          kind: 'PlacementRule',
        },
        row: 34,
      },
      topology: null,
      type: 'placements',
      uid: 'member--rules--default--mortgage-app-placement--0',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--clusters--fxiang',
      labels: null,
      name: 'fxiang',
      namespace: '',
      specs: {
        cluster: {
          allocatable: { cpu: '33', memory: '137847Mi' },
          capacity: { cpu: '36', memory: '144591Mi' },
          consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
          metadata: {
            creationTimestamp: '2019-08-13T18:17:34Z',
            finalizers: Array(5),
            generation: 1,
            name: 'fxiang',
          },
          rawCluster: {
            apiVersion: 'cluster.open-cluster-management.io/v1',
            kind: 'ManagedCluster',
          },
          rawStatus: {
            apiVersion: 'internal.open-cluster-management.io/v1beta1',
            kind: 'ManagedClusterInfo',
          },
          status: 'ok',
        },
        clusterNames: ['fxiang'],
        clusters: [
          {
            allocatable: { cpu: '33', memory: '137847Mi' },
            capacity: { cpu: '36', memory: '144591Mi' },
            consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
            metadata: {
              creationTimestamp: '2019-08-13T18:17:34Z',
              finalizers: Array(5),
              generation: 1,
              name: 'fxiang',
            },
            rawCluster: {
              apiVersion: 'cluster.open-cluster-management.io/v1',
              kind: 'ManagedCluster',
            },
            rawStatus: {
              apiVersion: 'internal.open-cluster-management.io/v1beta1',
              kind: 'ManagedClusterInfo',
            },
            status: 'ok',
          },
        ],
        pulse: 'orange',
      },
      topology: null,
      type: 'cluster',
      uid: 'member--clusters--fxiang',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
      labels: null,
      name: 'mortgage-app-svc',
      namespace: 'default',
      specs: {
        deployStatuses: [],
        isDesign: false,
        parent: {
          parentId: 'member--clusters--fxiang',
          parentName: 'fxiang',
          parentType: 'cluster',
        },
        pulse: 'orange',
        raw: { apiVersion: 'v1', kind: 'Service' },
        row: 48,
      },
      topology: null,
      type: 'service',
      uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
      labels: null,
      name: 'mortgage-app-deploy',
      namespace: 'default',
      specs: {
        deployStatuses: [],
        isDesign: false,
        parent: {
          parentId: 'member--clusters--fxiang',
          parentName: 'fxiang',
          parentType: 'cluster',
        },
        pulse: 'orange',
        raw: { apiVersion: 'apps/v1', kind: 'Deployment' },
        row: 63,
      },
      topology: null,
      type: 'deployment',
      uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
      __typename: 'Resource',
    },
    {
      cluster: null,
      clusterName: null,
      id: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
      labels: null,
      name: 'mortgage-app-deploy',
      namespace: 'default',
      specs: {
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
          parentName: 'mortgage-app-deploy',
          parentType: 'deployment',
        },
        pulse: 'orange',
        raw: { kind: 'replicaset' },
        row: 93,
      },
      topology: null,
      type: 'replicaset',
      uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
      __typename: 'Resource',
    },
  ],
  otherTypeFilters: [],
  reloading: false,
  status: 'DONE',
  willLoadDetails: false,
}

export const channelObjectForEdit: Record<string, any> = {
  data: {
    items: [
      {
        metadata: {
          resourceVersion: '1487949',
          creationTimestamp: '2019-03-18T20:06:46Z',
          kind: 'channel',
          name: 'mortgage-channel',
          namespace: 'default',
          selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/mortgage-channel',
          created: '2019-02-18T23:56:15Z',
          cluster: 'local-cluster',
          apigroup: 'app.ibm.com',
          apiversion: 'v1alpha1',
          _rbac: 'default_app.ibm.com_channels',
          _hubClusterResource: 'true',
          uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
          pathname: 'default',
          labels: {
            app: 'mortgage-channel-mortgage',
          },
        },
        type: 'Namespace',
      },
    ],
  },
}

export const subscriptionObjectForEdit: Record<string, any> = {
  data: {
    items: [
      {
        metadata: {
          resourceVersion: '1487949',
          creationTimestamp: '2019-03-18T20:06:46Z',
          kind: 'subscription',
          name: 'mortgage-channel-subscr',
          namespace: 'default',
          selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
          created: '2019-02-18T23:56:15Z',
          cluster: 'local-cluster',
          apigroup: 'app.ibm.com',
          apiversion: 'v1alpha1',
          _rbac: 'default_app.ibm.com_channels',
          _hubClusterResource: 'true',
          uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
          pathname: 'default',
          labels: {
            app: 'mortgage-channel-mortgage',
          },
        },
      },
    ],
  },
}

export const appObjectForEdit: Record<string, any> = {
  data: {
    items: [
      {
        metadata: {
          resourceVersion: '1487949',
          creationTimestamp: '2019-03-18T20:06:46Z',
          kind: 'application',
          name: 'mortgage-channel-subscr',
          namespace: 'default',
          selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
          created: '2019-02-18T23:56:15Z',
          cluster: 'local-cluster',
          apigroup: 'app.ibm.com',
          apiversion: 'v1alpha1',
          _rbac: 'default_app.ibm.com_channels',
          _hubClusterResource: 'true',
          uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
          pathname: 'default',
          labels: {
            app: 'mortgage-channel-mortgage',
          },
        },
      },
    ],
  },
}

export const prObjectForEdit: Record<string, any> = {
  data: {
    items: [
      {
        metadata: {
          resourceVersion: '1487949',
          creationTimestamp: '2019-03-18T20:06:46Z',
          kind: 'placementrule',
          name: 'mortgage-channel-subscr',
          namespace: 'default',
          selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
          created: '2019-02-18T23:56:15Z',
          cluster: 'local-cluster',
          apigroup: 'app.ibm.com',
          apiversion: 'v1alpha1',
          _rbac: 'default_app.ibm.com_channels',
          _hubClusterResource: 'true',
          uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
          pathname: 'default',
          labels: {
            app: 'mortgage-channel-mortgage',
          },
        },
      },
    ],
  },
}

export const AppOverview: Record<string, any> = {
  selectedAppTab: 0,
  showAppDetails: false,
  showExpandedTopology: false,
  selectedNodeId: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
}

export const AppOverviewWithCEM: Record<string, any> = {
  selectedAppTab: 0,
  showAppDetails: false,
  showExpandedTopology: false,
  selectedNodeId: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
}

export const secondaryHeader: Record<string, any> = {
  breadcrumbItems: [{ url: '/multicloud/applications' }, { url: '/multicloud/applications/default/mortgage-app' }],
}

export const secondaryHeaderAllApps: Record<string, any> = {
  breadcrumbItems: [],
}

export const portals: Readonly<Record<string, string>> = Object.freeze({
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
  editBtn: 'edit-button-portal-id',
})

export const controlData: Record<string, any>[] = [
  {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    id: 'name',
    type: 'text',
    syncWith: 'namespace',
  },
  {
    name: 'creation.app.namespace',
    tooltip: 'tooltip.creation.app.namespace',
    id: 'namespace',
    type: 'text',
    syncedWith: 'name',
    syncedSuffix: '-ns',
  },
]

export const createAppStore: Record<string, any> = {
  controlData: controlData,
  portals: portals,
}

export const reduxStoreAppPipeline: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
    subscriptionModalHeaderInfo: {
      application: 'app',
      deployable: 'depp',
    },
  },
  resourceFilters: {
    filters: {},
    selectedFilters: {},
  },
  secondaryHeader: secondaryHeader,
  QueryApplicationList: QueryApplicationList,
  QuerySubscriptionList: QuerySubscriptionList,
  QueryPlacementRuleList: QueryPlacementRuleList,
  QueryChannelList: QueryChannelList,
  HCMChannelList: HCMChannelList,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
  AppOverview: AppOverview,
}

export const reduxStoreAppPipelineWithCEM: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
  },
  resourceFilters: {
    filters: {},
    selectedFilters: {},
  },
  secondaryHeader: secondaryHeader,
  QueryApplicationList: QueryApplicationList,
  HCMApplicationList: HCMApplicationList,
  HCMChannelList: HCMChannelList,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
  AppOverview: AppOverviewWithCEM,
  topology: topology,
  role: {
    role: 'ClusterAdministrator',
  },
}

export const reduxStoreAppPipelineWithCEM_Inception: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
  },
  topology: topology,
  resourceFilters: {
    filters: {},
    selectedFilters: {},
  },
  secondaryHeader: secondaryHeader,
  HCMApplicationList: HCMApplicationList,
  QueryApplicationList: QueryApplicationList_INCEPTION,
  HCMChannelList: HCMChannelList,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
  AppOverview: AppOverviewWithCEM,
  role: {
    role: 'ClusterAdministrator',
  },
}

export const reduxStoreAllAppsPipeline: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
  },
  location: {
    pathname: '/multicloud/applications/',
  },
  resourceFilters: {
    filters: {},
    selectedFilters: {},
  },
  secondaryHeader: secondaryHeaderAllApps,
  QueryApplicationList: QueryApplicationList,
  QuerySubscriptionList: QuerySubscriptionList,
  QueryPlacementRuleList: QueryPlacementRuleList,
  QueryChannelList: QueryChannelList,
  HCMChannelList: HCMChannelList,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
  AppOverview: AppOverview,
}

export const reduxStoreAllAppsPipelineNoChannels: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
  },
  secondaryHeader: secondaryHeaderAllApps,
  QueryApplicationList: QueryApplicationList,
  HCMChannelList: HCMChannelListEmpty,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
}

export const reduxStoreAppPipelineNoChannels: Record<string, any> = {
  AppDeployments: {
    displaySubscriptionModal: false,
  },
  secondaryHeader: secondaryHeader,
  QueryApplicationList: QueryApplicationList,
  HCMChannelList: HCMChannelListEmpty,
  HCMSubscriptionList: HCMSubscriptionList,
  HCMPlacementRuleList: HCMPlacementRuleList,
}

export const staticResourceData: Record<string, any> = {
  defaultSortField: 'name',
  uriKey: 'name',
  primaryKey: 'name',
  secondaryKey: 'namespace',
  applicationName: {
    resourceKey: 'items',
    title: 'table.header.applicationName',
    defaultSortField: 'name',
    normalizedKey: 'name',

    uriKey: 'name',
    primaryKey: 'name',
    secondaryKey: 'namespace',
    tableKeys: [
      {
        msgKey: 'table.header.applicationName',
        resourceKey: 'name',
        transformFunction: (item) => item.name,
      },
      {
        msgKey: 'table.header.namespace',
        resourceKey: 'namespace',
      },
      {
        msgKey: 'table.header.managedClusters',
        resourceKey: 'clusters',
      },
      {
        msgKey: 'table.header.subscriptions',
        resourceKey: 'subscriptions',
      },
      {
        msgKey: 'table.header.created',
        resourceKey: 'created',
      },
    ],
    tableActions: ['table.actions.applications.edit', 'table.actions.applications.remove'],
  },
}

export const staticResourceDataApp: Record<string, any> = {
  defaultSortField: 'name',
  uriKey: 'name',
  primaryKey: 'name',
  secondaryKey: 'namespace',

  resourceKey: 'items',
  title: 'table.header.applicationName',
  normalizedKey: 'name',

  tableKeys: [
    {
      msgKey: 'table.header.applicationName',
      resourceKey: 'name',
      transformFunction: (item) => item.name,
    },
    {
      msgKey: 'table.header.namespace',
      resourceKey: 'namespace',
    },
    {
      msgKey: 'table.header.managedClusters',
      resourceKey: 'clusters',
    },
    {
      msgKey: 'table.header.subscriptions',
      resourceKey: 'subscriptions',
    },
    {
      msgKey: 'table.header.created',
      resourceKey: 'created',
    },
  ],
  tableActions: ['table.actions.applications.edit', 'table.actions.applications.remove'],
}
