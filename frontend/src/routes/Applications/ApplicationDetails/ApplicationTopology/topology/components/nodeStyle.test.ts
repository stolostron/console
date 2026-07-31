/* Copyright Contributors to the Open Cluster Management project */
import { cleanResults } from '../../../../../../lib/test-shots'

jest.mock('@patternfly/react-topology', () => ({
  NodeStatus: {
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    default: 'default',
  },
}))

jest.mock('./nodeStatusIcons.css', () => ({}))

import * as nodeStyleAPI from './nodeStyle'

describe('nodeStyle tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('happy path', async () => {
    const getNodeStyleFn = jest.spyOn(nodeStyleAPI, 'getNodeStyle') as jest.Mock<any>
    expect(cleanResults(getNodeStyleFn(...getNodeStyle.args))).toEqual(getNodeStyle.ret)
  })

  test('git node label joins path and chart from spec.resources', () => {
    const result = nodeStyleAPI.getNodeStyle(
      {
        uid: 'u',
        name: 'repo',
        namespace: 'ns',
        type: 'git',
        specs: {
          resources: [{ path: 'apps/foo' }, { chart: 'mychart' }],
        },
      },
      undefined
    )
    expect(result.label).toBe('apps/foo, mychart')
  })

  test('git node label is Repo when resources missing or empty', () => {
    expect(
      nodeStyleAPI.getNodeStyle({ uid: 'u', name: 'repo', namespace: 'ns', type: 'git', specs: {} }, undefined).label
    ).toBe('Repo')
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'repo', namespace: 'ns', type: 'git', specs: { resources: [] } },
        undefined
      ).label
    ).toBe('Repo')
  })

  test('git node uses path when no chart property (argo git default)', () => {
    const result = nodeStyleAPI.getNodeStyle(
      {
        uid: 'u',
        name: 'repo',
        namespace: 'ns',
        type: 'git',
        specs: {
          resources: [{ path: 'manifests' }],
        },
      },
      undefined
    )
    expect(result.label).toBe('manifests')
  })

  test('chart node uses same label rules as git', () => {
    const result = nodeStyleAPI.getNodeStyle(
      {
        uid: 'u',
        name: 'repo',
        namespace: 'ns',
        type: 'chart',
        specs: {
          resources: [{ chart: 'redis' }],
        },
      },
      undefined
    )
    expect(result.label).toBe('redis')
  })

  test('cluster label uses single cluster name or Multiple Clusters', () => {
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'c', namespace: '', type: 'cluster', specs: { clustersNames: ['only'] } },
        undefined
      ).label
    ).toBe('only')
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'c', namespace: '', type: 'cluster', specs: { clustersNames: ['a', 'b'] } },
        undefined
      ).label
    ).toBe('Multiple Clusters')
  })

  test('application and applicationset labels', () => {
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'app', namespace: 'ns', type: 'application', specs: { applicationName: 'hello' } },
        undefined
      ).label
    ).toBe('hello')
    expect(
      nodeStyleAPI.getNodeStyle({ uid: 'u', name: 'app', namespace: 'ns', type: 'application', specs: {} }, undefined)
        .label
    ).toBe('Application')
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'as', namespace: 'ns', type: 'applicationset', specs: { raw: { isChild: true } } },
        undefined
      ).label
    ).toBe('Application Set')
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'as', namespace: 'ns', type: 'applicationset', specs: { isAppSetPullModel: true } },
        undefined
      ).label
    ).toBe('Pull Application Set')
    expect(
      nodeStyleAPI.getNodeStyle({ uid: 'u', name: 'as', namespace: 'ns', type: 'applicationset', specs: {} }, undefined)
        .label
    ).toBe('Push Application Set')
  })

  test('placementDecision and default type labels', () => {
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'pd', namespace: 'ns', type: 'placementDecision', specs: {} },
        undefined
      ).label
    ).toBe('Placement Decision')
    expect(
      nodeStyleAPI.getNodeStyle({ uid: 'u', name: 'a', namespace: 'ns', type: 'argocd', specs: {} }, undefined).label
    ).toBe('Argo CD')
    expect(
      nodeStyleAPI.getNodeStyle(
        { uid: 'u', name: 'a', namespace: 'ns', type: undefined as unknown as string, specs: {} },
        undefined
      ).label
    ).toBe('')
  })

  test('cluster status icons from clusterStatus', () => {
    expect(
      nodeStyleAPI.getNodeStyle(
        {
          uid: 'u',
          name: 'c',
          namespace: '',
          type: 'cluster',
          specs: {
            clusterStatus: {
              hasWarning: false,
              hasFailure: true,
              isDisabled: false,
              hasViolations: false,
              isOffline: false,
            },
          },
        },
        undefined
      ).status
    ).toBe('danger')
    expect(
      nodeStyleAPI.getNodeStyle(
        {
          uid: 'u',
          name: 'c',
          namespace: '',
          type: 'cluster',
          specs: {
            clusterStatus: {
              hasWarning: true,
              hasFailure: false,
              isDisabled: true,
              hasViolations: false,
              isOffline: false,
            },
          },
        },
        undefined
      )
    ).toEqual(
      expect.objectContaining({
        status: 'warning',
        isDisabled: true,
      })
    )
  })

  test.each([
    ['none', 'default', undefined],
    ['red', 'danger', 'failure'],
    ['yellow', 'warning', 'warning'],
    ['orange', 'default', 'pending'],
    ['green', 'success', 'success'],
    ['spinner', 'default', 'spinner'],
    ['sync', 'default', 'sync'],
  ] as const)('pulse %s maps to status %s', (pulse, status, expectedIcon) => {
    const result = nodeStyleAPI.getNodeStyle(
      { uid: 'u', name: 'n', namespace: 'ns', type: 'deployment', specs: { pulse } },
      undefined
    )
    expect(result.status).toBe(status)
    expect(result.statusIcon?.icon).toBe(expectedIcon)
  })

  test('defaults offset when undefined', () => {
    const result = nodeStyleAPI.getNodeStyle(
      { uid: 'u', name: 'n', namespace: 'ns', type: 'service', specs: {} },
      undefined
    )
    expect(result.dx).toBe(0)
    expect(result.dy).toBe(0)
  })
})

