// Copyright Contributors to the Open Cluster Management project

import { addDiagramDetails, mapSingleApplication, syncReplicaSetCountToPodNode } from './computeRelated'

describe('addDiagramDetails', () => {
  const mockData = {
    resourceStatuses: {
      data: {
        searchResult: [
          {
            items: [],
            related: null,
          },
          {
            items: [
              {
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                cluster: 'local-cluster',
                created: '2022-09-22T19:57:34Z',
                kind: 'subscription',
                kind_plural: 'subscriptions',
                label:
                  'app.kubernetes.io/part-of=feng-bz; app=feng-bz; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                status: 'Propagated',
                timeWindow: 'none',
                _gitbranch: 'master',
                _gitpath: 'resources17',
                _hubClusterResource: 'true',
                _rbac: 'feng-bz_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/6a7262ca-46ff-428a-9abb-e987b4acdc3b',
              },
            ],
            related: [
              {
                items: [
                  {
                    ClusterCertificateRotated: 'True',
                    HubAcceptedManagedCluster: 'True',
                    ManagedClusterConditionAvailable: 'True',
                    ManagedClusterImportSucceeded: 'True',
                    ManagedClusterJoined: 'True',
                    addon:
                      'application-manager=true; cert-policy-controller=true; policy-controller=true; search-collector=false',
                    apigroup: 'internal.open-cluster-management.io',
                    consoleURL:
                      'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                    cpu: 24,
                    created: '2022-08-30T15:07:12Z',
                    kind: 'cluster',
                    kubernetesVersion: 'v1.23.5+3afdacb',
                    label:
                      'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; cluster=error; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
                    memory: '97683292Ki',
                    name: 'local-cluster',
                    nodes: 3,
                    status: 'OK',
                    _clusterNamespace: 'local-cluster',
                    _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                    _uid: 'cluster__local-cluster',
                  },
                ],
                kind: 'cluster',
              },
              {
                items: [
                  {
                    apigroup: 'app.k8s.io',
                    apiversion: 'v1beta1',
                    cluster: 'local-cluster',
                    created: '2022-09-22T19:57:34Z',
                    kind: 'application',
                    kind_plural: 'applications',
                    name: 'feng-bz',
                    namespace: 'feng-bz',
                    _hubClusterResource: 'true',
                    _rbac: 'feng-bz_app.k8s.io_applications',
                    _uid: 'local-cluster/4c8d94d9-701d-48c4-ba54-8be35168e0b6',
                  },
                ],
                kind: 'application',
              },
              {
                items: [
                  {
                    apigroup: 'apps.open-cluster-management.io',
                    apiversion: 'v1',
                    channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                    cluster: 'local-cluster',
                    created: '2022-09-22T19:57:35Z',
                    kind: 'subscription',
                    kind_plural: 'subscriptions',
                    label:
                      'app.kubernetes.io/part-of=feng-bz; app=feng-bz; apps.open-cluster-management.io/reconcile-rate=medium',
                    localPlacement: 'true',
                    name: 'feng-bz-subscription-1-local',
                    namespace: 'feng-bz',
                    status: 'Subscribed',
                    timeWindow: 'none',
                    _gitbranch: 'master',
                    _gitpath: 'resources17',
                    _hostingSubscription: 'feng-bz/feng-bz-subscription-1',
                    _hubClusterResource: 'true',
                    _rbac: 'feng-bz_apps.open-cluster-management.io_subscriptions',
                    _uid: 'local-cluster/7cf6fb13-dc85-4711-9a73-81cf450cef1b',
                  },
                ],
                kind: 'subscription',
              },
              {
                items: [
                  {
                    _uid: 'local-cluster/f9ffbfd4-4731-4973-96d6-c1fb6dcecf2e',
                    kind: 'namespace',
                    _hubClusterResource: 'true',
                    kind_plural: 'namespaces',
                    label: 'kubernetes.io/metadata.name=feng-bz',
                    status: 'Active',
                    _rbac: 'null_null_namespaces',
                    created: '2022-09-09T16:20:37Z',
                    name: 'feng-bz',
                    cluster: 'local-cluster',
                    apiversion: 'v1',
                    _hostingSubscription: 'feng-bz/feng-bz-subscription-1',
                  },
                  {
                    _uid: 'local-cluster/365ceb04-1cd9-41fe-9213-bc3d2e28a2da',
                    cluster: 'local-cluster',
                    created: '2022-09-22T20:12:37Z',
                    kind_plural: 'namespaces',
                    name: 'acm-namespace3',
                    _rbac: 'null_null_namespaces',
                    status: 'Active',
                    apiversion: 'v1',
                    label:
                      'app.kubernetes.io/part-of=feng-bz; app=acm-namespace3; apps.open-cluster-management.io/reconcile-rate=medium; kubernetes.io/metadata.name=acm-namespace3',
                    _hostingSubscription: 'feng-bz/feng-bz-subscription-1-local',
                    _hubClusterResource: 'true',
                    kind: 'namespace',
                  },
                  {
                    _uid: 'local-cluster/8782d54f-efb6-42fb-9af1-b3484f0e97b8',
                    apiversion: 'v1',
                    created: '2022-09-22T21:06:43Z',
                    kind: 'namespace',
                    kind_plural: 'namespaces',
                    name: 'acm-namespace2',
                    status: 'Active',
                    cluster: 'local-cluster',
                    _rbac: 'null_null_namespaces',
                    _hostingSubscription: 'feng-bz/feng-bz-subscription-1-local',
                    _hubClusterResource: 'true',
                    label:
                      'app.kubernetes.io/part-of=feng-bz; app=acm-namespace2; apps.open-cluster-management.io/reconcile-rate=medium; kubernetes.io/metadata.name=acm-namespace2',
                  },
                  {
                    _uid: 'local-cluster/02792ee0-dab4-4b9b-b13b-7294563b5746',
                    kind_plural: 'namespaces',
                    created: '2022-09-22T21:06:43Z',
                    name: 'acm-namespace',
                    _rbac: 'null_null_namespaces',
                    _hubClusterResource: 'true',
                    kind: 'namespace',
                    cluster: 'local-cluster',
                    _hostingSubscription: 'feng-bz/feng-bz-subscription-1-local',
                    label:
                      'app.kubernetes.io/part-of=feng-bz; app=acm-namespace; apps.open-cluster-management.io/reconcile-rate=medium; kubernetes.io/metadata.name=acm-namespace',
                    status: 'Active',
                    apiversion: 'v1',
                  },
                ],
                kind: 'namespace',
              },
            ],
          },
        ],
      },
    },
    resourceMap: {
      'feng-bz-subscription-1': {
        name: 'feng-bz-subscription-1',
        namespace: 'feng-bz',
        type: 'subscription',
        id: 'member--subscription--feng-bz--feng-bz-subscription-1',
        uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
        specs: {
          title: 'resources17',
          isDesign: true,
          hasRules: true,
          isPlaced: true,
          raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'master',
                'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                'apps.open-cluster-management.io/git-path': 'resources17',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2022-09-22T19:57:34Z',
              generation: 1,
              labels: {
                app: 'feng-bz',
                'app.kubernetes.io/part-of': 'feng-bz',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-bz-subscription-1',
              namespace: 'feng-bz',
              resourceVersion: '31030056',
              uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
            },
            spec: {
              channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'feng-bz-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2022-09-22T19:57:35Z',
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
                  creationTimestamp: '2022-09-09T16:20:38Z',
                  generation: 1,
                  name: 'ggithubcom-simondelord-acm-templates',
                  namespace: 'ggithubcom-simondelord-acm-templates-ns',
                  resourceVersion: '21085701',
                  uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                },
                spec: {
                  pathname: 'https://github.com/SimonDelord/ACM-Templates',
                  type: 'Git',
                },
              },
            ],
            rules: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                  annotations: {
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                  },
                  name: 'feng-bz-placement-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030028',
                  uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                },
                spec: {
                  clusterSelector: {
                    matchLabels: {
                      'local-cluster': 'true',
                    },
                  },
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'local-cluster',
                      clusterNamespace: 'local-cluster',
                    },
                  ],
                },
              },
            ],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2022-09-22T19:57:35Z',
                generation: 3,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-bz-subscription-1',
                    uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                  },
                ],
                resourceVersion: '31160390',
                uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'project.openshift.io/v1',
                  kind: 'Project',
                  name: 'acm-namespace3',
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
          clustersNames: ['local-cluster'],
        },
        report: {
          apiVersion: 'apps.open-cluster-management.io/v1alpha1',
          kind: 'SubscriptionReport',
          metadata: {
            creationTimestamp: '2022-09-22T19:57:35Z',
            generation: 3,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
            },
            name: 'feng-bz-subscription-1',
            namespace: 'feng-bz',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-bz-subscription-1',
                uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
              },
            ],
            resourceVersion: '31160390',
            uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'project.openshift.io/v1',
              kind: 'Project',
              name: 'acm-namespace3',
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
      'cluster-local-cluster-local-cluster': {
        name: 'local-cluster',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters--local-cluster--feng-bz-subscription-1',
        uid: 'member--clusters--local-cluster--feng-bz-subscription-1',
        specs: {
          title: '',
          subscription: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'master',
                'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                'apps.open-cluster-management.io/git-path': 'resources17',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2022-09-22T19:57:34Z',
              generation: 1,
              labels: {
                app: 'feng-bz',
                'app.kubernetes.io/part-of': 'feng-bz',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-bz-subscription-1',
              namespace: 'feng-bz',
              resourceVersion: '31030056',
              uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
            },
            spec: {
              channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'feng-bz-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2022-09-22T19:57:35Z',
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
                  creationTimestamp: '2022-09-09T16:20:38Z',
                  generation: 1,
                  name: 'ggithubcom-simondelord-acm-templates',
                  namespace: 'ggithubcom-simondelord-acm-templates-ns',
                  resourceVersion: '21085701',
                  uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                },
                spec: {
                  pathname: 'https://github.com/SimonDelord/ACM-Templates',
                  type: 'Git',
                },
              },
            ],
            rules: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                  annotations: {
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                  },
                  name: 'feng-bz-placement-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030028',
                  uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                },
                spec: {
                  clusterSelector: {
                    matchLabels: {
                      'local-cluster': 'true',
                    },
                  },
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'local-cluster',
                      clusterNamespace: 'local-cluster',
                    },
                  ],
                },
              },
            ],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2022-09-22T19:57:35Z',
                generation: 3,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-bz-subscription-1',
                    uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                  },
                ],
                resourceVersion: '31160390',
                uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'project.openshift.io/v1',
                  kind: 'Project',
                  name: 'acm-namespace3',
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
              uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              status: 'ready',
              provider: 'aws',
              distribution: {
                k8sVersion: 'v1.23.5+3afdacb',
                ocp: {
                  availableUpdates: [
                    '4.10.21',
                    '4.10.22',
                    '4.10.23',
                    '4.10.24',
                    '4.10.25',
                    '4.10.26',
                    '4.10.28',
                    '4.10.30',
                    '4.10.31',
                    '4.10.32',
                  ],
                  channel: 'stable-4.10',
                  desired: {
                    channels: ['candidate-4.10', 'candidate-4.11', 'eus-4.10', 'fast-4.10', 'fast-4.11', 'stable-4.10'],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                    version: '4.10.20',
                  },
                  desiredVersion: '4.10.20',
                  managedClusterClientConfig: {
                    caBundle:
                      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                    url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                  },
                  version: '4.10.20',
                  versionAvailableUpdates: [
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                      version: '4.10.21',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                      version: '4.10.22',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                      version: '4.10.23',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                      version: '4.10.24',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                      version: '4.10.25',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                      version: '4.10.26',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                      url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                      version: '4.10.28',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                      url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                      version: '4.10.30',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                      url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                      version: '4.10.31',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                      url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                      version: '4.10.32',
                    },
                  ],
                  versionHistory: [
                    {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      state: 'Completed',
                      verified: false,
                      version: '4.10.20',
                    },
                  ],
                },
                displayVersion: 'OpenShift 4.10.20',
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
                  currentVersion: '4.10.20',
                  desiredVersion: '4.10.20',
                  isReadySelectChannels: true,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  currentChannel: 'stable-4.10',
                  desiredChannel: 'stable-4.10',
                  availableUpdates: [
                    '4.10.21',
                    '4.10.22',
                    '4.10.23',
                    '4.10.24',
                    '4.10.25',
                    '4.10.26',
                    '4.10.28',
                    '4.10.30',
                    '4.10.31',
                    '4.10.32',
                  ],
                  availableChannels: [
                    'candidate-4.10',
                    'candidate-4.11',
                    'eus-4.10',
                    'fast-4.10',
                    'fast-4.11',
                    'stable-4.10',
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
                },
              },
              labels: {
                cloud: 'Amazon',
                cluster: 'error',
                'cluster.open-cluster-management.io/clusterset': 'default',
                clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                'feature.open-cluster-management.io/addon-application-manager': 'available',
                'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                'feature.open-cluster-management.io/addon-work-manager': 'available',
                'installer.name': 'multiclusterhub',
                'installer.namespace': 'open-cluster-management',
                'local-cluster': 'true',
                name: 'local-cluster',
                openshiftVersion: '4.10.20',
                'velero.io/exclude-from-backup': 'true',
                vendor: 'OpenShift',
              },
              nodes: {
                nodeList: [
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-129-97.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-156-177.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-162-59.ec2.internal',
                  },
                ],
                ready: 3,
                unhealthy: 0,
                unknown: 0,
              },
              kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
              consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
              isHive: false,
              isHypershift: false,
              isManaged: true,
              isCurator: false,
              isHostedCluster: false,
              isSNOCluster: false,
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              clusterSet: 'default',
              owner: {},
              creationTimestamp: '2022-08-30T15:07:12Z',
            },
          ],
          sortedClusterNames: ['local-cluster'],
        },
      },
      'project-acm-namespace3-local-cluster': {
        name: 'acm-namespace3',
        type: 'project',
        id: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
        uid: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters--local-cluster--feng-bz-subscription-1',
            parentName: 'local-cluster',
            parentType: 'cluster',
            parentSpecs: {
              title: '',
              subscription: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/git-branch': 'master',
                    'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                    'apps.open-cluster-management.io/git-path': 'resources17',
                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:34Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                    'app.kubernetes.io/part-of': 'feng-bz',
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                  },
                  name: 'feng-bz-subscription-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030056',
                  uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                },
                spec: {
                  channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                  placement: {
                    placementRef: {
                      kind: 'PlacementRule',
                      name: 'feng-bz-placement-1',
                    },
                  },
                },
                status: {
                  lastUpdateTime: '2022-09-22T19:57:35Z',
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
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-09T16:20:38Z',
                      generation: 1,
                      name: 'ggithubcom-simondelord-acm-templates',
                      namespace: 'ggithubcom-simondelord-acm-templates-ns',
                      resourceVersion: '21085701',
                      uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                    },
                    spec: {
                      pathname: 'https://github.com/SimonDelord/ACM-Templates',
                      type: 'Git',
                    },
                  },
                ],
                rules: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'PlacementRule',
                    metadata: {
                      annotations: {
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-22T19:57:35Z',
                      generation: 1,
                      labels: {
                        app: 'feng-bz',
                      },
                      name: 'feng-bz-placement-1',
                      namespace: 'feng-bz',
                      resourceVersion: '31030028',
                      uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                    },
                    spec: {
                      clusterSelector: {
                        matchLabels: {
                          'local-cluster': 'true',
                        },
                      },
                    },
                    status: {
                      decisions: [
                        {
                          clusterName: 'local-cluster',
                          clusterNamespace: 'local-cluster',
                        },
                      ],
                    },
                  },
                ],
                report: {
                  apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                  kind: 'SubscriptionReport',
                  metadata: {
                    creationTimestamp: '2022-09-22T19:57:35Z',
                    generation: 3,
                    labels: {
                      'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                    },
                    name: 'feng-bz-subscription-1',
                    namespace: 'feng-bz',
                    ownerReferences: [
                      {
                        apiVersion: 'apps.open-cluster-management.io/v1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Subscription',
                        name: 'feng-bz-subscription-1',
                        uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                      },
                    ],
                    resourceVersion: '31160390',
                    uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                  },
                  reportType: 'Application',
                  resources: [
                    {
                      apiVersion: 'project.openshift.io/v1',
                      kind: 'Project',
                      name: 'acm-namespace3',
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
                  uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
                  status: 'ready',
                  provider: 'aws',
                  distribution: {
                    k8sVersion: 'v1.23.5+3afdacb',
                    ocp: {
                      availableUpdates: [
                        '4.10.21',
                        '4.10.22',
                        '4.10.23',
                        '4.10.24',
                        '4.10.25',
                        '4.10.26',
                        '4.10.28',
                        '4.10.30',
                        '4.10.31',
                        '4.10.32',
                      ],
                      channel: 'stable-4.10',
                      desired: {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                        version: '4.10.20',
                      },
                      desiredVersion: '4.10.20',
                      managedClusterClientConfig: {
                        caBundle:
                          'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                        url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                      },
                      version: '4.10.20',
                      versionAvailableUpdates: [
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                          version: '4.10.21',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                          version: '4.10.22',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                          version: '4.10.23',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                          version: '4.10.24',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                          version: '4.10.25',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                          version: '4.10.26',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                          url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                          version: '4.10.28',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                          url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                          version: '4.10.30',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                          url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                          version: '4.10.31',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                          url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                          version: '4.10.32',
                        },
                      ],
                      versionHistory: [
                        {
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                          state: 'Completed',
                          verified: false,
                          version: '4.10.20',
                        },
                      ],
                    },
                    displayVersion: 'OpenShift 4.10.20',
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
                      currentVersion: '4.10.20',
                      desiredVersion: '4.10.20',
                      isReadySelectChannels: true,
                      isSelectingChannel: false,
                      isUpgradeCuration: false,
                      currentChannel: 'stable-4.10',
                      desiredChannel: 'stable-4.10',
                      availableUpdates: [
                        '4.10.21',
                        '4.10.22',
                        '4.10.23',
                        '4.10.24',
                        '4.10.25',
                        '4.10.26',
                        '4.10.28',
                        '4.10.30',
                        '4.10.31',
                        '4.10.32',
                      ],
                      availableChannels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
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
                    },
                  },
                  labels: {
                    cloud: 'Amazon',
                    cluster: 'error',
                    'cluster.open-cluster-management.io/clusterset': 'default',
                    clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                    'feature.open-cluster-management.io/addon-application-manager': 'available',
                    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                    'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                    'feature.open-cluster-management.io/addon-work-manager': 'available',
                    'installer.name': 'multiclusterhub',
                    'installer.namespace': 'open-cluster-management',
                    'local-cluster': 'true',
                    name: 'local-cluster',
                    openshiftVersion: '4.10.20',
                    'velero.io/exclude-from-backup': 'true',
                    vendor: 'OpenShift',
                  },
                  nodes: {
                    nodeList: [
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-129-97.ec2.internal',
                      },
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-156-177.ec2.internal',
                      },
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-162-59.ec2.internal',
                      },
                    ],
                    ready: 3,
                    unhealthy: 0,
                    unknown: 0,
                  },
                  kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                  consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                  isHive: false,
                  isHypershift: false,
                  isManaged: true,
                  isCurator: false,
                  isHostedCluster: false,
                  isSNOCluster: false,
                  hive: {
                    isHibernatable: false,
                    secrets: {},
                  },
                  clusterSet: 'default',
                  owner: {},
                  creationTimestamp: '2022-08-30T15:07:12Z',
                },
              ],
              sortedClusterNames: ['local-cluster'],
            },
          },
          clustersNames: ['local-cluster'],
          resourceCount: 1,
        },
      },
    },
    isClusterGrouped: {
      value: false,
    },
    hasHelmReleases: {
      value: false,
    },
    topology: {
      nodes: [
        {
          name: '',
          namespace: 'feng-bz',
          type: 'application',
          id: 'application--feng-bz',
          uid: 'application--feng-bz',
          specs: {
            isDesign: true,
            raw: {
              apiVersion: 'app.k8s.io/v1beta1',
              kind: 'Application',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/deployables': '',
                  'apps.open-cluster-management.io/subscriptions':
                    'feng-bz/feng-bz-subscription-1,feng-bz/feng-bz-subscription-1-local',
                  'open-cluster-management.io/user-group':
                    'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity':
                    'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
                },
                creationTimestamp: '2022-09-22T19:57:34Z',
                generation: 1,
                name: 'feng-bz',
                namespace: 'feng-bz',
                resourceVersion: '31030045',
                uid: '4c8d94d9-701d-48c4-ba54-8be35168e0b6',
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
                      values: ['feng-bz'],
                    },
                  ],
                },
              },
            },
            activeChannel:
              'feng-bz/feng-bz-subscription-1//ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
            allSubscriptions: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/git-branch': 'master',
                    'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                    'apps.open-cluster-management.io/git-path': 'resources17',
                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:34Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                    'app.kubernetes.io/part-of': 'feng-bz',
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                  },
                  name: 'feng-bz-subscription-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030056',
                  uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                },
                spec: {
                  channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                  placement: {
                    placementRef: {
                      kind: 'PlacementRule',
                      name: 'feng-bz-placement-1',
                    },
                  },
                },
                status: {
                  lastUpdateTime: '2022-09-22T19:57:35Z',
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
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-09T16:20:38Z',
                      generation: 1,
                      name: 'ggithubcom-simondelord-acm-templates',
                      namespace: 'ggithubcom-simondelord-acm-templates-ns',
                      resourceVersion: '21085701',
                      uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                    },
                    spec: {
                      pathname: 'https://github.com/SimonDelord/ACM-Templates',
                      type: 'Git',
                    },
                  },
                ],
                rules: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'PlacementRule',
                    metadata: {
                      annotations: {
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-22T19:57:35Z',
                      generation: 1,
                      labels: {
                        app: 'feng-bz',
                      },
                      name: 'feng-bz-placement-1',
                      namespace: 'feng-bz',
                      resourceVersion: '31030028',
                      uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                    },
                    spec: {
                      clusterSelector: {
                        matchLabels: {
                          'local-cluster': 'true',
                        },
                      },
                    },
                    status: {
                      decisions: [
                        {
                          clusterName: 'local-cluster',
                          clusterNamespace: 'local-cluster',
                        },
                      ],
                    },
                  },
                ],
                report: {
                  apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                  kind: 'SubscriptionReport',
                  metadata: {
                    creationTimestamp: '2022-09-22T19:57:35Z',
                    generation: 3,
                    labels: {
                      'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                    },
                    name: 'feng-bz-subscription-1',
                    namespace: 'feng-bz',
                    ownerReferences: [
                      {
                        apiVersion: 'apps.open-cluster-management.io/v1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Subscription',
                        name: 'feng-bz-subscription-1',
                        uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                      },
                    ],
                    resourceVersion: '31160390',
                    uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                  },
                  reportType: 'Application',
                  resources: [
                    {
                      apiVersion: 'project.openshift.io/v1',
                      kind: 'Project',
                      name: 'acm-namespace3',
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
            ],
            allChannels: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Channel',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-09T16:20:38Z',
                  generation: 1,
                  name: 'ggithubcom-simondelord-acm-templates',
                  namespace: 'ggithubcom-simondelord-acm-templates-ns',
                  resourceVersion: '21085701',
                  uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                },
                spec: {
                  pathname: 'https://github.com/SimonDelord/ACM-Templates',
                  type: 'Git',
                },
              },
            ],
            allClusters: {
              isLocal: true,
              remoteCount: 0,
            },
            channels: [
              'feng-bz/feng-bz-subscription-1//ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
            ],
          },
        },
        {
          name: 'feng-bz-subscription-1',
          namespace: 'feng-bz',
          type: 'subscription',
          id: 'member--subscription--feng-bz--feng-bz-subscription-1',
          uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
          specs: {
            title: 'resources17',
            isDesign: true,
            hasRules: true,
            isPlaced: true,
            raw: {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'master',
                  'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                  'apps.open-cluster-management.io/git-path': 'resources17',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-22T19:57:34Z',
                generation: 1,
                labels: {
                  app: 'feng-bz',
                  'app.kubernetes.io/part-of': 'feng-bz',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                resourceVersion: '31030056',
                uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
              },
              spec: {
                channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-bz-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-09-22T19:57:35Z',
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
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-09T16:20:38Z',
                    generation: 1,
                    name: 'ggithubcom-simondelord-acm-templates',
                    namespace: 'ggithubcom-simondelord-acm-templates-ns',
                    resourceVersion: '21085701',
                    uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                  },
                  spec: {
                    pathname: 'https://github.com/SimonDelord/ACM-Templates',
                    type: 'Git',
                  },
                },
              ],
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-22T19:57:35Z',
                    generation: 1,
                    labels: {
                      app: 'feng-bz',
                    },
                    name: 'feng-bz-placement-1',
                    namespace: 'feng-bz',
                    resourceVersion: '31030028',
                    uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 3,
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                  },
                  name: 'feng-bz-subscription-1',
                  namespace: 'feng-bz',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'feng-bz-subscription-1',
                      uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                    },
                  ],
                  resourceVersion: '31160390',
                  uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'project.openshift.io/v1',
                    kind: 'Project',
                    name: 'acm-namespace3',
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
            clustersNames: ['local-cluster'],
          },
          report: {
            apiVersion: 'apps.open-cluster-management.io/v1alpha1',
            kind: 'SubscriptionReport',
            metadata: {
              creationTimestamp: '2022-09-22T19:57:35Z',
              generation: 3,
              labels: {
                'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
              },
              name: 'feng-bz-subscription-1',
              namespace: 'feng-bz',
              ownerReferences: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Subscription',
                  name: 'feng-bz-subscription-1',
                  uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                },
              ],
              resourceVersion: '31160390',
              uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
            },
            reportType: 'Application',
            resources: [
              {
                apiVersion: 'project.openshift.io/v1',
                kind: 'Project',
                name: 'acm-namespace3',
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
        {
          name: 'feng-bz-placement-1',
          namespace: 'feng-bz',
          type: 'placements',
          id: 'member--rules--feng-bz--feng-bz-placement-1--0',
          uid: 'member--rules--feng-bz--feng-bz-placement-1--0',
          specs: {
            isDesign: true,
            raw: {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'PlacementRule',
              metadata: {
                annotations: {
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-22T19:57:35Z',
                generation: 1,
                labels: {
                  app: 'feng-bz',
                },
                name: 'feng-bz-placement-1',
                namespace: 'feng-bz',
                resourceVersion: '31030028',
                uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
              },
              spec: {
                clusterSelector: {
                  matchLabels: {
                    'local-cluster': 'true',
                  },
                },
              },
              status: {
                decisions: [
                  {
                    clusterName: 'local-cluster',
                    clusterNamespace: 'local-cluster',
                  },
                ],
              },
            },
          },
        },
        {
          name: 'local-cluster',
          namespace: '',
          type: 'cluster',
          id: 'member--clusters--local-cluster--feng-bz-subscription-1',
          uid: 'member--clusters--local-cluster--feng-bz-subscription-1',
          specs: {
            title: '',
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'master',
                  'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                  'apps.open-cluster-management.io/git-path': 'resources17',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-22T19:57:34Z',
                generation: 1,
                labels: {
                  app: 'feng-bz',
                  'app.kubernetes.io/part-of': 'feng-bz',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                resourceVersion: '31030056',
                uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
              },
              spec: {
                channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-bz-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-09-22T19:57:35Z',
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
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-09T16:20:38Z',
                    generation: 1,
                    name: 'ggithubcom-simondelord-acm-templates',
                    namespace: 'ggithubcom-simondelord-acm-templates-ns',
                    resourceVersion: '21085701',
                    uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                  },
                  spec: {
                    pathname: 'https://github.com/SimonDelord/ACM-Templates',
                    type: 'Git',
                  },
                },
              ],
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-22T19:57:35Z',
                    generation: 1,
                    labels: {
                      app: 'feng-bz',
                    },
                    name: 'feng-bz-placement-1',
                    namespace: 'feng-bz',
                    resourceVersion: '31030028',
                    uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 3,
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                  },
                  name: 'feng-bz-subscription-1',
                  namespace: 'feng-bz',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'feng-bz-subscription-1',
                      uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                    },
                  ],
                  resourceVersion: '31160390',
                  uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'project.openshift.io/v1',
                    kind: 'Project',
                    name: 'acm-namespace3',
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
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
                status: 'ready',
                provider: 'aws',
                distribution: {
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  displayVersion: 'OpenShift 4.10.20',
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
                    currentVersion: '4.10.20',
                    desiredVersion: '4.10.20',
                    isReadySelectChannels: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    currentChannel: 'stable-4.10',
                    desiredChannel: 'stable-4.10',
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                    ],
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
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
                  },
                },
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                isHive: false,
                isHypershift: false,
                isManaged: true,
                isCurator: false,
                isHostedCluster: false,
                isSNOCluster: false,
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                clusterSet: 'default',
                owner: {},
                creationTimestamp: '2022-08-30T15:07:12Z',
              },
            ],
            sortedClusterNames: ['local-cluster'],
          },
        },
        {
          name: 'acm-namespace3',
          type: 'project',
          id: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
          uid: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
          specs: {
            isDesign: false,
            parent: {
              parentId: 'member--clusters--local-cluster--feng-bz-subscription-1',
              parentName: 'local-cluster',
              parentType: 'cluster',
              parentSpecs: {
                title: '',
                subscription: {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'Subscription',
                  metadata: {
                    annotations: {
                      'apps.open-cluster-management.io/git-branch': 'master',
                      'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                      'apps.open-cluster-management.io/git-path': 'resources17',
                      'apps.open-cluster-management.io/reconcile-option': 'merge',
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-22T19:57:34Z',
                    generation: 1,
                    labels: {
                      app: 'feng-bz',
                      'app.kubernetes.io/part-of': 'feng-bz',
                      'apps.open-cluster-management.io/reconcile-rate': 'medium',
                    },
                    name: 'feng-bz-subscription-1',
                    namespace: 'feng-bz',
                    resourceVersion: '31030056',
                    uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                  },
                  spec: {
                    channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                    placement: {
                      placementRef: {
                        kind: 'PlacementRule',
                        name: 'feng-bz-placement-1',
                      },
                    },
                  },
                  status: {
                    lastUpdateTime: '2022-09-22T19:57:35Z',
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
                          'open-cluster-management.io/user-group':
                            'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                          'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                        },
                        creationTimestamp: '2022-09-09T16:20:38Z',
                        generation: 1,
                        name: 'ggithubcom-simondelord-acm-templates',
                        namespace: 'ggithubcom-simondelord-acm-templates-ns',
                        resourceVersion: '21085701',
                        uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                      },
                      spec: {
                        pathname: 'https://github.com/SimonDelord/ACM-Templates',
                        type: 'Git',
                      },
                    },
                  ],
                  rules: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      kind: 'PlacementRule',
                      metadata: {
                        annotations: {
                          'open-cluster-management.io/user-group':
                            'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                          'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                        },
                        creationTimestamp: '2022-09-22T19:57:35Z',
                        generation: 1,
                        labels: {
                          app: 'feng-bz',
                        },
                        name: 'feng-bz-placement-1',
                        namespace: 'feng-bz',
                        resourceVersion: '31030028',
                        uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                      },
                      spec: {
                        clusterSelector: {
                          matchLabels: {
                            'local-cluster': 'true',
                          },
                        },
                      },
                      status: {
                        decisions: [
                          {
                            clusterName: 'local-cluster',
                            clusterNamespace: 'local-cluster',
                          },
                        ],
                      },
                    },
                  ],
                  report: {
                    apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                    kind: 'SubscriptionReport',
                    metadata: {
                      creationTimestamp: '2022-09-22T19:57:35Z',
                      generation: 3,
                      labels: {
                        'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                      },
                      name: 'feng-bz-subscription-1',
                      namespace: 'feng-bz',
                      ownerReferences: [
                        {
                          apiVersion: 'apps.open-cluster-management.io/v1',
                          blockOwnerDeletion: true,
                          controller: true,
                          kind: 'Subscription',
                          name: 'feng-bz-subscription-1',
                          uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                        },
                      ],
                      resourceVersion: '31160390',
                      uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                    },
                    reportType: 'Application',
                    resources: [
                      {
                        apiVersion: 'project.openshift.io/v1',
                        kind: 'Project',
                        name: 'acm-namespace3',
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
                    uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
                    status: 'ready',
                    provider: 'aws',
                    distribution: {
                      k8sVersion: 'v1.23.5+3afdacb',
                      ocp: {
                        availableUpdates: [
                          '4.10.21',
                          '4.10.22',
                          '4.10.23',
                          '4.10.24',
                          '4.10.25',
                          '4.10.26',
                          '4.10.28',
                          '4.10.30',
                          '4.10.31',
                          '4.10.32',
                        ],
                        channel: 'stable-4.10',
                        desired: {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                          version: '4.10.20',
                        },
                        desiredVersion: '4.10.20',
                        managedClusterClientConfig: {
                          caBundle:
                            'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                          url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                        },
                        version: '4.10.20',
                        versionAvailableUpdates: [
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                            url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                            version: '4.10.21',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                            url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                            version: '4.10.22',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                            url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                            version: '4.10.23',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                            url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                            version: '4.10.24',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                            url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                            version: '4.10.25',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                            url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                            version: '4.10.26',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                            url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                            version: '4.10.28',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                            url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                            version: '4.10.30',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                            url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                            version: '4.10.31',
                          },
                          {
                            channels: [
                              'candidate-4.10',
                              'candidate-4.11',
                              'eus-4.10',
                              'fast-4.10',
                              'fast-4.11',
                              'stable-4.10',
                            ],
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                            url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                            version: '4.10.32',
                          },
                        ],
                        versionHistory: [
                          {
                            image:
                              'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                            state: 'Completed',
                            verified: false,
                            version: '4.10.20',
                          },
                        ],
                      },
                      displayVersion: 'OpenShift 4.10.20',
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
                        currentVersion: '4.10.20',
                        desiredVersion: '4.10.20',
                        isReadySelectChannels: true,
                        isSelectingChannel: false,
                        isUpgradeCuration: false,
                        currentChannel: 'stable-4.10',
                        desiredChannel: 'stable-4.10',
                        availableUpdates: [
                          '4.10.21',
                          '4.10.22',
                          '4.10.23',
                          '4.10.24',
                          '4.10.25',
                          '4.10.26',
                          '4.10.28',
                          '4.10.30',
                          '4.10.31',
                          '4.10.32',
                        ],
                        availableChannels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
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
                      },
                    },
                    labels: {
                      cloud: 'Amazon',
                      cluster: 'error',
                      'cluster.open-cluster-management.io/clusterset': 'default',
                      clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                      'feature.open-cluster-management.io/addon-application-manager': 'available',
                      'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                      'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                      'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                      'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                      'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                      'feature.open-cluster-management.io/addon-work-manager': 'available',
                      'installer.name': 'multiclusterhub',
                      'installer.namespace': 'open-cluster-management',
                      'local-cluster': 'true',
                      name: 'local-cluster',
                      openshiftVersion: '4.10.20',
                      'velero.io/exclude-from-backup': 'true',
                      vendor: 'OpenShift',
                    },
                    nodes: {
                      nodeList: [
                        {
                          capacity: {
                            cpu: '8',
                            memory: '32561100Ki',
                            socket: '1',
                          },
                          conditions: [
                            {
                              status: 'True',
                              type: 'Ready',
                            },
                          ],
                          labels: {
                            'beta.kubernetes.io/instance-type': 't3.2xlarge',
                            'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                            'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                            'node-role.kubernetes.io/master': '',
                            'node-role.kubernetes.io/worker': '',
                            'node.kubernetes.io/instance-type': 't3.2xlarge',
                          },
                          name: 'ip-10-0-129-97.ec2.internal',
                        },
                        {
                          capacity: {
                            cpu: '8',
                            memory: '32561100Ki',
                            socket: '1',
                          },
                          conditions: [
                            {
                              status: 'True',
                              type: 'Ready',
                            },
                          ],
                          labels: {
                            'beta.kubernetes.io/instance-type': 't3.2xlarge',
                            'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                            'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                            'node-role.kubernetes.io/master': '',
                            'node-role.kubernetes.io/worker': '',
                            'node.kubernetes.io/instance-type': 't3.2xlarge',
                          },
                          name: 'ip-10-0-156-177.ec2.internal',
                        },
                        {
                          capacity: {
                            cpu: '8',
                            memory: '32561100Ki',
                            socket: '1',
                          },
                          conditions: [
                            {
                              status: 'True',
                              type: 'Ready',
                            },
                          ],
                          labels: {
                            'beta.kubernetes.io/instance-type': 't3.2xlarge',
                            'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                            'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                            'node-role.kubernetes.io/master': '',
                            'node-role.kubernetes.io/worker': '',
                            'node.kubernetes.io/instance-type': 't3.2xlarge',
                          },
                          name: 'ip-10-0-162-59.ec2.internal',
                        },
                      ],
                      ready: 3,
                      unhealthy: 0,
                      unknown: 0,
                    },
                    kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    consoleURL:
                      'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                    isHive: false,
                    isHypershift: false,
                    isManaged: true,
                    isCurator: false,
                    isHostedCluster: false,
                    isSNOCluster: false,
                    hive: {
                      isHibernatable: false,
                      secrets: {},
                    },
                    clusterSet: 'default',
                    owner: {},
                    creationTimestamp: '2022-08-30T15:07:12Z',
                  },
                ],
                sortedClusterNames: ['local-cluster'],
              },
            },
            clustersNames: ['local-cluster'],
            resourceCount: 1,
          },
        },
      ],
      links: [
        {
          from: {
            uid: 'application--feng-bz',
          },
          to: {
            uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
          },
          type: '',
          specs: {
            isDesign: true,
          },
        },
        {
          from: {
            uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
          },
          to: {
            uid: 'member--rules--feng-bz--feng-bz-placement-1--0',
          },
          type: '',
          specs: {
            isDesign: true,
          },
        },
        {
          from: {
            uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
          },
          to: {
            uid: 'member--clusters--local-cluster--feng-bz-subscription-1',
          },
          type: '',
          specs: {
            isDesign: true,
          },
        },
        {
          from: {
            uid: 'member--clusters--local-cluster--feng-bz-subscription-1',
          },
          to: {
            uid: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
          },
          type: '',
        },
      ],
      hubClusterName: 'local-cluster',
    },
  }
  it('addDiagramDetails with project', async () => {
    const result = {
      'cluster-local-cluster-local-cluster': {
        id: 'member--clusters--local-cluster--feng-bz-subscription-1',
        name: 'local-cluster',
        namespace: '',
        specs: {
          clusters: [
            {
              clusterSet: 'default',
              consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
              creationTimestamp: '2022-08-30T15:07:12Z',
              displayName: 'local-cluster',
              distribution: {
                displayVersion: 'OpenShift 4.10.20',
                isManagedOpenShift: false,
                k8sVersion: 'v1.23.5+3afdacb',
                ocp: {
                  availableUpdates: [
                    '4.10.21',
                    '4.10.22',
                    '4.10.23',
                    '4.10.24',
                    '4.10.25',
                    '4.10.26',
                    '4.10.28',
                    '4.10.30',
                    '4.10.31',
                    '4.10.32',
                  ],
                  channel: 'stable-4.10',
                  desired: {
                    channels: ['candidate-4.10', 'candidate-4.11', 'eus-4.10', 'fast-4.10', 'fast-4.11', 'stable-4.10'],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                    version: '4.10.20',
                  },
                  desiredVersion: '4.10.20',
                  managedClusterClientConfig: {
                    caBundle:
                      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                    url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                  },
                  version: '4.10.20',
                  versionAvailableUpdates: [
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                      version: '4.10.21',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                      version: '4.10.22',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                      version: '4.10.23',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                      version: '4.10.24',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                      version: '4.10.25',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                      url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                      version: '4.10.26',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                      url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                      version: '4.10.28',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                      url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                      version: '4.10.30',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                      url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                      version: '4.10.31',
                    },
                    {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                      url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                      version: '4.10.32',
                    },
                  ],
                  versionHistory: [
                    {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      state: 'Completed',
                      verified: false,
                      version: '4.10.20',
                    },
                  ],
                },
                upgradeInfo: {
                  availableChannels: [
                    'candidate-4.10',
                    'candidate-4.11',
                    'eus-4.10',
                    'fast-4.10',
                    'fast-4.11',
                    'stable-4.10',
                  ],
                  availableUpdates: [
                    '4.10.21',
                    '4.10.22',
                    '4.10.23',
                    '4.10.24',
                    '4.10.25',
                    '4.10.26',
                    '4.10.28',
                    '4.10.30',
                    '4.10.31',
                    '4.10.32',
                  ],
                  currentChannel: 'stable-4.10',
                  currentVersion: '4.10.20',
                  desiredChannel: 'stable-4.10',
                  desiredVersion: '4.10.20',
                  hookFailed: false,
                  hooksInProgress: false,
                  isReadySelectChannels: true,
                  isReadyUpdates: true,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  isUpgrading: false,
                  latestJob: {
                    conditionMessage: '',
                    step: 'prehook-ansiblejob',
                  },
                  posthooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  prehooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  upgradeFailed: false,
                  upgradePercentage: '',
                },
              },
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              isCurator: false,
              isHive: false,
              isHostedCluster: false,
              isHypershift: false,
              isManaged: true,
              isSNOCluster: false,
              kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
              labels: {
                cloud: 'Amazon',
                cluster: 'error',
                'cluster.open-cluster-management.io/clusterset': 'default',
                clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                'feature.open-cluster-management.io/addon-application-manager': 'available',
                'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                'feature.open-cluster-management.io/addon-work-manager': 'available',
                'installer.name': 'multiclusterhub',
                'installer.namespace': 'open-cluster-management',
                'local-cluster': 'true',
                name: 'local-cluster',
                openshiftVersion: '4.10.20',
                'velero.io/exclude-from-backup': 'true',
                vendor: 'OpenShift',
              },
              name: 'local-cluster',
              namespace: 'local-cluster',
              nodes: {
                nodeList: [
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-129-97.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-156-177.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32561100Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 't3.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 't3.2xlarge',
                    },
                    name: 'ip-10-0-162-59.ec2.internal',
                  },
                ],
                ready: 3,
                unhealthy: 0,
                unknown: 0,
              },
              owner: {},
              provider: 'aws',
              status: 'ready',
              uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
            },
          ],
          clustersNames: ['local-cluster'],
          resourceCount: 1,
          sortedClusterNames: ['local-cluster'],
          subscription: {
            apiVersion: 'apps.open-cluster-management.io/v1',
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
                  creationTimestamp: '2022-09-09T16:20:38Z',
                  generation: 1,
                  name: 'ggithubcom-simondelord-acm-templates',
                  namespace: 'ggithubcom-simondelord-acm-templates-ns',
                  resourceVersion: '21085701',
                  uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                },
                spec: {
                  pathname: 'https://github.com/SimonDelord/ACM-Templates',
                  type: 'Git',
                },
              },
            ],
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'master',
                'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                'apps.open-cluster-management.io/git-path': 'resources17',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2022-09-22T19:57:34Z',
              generation: 1,
              labels: {
                app: 'feng-bz',
                'app.kubernetes.io/part-of': 'feng-bz',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-bz-subscription-1',
              namespace: 'feng-bz',
              resourceVersion: '31030056',
              uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
            },
            posthooks: [],
            prehooks: [],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2022-09-22T19:57:35Z',
                generation: 3,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-bz-subscription-1',
                    uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                  },
                ],
                resourceVersion: '31160390',
                uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'project.openshift.io/v1',
                  kind: 'Project',
                  name: 'acm-namespace3',
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
            rules: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                  annotations: {
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                  },
                  name: 'feng-bz-placement-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030028',
                  uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                },
                spec: {
                  clusterSelector: {
                    matchLabels: {
                      'local-cluster': 'true',
                    },
                  },
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'local-cluster',
                      clusterNamespace: 'local-cluster',
                    },
                  ],
                },
              },
            ],
            spec: {
              channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'feng-bz-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2022-09-22T19:57:35Z',
              phase: 'Propagated',
            },
          },
          title: '',
        },
        type: 'cluster',
        uid: 'member--clusters--local-cluster--feng-bz-subscription-1',
      },
      'feng-bz-subscription-1': {
        id: 'member--subscription--feng-bz--feng-bz-subscription-1',
        name: 'feng-bz-subscription-1',
        namespace: 'feng-bz',
        report: {
          apiVersion: 'apps.open-cluster-management.io/v1alpha1',
          kind: 'SubscriptionReport',
          metadata: {
            creationTimestamp: '2022-09-22T19:57:35Z',
            generation: 3,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
            },
            name: 'feng-bz-subscription-1',
            namespace: 'feng-bz',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-bz-subscription-1',
                uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
              },
            ],
            resourceVersion: '31160390',
            uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'project.openshift.io/v1',
              kind: 'Project',
              name: 'acm-namespace3',
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
        specs: {
          clustersNames: ['local-cluster'],
          hasRules: true,
          isDesign: true,
          isPlaced: true,
          raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
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
                  creationTimestamp: '2022-09-09T16:20:38Z',
                  generation: 1,
                  name: 'ggithubcom-simondelord-acm-templates',
                  namespace: 'ggithubcom-simondelord-acm-templates-ns',
                  resourceVersion: '21085701',
                  uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                },
                spec: {
                  pathname: 'https://github.com/SimonDelord/ACM-Templates',
                  type: 'Git',
                },
              },
            ],
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'master',
                'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                'apps.open-cluster-management.io/git-path': 'resources17',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2022-09-22T19:57:34Z',
              generation: 1,
              labels: {
                app: 'feng-bz',
                'app.kubernetes.io/part-of': 'feng-bz',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-bz-subscription-1',
              namespace: 'feng-bz',
              resourceVersion: '31030056',
              uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
            },
            posthooks: [],
            prehooks: [],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2022-09-22T19:57:35Z',
                generation: 3,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                },
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-bz-subscription-1',
                    uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                  },
                ],
                resourceVersion: '31160390',
                uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'project.openshift.io/v1',
                  kind: 'Project',
                  name: 'acm-namespace3',
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
            rules: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'PlacementRule',
                metadata: {
                  annotations: {
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:35Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                  },
                  name: 'feng-bz-placement-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030028',
                  uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                },
                spec: {
                  clusterSelector: {
                    matchLabels: {
                      'local-cluster': 'true',
                    },
                  },
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'local-cluster',
                      clusterNamespace: 'local-cluster',
                    },
                  ],
                },
              },
            ],
            spec: {
              channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'feng-bz-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2022-09-22T19:57:35Z',
              phase: 'Propagated',
            },
          },
          subscriptionModel: {
            'feng-bz-subscription-1-local-cluster-feng-bz': [
              {
                _gitbranch: 'master',
                _gitpath: 'resources17',
                _hubClusterResource: 'true',
                _rbac: 'feng-bz_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                cluster: 'local-cluster',
                created: '2022-09-22T19:57:34Z',
                kind: 'subscription',
                kind_plural: 'subscriptions',
                label:
                  'app.kubernetes.io/part-of=feng-bz; app=feng-bz; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'feng-bz-subscription-1',
                namespace: 'feng-bz',
                status: 'Propagated',
                timeWindow: 'none',
              },
            ],
            'feng-bz-subscription-1-local-local-cluster-feng-bz': [
              {
                _gitbranch: 'master',
                _gitpath: 'resources17',
                _hostingSubscription: 'feng-bz/feng-bz-subscription-1',
                _hubClusterResource: 'true',
                _rbac: 'feng-bz_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/7cf6fb13-dc85-4711-9a73-81cf450cef1b',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                cluster: 'local-cluster',
                created: '2022-09-22T19:57:35Z',
                kind: 'subscription',
                kind_plural: 'subscriptions',
                label:
                  'app.kubernetes.io/part-of=feng-bz; app=feng-bz; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'true',
                name: 'feng-bz-subscription-1-local',
                namespace: 'feng-bz',
                status: 'Subscribed',
                timeWindow: 'none',
              },
            ],
          },
          title: 'resources17',
        },
        type: 'subscription',
        uid: 'member--subscription--feng-bz--feng-bz-subscription-1',
      },
      'project-acm-namespace3-local-cluster': {
        id: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
        name: 'acm-namespace3',
        specs: {
          clustersNames: ['local-cluster'],
          isDesign: false,
          parent: {
            parentId: 'member--clusters--local-cluster--feng-bz-subscription-1',
            parentName: 'local-cluster',
            parentSpecs: {
              clusters: [
                {
                  clusterSet: 'default',
                  consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                  creationTimestamp: '2022-08-30T15:07:12Z',
                  displayName: 'local-cluster',
                  distribution: {
                    displayVersion: 'OpenShift 4.10.20',
                    isManagedOpenShift: false,
                    k8sVersion: 'v1.23.5+3afdacb',
                    ocp: {
                      availableUpdates: [
                        '4.10.21',
                        '4.10.22',
                        '4.10.23',
                        '4.10.24',
                        '4.10.25',
                        '4.10.26',
                        '4.10.28',
                        '4.10.30',
                        '4.10.31',
                        '4.10.32',
                      ],
                      channel: 'stable-4.10',
                      desired: {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                        version: '4.10.20',
                      },
                      desiredVersion: '4.10.20',
                      managedClusterClientConfig: {
                        caBundle:
                          'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                        url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                      },
                      version: '4.10.20',
                      versionAvailableUpdates: [
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                          version: '4.10.21',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                          version: '4.10.22',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                          url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                          version: '4.10.23',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                          version: '4.10.24',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                          version: '4.10.25',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                          url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                          version: '4.10.26',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                          url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                          version: '4.10.28',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                          url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                          version: '4.10.30',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                          url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                          version: '4.10.31',
                        },
                        {
                          channels: [
                            'candidate-4.10',
                            'candidate-4.11',
                            'eus-4.10',
                            'fast-4.10',
                            'fast-4.11',
                            'stable-4.10',
                          ],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                          url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                          version: '4.10.32',
                        },
                      ],
                      versionHistory: [
                        {
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                          state: 'Completed',
                          verified: false,
                          version: '4.10.20',
                        },
                      ],
                    },
                    upgradeInfo: {
                      availableChannels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                      ],
                      availableUpdates: [
                        '4.10.21',
                        '4.10.22',
                        '4.10.23',
                        '4.10.24',
                        '4.10.25',
                        '4.10.26',
                        '4.10.28',
                        '4.10.30',
                        '4.10.31',
                        '4.10.32',
                      ],
                      currentChannel: 'stable-4.10',
                      currentVersion: '4.10.20',
                      desiredChannel: 'stable-4.10',
                      desiredVersion: '4.10.20',
                      hookFailed: false,
                      hooksInProgress: false,
                      isReadySelectChannels: true,
                      isReadyUpdates: true,
                      isSelectingChannel: false,
                      isUpgradeCuration: false,
                      isUpgrading: false,
                      latestJob: {
                        conditionMessage: '',
                        step: 'prehook-ansiblejob',
                      },
                      posthooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      prehooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      upgradeFailed: false,
                      upgradePercentage: '',
                    },
                  },
                  hive: {
                    isHibernatable: false,
                    secrets: {},
                  },
                  isCurator: false,
                  isHive: false,
                  isHostedCluster: false,
                  isHypershift: false,
                  isManaged: true,
                  isSNOCluster: false,
                  kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                  labels: {
                    cloud: 'Amazon',
                    cluster: 'error',
                    'cluster.open-cluster-management.io/clusterset': 'default',
                    clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                    'feature.open-cluster-management.io/addon-application-manager': 'available',
                    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                    'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                    'feature.open-cluster-management.io/addon-work-manager': 'available',
                    'installer.name': 'multiclusterhub',
                    'installer.namespace': 'open-cluster-management',
                    'local-cluster': 'true',
                    name: 'local-cluster',
                    openshiftVersion: '4.10.20',
                    'velero.io/exclude-from-backup': 'true',
                    vendor: 'OpenShift',
                  },
                  name: 'local-cluster',
                  namespace: 'local-cluster',
                  nodes: {
                    nodeList: [
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-129-97.ec2.internal',
                      },
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-156-177.ec2.internal',
                      },
                      {
                        capacity: {
                          cpu: '8',
                          memory: '32561100Ki',
                          socket: '1',
                        },
                        conditions: [
                          {
                            status: 'True',
                            type: 'Ready',
                          },
                        ],
                        labels: {
                          'beta.kubernetes.io/instance-type': 't3.2xlarge',
                          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 't3.2xlarge',
                        },
                        name: 'ip-10-0-162-59.ec2.internal',
                      },
                    ],
                    ready: 3,
                    unhealthy: 0,
                    unknown: 0,
                  },
                  owner: {},
                  provider: 'aws',
                  status: 'ready',
                  uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
                },
              ],
              clustersNames: ['local-cluster'],
              resourceCount: 1,
              sortedClusterNames: ['local-cluster'],
              subscription: {
                apiVersion: 'apps.open-cluster-management.io/v1',
                channels: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'Channel',
                    metadata: {
                      annotations: {
                        'apps.open-cluster-management.io/reconcile-rate': 'medium',
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-09T16:20:38Z',
                      generation: 1,
                      name: 'ggithubcom-simondelord-acm-templates',
                      namespace: 'ggithubcom-simondelord-acm-templates-ns',
                      resourceVersion: '21085701',
                      uid: 'dead9d29-ee49-4fa1-a68f-cfd93bb2c415',
                    },
                    spec: {
                      pathname: 'https://github.com/SimonDelord/ACM-Templates',
                      type: 'Git',
                    },
                  },
                ],
                kind: 'Subscription',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/git-branch': 'master',
                    'apps.open-cluster-management.io/git-current-commit': '35dec8c199dcd7c0e651da03094156968e5d92f7',
                    'apps.open-cluster-management.io/git-path': 'resources17',
                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2022-09-22T19:57:34Z',
                  generation: 1,
                  labels: {
                    app: 'feng-bz',
                    'app.kubernetes.io/part-of': 'feng-bz',
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                  },
                  name: 'feng-bz-subscription-1',
                  namespace: 'feng-bz',
                  resourceVersion: '31030056',
                  uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                },
                posthooks: [],
                prehooks: [],
                report: {
                  apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                  kind: 'SubscriptionReport',
                  metadata: {
                    creationTimestamp: '2022-09-22T19:57:35Z',
                    generation: 3,
                    labels: {
                      'apps.open-cluster-management.io/hosting-subscription': 'feng-bz.feng-bz-subscription-1',
                    },
                    name: 'feng-bz-subscription-1',
                    namespace: 'feng-bz',
                    ownerReferences: [
                      {
                        apiVersion: 'apps.open-cluster-management.io/v1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Subscription',
                        name: 'feng-bz-subscription-1',
                        uid: '6a7262ca-46ff-428a-9abb-e987b4acdc3b',
                      },
                    ],
                    resourceVersion: '31160390',
                    uid: 'c9acea10-4a99-4f8c-b1ba-cbd5fd661fd9',
                  },
                  reportType: 'Application',
                  resources: [
                    {
                      apiVersion: 'project.openshift.io/v1',
                      kind: 'Project',
                      name: 'acm-namespace3',
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
                rules: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'PlacementRule',
                    metadata: {
                      annotations: {
                        'open-cluster-management.io/user-group':
                          'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                        'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                      },
                      creationTimestamp: '2022-09-22T19:57:35Z',
                      generation: 1,
                      labels: {
                        app: 'feng-bz',
                      },
                      name: 'feng-bz-placement-1',
                      namespace: 'feng-bz',
                      resourceVersion: '31030028',
                      uid: '17215d0c-b3e7-475f-ba0b-4d7e553c8650',
                    },
                    spec: {
                      clusterSelector: {
                        matchLabels: {
                          'local-cluster': 'true',
                        },
                      },
                    },
                    status: {
                      decisions: [
                        {
                          clusterName: 'local-cluster',
                          clusterNamespace: 'local-cluster',
                        },
                      ],
                    },
                  },
                ],
                spec: {
                  channel: 'ggithubcom-simondelord-acm-templates-ns/ggithubcom-simondelord-acm-templates',
                  placement: {
                    placementRef: {
                      kind: 'PlacementRule',
                      name: 'feng-bz-placement-1',
                    },
                  },
                },
                status: {
                  lastUpdateTime: '2022-09-22T19:57:35Z',
                  phase: 'Propagated',
                },
              },
              title: '',
            },
            parentType: 'cluster',
          },
          projectModel: {
            'acm-namespace3-local-cluster': [
              {
                _hostingSubscription: 'feng-bz/feng-bz-subscription-1-local',
                _hubClusterResource: 'true',
                _rbac: 'null_null_namespaces',
                _uid: 'local-cluster/365ceb04-1cd9-41fe-9213-bc3d2e28a2da',
                apiversion: 'v1',
                cluster: 'local-cluster',
                created: '2022-09-22T20:12:37Z',
                kind: 'namespace',
                kind_plural: 'namespaces',
                label:
                  'app.kubernetes.io/part-of=feng-bz; app=acm-namespace3; apps.open-cluster-management.io/reconcile-rate=medium; kubernetes.io/metadata.name=acm-namespace3',
                name: 'acm-namespace3',
                status: 'Active',
              },
            ],
          },
          resourceCount: 1,
        },
        type: 'project',
        uid: 'member--deployed-resource--member--clusters--local-cluster--feng-bz-subscription-1--undefined--acm-namespace3--project',
      },
    }
    expect(
      addDiagramDetails(
        mockData.resourceStatuses,
        mockData.resourceMap,
        mockData.isClusterGrouped,
        mockData.hasHelmReleases,
        mockData.topology
      )
    ).toEqual(result)
  })
})

