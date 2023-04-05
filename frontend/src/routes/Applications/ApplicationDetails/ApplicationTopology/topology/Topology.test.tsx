/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
//import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { nockSearch } from '../../../../../lib/nock-util'
import {
  mockSearchQuerySearchDisabledManagedClusters,
  mockSearchResponseSearchDisabledManagedClusters,
} from '../../../Application.sharedmocks'

import { Topology, TopologyProps } from './Topology'
const mockProcessactionlink = jest.fn()
const mockDispatchaction = jest.fn()
const mockHandleerrormsg = jest.fn()
const mockComputenodestatus = jest.fn()
const mockGetnodedescription = jest.fn()
const mockGetnodetitle = jest.fn()
const mockGetsectiontitles = jest.fn()
const mockGetnodedetails = jest.fn()
const mockUpdatenodestatus = jest.fn()
const mockUpdatenodeicons = jest.fn()
const mockGetallfilters = jest.fn()
const mockGetavailablefilters = jest.fn()
const mockGetsearchfilter = jest.fn()
const mockFilternodes = jest.fn()
const mockGetconnectedlayoutoptions = jest.fn()
const mockGetunconnectedlayoutoptions = jest.fn()
const mockSetdrawercontent = jest.fn()

describe('Topology tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // jest jsdom doesn't have SVGGraphElement with getBBox
    Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      }),
    })

    nockSearch(mockSearchQuerySearchDisabledManagedClusters, mockSearchResponseSearchDisabledManagedClusters)
  })

  test('app subscription topology no placement', async () => {
    const { container } = render(<Topology {...props1} />)

    /////////////////////////////////////////////////
    // how to read topology button
    expect(
      screen.getByRole('button', {
        name: /how to read topology/i,
      })
    ).toBeInTheDocument()
    userEvent.click(
      screen.getByRole('button', {
        name: /how to read topology/i,
      })
    )
    expect(mockSetdrawercontent).toHaveBeenCalledTimes(1)

    /////////////////////////////////////////////////
    // channel changer
    userEvent.click(
      screen.getByRole('button', {
        name: /all subscriptions/i,
      })
    )
    userEvent.click(screen.getByText(/test-subscription-2/i))
    expect(
      screen.getByRole('button', {
        name: /test-subscription-2/i,
      })
    ).toBeInTheDocument()

    /////////////////////////////////////////////////
    // zoom buttons
    userEvent.click(
      screen.getByRole('button', {
        name: /zoom in/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /zoom out/i,
      })
    )
    userEvent.click(screen.getByText(/fit to screen/i))
    userEvent.click(screen.getByText(/reset view/i))

    expect(container.querySelectorAll("[data-type='edge']")).toHaveLength(9)
    // nodes
    expect(container.querySelectorAll("[data-id='application--test']")).toHaveLength(2)
    expect(
      container.querySelectorAll(
        "[data-id='member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy']"
      )
    ).toHaveLength(2)
    expect(
      container.querySelectorAll(
        "[data-id='member--deployed-resource--member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route--test--helloworld-app-svc--service']"
      )
    ).toHaveLength(2)
  })

  test('app subscription topology with placement', async () => {
    const { container } = render(<Topology {...props2} />)

    /////////////////////////////////////////////////
    // verify topology
    // edges
    expect(container.querySelectorAll("[data-type='edge']")).toHaveLength(9)
    // nodes
    expect(container.querySelectorAll("[href = '#nodeIcon_placements']")).toHaveLength(2)
    expect(container.querySelectorAll("[href = '#nodeIcon_service']")).toHaveLength(1)
    expect(container.querySelectorAll("[href = '#nodeIcon_application']")).toHaveLength(1)
    // status icons
    expect(container.querySelectorAll("[href = '#nodeStatusIcon_success']")).toHaveLength(9)
    expect(container.querySelectorAll("[href = '#nodeStatusIcon_warning']")).toHaveLength(1)
    expect(container.querySelectorAll("[href = '#nodeStatusIcon_pending']")).toHaveLength(0)
  })
})