const getNodeStyle = {
  args: [
    {
      name: 'blocked-app-subscription-1',
      namespace: 'default',
      type: 'subscription',
      id: 'member--subscription--default--blocked-app-subscription-1',
      specs: {
        title: 'helloworld',
        isDesign: true,
        hasRules: false,
        isPlaced: false,
        isBlocked: true,
        raw: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          kind: 'Subscription',
          metadata: {
            annotations: {
              'apps.open-cluster-management.io/git-branch': 'main',
              'apps.open-cluster-management.io/git-current-commit': '63940d8ed85804ab11e82162e37f9d01dd2e9c94',
              'apps.open-cluster-management.io/git-path': 'helloworld',
              'apps.open-cluster-management.io/reconcile-option': 'merge',
              'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
              'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
            },
            labels: {
              app: 'blocked-app',
              'app.kubernetes.io/part-of': 'blocked-app',
              'apps.open-cluster-management.io/reconcile-rate': 'medium',
            },
            name: 'blocked-app-subscription-1',
            namespace: 'default',
          },
          spec: {
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            placement: {
              placementRef: {
                kind: 'Placement',
                name: 'rbrunopi-test-policy-placement',
              },
            },
            timewindow: {
              daysofweek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              hours: [
                {
                  end: '12:00AM',
                  start: '12:00AM',
                },
              ],
              location: 'America/New_York',
              windowtype: 'blocked',
            },
          },
          status: {
            lastUpdateTime: '2023-04-25T16:32:55Z',
            message: 'Blocked',
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
                name: 'ggithubcom-fxiang1-app-samples',
                namespace: 'ggithubcom-fxiang1-app-samples-ns',
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
                labels: {
                  'cluster.open-cluster-management.io/placement': 'rbrunopi-test-policy-placement',
                },
                name: 'rbrunopi-test-policy-placement-decision-1',
                namespace: 'default',
                ownerReferences: [
                  {
                    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Placement',
                    name: 'rbrunopi-test-policy-placement',
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
                name: 'rbrunopi-test-policy-placement',
                namespace: 'default',
              },
              spec: {
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
                    lastTransitionTime: '2023-04-25T14:05:16Z',
                    message: 'Placement configurations check pass',
                    reason: 'Succeedconfigured',
                    status: 'False',
                    type: 'PlacementMisconfigured',
                  },
                  {
                    lastTransitionTime: '2023-04-25T14:05:16Z',
                    message: 'No valid ManagedClusterSetBindings found in placement namespace',
                    reason: 'NoManagedClusterSetBindings',
                    status: 'False',
                    type: 'PlacementSatisfied',
                  },
                ],
                numberOfSelectedClusters: 0,
              },
            },
          ],
          report: {
            apiVersion: 'apps.open-cluster-management.io/v1alpha1',
            kind: 'SubscriptionReport',
            metadata: {
              labels: {
                'apps.open-cluster-management.io/hosting-subscription': 'default.blocked-app-subscription-1',
              },
              name: 'blocked-app-subscription-1',
              namespace: 'default',
              ownerReferences: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Subscription',
                  name: 'blocked-app-subscription-1',
                },
              ],
            },
            reportType: 'Application',
            resources: [
              {
                apiVersion: 'v1',
                kind: 'Service',
                name: 'helloworld-app-svc',
                namespace: 'default',
              },
              {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                name: 'helloworld-app-deploy',
                namespace: 'default',
              },
              {
                apiVersion: 'route.openshift.io/v1',
                kind: 'Route',
                name: 'helloworld-app-route',
                namespace: 'default',
              },
            ],
            summary: {
              clusters: '0',
              deployed: '0',
              failed: '0',
              inProgress: '0',
              propagationFailed: '0',
            },
          },
        },
        clustersNames: [],
        searchClusters: [],
        subscriptionModel: {
          'blocked-app-subscription-1-local-cluster-default': [
            {
              _clusterNamespace: '',
              _gitbranch: 'main',
              _gitpath: 'helloworld',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/6be86281-1831-4ab6-9474-b85bd35ce0ea',
              apigroup: 'apps.open-cluster-management.io',
              apiversion: 'v1',
              channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
              cluster: 'local-cluster',
              created: '2023-04-25T16:32:55Z',
              kind: 'Subscription',
              kind_plural: 'subscriptions',
              label:
                'app=blocked-app; app.kubernetes.io/part-of=blocked-app; apps.open-cluster-management.io/reconcile-rate=medium',
              localPlacement: 'false',
              name: 'blocked-app-subscription-1',
              namespace: 'default',
              status: 'Propagated',
              timeWindow: 'blocked',
            },
          ],
        },
        pulse: 'blocked',
        shapeType: 'subscription',
      },
    },
    {
      dx: -32.5,
      dy: -220,
    },
  ],
  ret: {
    dx: -32.5,
    dy: -220,
    width: 65,
    height: 65,
    status: 'success',
    statusIcon: {
      icon: 'blocked',
      classType: 'success',
      width: 16,
      height: 16,
      dx: -18,
      dy: 12,
    },
    type: 'subscription',
    specs: {
      title: 'helloworld',
      isDesign: true,
      hasRules: false,
      isPlaced: false,
      isBlocked: true,
      raw: {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/git-branch': 'main',
            'apps.open-cluster-management.io/git-current-commit': '63940d8ed85804ab11e82162e37f9d01dd2e9c94',
            'apps.open-cluster-management.io/git-path': 'helloworld',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          labels: {
            app: 'blocked-app',
            'app.kubernetes.io/part-of': 'blocked-app',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'blocked-app-subscription-1',
          namespace: 'default',
        },
        spec: {
          channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          placement: {
            placementRef: {
              kind: 'Placement',
              name: 'rbrunopi-test-policy-placement',
            },
          },
          timewindow: {
            daysofweek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            hours: [
              {
                end: '12:00AM',
                start: '12:00AM',
              },
            ],
            location: 'America/New_York',
            windowtype: 'blocked',
          },
        },
        status: {
          lastUpdateTime: '2023-04-25T16:32:55Z',
          message: 'Blocked',
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
              name: 'ggithubcom-fxiang1-app-samples',
              namespace: 'ggithubcom-fxiang1-app-samples-ns',
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
              labels: {
                'cluster.open-cluster-management.io/placement': 'rbrunopi-test-policy-placement',
              },
              name: 'rbrunopi-test-policy-placement-decision-1',
              namespace: 'default',
              ownerReferences: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Placement',
                  name: 'rbrunopi-test-policy-placement',
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
              name: 'rbrunopi-test-policy-placement',
              namespace: 'default',
            },
            spec: {
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
                  lastTransitionTime: '2023-04-25T14:05:16Z',
                  message: 'Placement configurations check pass',
                  reason: 'Succeedconfigured',
                  status: 'False',
                  type: 'PlacementMisconfigured',
                },
                {
                  lastTransitionTime: '2023-04-25T14:05:16Z',
                  message: 'No valid ManagedClusterSetBindings found in placement namespace',
                  reason: 'NoManagedClusterSetBindings',
                  status: 'False',
                  type: 'PlacementSatisfied',
                },
              ],
              numberOfSelectedClusters: 0,
            },
          },
        ],
        report: {
          apiVersion: 'apps.open-cluster-management.io/v1alpha1',
          kind: 'SubscriptionReport',
          metadata: {
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'default.blocked-app-subscription-1',
            },
            name: 'blocked-app-subscription-1',
            namespace: 'default',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'blocked-app-subscription-1',
              },
            ],
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'v1',
              kind: 'Service',
              name: 'helloworld-app-svc',
              namespace: 'default',
            },
            {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              name: 'helloworld-app-deploy',
              namespace: 'default',
            },
            {
              apiVersion: 'route.openshift.io/v1',
              kind: 'Route',
              name: 'helloworld-app-route',
              namespace: 'default',
            },
          ],
          summary: {
            clusters: '0',
            deployed: '0',
            failed: '0',
            inProgress: '0',
            propagationFailed: '0',
          },
        },
      },
      clustersNames: [],
      searchClusters: [],
      subscriptionModel: {
        'blocked-app-subscription-1-local-cluster-default': [
          {
            _clusterNamespace: '',
            _gitbranch: 'main',
            _gitpath: 'helloworld',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/6be86281-1831-4ab6-9474-b85bd35ce0ea',
            apigroup: 'apps.open-cluster-management.io',
            apiversion: 'v1',
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            cluster: 'local-cluster',
            created: '2023-04-25T16:32:55Z',
            kind: 'Subscription',
            kind_plural: 'subscriptions',
            label:
              'app=blocked-app; app.kubernetes.io/part-of=blocked-app; apps.open-cluster-management.io/reconcile-rate=medium',
            localPlacement: 'false',
            name: 'blocked-app-subscription-1',
            namespace: 'default',
            status: 'Propagated',
            timeWindow: 'blocked',
          },
        ],
      },
      pulse: 'blocked',
      shapeType: 'subscription',
    },
    name: 'blocked-app-subscription-1',
    namespace: 'default',
    shape: 'subscription',
    label: 'Subscription',
    isDisabled: false,
  },
}