describe('mapSingleApplication', () => {
  const app = {
    items: [
      {
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label:
          'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        status: 'Propagated',
        timeWindow: 'none',
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
      },
    ],
    related: [
      {
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label:
          'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        status: 'Propagated',
        timeWindow: 'none',
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
      },
    ],
  }

  const result = {
    _gitbranch: 'main',
    _gitpath: 'helloworld',
    _hubClusterResource: 'true',
    _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
    _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
    apigroup: 'apps.open-cluster-management.io',
    apiversion: 'v1',
    channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    cluster: 'local-cluster',
    created: '2022-09-16T21:13:04Z',
    kind: 'application',
    kind_plural: 'applications',
    label:
      'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
    localPlacement: 'false',
    name: 'feng-hello-application',
    namespace: 'feng-hello',
    related: [
      {
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label:
          'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        status: 'Propagated',
        timeWindow: 'none',
      },
    ],
    status: 'Propagated',
    timeWindow: 'none',
  }
  it('mapSingleApplication primary app', () => {
    expect(mapSingleApplication(app)).toEqual(result)
  })
})

describe('mapSingleApplication', () => {
  const app = {
    items: [
      {
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label: 'app.kubernetes.io/instance=feng-hello',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        status: 'Propagated',
        timeWindow: 'none',
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
      },
    ],
    related: [
      {
        items: [
          {
            ClusterCertificateRotated: 'True',
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            addon:
              'application-manager=true; cert-policy-controller=true; policy-controller=true; search-collector=false',
            apigroup: 'internal.open-cluster-management.io',
            consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
            cpu: 24,
            created: '2022-08-30T15:07:12Z',
            kind: 'cluster',
            kubernetesVersion: 'v1.23.5+3afdacb',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; cluster=error; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '97683300Ki',
            name: 'local-cluster',
            nodes: 3,
            status: 'OK',
            _clusterNamespace: 'local-cluster',
            _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
            _uid: 'cluster__local-cluster',
          },
        ],
        kind: 'cluster',
      },
    ],
  }

  const result = {
    _gitbranch: 'main',
    _gitpath: 'helloworld',
    _hubClusterResource: 'true',
    _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
    _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
    apigroup: 'apps.open-cluster-management.io',
    apiversion: 'v1',
    channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    cluster: 'local-cluster',
    created: '2022-09-16T21:13:04Z',
    kind: 'application',
    kind_plural: 'applications',
    label: 'app.kubernetes.io/instance=feng-hello',
    localPlacement: 'false',
    name: 'feng-hello-application',
    namespace: 'feng-hello',
    related: [
      {
        items: [
          {
            ClusterCertificateRotated: 'True',
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _clusterNamespace: 'local-cluster',
            _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
            _uid: 'cluster__local-cluster',
            addon:
              'application-manager=true; cert-policy-controller=true; policy-controller=true; search-collector=false',
            apigroup: 'internal.open-cluster-management.io',
            consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
            cpu: 24,
            created: '2022-08-30T15:07:12Z',
            kind: 'cluster',
            kubernetesVersion: 'v1.23.5+3afdacb',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; cluster=error; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '97683300Ki',
            name: 'local-cluster',
            nodes: 3,
            status: 'OK',
          },
        ],
        kind: 'cluster',
      },
      {
        items: [
          {
            _gitbranch: 'main',
            _gitpath: 'helloworld',
            _hubClusterResource: 'true',
            _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
            _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
            apigroup: 'apps.open-cluster-management.io',
            apiversion: 'v1',
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            cluster: 'local-cluster',
            created: '2022-09-16T21:13:04Z',
            kind: 'application',
            kind_plural: 'applications',
            label: 'app.kubernetes.io/instance=feng-hello',
            localPlacement: 'false',
            name: 'feng-hello-application',
            namespace: 'feng-hello',
            status: 'Propagated',
            timeWindow: 'none',
          },
        ],
        kind: 'application',
      },
    ],
    status: 'Propagated',
    timeWindow: 'none',
  }
  it('mapSingleApplication argo child app', () => {
    expect(mapSingleApplication(app)).toEqual(result)
  })
})