const props1: TopologyProps = {
  disableRenderConstraint: true,
  elements: {
    activeChannel: 'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    channels: [
      '__ALL__/__ALL__//__ALL__/__ALL__',
      'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test-subscription-3//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    ],
    links: [
      {
        source: 'application--test',
        target: 'member--subscription--test--test-subscription-1',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test-subscription-1',
        target: 'member--clusters----test-subscription-1',
        label: '',
        type: '',
      },
      {
        source: 'member--clusters----test-subscription-1',
        target: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
        label: '',
        type: '',
      },
      {
        source: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
        target:
          'member--deployed-resource--member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route--test--helloworld-app-svc--service',
        label: '',
        type: '',
      },
      {
        source: 'member--clusters----test-subscription-1',
        target:
          'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
        label: '',
        type: '',
      },
      {
        source:
          'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
        target:
          'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
        label: '',
        type: '',
      },
      {
        source:
          'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
        target:
          'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        label: '',
        type: '',
      },
      {
        source: 'application--test',
        target: 'member--subscription--test--test-subscription-2',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test-subscription-2',
        target: 'member--clusters----test-subscription-2',
        label: '',
        type: '',
      },
    ],
    nodes: [
      {
        name: '',
        namespace: 'test',
        type: 'application',
        id: 'application--test',
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
            kind: 'Application',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/deployables': '',
                'apps.open-cluster-management.io/subscriptions':
                  'test/test-subscription-3,test/test-subscription-1-local,test/test-subscription-3-local,test/test-subscription-2-local,test/test-subscription-1,test/test-subscription-2',
                'open-cluster-management.io/user-group':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
              },
              name: 'test',
              namespace: 'test',
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
                    values: ['test'],
                  },
                ],
              },
            },
          },
          activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
          allSubscriptions: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                labels: {
                  app: 'test',
                  'app.kubernetes.io/part-of': 'test',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'test-subscription-1',
                namespace: 'test',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'test-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-11-16T14:29:26Z',
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
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              rules: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'test.test-subscription-1',
                  },
                  name: 'test-subscription-1',
                  namespace: 'test',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'test-subscription-1',
                    },
                  ],
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: 'helloworld-app-deploy',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'route.openshift.io/v1',
                    kind: 'Route',
                    name: 'helloworld-app-route',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'Service',
                    name: 'helloworld-app-svc',
                    namespace: 'test',
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
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                  'apps.open-cluster-management.io/git-path': 'large-nb-resource-app',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                labels: {
                  app: 'test',
                  'app.kubernetes.io/part-of': 'test',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'test-subscription-2',
                namespace: 'test',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'test-placement-2',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-11-16T14:29:27Z',
                phase: 'Propagated',
              },
              posthooks: [],
              prehooks: [],
              channels: [null],
              rules: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'test.test-subscription-2',
                  },
                  name: 'test-subscription-2',
                  namespace: 'test',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'test-subscription-2',
                    },
                  ],
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-31',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-50',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'Service',
                    name: 'helloworld-app-svc',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-2222',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-12',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-58',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-61',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: 'pause-deploy3',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-10',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-24',
                    namespace: 'test',
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
                  clusters: '1',
                  deployed: '0',
                  failed: '1',
                  inProgress: '0',
                  propagationFailed: '0',
                },
              },
            },
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                  'apps.open-cluster-management.io/git-path': 'mortgage',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                labels: {
                  app: 'test',
                  'app.kubernetes.io/part-of': 'test',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'test-subscription-3',
                namespace: 'test',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'test-placement-3',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-11-16T14:29:28Z',
                phase: 'Propagated',
              },
              posthooks: [],
              prehooks: [],
              channels: [null],
              rules: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'test.test-subscription-3',
                  },
                  name: 'test-subscription-3',
                  namespace: 'test',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'test-subscription-3',
                    },
                  ],
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: 'mortgage-app-deploy',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'Service',
                    name: 'mortgage-app-svc',
                    namespace: 'test',
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
          allChannels: [null],
          allClusters: {
            isLocal: true,
            remoteCount: 0,
          },
          searchClusters: [
            {
              _uid: 'cluster__local-cluster',
              nodes: 6,
              _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
              kind: 'cluster',
              name: 'local-cluster',
              _clusterNamespace: 'local-cluster',
              apigroup: 'internal.open-cluster-management.io',
              label:
                'cloud=Amazon; cluster.open-cluster-management.io/clusterset=hub; clusterID=70ebe797-4791-4958-be17-f088411a0db5; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.11.0-fc.3; velero.io/exclude-from-backup=true; vendor=OpenShift',
              ManagedClusterImportSucceeded: 'True',
              HubAcceptedManagedCluster: 'True',
              ManagedClusterConditionAvailable: 'True',
              created: '2022-07-08T13:02:56Z',
              cpu: 36,
              kubernetesVersion: 'v1.24.0+284d62a',
              memory: '144758296Ki',
              ManagedClusterJoined: 'True',
              addon:
                'application-manager=true; cert-policy-controller=true; iam-policy-controller=true; policy-controller=true; search-collector=false',
              consoleURL: 'https://console-openshift-console.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
              status: 'OK',
              ClusterCertificateRotated: 'True',
            },
          ],
          pulse: 'green',
          shapeType: 'application',
        },
      },
      {
        name: 'test-subscription-1',
        namespace: 'test',
        type: 'subscription',
        id: 'member--subscription--test--test-subscription-1',
        specs: {
          title: 'helloworld',
          isDesign: true,
          hasRules: false,
          isPlaced: false,
          clustersNames: ['local-cluster'],
          searchClusters: [null],
          subscriptionModel: {
            'test-subscription-1-local-cluster': [
              {
                _uid: 'local-cluster/581c0b05-81c3-489f-b733-94892e2aa32b',
                _gitpath: 'helloworld',
                _gitbranch: 'main',
                _hubClusterResource: 'true',
                apiversion: 'v1',
                apigroup: 'apps.open-cluster-management.io',
                localPlacement: 'false',
                cluster: 'local-cluster',
                timeWindow: 'none',
                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                namespace: 'test',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                created: '2022-11-16T14:29:26Z',
                label:
                  'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                kind: 'subscription',
                name: 'test-subscription-1',
                status: 'Propagated',
              },
            ],
            'test-subscription-1-local-local-cluster': [
              {
                _uid: 'local-cluster/452e02f9-0824-4e16-89ba-b0433a997e3c',
                _hubClusterResource: 'true',
                apiversion: 'v1',
                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                _gitpath: 'helloworld',
                status: 'Subscribed',
                apigroup: 'apps.open-cluster-management.io',
                created: '2022-11-16T14:29:26Z',
                kind: 'subscription',
                cluster: 'local-cluster',
                namespace: 'test',
                _hostingSubscription: 'test/test-subscription-1',
                name: 'test-subscription-1-local',
                timeWindow: 'none',
                _gitbranch: 'main',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                localPlacement: 'true',
                label:
                  'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'subscription',
        },
      },
      {
        name: '',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters----test-subscription-1',
        specs: {
          title: '',
          resourceCount: 0,
          clustersNames: [],
          clusters: [],
          sortedClusterNames: [],
          appClusters: [],
          searchClusters: [],
          pulse: 'red',
          shapeType: 'cluster',
        },
      },
      {
        name: '',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters----test-subscription-2',
        specs: {
          title: '',
          resourceCount: 0,
          clustersNames: [],
          clusters: [],
          sortedClusterNames: [],
          appClusters: [],
          searchClusters: [],
          pulse: 'red',
          shapeType: 'cluster',
        },
      },
      {
        name: 'helloworld-app-route',
        namespace: 'test',
        type: 'route',
        id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters----test-subscription-1',
            parentName: '',
            parentType: 'cluster',
          },
          template: {
            template: {
              apiVersion: 'route.openshift.io/v1',
              kind: 'Route',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/hosting-subscription': 'test/test-subscription-1-local',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'openshift.io/host.generated': 'true',
                },
                labels: {
                  app: 'helloworld-app',
                  'app.kubernetes.io/part-of': 'test',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'helloworld-app-route',
                namespace: 'test',
              },
              spec: {
                host: 'helloworld-app-route-test.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                port: {
                  targetPort: 3002,
                },
                to: {
                  kind: 'Service',
                  name: 'helloworld-app-svc',
                  weight: 100,
                },
                wildcardPolicy: 'None',
              },
              status: {
                ingress: [
                  {
                    conditions: [
                      {
                        lastTransitionTime: '2022-11-16T14:29:27Z',
                        status: 'True',
                        type: 'Admitted',
                      },
                    ],
                    host: 'helloworld-app-route-test.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                    routerCanonicalHostname: 'router-default.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                    routerName: 'default',
                    wildcardPolicy: 'None',
                  },
                ],
              },
            },
          },
          resourceCount: 1,
          searchClusters: [null],
          pulse: 'orange',
          shapeType: 'route',
        },
      },
      {
        name: 'helloworld-app-svc',
        namespace: 'test',
        type: 'service',
        id: 'member--deployed-resource--member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route--test--helloworld-app-svc--service',
        specs: {
          isDesign: false,
          parent: {
            parentId:
              'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-route--route',
            parentName: 'helloworld-app-route',
            parentType: 'route',
          },
          resourceCount: 1,
          searchClusters: [null],
          pulse: 'spinner',
          shapeType: 'service',
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'test',
        type: 'deployment',
        id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters----test-subscription-1',
            parentName: '',
            parentType: 'cluster',
          },
          template: {
            related: [
              {
                kind: 'pod',
                items: [
                  {
                    _uid: 'local-cluster/b6a53e57-b2e1-4d3e-b61f-e77ce2b20f02',
                    status: 'Running',
                    hostIP: '10.0.170.20',
                    container: 'helloworld-app-container',
                    _rbac: 'test_null_pods',
                    name: 'helloworld-app-deploy-6f68457854-w4q2t',
                    kind: 'pod',
                    label: 'app=helloworld-app; pod-template-hash=6f68457854',
                    _hubClusterResource: 'true',
                    apiversion: 'v1',
                    startedAt: '2022-11-16T14:29:27Z',
                    _ownerUID: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                    restarts: 0,
                    podIP: '10.131.1.59',
                    created: '2022-11-16T14:29:27Z',
                    namespace: 'test',
                    image: 'quay.io/fxiang1/helloworld:0.0.1',
                    cluster: 'local-cluster',
                  },
                ],
              },
              {
                kind: 'replicaset',
                items: [
                  {
                    _uid: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                    _hostingSubscription: 'test/test-subscription-1-local',
                    _rbac: 'test_apps_replicasets',
                    namespace: 'test',
                    created: '2022-11-16T14:29:27Z',
                    apiversion: 'v1',
                    cluster: 'local-cluster',
                    name: 'helloworld-app-deploy-6f68457854',
                    apigroup: 'apps',
                    current: 1,
                    desired: 1,
                    label: 'app=helloworld-app; pod-template-hash=6f68457854',
                    _hubClusterResource: 'true',
                    kind: 'replicaset',
                  },
                ],
              },
            ],
          },
          resourceCount: 1,
          searchClusters: [null],
          deploymentModel: {
            'helloworld-app-deploy-local-cluster': [
              {
                _uid: 'local-cluster/07aeae15-0e92-4f36-801f-4f0ffb1f3adf',
                _rbac: 'test_apps_deployments',
                desired: 1,
                label:
                  'app.kubernetes.io/part-of=test; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                name: 'helloworld-app-deploy',
                ready: 1,
                apiversion: 'v1',
                kind: 'deployment',
                available: 1,
                current: 1,
                _hostingSubscription: 'test/test-subscription-1-local',
                apigroup: 'apps',
                namespace: 'test',
                cluster: 'local-cluster',
                _hubClusterResource: 'true',
                created: '2022-11-16T14:29:27Z',
                resStatus: '1/1',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'deployment',
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'test',
        type: 'replicaset',
        id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: 1,
          replicaCount: 1,
          parent: {
            parentId:
              'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment',
            parentName: 'helloworld-app-deploy',
            parentType: 'deployment',
          },
          searchClusters: [null],
          replicasetModel: {
            'helloworld-app-deploy-local-cluster': [
              {
                _uid: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                _hostingSubscription: 'test/test-subscription-1-local',
                _rbac: 'test_apps_replicasets',
                namespace: 'test',
                created: '2022-11-16T14:29:27Z',
                apiversion: 'v1',
                cluster: 'local-cluster',
                name: 'helloworld-app-deploy-6f68457854',
                apigroup: 'apps',
                current: 1,
                desired: 1,
                label: 'app=helloworld-app; pod-template-hash=6f68457854',
                _hubClusterResource: 'true',
                kind: 'replicaset',
                resStatus: '1/1',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'replicaset',
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'test',
        type: 'pod',
        id: 'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: 1,
          replicaCount: 1,
          parent: {
            parentId:
              'member--deployed-resource--member--clusters----test-subscription-1--test--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
            parentName: 'helloworld-app-deploy',
            parentType: 'replicaset',
          },
          searchClusters: [null],
          podModel: {
            'helloworld-app-deploy-local-cluster': [
              {
                _uid: 'local-cluster/b6a53e57-b2e1-4d3e-b61f-e77ce2b20f02',
                status: 'Running',
                hostIP: '10.0.170.20',
                container: 'helloworld-app-container',
                _rbac: 'test_null_pods',
                name: 'helloworld-app-deploy-6f68457854-w4q2t',
                kind: 'pod',
                label: 'app=helloworld-app; pod-template-hash=6f68457854',
                _hubClusterResource: 'true',
                apiversion: 'v1',
                startedAt: '2022-11-16T14:29:27Z',
                _ownerUID: 'local-cluster/0f9ae5bb-80a4-45bb-98ad-8bf0063c276a',
                restarts: 0,
                podIP: '10.131.1.59',
                created: '2022-11-16T14:29:27Z',
                namespace: 'test',
                image: 'quay.io/fxiang1/helloworld:0.0.1',
                cluster: 'local-cluster',
                resStatus: 'running',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'pod',
        },
      },
      {
        name: 'test-subscription-2',
        namespace: 'test',
        type: 'subscription',
        id: 'member--subscription--test--test-subscription-2',
        specs: {
          title: 'large-nb-resource-app',
          isDesign: true,
          hasRules: false,
          isPlaced: false,
          clustersNames: ['local-cluster'],
          searchClusters: [null],
          subscriptionModel: {
            'test-subscription-2-local-cluster': [
              {
                _uid: 'local-cluster/df5d0e8c-9839-4e24-923d-fb2e12b095dd',
                apigroup: 'apps.open-cluster-management.io',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                name: 'test-subscription-2',
                timeWindow: 'none',
                _hubClusterResource: 'true',
                namespace: 'test',
                kind: 'subscription',
                _gitbranch: 'main',
                label:
                  'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                apiversion: 'v1',
                localPlacement: 'false',
                cluster: 'local-cluster',
                _gitpath: 'large-nb-resource-app',
                created: '2022-11-16T14:29:26Z',
                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                status: 'Propagated',
              },
            ],
            'test-subscription-2-local-local-cluster': [
              {
                _uid: 'local-cluster/2d5756dd-e7bb-4ee4-a129-2db885255085',
                _hostingSubscription: 'test/test-subscription-2',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                timeWindow: 'none',
                kind: 'subscription',
                namespace: 'test',
                apiversion: 'v1',
                _rbac: 'test_apps.open-cluster-management.io_subscriptions',
                cluster: 'local-cluster',
                label:
                  'app.kubernetes.io/part-of=test; app=test; apps.open-cluster-management.io/reconcile-rate=medium',
                _hubClusterResource: 'true',
                apigroup: 'apps.open-cluster-management.io',
                created: '2022-11-16T14:29:28Z',
                localPlacement: 'true',
                _gitpath: 'large-nb-resource-app',
                name: 'test-subscription-2-local',
                status: 'Subscribed',
                _gitbranch: 'main',
              },
            ],
          },
          pulse: 'red',
          shapeType: 'subscription',
        },
      },
      {
        name: '',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters----test-subscription-2',
        specs: {
          title: '',
          resourceCount: 0,
          clustersNames: [],
          clusters: [],
          sortedClusterNames: [],
          appClusters: [],
          searchClusters: [],
          pulse: 'red',
          shapeType: 'cluster',
        },
      },
    ],
  },
  processActionLink: mockProcessactionlink,
  canUpdateStatuses: true,
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: {
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selectedArgoAppList: [],
      isLoading: false,
    },
    handleArgoAppDetailsContainerUpdate: mockDispatchaction,
    handleErrorMsg: mockHandleerrormsg,
  },
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: {
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: {},
      selectedClusterList: [],
    },
    handleClusterDetailsContainerUpdate: mockDispatchaction,
  },
  channelControl: {
    allChannels: [
      '__ALL__/__ALL__//__ALL__/__ALL__',
      'test/test-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test-subscription-3//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    ],
    activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
    setActiveChannel: mockDispatchaction,
  },
  options: {
    typeToShapeMap: {
      application: {
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      },
      applicationset: {
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      },
      cluster: {
        shape: 'cluster',
        className: 'container',
      },
      clusters: {
        shape: 'cluster',
        className: 'container',
      },
      ansiblejob: {
        shape: 'ansiblejob',
        className: 'container',
      },
      configmap: {
        shape: 'configmap',
        className: 'container',
      },
      container: {
        shape: 'container',
        className: 'container',
      },
      customresource: {
        shape: 'customresource',
        className: 'container',
      },
      daemonset: {
        shape: 'daemonset',
        className: 'daemonset',
      },
      deployable: {
        shape: 'deployable',
        className: 'design',
      },
      deployment: {
        shape: 'deployment',
        className: 'deployment',
      },
      deploymentconfig: {
        shape: 'deploymentconfig',
        className: 'deployment',
      },
      helmrelease: {
        shape: 'chart',
        className: 'container',
      },
      host: {
        shape: 'host',
        className: 'host',
      },
      ingress: {
        shape: 'ingress',
        className: 'host',
      },
      internet: {
        shape: 'cloud',
        className: 'internet',
      },
      namespace: {
        shape: 'namespace',
        className: 'host',
      },
      node: {
        shape: 'node',
        className: 'host',
      },
      other: {
        shape: 'other',
        className: 'default',
      },
      package: {
        shape: 'chart',
        className: 'container',
      },
      placement: {
        shape: 'placement',
        className: 'design',
      },
      pod: {
        shape: 'pod',
        className: 'pod',
      },
      policy: {
        shape: 'policy',
        className: 'design',
        nodeRadius: 30,
      },
      replicaset: {
        shape: 'replicaset',
        className: 'container',
      },
      replicationcontroller: {
        shape: 'replicationcontroller',
        className: 'container',
      },
      route: {
        shape: 'route',
        className: 'container',
      },
      placements: {
        shape: 'placements',
        className: 'design',
      },
      secret: {
        shape: 'secret',
        className: 'service',
      },
      service: {
        shape: 'service',
        className: 'service',
      },
      statefulset: {
        shape: 'statefulset',
        className: 'default',
      },
      storageclass: {
        shape: 'storageclass',
        className: 'default',
      },
      subscription: {
        shape: 'subscription',
        className: 'design',
      },
      subscriptionblocked: {
        shape: 'subscriptionblocked',
        className: 'design',
      },
    },
    diagramOptions: {
      showLineLabels: true,
      showGroupTitles: false,
    },
    computeNodeStatus: mockComputenodestatus,
    getNodeDescription: mockGetnodedescription,
    getNodeTitle: mockGetnodetitle,
    getSectionTitles: mockGetsectiontitles,
    getNodeDetails: mockGetnodedetails,
    updateNodeStatus: mockUpdatenodestatus,
    updateNodeIcons: mockUpdatenodeicons,
    getAllFilters: mockGetallfilters,
    getAvailableFilters: mockGetavailablefilters,
    getSearchFilter: mockGetsearchfilter,
    filterNodes: mockFilternodes,
    getConnectedLayoutOptions: mockGetconnectedlayoutoptions,
    getUnconnectedLayoutOptions: mockGetunconnectedlayoutoptions,
  },
  setDrawerContent: mockSetdrawercontent,
}

const props2: TopologyProps = {
  disableRenderConstraint: true,
  elements: {
    activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
    channels: [
      '__ALL__/__ALL__//__ALL__/__ALL__',
      'test/test3-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test3-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    ],
    links: [
      {
        source: 'application--test3',
        target: 'member--subscription--test--test3-subscription-1',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test3-subscription-1',
        target: 'member--rules--test--test3-placement-1--0',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test3-subscription-1',
        target: 'member--clusters--local-cluster--test3-subscription-1',
        label: '',
        type: '',
      },
      {
        source: 'member--clusters--local-cluster--test3-subscription-1',
        target:
          'member--deployed-resource--member--clusters--local-cluster--test3-subscription-1--undefined--cars.feng.example.com--customresourcedefinition',
        label: '',
        type: '',
      },
      {
        source: 'application--test3',
        target: 'member--subscription--test--test3-subscription-2',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test3-subscription-2',
        target: 'member--rules--test--test3-placement-2--0',
        label: '',
        type: '',
      },
      {
        source: 'member--subscription--test--test3-subscription-2',
        target: 'member--clusters--local-cluster--test3-subscription-2',
        label: '',
        type: '',
      },
      {
        source: 'member--clusters--local-cluster--test3-subscription-2',
        target:
          'member--deployed-resource--member--clusters--local-cluster--test3-subscription-2--test--helloworld-app-route--route',
        label: '',
        type: '',
      },
      {
        source: 'member--clusters--local-cluster--test3-subscription-2',
        target:
          'member--deployed-resource--member--clusters--local-cluster--test3-subscription-2--test--helloworld-app-svc2--service',
        label: '',
        type: '',
      },
    ],
    nodes: [
      {
        name: '',
        namespace: 'test',
        type: 'application',
        id: 'application--test3',
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
            kind: 'Application',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/deployables': '',
                'apps.open-cluster-management.io/subscriptions':
                  'test/test3-subscription-1-local,test/test3-subscription-2-local,test/test3-subscription-1,test/test3-subscription-2',
                'open-cluster-management.io/user-group':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
              },
              name: 'test3',
              namespace: 'test',
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
                    values: ['test3'],
                  },
                ],
              },
            },
          },
          activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
          allSubscriptions: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                  'apps.open-cluster-management.io/git-path': 'crd',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                labels: {
                  app: 'test3',
                  'app.kubernetes.io/part-of': 'test3',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'test3-subscription-1',
                namespace: 'test',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'test3-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-11-22T15:33:34Z',
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
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
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
                    labels: {
                      app: 'test3',
                    },
                    name: 'test3-placement-1',
                    namespace: 'test',
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
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'test.test3-subscription-1',
                  },
                  name: 'test3-subscription-1',
                  namespace: 'test',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'test3-subscription-1',
                    },
                  ],
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'apiextensions.k8s.io/v1',
                    kind: 'CustomResourceDefinition',
                    name: 'cars.feng.example.com',
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
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44',
                  'apps.open-cluster-management.io/git-path': 'large-nb-resource-app',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                labels: {
                  app: 'test3',
                  'app.kubernetes.io/part-of': 'test3',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'test3-subscription-2',
                namespace: 'test',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'test3-placement-2',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-11-22T15:33:34Z',
                phase: 'Propagated',
              },
              posthooks: [],
              prehooks: [],
              channels: [null],
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
                    labels: {
                      app: 'test3',
                    },
                    name: 'test3-placement-2',
                    namespace: 'test',
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
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'test.test3-subscription-2',
                  },
                  name: 'test3-subscription-2',
                  namespace: 'test',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'test3-subscription-2',
                    },
                  ],
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-58',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-59',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: 'pause-deploy3',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-5',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-27',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-36',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-39',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-55',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-28',
                    namespace: 'test',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'ConfigMap',
                    name: 'test-configmap-6',
                    namespace: 'test',
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
          allChannels: [null],
          allClusters: {
            isLocal: true,
            remoteCount: 0,
          },
          searchClusters: [
            {
              ClusterCertificateRotated: 'True',
              HubAcceptedManagedCluster: 'True',
              ManagedClusterConditionAvailable: 'True',
              ManagedClusterImportSucceeded: 'True',
              ManagedClusterJoined: 'True',
              _hubClusterResource: 'true',
              _uid: 'cluster__local-cluster',
              apigroup: 'internal.open-cluster-management.io',
              cluster: '',
              consoleURL: 'https://console-openshift-console.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
              cpu: '24',
              created: '2022-11-22T11:20:10Z',
              kind: 'Cluster',
              kind_plural: 'managedclusterinfos',
              kubernetesVersion: 'v1.25.0+3ef6ef3',
              label:
                'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=4754dab2-264e-4e69-94b9-893fa0b25ee6; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.12.0-ec.4; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; velero.io/exclude-from-backup=true; vendor=OpenShift',
              memory: '96634348Ki',
              name: 'local-cluster',
              nodes: '3',
            },
          ],
          pulse: 'green',
          shapeType: 'application',
        },
      },
      {
        name: 'test3-subscription-1',
        namespace: 'test',
        type: 'subscription',
        id: 'member--subscription--test--test3-subscription-1',
        specs: {
          title: 'crd',
          isDesign: true,
          hasRules: true,
          isPlaced: true,
          clustersNames: ['local-cluster'],
          searchClusters: [null],
          subscriptionModel: {
            'test3-subscription-1-local-local-cluster': [
              {
                _clusterNamespace: '',
                _gitbranch: 'main',
                _gitpath: 'crd',
                _hostingSubscription: 'test/test3-subscription-1',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/ec427910-e1fb-4e8f-8b52-65b90724f9bb',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:34Z',
                kind: 'Subscription',
                kind_plural: 'subscriptions',
                label:
                  'app=test3; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'true',
                name: 'test3-subscription-1-local',
                namespace: 'test',
                status: 'Subscribed',
                timeWindow: 'none',
              },
            ],
            'test3-subscription-1-local-cluster': [
              {
                _clusterNamespace: '',
                _gitbranch: 'main',
                _gitpath: 'crd',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/d137f14f-165f-4bb3-8d1d-56b72fe61969',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:33Z',
                kind: 'Subscription',
                kind_plural: 'subscriptions',
                label:
                  'app=test3; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'test3-subscription-1',
                namespace: 'test',
                status: 'Propagated',
                timeWindow: 'none',
              },
            ],
          },
          pulse: 'yellow',
          shapeType: 'subscription',
        },
      },
      {
        name: 'test3-placement-1',
        namespace: 'test',
        type: 'placements',
        id: 'member--rules--test--test3-placement-1--0',
        specs: {
          isDesign: true,
          searchClusters: [],
          pulse: 'green',
          shapeType: 'placements',
        },
      },
      {
        name: 'local-cluster',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters--local-cluster--test3-subscription-1',
        specs: {
          title: '',
          resourceCount: 1,
          clustersNames: ['local-cluster'],
          clusterStatus: {
            hasWarning: true,
          },
          clusters: [
            {
              name: 'local-cluster',
              displayName: 'local-cluster',
              namespace: 'local-cluster',
              status: 'ready',
              provider: 'aws',
              distribution: {
                k8sVersion: 'v1.25.0+3ef6ef3',
                ocp: {
                  channel: 'stable-4.12',
                  desired: {
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b83381ad349bdd535d27a6ae2d78e5a148a9f8930379818ad7a6b6b7303fe2a7',
                    version: '4.12.0-ec.4',
                  },
                  desiredVersion: '4.12.0-ec.4',
                  managedClusterClientConfig: {
                    caBundle:
                      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJRFhEdHlwNFFTS293RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJeE1USXlNRGt3TURReldoY05Nekl4TVRFNU1Ea3dNRFF6V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTndJc1NkY2Fac0lJNllBNmx5TXdZcVlHa2k1eFJ6UAoxdjZrMG12Y0tReGJUOUIvL0IxaGhrVHNvWXl2M25oOVQyQmtNZWt3cjJramgySnlzRzY2YzQ1UEFTOE41Skp3Ci9ldmR6bFM4MlJocVRMci90b0MvTDFVY3BIWndYR0xGZXhNekIyREczNUtpWldncmVYcHptZm1td0NuL1RobEIKSEp6NXJORHFEOVYraHlGVHJyQjF2RVlXeHh5a1ZZYmx1TldnVVgwdWRJTFlaZERQWDRSdnNseitSNi9UTUZERgpnMEJva2RoVkFraU9OaWVOQXNLdDZBang4TjlVYWhWckViYis5Q0FJenhVNVpIVTRKNTZZajlUNkliT0t3cWliCmsrcmlzanVRajBEY1dEZkY0Z2JZZ1N6SU9aditsaE52aEtDN2w2V090SlBENTRaQ0xIc0dueDhDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkZQdwp4MzRJTmJreHBmL3UwL0JqZWZTVm5rOWtNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUExaFJnVmRNbjRRVFVoCnlTQUtmQlM3Vklhcmp3cFZVRUlCYU40RkJsS2U0bW1xaXJyUk5CR2VEdk81MW9LNVFaWVlWbFdzTTlSc201Nm4KMkRzSHArMlpSY1VHbGF5SHUvYmpzQ3NSNlpGQXZYMXl6RzFneXlmK2lhQjg1aXNaT05Da3NlR21wMmYyUWFuagpqNUVFV2FRMitlSFJBSEV4TGhpVnovUVZDRm5VMVlsUHl3VDBPeFRSOTRidFJlaUR0d3FmbWlyLy8vaW55MVFBCkZpWmNnNTNoSXpKbnozRmpoVTdRV1hKQmJ2TUdmWDRYS1lrMHlzYXNZZHBGU2xnV09IeEtUZ0xrOWd6NGgxSTgKN3UzaEk3UnozTktzN1QySEk0TzJPaGd6TWVxZjBoemhDMnc5SzV0K3pJQ2VWMS9NRVNiYjlBRVBRNUVkSXhuYgorQTFqY3IrSAotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSUhidzA3bnB1WW4wd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1URXlNakE1TURBME0xb1hEVE15TVRFeE9UQTVNREEwTTFvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF2d1gyUnBjMWpFMjkKUXBoeUR1OTFOd0txNnY4SlJkSCt0Nmo3VGtEdVBTSU1nR1JOVnl1NUtQZ3lmUnVJaytHbDZUUHBaemNsanFtbApWU1pObkNqMXZ0VlhwOU9maU9udjRtRUNzNmFSaUJyVjJ4c0pHVjJid3AyUTdtemlCaUdPcEZmMkhNT0REWXRqCkEzNnRkOEhkK0dkRnh0WTN1YW5uMXZNQkN0ck9NaDBLVUZseVJsRHRyRE5GcWF3NTRZR0xYMXh0Y1Y1akZBenkKcEM2Mm5RbHB0cDRIcWs0bml6UmFNWGtabll3S01JNTUwTS9ycnBEajlQWkR3aTNWRnBHQ0lhZGd0djFoTmFLMgpPR0x4UHhWaVpWUVZtOG1NM05Tc0FVQVR3bjEyd3B3c3lUOFFUZnN3dGNaRysrZGRtdEtmTzUxemhhTm5Kc1phCnd4dEJ6Mzl2NlFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVVBxanQ0YjRnNHVhcXlIN3VjUjNIaDdiZExZOHdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUkxajYwZWErQnZPOFZUNzZKeDZTQkN2NUZ2czZ6V0VKbUdNVEppajJXTEZMUWFXOW93RWZHY0psN2ZkCmcxa2R0b0l2RURyTWcwTTlmZThuSStSRXZrd1AxUzZJVFkrNytRQm4rMk5yNTRqU09sQ0pEejM2MUxESG0vczEKVHNaMjdwRE9nVjNZUXk2TkFaQk15YTlodjJjQmRmZzVpV1BIWUJiNU9kVDVFejNuTVV0cktNUzRYYlhZVjhpSQpCZkVBVFl1ZmZZb2w0L2pKeUFVSkY3YzN1M0k0ekhSMmw0R1lRckxkOVBTRmZZeFdGanNmaFcrckVYTzYvWmFJCi9DS1R1cmRPWlhpTC9WUDlzakY5bWcxeGlzTWFhN0U4Q1NXYVNWWGd0VUFUZzZUZ3hqcGRpQjk3YnhsV0J0TVEKZldXckF6SWNoWDBPMUJKZ1JpUkthNlQrRy80PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSURXZnAvL2QrcXdBd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TVRFeU1qQTVNREEwTTFvWERUTXlNVEV4T1RBNU1EQTBNMW93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQTBVMnJVTUM5YnQ1bGJQRjNpWTA3OWVnTnZwQ2NiUFhkSDhZZTIwd09qZFk3TUUvQlJkQkZPRyttV0NkSQpmUTBTWW9FRkFyeVY1YU1ZYXZFZDkySS85WU9kNHJjbDA5RnV4K041cWpicFBpd1c1Z0dOTVo1eXdXMUpIakx6CjBMeVowUzI0d2dGemlOOC9WcFphUmtCRkQ2OXJQcXc1TWhJdnZDaGRPdHNpZUVqemYraWk0dWdsbmQzWG1SYkgKNjNRQTNwdDJUUnVlaHF5VjE3ajNHK1EzNUprdHFHVGdxQ2VBaVUwWC92UjE2QTdpeGp3MEcrNWZsWEV5U01QNgpnWmFmNVZBQlJxZjJnSTlKNXQ2M2xzcDhJd2JucXJDV1VFR0xINmZaUWVQQXFZZnJyVmc0TG15S3phQVMvcUhYClRiMFhtQ3ovZFhiT2h3MXRNVjFJcndycnN3SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVtQW94Vy85cGUvNThsWUxud2FwdXVKMk5Vc3N3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFGdE5vUE1tZ1FoejhtZlZIaWRtaDFNdTJsYUlXRlkxL0gzNVZXUU5keEd3CmZwWjU0YTNlUkhnMEdoN2dEM2JuYk44UDNNZGF4L1ZmS1NIMWRoY3lPN0liQWZORitmSlVOck4xTVZkVTlPRlMKZ0FUa0N2bG40ckQ5ZkRTd3hjdm9qZ3pXdEl5TEhlK1poOTViUEFuVnhxaURVZVY3eUNicjdGWVV1RmRnT3Z2MgoreHYzWkZJUmNFZkQ1ZCtlMW5SOFRYdWMxSzBBY2UwNkpUcVpiWEJrK1hNdGFvclk4Z3hkYndyS09tNjF5dG44CnZEU0E2UzA1R3Q5UkhJbXdwRHlKTnA1T2lmeTF4djdrUVduZGkxVTJUeHlRNDFWNDRlSXMyZnhudHB6SnB0K2QKN3AwdHd1S0dVZVhOSGxDVFk1L0pKalJiSlZTSklkRDdXajlVMmdIczdpRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlTM0RlK3RrcG5Lb3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpZNU1UQTRNalUyTUI0WERUSXlNVEV5TWpBNU1UQTEKTlZvWERUTXlNVEV4T1RBNU1UQTFObG93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalk1TVRBNE1qVTJNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXlLZ1gKYTJ4a1hSdlNyODJBMzRtc1QzTjVNZ3duazdmdzFBM0VvRlNPNWJLNmhhOW84dVVIZFhrUnRBTHMyZVZPRytNRApIYSsxUCs0M3lGajdXU3dDZktVZ0xhNWhDbjNjVUpCUUhVemtMZVhCZVRsVDExQmJnVTgwTGlPSjQ0VEJLYkZXCjlOWlZZcmp6Y3BlSG1POGt5L3FTNlVUWEpLNmJsa2FVUEdLMmVVWDhvaThDb2Z0eXo5bi8yb3dPSmFxRUpyR1IKY3ZVQnFCbVg3RDhsUjdnWk9YditIVkpkTmwwaFdabWxhWXBuTkc4UVR3RDEvSnBzWkxCeTh6TDZqTHRKMjVlRApLWGhyMWRGWnR1WkJlVEk3VFZORWRZUjg5Q3lWL1RYVktXakZlR1JZWEo4L01YeC91L2dHanFFYzlHVzRQTllGClZqRHJ3eWxLc2N0NG1TSXZQUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVV1pTSXJMdWJwTnozd0ZRTi9NenJPNlhIUVhnd0h3WURWUjBqQkJndwpGb0FVV1pTSXJMdWJwTnozd0ZRTi9NenJPNlhIUVhnd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFDbWtWNERqCjBwQzJndjJRU1U4YnZZNko1T2xUK3BoZndHempqR1RFU3krZE1QWm5Ub1F0cUpLdE5UZTdvazlOREpyN1ZZVHgKclFXTG9vM0l1OVU1NEUwQjg1OGJ0S1VMcGMwK2FjOElNOWNXUWh3WkdOeG8zU2tQTkVMc2ltSThyYzR5KzhoZApqNWZqTm9mc1ZxYzVqTWtnQjBuOEVoTHpvZ3Q3YlBDSWlyVEgwcDBWWE04eUZRRlhPSFMwZkVEem80UG1BRmV2CkRGZ0VHUnJ4SHI5bW8yaFVUZ0tOdXBnL0owN1BVdHNDQk1UOUZmdWQvczR3K2wwcWU0Ry8vYkR3QkoyV0NNVW4KbmttQlFFdDE4Y0VQdWx0bSsxemdlSTl4NmVJNDhUU1ZKS0M3ZGNwZkw4TklWS1Nlb1c0d3p0VTNpV3o0ZVhZbgpiRkNoWXZvVGI0S3F6Y2c9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtekNDQW9PZ0F3SUJBZ0lJTXZhNDZESExMTTB3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qWTVNVEE0TWpreU1CNFhEVEl5TVRFeU1qQTVNVEV6TWxvWApEVEkwTVRFeU1UQTVNVEV6TTFvd1BURTdNRGtHQTFVRUF3d3lLaTVoY0hCekxtTnpMV0YzY3kwME1USXRkMk01CmJUa3VaR1YyTURJdWNtVmtMV05vWlhOMFpYSm1hV1ZzWkM1amIyMHdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUEKQTRJQkR3QXdnZ0VLQW9JQkFRREpoNVgwcS9mbFBLdkNzQ213WU1hSWVzcXBuYWFVd3JQTmtjUnZmelRCOU1KSAprQ21KUkZic0dWKzZLRUxNa0p6YVVlOUcxcE8xTzMvamJWT00zeDR1aEZQTTVTbWJqLytuYnhJLzZmVStTQjRiCjBzR3FiUVZNakdISGliOXhvUWZMR2dXeWpOTFZLTzBFVkw5eHV6M1VJOGxxZG5rSUdrUEl0eGVlNmxoS3JBVS8KSlJHcVJTd1BCVmI1b0NGZGFSUXF2T08yUG5TaDRYT1pEcVB2R2FaVGxhdEREQ1lXTnVXTS9wc3hPbitaRURaVQp3RzR1UkVKdnZseG4yWk1HeTJDUFFURmFHSThJMFRMdSs0d2ZTZFRhU1J5NHE5RG0rdUxVVUd3a0pKZzQrUkFUCm5CalN1U1M0MnhJVlpTa0t6ajByVFByMlh5cEdhU1VRMGl0S0twdjdBZ01CQUFHamdiVXdnYkl3RGdZRFZSMFAKQVFIL0JBUURBZ1dnTUJNR0ExVWRKUVFNTUFvR0NDc0dBUVVGQndNQk1Bd0dBMVVkRXdFQi93UUNNQUF3SFFZRApWUjBPQkJZRUZDUXRPZ0lnbUJqcm9mNVJ5VlU4SWVJaUJWalhNQjhHQTFVZEl3UVlNQmFBRkx4Z1NJS0FhcTdHCitaOS9FY2NzY1FRQVJTa3RNRDBHQTFVZEVRUTJNRFNDTWlvdVlYQndjeTVqY3kxaGQzTXROREV5TFhkak9XMDUKTG1SbGRqQXlMbkpsWkMxamFHVnpkR1Z5Wm1sbGJHUXVZMjl0TUEwR0NTcUdTSWIzRFFFQkN3VUFBNElCQVFDQgpVV3AyVDBLYlIvaVJPRGJWTm5MMmljM2szMEkydGFObzRCczArOTNsQWpNQ21YT2hjZEl2VUlKNDhoRHFQQ1VRClR5MWFOVkxzUHA2N3pnK29uV0x4ZWR1RUNuRXoxV3RvWWdpQmpQSUVKMXhIV2JkSE9KdEVjeXhEazJDT1I2SGEKbEd2QmJBRi9BaExxbkpaUUQwREw2NmJiVU91QkJrZ3BkMlB1Vm96bDBKWXdwQnh0ckNHOUEvbkhXRU9tbG8ySgpUSytJMkhScjQ4bGVjVkZZTnBaaU44aGErWERhR0t6VlJlalJ4dEtCWmIwNGpuMHRiMzJ4OUJoa0d6R3dtaDZKCk9JSVBvdzF1U0dvTVNPR0UycGJBWVRDT2lWR0RuSjRORU4yRW9qSHQ1ZVZuZ3pkeHk4WGpRODZxNVpQQkt4N04KQXBIek5ZWWdwSlIveHk0R013VW4KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJREREQ0NBZlNnQXdJQkFnSUJBVEFOQmdrcWhraUc5dzBCQVFzRkFEQW1NU1F3SWdZRFZRUUREQnRwYm1keQpaWE56TFc5d1pYSmhkRzl5UURFMk5qa3hNRGd5T1RJd0hoY05Nakl4TVRJeU1Ea3hNVE14V2hjTk1qUXhNVEl4Ck1Ea3hNVE15V2pBbU1TUXdJZ1lEVlFRRERCdHBibWR5WlhOekxXOXdaWEpoZEc5eVFERTJOamt4TURneU9USXcKZ2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFRRFJKenNBV25lTEVBckZkOWw3RWs4agpkZFl5b0FrUlV2bGdGUUg0dTBOQkRDMFB1UnFJZUNGbHVhZnlPWC96cDJDRXkyREdOV1RNSVJPcXF4cXBadStMClh2QUFoVHRjVEdBTmhTQytobHRkRzlOeE1hU2VwRUUxYTBWZk9WdjRQd3VZRDlxbC9CV0tUdDcyNms3NzdSa1AKWFdFTWhVK0RpRlEyYU5EaEs4ZDFzK25sKzVTVEJocTJqdzgzWk95d3RhcVZxY2lJY2diMG5TY1Nqb0hYK0Q3WQp2YVk2ak1rZnUrVHpLOCtWWG1mcFo1cld1Y1NlQ0RvZDI2RTQ0RU0wNEtpSWxLSkQ2SU5tZE04T1NXL0lQNkZpCk44aHVtYkVnM3BZNWNFVW9ZSTBoK2NsalNKY0NkV3pWY1k3SjlCYTdhRkorNXA3YzhXL3Q5Q0N4cy96UHQraGoKQWdNQkFBR2pSVEJETUE0R0ExVWREd0VCL3dRRUF3SUNwREFTQmdOVkhSTUJBZjhFQ0RBR0FRSC9BZ0VBTUIwRwpBMVVkRGdRV0JCUzhZRWlDZ0dxdXh2bWZmeEhITEhFRUFFVXBMVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBCmtoT2h5OFBwMzhPZE9pVTBUSDlmOVVFdzhZTDJuRTBWR1JDQmZxMjJGc3A4VUlBREtJMmlXZWNZR2JnUjkzQWYKMGhiVVdUYmJXRFRIbjFBR3BQZVZNbTFXN1I5M0QvRVVFVnFCVDVUZmxhcEYzOFY2dVViVE50UFRLT01WcGRJSApHRWlJOVlkaGYxVW5wclhCTC9scTlMZkJaemE4UXlDTDkzeTVoVUlEd2p1NzV1cHRuaFVkOVpoUU1sNy9BV01LCjZNRzcvM1dISDFnQ1BmL0Q1eWN5MHB2aGdIUko1cDdRK2tYOHhMRGNjVHlpWjFQZ1VmL0pwK3liMSsvd2M5NlYKUEJpTUJPL01KcUNLbkJZYlM4Z3RQS1RNUWtOczlEUmxiRzVwM2M3cG1WZkp5cWVZTmxUODJCbW5pdzhObUpEQgpPYWowajNQRFhUK1B5SHJzMWVub3ZBPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
                    url: 'https://api.cs-aws-412-wc9m9.dev02.red-chesterfield.com:6443',
                  },
                  version: '4.12.0-ec.4',
                  versionHistory: [
                    {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b83381ad349bdd535d27a6ae2d78e5a148a9f8930379818ad7a6b6b7303fe2a7',
                      state: 'Completed',
                      verified: false,
                      version: '4.12.0-ec.4',
                    },
                  ],
                },
                displayVersion: 'OpenShift 4.12.0-ec.4',
                isManagedOpenShift: false,
                upgradeInfo: {
                  isUpgrading: false,
                  isReadyUpdates: false,
                  upgradePercentage: '',
                  upgradeFailed: false,
                  hooksInProgress: false,
                  hookFailed: false,
                  latestJob: {
                    conditionMessage: '',
                    step: 'prehook-ansiblejob',
                  },
                  currentVersion: '4.12.0-ec.4',
                  desiredVersion: '4.12.0-ec.4',
                  isReadySelectChannels: false,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  currentChannel: 'stable-4.12',
                  desiredChannel: 'stable-4.12',
                  availableUpdates: [],
                  availableChannels: [],
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
              acmDistribution: {},
              labels: {
                cloud: 'Amazon',
                'cluster.open-cluster-management.io/clusterset': 'default',
                clusterID: '4754dab2-264e-4e69-94b9-893fa0b25ee6',
                'feature.open-cluster-management.io/addon-application-manager': 'available',
                'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-work-manager': 'available',
                'local-cluster': 'true',
                name: 'local-cluster',
                openshiftVersion: '4.12.0-ec.4',
                'openshiftVersion-major': '4',
                'openshiftVersion-major-minor': '4.12',
                'velero.io/exclude-from-backup': 'true',
                vendor: 'OpenShift',
              },
              nodes: {
                nodeList: [
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211452Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-149-227.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211444Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-186-36.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211452Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-221-210.ec2.internal',
                  },
                ],
                ready: 3,
                unhealthy: 0,
                unknown: 0,
              },
              kubeApiServer: 'https://api.cs-aws-412-wc9m9.dev02.red-chesterfield.com:6443',
              consoleURL: 'https://console-openshift-console.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
              isHive: false,
              isManaged: true,
              isCurator: false,
              isHostedCluster: false,
              isSNOCluster: false,
              isRegionalHubCluster: false,
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              clusterSet: 'default',
              owner: {},
            },
          ],
          sortedClusterNames: ['local-cluster'],
          appClusters: [],
          searchClusters: [null],
          pulse: 'green',
          shapeType: 'cluster',
        },
      },
      {
        name: 'cars.feng.example.com',
        type: 'customresourcedefinition',
        id: 'member--deployed-resource--member--clusters--local-cluster--test3-subscription-1--undefined--cars.feng.example.com--customresourcedefinition',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters--local-cluster--test3-subscription-1',
            parentName: 'local-cluster',
            parentType: 'cluster',
          },
          resourceCount: 1,
          searchClusters: [null],
          customresourcedefinitionModel: {
            'cars.feng.example.com-local-cluster': [
              {
                _clusterNamespace: '',
                _hostingSubscription: 'test/test3-subscription-1-local',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/2857b26b-d9d1-47d5-b071-c52fb0c8032a',
                apigroup: 'apiextensions.k8s.io',
                apiversion: 'v1',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:35Z',
                kind: 'CustomResourceDefinition',
                kind_plural: 'customresourcedefinitions',
                label:
                  'app=test3; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                name: 'cars.feng.example.com',
                resStatus: 'deployed',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'customresourcedefinition',
        },
      },
      {
        name: 'test3-subscription-2',
        namespace: 'test',
        type: 'subscription',
        id: 'member--subscription--test--test3-subscription-2',
        specs: {
          title: 'large-nb-resource-app',
          isDesign: true,
          hasRules: true,
          isPlaced: true,
          clustersNames: ['local-cluster'],
          searchClusters: [null],
          subscriptionModel: {
            'test3-subscription-2-local-cluster': [
              {
                _clusterNamespace: '',
                _gitbranch: 'main',
                _gitpath: 'large-nb-resource-app',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/7cf28762-b1f3-42ab-88d9-3715d988af83',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:33Z',
                kind: 'Subscription',
                kind_plural: 'subscriptions',
                label:
                  'app=test3; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'test3-subscription-2',
                namespace: 'test',
                status: 'Propagated',
                timeWindow: 'none',
              },
            ],
            'test3-subscription-2-local-local-cluster': [
              {
                _clusterNamespace: '',
                _gitbranch: 'main',
                _gitpath: 'large-nb-resource-app',
                _hostingSubscription: 'test/test3-subscription-2',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/167f0c21-046b-4c6d-b418-409db59a2e29',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:34Z',
                kind: 'Subscription',
                kind_plural: 'subscriptions',
                label:
                  'app=test3; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'true',
                name: 'test3-subscription-2-local',
                namespace: 'test',
                status: 'Subscribed',
                timeWindow: 'none',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'subscription',
        },
      },
      {
        name: 'test3-placement-2',
        namespace: 'test',
        type: 'placements',
        id: 'member--rules--test--test3-placement-2--0',
        specs: {
          isDesign: true,
          searchClusters: [],
          pulse: 'green',
          shapeType: 'placements',
        },
      },
      {
        name: 'local-cluster',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters--local-cluster--test3-subscription-2',
        specs: {
          title: '',
          resourceCount: 1,
          clustersNames: ['local-cluster'],
          clusterStatus: {
            hasFailure: true,
          },
          clusters: [
            {
              name: 'local-cluster',
              displayName: 'local-cluster',
              namespace: 'local-cluster',
              status: 'ready',
              provider: 'aws',
              distribution: {
                k8sVersion: 'v1.25.0+3ef6ef3',
                ocp: {
                  channel: 'stable-4.12',
                  desired: {
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b83381ad349bdd535d27a6ae2d78e5a148a9f8930379818ad7a6b6b7303fe2a7',
                    version: '4.12.0-ec.4',
                  },
                  desiredVersion: '4.12.0-ec.4',
                  managedClusterClientConfig: {
                    caBundle:
                      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJRFhEdHlwNFFTS293RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJeE1USXlNRGt3TURReldoY05Nekl4TVRFNU1Ea3dNRFF6V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTndJc1NkY2Fac0lJNllBNmx5TXdZcVlHa2k1eFJ6UAoxdjZrMG12Y0tReGJUOUIvL0IxaGhrVHNvWXl2M25oOVQyQmtNZWt3cjJramgySnlzRzY2YzQ1UEFTOE41Skp3Ci9ldmR6bFM4MlJocVRMci90b0MvTDFVY3BIWndYR0xGZXhNekIyREczNUtpWldncmVYcHptZm1td0NuL1RobEIKSEp6NXJORHFEOVYraHlGVHJyQjF2RVlXeHh5a1ZZYmx1TldnVVgwdWRJTFlaZERQWDRSdnNseitSNi9UTUZERgpnMEJva2RoVkFraU9OaWVOQXNLdDZBang4TjlVYWhWckViYis5Q0FJenhVNVpIVTRKNTZZajlUNkliT0t3cWliCmsrcmlzanVRajBEY1dEZkY0Z2JZZ1N6SU9aditsaE52aEtDN2w2V090SlBENTRaQ0xIc0dueDhDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkZQdwp4MzRJTmJreHBmL3UwL0JqZWZTVm5rOWtNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUExaFJnVmRNbjRRVFVoCnlTQUtmQlM3Vklhcmp3cFZVRUlCYU40RkJsS2U0bW1xaXJyUk5CR2VEdk81MW9LNVFaWVlWbFdzTTlSc201Nm4KMkRzSHArMlpSY1VHbGF5SHUvYmpzQ3NSNlpGQXZYMXl6RzFneXlmK2lhQjg1aXNaT05Da3NlR21wMmYyUWFuagpqNUVFV2FRMitlSFJBSEV4TGhpVnovUVZDRm5VMVlsUHl3VDBPeFRSOTRidFJlaUR0d3FmbWlyLy8vaW55MVFBCkZpWmNnNTNoSXpKbnozRmpoVTdRV1hKQmJ2TUdmWDRYS1lrMHlzYXNZZHBGU2xnV09IeEtUZ0xrOWd6NGgxSTgKN3UzaEk3UnozTktzN1QySEk0TzJPaGd6TWVxZjBoemhDMnc5SzV0K3pJQ2VWMS9NRVNiYjlBRVBRNUVkSXhuYgorQTFqY3IrSAotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSUhidzA3bnB1WW4wd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1URXlNakE1TURBME0xb1hEVE15TVRFeE9UQTVNREEwTTFvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF2d1gyUnBjMWpFMjkKUXBoeUR1OTFOd0txNnY4SlJkSCt0Nmo3VGtEdVBTSU1nR1JOVnl1NUtQZ3lmUnVJaytHbDZUUHBaemNsanFtbApWU1pObkNqMXZ0VlhwOU9maU9udjRtRUNzNmFSaUJyVjJ4c0pHVjJid3AyUTdtemlCaUdPcEZmMkhNT0REWXRqCkEzNnRkOEhkK0dkRnh0WTN1YW5uMXZNQkN0ck9NaDBLVUZseVJsRHRyRE5GcWF3NTRZR0xYMXh0Y1Y1akZBenkKcEM2Mm5RbHB0cDRIcWs0bml6UmFNWGtabll3S01JNTUwTS9ycnBEajlQWkR3aTNWRnBHQ0lhZGd0djFoTmFLMgpPR0x4UHhWaVpWUVZtOG1NM05Tc0FVQVR3bjEyd3B3c3lUOFFUZnN3dGNaRysrZGRtdEtmTzUxemhhTm5Kc1phCnd4dEJ6Mzl2NlFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVVBxanQ0YjRnNHVhcXlIN3VjUjNIaDdiZExZOHdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUkxajYwZWErQnZPOFZUNzZKeDZTQkN2NUZ2czZ6V0VKbUdNVEppajJXTEZMUWFXOW93RWZHY0psN2ZkCmcxa2R0b0l2RURyTWcwTTlmZThuSStSRXZrd1AxUzZJVFkrNytRQm4rMk5yNTRqU09sQ0pEejM2MUxESG0vczEKVHNaMjdwRE9nVjNZUXk2TkFaQk15YTlodjJjQmRmZzVpV1BIWUJiNU9kVDVFejNuTVV0cktNUzRYYlhZVjhpSQpCZkVBVFl1ZmZZb2w0L2pKeUFVSkY3YzN1M0k0ekhSMmw0R1lRckxkOVBTRmZZeFdGanNmaFcrckVYTzYvWmFJCi9DS1R1cmRPWlhpTC9WUDlzakY5bWcxeGlzTWFhN0U4Q1NXYVNWWGd0VUFUZzZUZ3hqcGRpQjk3YnhsV0J0TVEKZldXckF6SWNoWDBPMUJKZ1JpUkthNlQrRy80PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSURXZnAvL2QrcXdBd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TVRFeU1qQTVNREEwTTFvWERUTXlNVEV4T1RBNU1EQTBNMW93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQTBVMnJVTUM5YnQ1bGJQRjNpWTA3OWVnTnZwQ2NiUFhkSDhZZTIwd09qZFk3TUUvQlJkQkZPRyttV0NkSQpmUTBTWW9FRkFyeVY1YU1ZYXZFZDkySS85WU9kNHJjbDA5RnV4K041cWpicFBpd1c1Z0dOTVo1eXdXMUpIakx6CjBMeVowUzI0d2dGemlOOC9WcFphUmtCRkQ2OXJQcXc1TWhJdnZDaGRPdHNpZUVqemYraWk0dWdsbmQzWG1SYkgKNjNRQTNwdDJUUnVlaHF5VjE3ajNHK1EzNUprdHFHVGdxQ2VBaVUwWC92UjE2QTdpeGp3MEcrNWZsWEV5U01QNgpnWmFmNVZBQlJxZjJnSTlKNXQ2M2xzcDhJd2JucXJDV1VFR0xINmZaUWVQQXFZZnJyVmc0TG15S3phQVMvcUhYClRiMFhtQ3ovZFhiT2h3MXRNVjFJcndycnN3SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVtQW94Vy85cGUvNThsWUxud2FwdXVKMk5Vc3N3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFGdE5vUE1tZ1FoejhtZlZIaWRtaDFNdTJsYUlXRlkxL0gzNVZXUU5keEd3CmZwWjU0YTNlUkhnMEdoN2dEM2JuYk44UDNNZGF4L1ZmS1NIMWRoY3lPN0liQWZORitmSlVOck4xTVZkVTlPRlMKZ0FUa0N2bG40ckQ5ZkRTd3hjdm9qZ3pXdEl5TEhlK1poOTViUEFuVnhxaURVZVY3eUNicjdGWVV1RmRnT3Z2MgoreHYzWkZJUmNFZkQ1ZCtlMW5SOFRYdWMxSzBBY2UwNkpUcVpiWEJrK1hNdGFvclk4Z3hkYndyS09tNjF5dG44CnZEU0E2UzA1R3Q5UkhJbXdwRHlKTnA1T2lmeTF4djdrUVduZGkxVTJUeHlRNDFWNDRlSXMyZnhudHB6SnB0K2QKN3AwdHd1S0dVZVhOSGxDVFk1L0pKalJiSlZTSklkRDdXajlVMmdIczdpRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlTM0RlK3RrcG5Lb3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpZNU1UQTRNalUyTUI0WERUSXlNVEV5TWpBNU1UQTEKTlZvWERUTXlNVEV4T1RBNU1UQTFObG93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalk1TVRBNE1qVTJNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXlLZ1gKYTJ4a1hSdlNyODJBMzRtc1QzTjVNZ3duazdmdzFBM0VvRlNPNWJLNmhhOW84dVVIZFhrUnRBTHMyZVZPRytNRApIYSsxUCs0M3lGajdXU3dDZktVZ0xhNWhDbjNjVUpCUUhVemtMZVhCZVRsVDExQmJnVTgwTGlPSjQ0VEJLYkZXCjlOWlZZcmp6Y3BlSG1POGt5L3FTNlVUWEpLNmJsa2FVUEdLMmVVWDhvaThDb2Z0eXo5bi8yb3dPSmFxRUpyR1IKY3ZVQnFCbVg3RDhsUjdnWk9YditIVkpkTmwwaFdabWxhWXBuTkc4UVR3RDEvSnBzWkxCeTh6TDZqTHRKMjVlRApLWGhyMWRGWnR1WkJlVEk3VFZORWRZUjg5Q3lWL1RYVktXakZlR1JZWEo4L01YeC91L2dHanFFYzlHVzRQTllGClZqRHJ3eWxLc2N0NG1TSXZQUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVV1pTSXJMdWJwTnozd0ZRTi9NenJPNlhIUVhnd0h3WURWUjBqQkJndwpGb0FVV1pTSXJMdWJwTnozd0ZRTi9NenJPNlhIUVhnd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFDbWtWNERqCjBwQzJndjJRU1U4YnZZNko1T2xUK3BoZndHempqR1RFU3krZE1QWm5Ub1F0cUpLdE5UZTdvazlOREpyN1ZZVHgKclFXTG9vM0l1OVU1NEUwQjg1OGJ0S1VMcGMwK2FjOElNOWNXUWh3WkdOeG8zU2tQTkVMc2ltSThyYzR5KzhoZApqNWZqTm9mc1ZxYzVqTWtnQjBuOEVoTHpvZ3Q3YlBDSWlyVEgwcDBWWE04eUZRRlhPSFMwZkVEem80UG1BRmV2CkRGZ0VHUnJ4SHI5bW8yaFVUZ0tOdXBnL0owN1BVdHNDQk1UOUZmdWQvczR3K2wwcWU0Ry8vYkR3QkoyV0NNVW4KbmttQlFFdDE4Y0VQdWx0bSsxemdlSTl4NmVJNDhUU1ZKS0M3ZGNwZkw4TklWS1Nlb1c0d3p0VTNpV3o0ZVhZbgpiRkNoWXZvVGI0S3F6Y2c9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtekNDQW9PZ0F3SUJBZ0lJTXZhNDZESExMTTB3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qWTVNVEE0TWpreU1CNFhEVEl5TVRFeU1qQTVNVEV6TWxvWApEVEkwTVRFeU1UQTVNVEV6TTFvd1BURTdNRGtHQTFVRUF3d3lLaTVoY0hCekxtTnpMV0YzY3kwME1USXRkMk01CmJUa3VaR1YyTURJdWNtVmtMV05vWlhOMFpYSm1hV1ZzWkM1amIyMHdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUEKQTRJQkR3QXdnZ0VLQW9JQkFRREpoNVgwcS9mbFBLdkNzQ213WU1hSWVzcXBuYWFVd3JQTmtjUnZmelRCOU1KSAprQ21KUkZic0dWKzZLRUxNa0p6YVVlOUcxcE8xTzMvamJWT00zeDR1aEZQTTVTbWJqLytuYnhJLzZmVStTQjRiCjBzR3FiUVZNakdISGliOXhvUWZMR2dXeWpOTFZLTzBFVkw5eHV6M1VJOGxxZG5rSUdrUEl0eGVlNmxoS3JBVS8KSlJHcVJTd1BCVmI1b0NGZGFSUXF2T08yUG5TaDRYT1pEcVB2R2FaVGxhdEREQ1lXTnVXTS9wc3hPbitaRURaVQp3RzR1UkVKdnZseG4yWk1HeTJDUFFURmFHSThJMFRMdSs0d2ZTZFRhU1J5NHE5RG0rdUxVVUd3a0pKZzQrUkFUCm5CalN1U1M0MnhJVlpTa0t6ajByVFByMlh5cEdhU1VRMGl0S0twdjdBZ01CQUFHamdiVXdnYkl3RGdZRFZSMFAKQVFIL0JBUURBZ1dnTUJNR0ExVWRKUVFNTUFvR0NDc0dBUVVGQndNQk1Bd0dBMVVkRXdFQi93UUNNQUF3SFFZRApWUjBPQkJZRUZDUXRPZ0lnbUJqcm9mNVJ5VlU4SWVJaUJWalhNQjhHQTFVZEl3UVlNQmFBRkx4Z1NJS0FhcTdHCitaOS9FY2NzY1FRQVJTa3RNRDBHQTFVZEVRUTJNRFNDTWlvdVlYQndjeTVqY3kxaGQzTXROREV5TFhkak9XMDUKTG1SbGRqQXlMbkpsWkMxamFHVnpkR1Z5Wm1sbGJHUXVZMjl0TUEwR0NTcUdTSWIzRFFFQkN3VUFBNElCQVFDQgpVV3AyVDBLYlIvaVJPRGJWTm5MMmljM2szMEkydGFObzRCczArOTNsQWpNQ21YT2hjZEl2VUlKNDhoRHFQQ1VRClR5MWFOVkxzUHA2N3pnK29uV0x4ZWR1RUNuRXoxV3RvWWdpQmpQSUVKMXhIV2JkSE9KdEVjeXhEazJDT1I2SGEKbEd2QmJBRi9BaExxbkpaUUQwREw2NmJiVU91QkJrZ3BkMlB1Vm96bDBKWXdwQnh0ckNHOUEvbkhXRU9tbG8ySgpUSytJMkhScjQ4bGVjVkZZTnBaaU44aGErWERhR0t6VlJlalJ4dEtCWmIwNGpuMHRiMzJ4OUJoa0d6R3dtaDZKCk9JSVBvdzF1U0dvTVNPR0UycGJBWVRDT2lWR0RuSjRORU4yRW9qSHQ1ZVZuZ3pkeHk4WGpRODZxNVpQQkt4N04KQXBIek5ZWWdwSlIveHk0R013VW4KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJREREQ0NBZlNnQXdJQkFnSUJBVEFOQmdrcWhraUc5dzBCQVFzRkFEQW1NU1F3SWdZRFZRUUREQnRwYm1keQpaWE56TFc5d1pYSmhkRzl5UURFMk5qa3hNRGd5T1RJd0hoY05Nakl4TVRJeU1Ea3hNVE14V2hjTk1qUXhNVEl4Ck1Ea3hNVE15V2pBbU1TUXdJZ1lEVlFRRERCdHBibWR5WlhOekxXOXdaWEpoZEc5eVFERTJOamt4TURneU9USXcKZ2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFRRFJKenNBV25lTEVBckZkOWw3RWs4agpkZFl5b0FrUlV2bGdGUUg0dTBOQkRDMFB1UnFJZUNGbHVhZnlPWC96cDJDRXkyREdOV1RNSVJPcXF4cXBadStMClh2QUFoVHRjVEdBTmhTQytobHRkRzlOeE1hU2VwRUUxYTBWZk9WdjRQd3VZRDlxbC9CV0tUdDcyNms3NzdSa1AKWFdFTWhVK0RpRlEyYU5EaEs4ZDFzK25sKzVTVEJocTJqdzgzWk95d3RhcVZxY2lJY2diMG5TY1Nqb0hYK0Q3WQp2YVk2ak1rZnUrVHpLOCtWWG1mcFo1cld1Y1NlQ0RvZDI2RTQ0RU0wNEtpSWxLSkQ2SU5tZE04T1NXL0lQNkZpCk44aHVtYkVnM3BZNWNFVW9ZSTBoK2NsalNKY0NkV3pWY1k3SjlCYTdhRkorNXA3YzhXL3Q5Q0N4cy96UHQraGoKQWdNQkFBR2pSVEJETUE0R0ExVWREd0VCL3dRRUF3SUNwREFTQmdOVkhSTUJBZjhFQ0RBR0FRSC9BZ0VBTUIwRwpBMVVkRGdRV0JCUzhZRWlDZ0dxdXh2bWZmeEhITEhFRUFFVXBMVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBCmtoT2h5OFBwMzhPZE9pVTBUSDlmOVVFdzhZTDJuRTBWR1JDQmZxMjJGc3A4VUlBREtJMmlXZWNZR2JnUjkzQWYKMGhiVVdUYmJXRFRIbjFBR3BQZVZNbTFXN1I5M0QvRVVFVnFCVDVUZmxhcEYzOFY2dVViVE50UFRLT01WcGRJSApHRWlJOVlkaGYxVW5wclhCTC9scTlMZkJaemE4UXlDTDkzeTVoVUlEd2p1NzV1cHRuaFVkOVpoUU1sNy9BV01LCjZNRzcvM1dISDFnQ1BmL0Q1eWN5MHB2aGdIUko1cDdRK2tYOHhMRGNjVHlpWjFQZ1VmL0pwK3liMSsvd2M5NlYKUEJpTUJPL01KcUNLbkJZYlM4Z3RQS1RNUWtOczlEUmxiRzVwM2M3cG1WZkp5cWVZTmxUODJCbW5pdzhObUpEQgpPYWowajNQRFhUK1B5SHJzMWVub3ZBPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
                    url: 'https://api.cs-aws-412-wc9m9.dev02.red-chesterfield.com:6443',
                  },
                  version: '4.12.0-ec.4',
                  versionHistory: [
                    {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b83381ad349bdd535d27a6ae2d78e5a148a9f8930379818ad7a6b6b7303fe2a7',
                      state: 'Completed',
                      verified: false,
                      version: '4.12.0-ec.4',
                    },
                  ],
                },
                displayVersion: 'OpenShift 4.12.0-ec.4',
                isManagedOpenShift: false,
                upgradeInfo: {
                  isUpgrading: false,
                  isReadyUpdates: false,
                  upgradePercentage: '',
                  upgradeFailed: false,
                  hooksInProgress: false,
                  hookFailed: false,
                  latestJob: {
                    conditionMessage: '',
                    step: 'prehook-ansiblejob',
                  },
                  currentVersion: '4.12.0-ec.4',
                  desiredVersion: '4.12.0-ec.4',
                  isReadySelectChannels: false,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  currentChannel: 'stable-4.12',
                  desiredChannel: 'stable-4.12',
                  availableUpdates: [],
                  availableChannels: [],
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
              acmDistribution: {},
              labels: {
                cloud: 'Amazon',
                'cluster.open-cluster-management.io/clusterset': 'default',
                clusterID: '4754dab2-264e-4e69-94b9-893fa0b25ee6',
                'feature.open-cluster-management.io/addon-application-manager': 'available',
                'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-work-manager': 'available',
                'local-cluster': 'true',
                name: 'local-cluster',
                openshiftVersion: '4.12.0-ec.4',
                'openshiftVersion-major': '4',
                'openshiftVersion-major-minor': '4.12',
                'velero.io/exclude-from-backup': 'true',
                vendor: 'OpenShift',
              },
              nodes: {
                nodeList: [
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211452Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-149-227.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211444Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-186-36.ec2.internal',
                  },
                  {
                    capacity: {
                      cpu: '8',
                      memory: '32211452Ki',
                      socket: '1',
                    },
                    conditions: [
                      {
                        status: 'True',
                        type: 'Ready',
                      },
                    ],
                    labels: {
                      'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                      'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                    },
                    name: 'ip-10-0-221-210.ec2.internal',
                  },
                ],
                ready: 3,
                unhealthy: 0,
                unknown: 0,
              },
              kubeApiServer: 'https://api.cs-aws-412-wc9m9.dev02.red-chesterfield.com:6443',
              consoleURL: 'https://console-openshift-console.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
              isHive: false,
              isManaged: true,
              isCurator: false,
              isHostedCluster: false,
              isSNOCluster: false,
              isRegionalHubCluster: false,
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              clusterSet: 'default',
              owner: {},
            },
          ],
          sortedClusterNames: ['local-cluster'],
          appClusters: [],
          searchClusters: [null],
          pulse: 'green',
          shapeType: 'cluster',
        },
      },
      {
        name: 'helloworld-app-route',
        namespace: 'test',
        type: 'route',
        id: 'member--deployed-resource--member--clusters--local-cluster--test3-subscription-2--test--helloworld-app-route--route',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters--local-cluster--test3-subscription-2',
            parentName: 'local-cluster',
            parentType: 'cluster',
          },
          template: {
            template: {
              apiVersion: 'route.openshift.io/v1',
              kind: 'Route',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/hosting-subscription': 'test/test3-subscription-2-local',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'openshift.io/host.generated': 'true',
                },
                labels: {
                  app: 'helloworld-app',
                  'app.kubernetes.io/part-of': 'test3',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'helloworld-app-route',
                namespace: 'test',
              },
              spec: {
                host: 'helloworld-app-route-test.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
                port: {
                  targetPort: 3002,
                },
                to: {
                  kind: 'Service',
                  name: 'helloworld-app-svc',
                  weight: 100,
                },
                wildcardPolicy: 'None',
              },
              status: {
                ingress: [
                  {
                    conditions: [
                      {
                        lastTransitionTime: '2022-11-22T15:33:36Z',
                        status: 'True',
                        type: 'Admitted',
                      },
                    ],
                    host: 'helloworld-app-route-test.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
                    routerCanonicalHostname: 'router-default.apps.cs-aws-412-wc9m9.dev02.red-chesterfield.com',
                    routerName: 'default',
                    wildcardPolicy: 'None',
                  },
                ],
              },
            },
          },
          resourceCount: 1,
          searchClusters: [null],
          routeModel: {
            'helloworld-app-route-local-cluster': [
              {
                _clusterNamespace: '',
                _hostingSubscription: 'test/test3-subscription-2-local',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/7aa56b4b-7688-4bf7-ae5b-a4fb04b3ef5e',
                apigroup: 'route.openshift.io',
                apiversion: 'v1',
                cluster: 'local-cluster',
                created: '2022-11-22T15:33:36Z',
                kind: 'Route',
                kind_plural: 'routes',
                label:
                  'app=helloworld-app; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                name: 'helloworld-app-route',
                namespace: 'test',
                resStatus: 'deployed',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'route',
        },
      },
      {
        name: 'helloworld-app-svc2',
        namespace: 'test',
        type: 'service',
        id: 'member--deployed-resource--member--clusters--local-cluster--test3-subscription-2--test--helloworld-app-svc2--service',
        specs: {
          isDesign: false,
          parent: {
            parentId: 'member--clusters--local-cluster--test3-subscription-2',
            parentName: 'local-cluster',
            parentType: 'cluster',
          },
          resourceCount: 1,
          searchClusters: [null],
          serviceModel: {
            'helloworld-app-svc2-local-cluster': [
              {
                _clusterNamespace: '',
                _hostingSubscription: 'test/test3-subscription-2-local',
                _hubClusterResource: 'true',
                _uid: 'local-cluster/907642bd-556d-49fa-b982-d15cc5c9acca',
                apiversion: 'v1',
                cluster: 'local-cluster',
                clusterIP: '172.30.246.78',
                created: '2022-11-22T15:33:36Z',
                kind: 'Service',
                kind_plural: 'services',
                label:
                  'app=helloworld-app; app.kubernetes.io/part-of=test3; apps.open-cluster-management.io/reconcile-rate=medium',
                name: 'helloworld-app-svc2',
                namespace: 'test',
                port: '3002:31469/tcp',
                type: 'NodePort',
                resStatus: 'deployed',
                pulse: 'green',
              },
            ],
          },
          pulse: 'green',
          shapeType: 'service',
        },
      },
    ],
  },
  processActionLink: mockProcessactionlink,
  canUpdateStatuses: true,
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: {
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selectedArgoAppList: [],
      isLoading: false,
    },
    handleArgoAppDetailsContainerUpdate: mockDispatchaction,
    handleErrorMsg: mockHandleerrormsg,
  },
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: {
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: {},
      selectedClusterList: [],
    },
    handleClusterDetailsContainerUpdate: mockDispatchaction,
  },
  channelControl: {
    allChannels: [
      '__ALL__/__ALL__//__ALL__/__ALL__',
      'test/test3-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
      'test/test3-subscription-2//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    ],
    activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
    setActiveChannel: mockDispatchaction,
  },
  options: {
    typeToShapeMap: {
      application: {
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      },
      applicationset: {
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      },
      cluster: {
        shape: 'cluster',
        className: 'container',
      },
      clusters: {
        shape: 'cluster',
        className: 'container',
      },
      ansiblejob: {
        shape: 'ansiblejob',
        className: 'container',
      },
      configmap: {
        shape: 'configmap',
        className: 'container',
      },
      container: {
        shape: 'container',
        className: 'container',
      },
      customresource: {
        shape: 'customresource',
        className: 'container',
      },
      daemonset: {
        shape: 'daemonset',
        className: 'daemonset',
      },
      deployable: {
        shape: 'deployable',
        className: 'design',
      },
      deployment: {
        shape: 'deployment',
        className: 'deployment',
      },
      deploymentconfig: {
        shape: 'deploymentconfig',
        className: 'deployment',
      },
      helmrelease: {
        shape: 'chart',
        className: 'container',
      },
      host: {
        shape: 'host',
        className: 'host',
      },
      ingress: {
        shape: 'ingress',
        className: 'host',
      },
      internet: {
        shape: 'cloud',
        className: 'internet',
      },
      namespace: {
        shape: 'namespace',
        className: 'host',
      },
      node: {
        shape: 'node',
        className: 'host',
      },
      other: {
        shape: 'other',
        className: 'default',
      },
      package: {
        shape: 'chart',
        className: 'container',
      },
      placement: {
        shape: 'placement',
        className: 'design',
      },
      pod: {
        shape: 'pod',
        className: 'pod',
      },
      policy: {
        shape: 'policy',
        className: 'design',
        nodeRadius: 30,
      },
      replicaset: {
        shape: 'replicaset',
        className: 'container',
      },
      replicationcontroller: {
        shape: 'replicationcontroller',
        className: 'container',
      },
      route: {
        shape: 'route',
        className: 'container',
      },
      placements: {
        shape: 'placements',
        className: 'design',
      },
      secret: {
        shape: 'secret',
        className: 'service',
      },
      service: {
        shape: 'service',
        className: 'service',
      },
      statefulset: {
        shape: 'statefulset',
        className: 'default',
      },
      storageclass: {
        shape: 'storageclass',
        className: 'default',
      },
      subscription: {
        shape: 'subscription',
        className: 'design',
      },
      subscriptionblocked: {
        shape: 'subscriptionblocked',
        className: 'design',
      },
    },
    diagramOptions: {
      showLineLabels: true,
      showGroupTitles: false,
    },
    computeNodeStatus: mockComputenodestatus,
    getNodeDescription: mockGetnodedescription,
    getNodeTitle: mockGetnodetitle,
    getSectionTitles: mockGetsectiontitles,
    getNodeDetails: mockGetnodedetails,
    updateNodeStatus: mockUpdatenodestatus,
    updateNodeIcons: mockUpdatenodeicons,
    getAllFilters: mockGetallfilters,
    getAvailableFilters: mockGetavailablefilters,
    getSearchFilter: mockGetsearchfilter,
    filterNodes: mockFilternodes,
    getConnectedLayoutOptions: mockGetconnectedlayoutoptions,
    getUnconnectedLayoutOptions: mockGetunconnectedlayoutoptions,
  },
  setDrawerContent: mockSetdrawercontent,
}