describe('syncReplicaSetCountToPodNode', () => {
  const resourceMap = {
    'pod-book-import-feng-managed,local-cluster': {
      name: 'book-import',
      namespace: 'feng-gatekeeper',
      type: 'pod',
      id: 'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import--replicaset--book-import--pod--book-import',
      uid: 'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import--replicaset--book-import--pod--book-import',
      specs: {
        isDesign: false,
        resourceCount: 2,
        clustersNames: ['feng-managed', 'local-cluster'],
        replicaCount: 1,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import--replicaset--book-import',
          parentName: 'book-import',
          parentType: 'replicaset',
        },
        searchClusters: [
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterConditionClockSynced: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _relatedUids: [
              'feng-managed/2713117f-0d92-4422-a624-fa5cd7d9289a',
              'feng-managed/ef444b5c-6159-494b-a803-a05c72f9e77b',
              'feng-managed/63d09020-7d3d-4557-b668-3660ddfe62f2',
              'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
            ],
            _uid: 'cluster__feng-managed',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=true; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'feng-managed',
            consoleURL:
              'https://console-openshift-console.apps.app-aws-east1-412-sno-2xl-czhzf.dev11.red-chesterfield.com',
            cpu: '8',
            created: '2024-08-28T19:31:52Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.25.8+27e744f',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=be369068-8d2d-441d-aedf-c7edda2ebf1e; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=feng-managed; openshiftVersion=4.12.14; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; vendor=OpenShift',
            memory: '32098812Ki',
            name: 'feng-managed',
            nodes: '1',
          },
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterConditionClockSynced: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _relatedUids: [
              'local-cluster/21cd3546-2dd6-485e-91e1-3c71e78978dc',
              'local-cluster/67a2c255-307c-42e8-a451-42b37ff04bfc',
              'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              'local-cluster/30f97faf-cb82-4010-8895-38c2a526b270',
              'local-cluster/d7e2f9e1-3d4c-49d4-a409-765f50cf1691',
              'local-cluster/352c75ee-8375-4257-8d00-515c1ca67d5d',
            ],
            _uid: 'cluster__local-cluster',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'local-cluster',
            consoleURL: 'https://console-openshift-console.apps.app-aws-east2-413-hub-fsjvw.dev11.red-chesterfield.com',
            cpu: '24',
            created: '2024-08-28T17:35:22Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.28.11+add48d0',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=e71c9a56-bd8f-4a53-abf9-401fed971a82; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.15.22; openshiftVersion-major=4; openshiftVersion-major-minor=4.15; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '96115320Ki',
            name: 'local-cluster',
            nodes: '6',
          },
        ],
        podModel: {
          'book-import-feng-managed-feng-gatekeeper': [
            {
              _ownerUID: 'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
              _uid: 'feng-managed/2713117f-0d92-4422-a624-fa5cd7d9289a',
              apiversion: 'v1',
              cluster: 'feng-managed',
              container: 'book-import',
              created: '2024-08-28T19:52:07Z',
              hostIP: '10.0.138.250',
              image: 'quay.io/jpacker/hugo-nginx:latest',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=55cdf9cf5b',
              name: 'book-import-55cdf9cf5b-nq84b',
              namespace: 'feng-gatekeeper',
              podIP: '10.128.0.108',
              restarts: '5',
              startedAt: '2024-08-28T19:52:07Z',
              status: 'Running',
            },
            {
              _ownerUID: 'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
              _uid: 'feng-managed/63d09020-7d3d-4557-b668-3660ddfe62f2',
              apiversion: 'v1',
              cluster: 'feng-managed',
              container: 'book-import',
              created: '2024-08-28T19:52:07Z',
              hostIP: '10.0.138.250',
              image: 'quay.io/jpacker/hugo-nginx:latest',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=55cdf9cf5b',
              name: 'book-import-55cdf9cf5b-frzx2',
              namespace: 'feng-gatekeeper',
              podIP: '10.128.0.109',
              restarts: '5',
              startedAt: '2024-08-28T19:52:07Z',
              status: 'Running',
            },
            {
              _ownerUID: 'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
              _uid: 'feng-managed/ef444b5c-6159-494b-a803-a05c72f9e77b',
              apiversion: 'v1',
              cluster: 'feng-managed',
              container: 'book-import',
              created: '2024-08-28T19:52:07Z',
              hostIP: '10.0.138.250',
              image: 'quay.io/jpacker/hugo-nginx:latest',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=55cdf9cf5b',
              name: 'book-import-55cdf9cf5b-zw2k2',
              namespace: 'feng-gatekeeper',
              podIP: '10.128.0.107',
              restarts: '5',
              startedAt: '2024-08-28T19:52:07Z',
              status: 'Running',
            },
          ],
          'book-import-local-cluster-feng-gatekeeper': [
            {
              _hubClusterResource: 'true',
              _ownerUID: 'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              _uid: 'local-cluster/21cd3546-2dd6-485e-91e1-3c71e78978dc',
              apiversion: 'v1',
              cluster: 'local-cluster',
              container: 'book-import',
              created: '2024-08-30T15:22:40Z',
              hostIP: '10.0.149.167',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=5c8b5bd988',
              name: 'book-import-5c8b5bd988-r89w4',
              namespace: 'feng-gatekeeper',
              podIP: '10.128.2.107',
              restarts: '4',
              startedAt: '2024-08-30T15:22:40Z',
              status: 'Running',
            },
            {
              _hubClusterResource: 'true',
              _ownerUID: 'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              _uid: 'local-cluster/30f97faf-cb82-4010-8895-38c2a526b270',
              apiversion: 'v1',
              cluster: 'local-cluster',
              container: 'book-import',
              created: '2024-08-30T15:22:38Z',
              hostIP: '10.0.182.231',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=5c8b5bd988',
              name: 'book-import-5c8b5bd988-vsrnk',
              namespace: 'feng-gatekeeper',
              podIP: '10.129.2.13',
              restarts: '4',
              startedAt: '2024-08-30T15:22:38Z',
              status: 'Running',
            },
            {
              _hubClusterResource: 'true',
              _ownerUID: 'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              _uid: 'local-cluster/67a2c255-307c-42e8-a451-42b37ff04bfc',
              apiversion: 'v1',
              cluster: 'local-cluster',
              container: 'book-import',
              created: '2024-08-30T15:22:55Z',
              hostIP: '10.0.182.231',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'name=book-import; pod-template-hash=5c8b5bd988',
              name: 'book-import-5c8b5bd988-qdscb',
              namespace: 'feng-gatekeeper',
              podIP: '10.129.2.14',
              restarts: '4',
              startedAt: '2024-08-30T15:22:55Z',
              status: 'Running',
            },
          ],
        },
      },
    },
    'replicaset-book-import-feng-managed,local-cluster': {
      name: 'book-import',
      namespace: 'feng-gatekeeper',
      type: 'replicaset',
      id: 'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import--replicaset--book-import',
      uid: 'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import--replicaset--book-import',
      specs: {
        isDesign: false,
        resourceCount: 2,
        clustersNames: ['feng-managed', 'local-cluster'],
        replicaCount: 1,
        parent: {
          parentId: 'member--member--deployable--member--clusters----deployment--feng-gatekeeper--book-import',
          parentName: 'book-import',
          parentType: 'deployment',
        },
        searchClusters: [
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterConditionClockSynced: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _relatedUids: [
              'feng-managed/2713117f-0d92-4422-a624-fa5cd7d9289a',
              'feng-managed/ef444b5c-6159-494b-a803-a05c72f9e77b',
              'feng-managed/63d09020-7d3d-4557-b668-3660ddfe62f2',
              'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
            ],
            _uid: 'cluster__feng-managed',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=true; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'feng-managed',
            consoleURL:
              'https://console-openshift-console.apps.app-aws-east1-412-sno-2xl-czhzf.dev11.red-chesterfield.com',
            cpu: '8',
            created: '2024-08-28T19:31:52Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.25.8+27e744f',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=be369068-8d2d-441d-aedf-c7edda2ebf1e; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=feng-managed; openshiftVersion=4.12.14; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; vendor=OpenShift',
            memory: '32098812Ki',
            name: 'feng-managed',
            nodes: '1',
          },
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterConditionClockSynced: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _relatedUids: [
              'local-cluster/21cd3546-2dd6-485e-91e1-3c71e78978dc',
              'local-cluster/67a2c255-307c-42e8-a451-42b37ff04bfc',
              'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              'local-cluster/30f97faf-cb82-4010-8895-38c2a526b270',
              'local-cluster/d7e2f9e1-3d4c-49d4-a409-765f50cf1691',
              'local-cluster/352c75ee-8375-4257-8d00-515c1ca67d5d',
            ],
            _uid: 'cluster__local-cluster',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'local-cluster',
            consoleURL: 'https://console-openshift-console.apps.app-aws-east2-413-hub-fsjvw.dev11.red-chesterfield.com',
            cpu: '24',
            created: '2024-08-28T17:35:22Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.28.11+add48d0',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=e71c9a56-bd8f-4a53-abf9-401fed971a82; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.15.22; openshiftVersion-major=4; openshiftVersion-major-minor=4.15; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '96115320Ki',
            name: 'local-cluster',
            nodes: '6',
          },
        ],
        replicasetModel: {
          'book-import-feng-managed-feng-gatekeeper': [
            {
              _uid: 'feng-managed/3b3c2e42-c92e-4033-8eab-b1b3fc182d39',
              apigroup: 'apps',
              apiversion: 'v1',
              cluster: 'feng-managed',
              created: '2024-08-28T19:52:07Z',
              current: '3',
              desired: '3',
              kind: 'ReplicaSet',
              kind_plural: 'replicasets',
              label: 'name=book-import; pod-template-hash=55cdf9cf5b',
              name: 'book-import-55cdf9cf5b',
              namespace: 'feng-gatekeeper',
            },
          ],
          'book-import-local-cluster-feng-gatekeeper': [
            {
              _hubClusterResource: 'true',
              _uid: 'local-cluster/05c3af0c-5d2e-4a5a-a873-5d7876e7c14d',
              apigroup: 'apps',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2024-08-30T15:22:38Z',
              current: '3',
              desired: '3',
              kind: 'ReplicaSet',
              kind_plural: 'replicasets',
              label: 'name=book-import; pod-template-hash=5c8b5bd988',
              name: 'book-import-5c8b5bd988',
              namespace: 'feng-gatekeeper',
            },
          ],
        },
      },
    },
  }

  it('syncReplicaSetCountToPodNode sync replicaset to pod', () => {
    expect(syncReplicaSetCountToPodNode(resourceMap)).toEqual(undefined)
  })
})
