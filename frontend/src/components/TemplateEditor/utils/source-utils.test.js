/* Copyright Contributors to the Open Cluster Management project */

import * as sourceUtilsAPI from './source-utils'
import { cleanResults } from '../../../lib/test-shots'

describe('source-utils tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getDecorationRows', async () => {
    const getDecorationRowsFn = jest.spyOn(sourceUtilsAPI, 'getDecorationRows')
    expect(cleanResults(getDecorationRowsFn(...getDecorationRows.args))).toEqual(getDecorationRows.ret)
  })
})

const getDecorationRows = {
  args: [
    [
      {
        value: 'old-3',
        path: 'Application[0].metadata.name',
        decorationType: 'IMMUTABLE',
      },
      {
        value: 'old-prs',
        path: 'Application[0].metadata.namespace',
        decorationType: 'IMMUTABLE',
      },
      {
        value: 'medium',
        path: 'Channel[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
        decorationType: 'IMMUTABLE',
      },
      {
        path: 'PlacementRule[*].kind',
        decorationType: 'DEPRECATED',
      },
      {
        value: 'medium',
        path: 'Channel[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
        decorationType: 'IMMUTABLE',
      },
      {
        path: 'PlacementRule[*].kind',
        decorationType: 'DEPRECATED',
      },
    ],
    {
      Application: [
        {
          $raw: {
            apiVersion: 'app.k8s.io/v1beta1',
            kind: 'Application',
            metadata: {
              name: 'old-3',
              namespace: 'old-prs',
              selfLink: '/namespaces/old-prs/applications/old-3',
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
                    values: ['old-3'],
                  },
                ],
              },
            },
          },
          $yml: 'apiVersion: app.k8s.io/v1beta1\nkind: Application\nmetadata:\n  name: old-3 ##name\n  namespace: old-prs ##namespace\n  selfLink: /namespaces/old-prs/applications/old-3\nspec:\n  componentKinds:\n  - group: apps.open-cluster-management.io\n    kind: Subscription\n  descriptor: {}\n  selector:\n    matchExpressions:\n      - key: app\n        operator: In\n        values: \n          - old-3',
          $synced: {
            apiVersion: {
              $r: 0,
              $l: 1,
              $v: 'app.k8s.io/v1beta1',
            },
            kind: {
              $r: 1,
              $l: 1,
              $v: 'Application',
            },
            metadata: {
              $r: 2,
              $l: 4,
              $v: {
                name: {
                  $r: 3,
                  $l: 1,
                  $cmt: 'name',
                  $v: 'old-3',
                },
                namespace: {
                  $r: 4,
                  $l: 1,
                  $cmt: 'namespace',
                  $v: 'old-prs',
                },
                selfLink: {
                  $r: 5,
                  $l: 1,
                  $v: '/namespaces/old-prs/applications/old-3',
                },
              },
            },
            spec: {
              $r: 6,
              $l: 11,
              $v: {
                componentKinds: {
                  $r: 7,
                  $l: 3,
                  $v: [
                    {
                      $r: 8,
                      $l: 2,
                      $v: {
                        group: {
                          $r: 8,
                          $l: 1,
                          $v: 'apps.open-cluster-management.io',
                        },
                        kind: {
                          $r: 9,
                          $l: 1,
                          $v: 'Subscription',
                        },
                      },
                    },
                  ],
                },
                descriptor: {
                  $r: 10,
                  $l: 1,
                  $v: {},
                },
                selector: {
                  $r: 11,
                  $l: 6,
                  $v: {
                    matchExpressions: {
                      $r: 12,
                      $l: 5,
                      $v: [
                        {
                          $r: 13,
                          $l: 4,
                          $v: {
                            key: {
                              $r: 13,
                              $l: 1,
                              $v: 'app',
                            },
                            operator: {
                              $r: 14,
                              $l: 1,
                              $v: 'In',
                            },
                            values: {
                              $r: 15,
                              $l: 2,
                              $v: [
                                {
                                  $v: 'old-3',
                                  $r: 16,
                                  $l: 1,
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            $r: 0,
            $l: 17,
          },
        },
      ],
      Subscription: [
        {
          $raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-path': null,
                'apps.open-cluster-management.io/reconcile-option': 'merge',
              },
              labels: {
                app: 'old-3',
              },
              name: 'old-3-subscription-4',
              namespace: 'old-prs',
              selfLink: '/namespaces/old-prs/subscriptions/old-3-subscription-1',
            },
            spec: {
              channel: 'ggithubcom-fxiang1-app-samples-ns/',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'old-3-placement-1',
                },
              },
            },
          },
          $yml: 'apiVersion: apps.open-cluster-management.io/v1\nkind: Subscription\nmetadata:\n  annotations:\n    apps.open-cluster-management.io/git-branch: main\n    apps.open-cluster-management.io/git-path: \n    apps.open-cluster-management.io/reconcile-option: merge\n  labels:\n    app: old-3\n  name: old-3-subscription-4\n  namespace: old-prs\n  selfLink: /namespaces/old-prs/subscriptions/old-3-subscription-1\nspec:\n  channel: ggithubcom-fxiang1-app-samples-ns/\n  placement:\n    placementRef:\n      kind: PlacementRule\n      name: old-3-placement-1',
          $synced: {
            apiVersion: {
              $r: 18,
              $l: 1,
              $v: 'apps.open-cluster-management.io/v1',
            },
            kind: {
              $r: 19,
              $l: 1,
              $v: 'Subscription',
            },
            metadata: {
              $r: 20,
              $l: 10,
              $v: {
                annotations: {
                  $r: 21,
                  $l: 4,
                  $v: {
                    'apps.open-cluster-management.io/git-branch': {
                      $r: 22,
                      $l: 1,
                      $v: 'main',
                    },
                    'apps.open-cluster-management.io/git-path': {
                      $r: 23,
                      $l: 1,
                      $v: null,
                    },
                    'apps.open-cluster-management.io/reconcile-option': {
                      $r: 24,
                      $l: 1,
                      $v: 'merge',
                    },
                  },
                },
                labels: {
                  $r: 25,
                  $l: 2,
                  $v: {
                    app: {
                      $r: 26,
                      $l: 1,
                      $v: 'old-3',
                    },
                  },
                },
                name: {
                  $r: 27,
                  $l: 1,
                  $v: 'old-3-subscription-4',
                },
                namespace: {
                  $r: 28,
                  $l: 1,
                  $v: 'old-prs',
                },
                selfLink: {
                  $r: 29,
                  $l: 1,
                  $v: '/namespaces/old-prs/subscriptions/old-3-subscription-1',
                },
              },
            },
            spec: {
              $r: 30,
              $l: 6,
              $v: {
                channel: {
                  $r: 31,
                  $l: 1,
                  $v: 'ggithubcom-fxiang1-app-samples-ns/',
                },
                placement: {
                  $r: 32,
                  $l: 4,
                  $v: {
                    placementRef: {
                      $r: 33,
                      $l: 3,
                      $v: {
                        kind: {
                          $r: 34,
                          $l: 1,
                          $v: 'PlacementRule',
                        },
                        name: {
                          $r: 35,
                          $l: 1,
                          $v: 'old-3-placement-1',
                        },
                      },
                    },
                  },
                },
              },
            },
            $r: 18,
            $l: 18,
          },
        },
        {
          $raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'val-b1',
                'apps.open-cluster-management.io/git-path': 'resources-roke',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
              },
              labels: {
                app: 'old-3',
              },
              name: 'old-3-subscription-5',
              namespace: 'old-prs',
              selfLink: '/namespaces/old-prs/subscriptions/old-3-subscription-2',
            },
            spec: {
              channel: 'ggithubcom-fxiang1-app-samples-ns/',
              placement: {
                placementRef: {
                  kind: 'PlacementRule',
                  name: 'old-3-placement-2',
                },
              },
            },
          },
          $yml: 'apiVersion: apps.open-cluster-management.io/v1\nkind: Subscription\nmetadata:\n  annotations:\n    apps.open-cluster-management.io/git-branch: val-b1\n    apps.open-cluster-management.io/git-path: resources-roke\n    apps.open-cluster-management.io/reconcile-option: merge\n  labels:\n    app: old-3\n  name: old-3-subscription-5\n  namespace: old-prs\n  selfLink: /namespaces/old-prs/subscriptions/old-3-subscription-2\nspec:\n  channel: ggithubcom-fxiang1-app-samples-ns/\n  placement:\n    placementRef:\n      kind: PlacementRule\n      name: old-3-placement-2',
          $synced: {
            apiVersion: {
              $r: 53,
              $l: 1,
              $v: 'apps.open-cluster-management.io/v1',
            },
            kind: {
              $r: 54,
              $l: 1,
              $v: 'Subscription',
            },
            metadata: {
              $r: 55,
              $l: 10,
              $v: {
                annotations: {
                  $r: 56,
                  $l: 4,
                  $v: {
                    'apps.open-cluster-management.io/git-branch': {
                      $r: 57,
                      $l: 1,
                      $v: 'val-b1',
                    },
                    'apps.open-cluster-management.io/git-path': {
                      $r: 58,
                      $l: 1,
                      $v: 'resources-roke',
                    },
                    'apps.open-cluster-management.io/reconcile-option': {
                      $r: 59,
                      $l: 1,
                      $v: 'merge',
                    },
                  },
                },
                labels: {
                  $r: 60,
                  $l: 2,
                  $v: {
                    app: {
                      $r: 61,
                      $l: 1,
                      $v: 'old-3',
                    },
                  },
                },
                name: {
                  $r: 62,
                  $l: 1,
                  $v: 'old-3-subscription-5',
                },
                namespace: {
                  $r: 63,
                  $l: 1,
                  $v: 'old-prs',
                },
                selfLink: {
                  $r: 64,
                  $l: 1,
                  $v: '/namespaces/old-prs/subscriptions/old-3-subscription-2',
                },
              },
            },
            spec: {
              $r: 65,
              $l: 6,
              $v: {
                channel: {
                  $r: 66,
                  $l: 1,
                  $v: 'ggithubcom-fxiang1-app-samples-ns/',
                },
                placement: {
                  $r: 67,
                  $l: 4,
                  $v: {
                    placementRef: {
                      $r: 68,
                      $l: 3,
                      $v: {
                        kind: {
                          $r: 69,
                          $l: 1,
                          $v: 'PlacementRule',
                        },
                        name: {
                          $r: 70,
                          $l: 1,
                          $v: 'old-3-placement-2',
                        },
                      },
                    },
                  },
                },
              },
            },
            $r: 53,
            $l: 18,
          },
        },
      ],
      PlacementRule: [
        {
          $raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'PlacementRule',
            metadata: {
              annotations: {
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              labels: {
                app: 'old-3',
              },
              name: 'old-3-placement-1',
              namespace: 'old-prs',
            },
            spec: {
              clusterConditions: {
                0: {
                  status: 'True',
                  type: 'ManagedClusterConditionAvailable',
                },
              },
            },
          },
          $yml: 'apiVersion: apps.open-cluster-management.io/v1\nkind: PlacementRule\nmetadata:\n  annotations:\n    open-cluster-management.io/user-group: c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk\n    open-cluster-management.io/user-identity: a3ViZTphZG1pbg==\n  labels:\n    app: old-3\n  name: old-3-placement-1\n  namespace: old-prs\nspec:\n  clusterConditions:\n    "0":\n      status: "True"\n      type: ManagedClusterConditionAvailable',
          $synced: {
            apiVersion: {
              $r: 37,
              $l: 1,
              $v: 'apps.open-cluster-management.io/v1',
            },
            kind: {
              $r: 38,
              $l: 1,
              $v: 'PlacementRule',
            },
            metadata: {
              $r: 39,
              $l: 8,
              $v: {
                annotations: {
                  $r: 40,
                  $l: 3,
                  $v: {
                    'open-cluster-management.io/user-group': {
                      $r: 41,
                      $l: 1,
                      $v: 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    },
                    'open-cluster-management.io/user-identity': {
                      $r: 42,
                      $l: 1,
                      $v: 'a3ViZTphZG1pbg==',
                    },
                  },
                },
                labels: {
                  $r: 43,
                  $l: 2,
                  $v: {
                    app: {
                      $r: 44,
                      $l: 1,
                      $v: 'old-3',
                    },
                  },
                },
                name: {
                  $r: 45,
                  $l: 1,
                  $v: 'old-3-placement-1',
                },
                namespace: {
                  $r: 46,
                  $l: 1,
                  $v: 'old-prs',
                },
              },
            },
            spec: {
              $r: 47,
              $l: 5,
              $v: {
                clusterConditions: {
                  $r: 48,
                  $l: 4,
                  $v: {
                    0: {
                      $r: 49,
                      $l: 3,
                      $v: {
                        status: {
                          $r: 50,
                          $l: 1,
                          $v: 'True',
                        },
                        type: {
                          $r: 51,
                          $l: 1,
                          $v: 'ManagedClusterConditionAvailable',
                        },
                      },
                    },
                  },
                },
              },
            },
            $r: 37,
            $l: 15,
          },
        },
        {
          $raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'PlacementRule',
            metadata: {
              annotations: {
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              labels: {
                app: 'old-3',
              },
              name: 'old-3-placement-2',
              namespace: 'old-prs',
            },
            spec: {
              clusterSelector: {
                matchLabels: {
                  'local-cluster': 'true',
                },
              },
            },
          },
          $yml: 'apiVersion: apps.open-cluster-management.io/v1\nkind: PlacementRule\nmetadata:\n  annotations:\n    open-cluster-management.io/user-group: c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk\n    open-cluster-management.io/user-identity: a3ViZTphZG1pbg==\n  labels:\n    app: old-3\n  name: old-3-placement-2\n  namespace: old-prs\nspec:\n  clusterSelector:\n    matchLabels:\n      local-cluster: "true"',
          $synced: {
            apiVersion: {
              $r: 72,
              $l: 1,
              $v: 'apps.open-cluster-management.io/v1',
            },
            kind: {
              $r: 73,
              $l: 1,
              $v: 'PlacementRule',
            },
            metadata: {
              $r: 74,
              $l: 8,
              $v: {
                annotations: {
                  $r: 75,
                  $l: 3,
                  $v: {
                    'open-cluster-management.io/user-group': {
                      $r: 76,
                      $l: 1,
                      $v: 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    },
                    'open-cluster-management.io/user-identity': {
                      $r: 77,
                      $l: 1,
                      $v: 'a3ViZTphZG1pbg==',
                    },
                  },
                },
                labels: {
                  $r: 78,
                  $l: 2,
                  $v: {
                    app: {
                      $r: 79,
                      $l: 1,
                      $v: 'old-3',
                    },
                  },
                },
                name: {
                  $r: 80,
                  $l: 1,
                  $v: 'old-3-placement-2',
                },
                namespace: {
                  $r: 81,
                  $l: 1,
                  $v: 'old-prs',
                },
              },
            },
            spec: {
              $r: 82,
              $l: 4,
              $v: {
                clusterSelector: {
                  $r: 83,
                  $l: 3,
                  $v: {
                    matchLabels: {
                      $r: 84,
                      $l: 2,
                      $v: {
                        'local-cluster': {
                          $r: 85,
                          $l: 1,
                          $v: 'true',
                        },
                      },
                    },
                  },
                },
              },
            },
            $r: 72,
            $l: 14,
          },
        },
      ],
    },
  ],
  ret: [
    {
      $r: 3,
      $l: 1,
      $cmt: 'name',
      $v: 'old-3',
      decorationType: 'IMMUTABLE',
    },
    {
      $r: 4,
      $l: 1,
      $cmt: 'namespace',
      $v: 'old-prs',
      decorationType: 'IMMUTABLE',
    },
    {
      $r: 38,
      $l: 1,
      $v: 'PlacementRule',
      decorationType: 'DEPRECATED',
    },
    {
      $r: 73,
      $l: 1,
      $v: 'PlacementRule',
      decorationType: 'DEPRECATED',
    },
    {
      $r: 38,
      $l: 1,
      $v: 'PlacementRule',
      decorationType: 'DEPRECATED',
    },
    {
      $r: 73,
      $l: 1,
      $v: 'PlacementRule',
      decorationType: 'DEPRECATED',
    },
  ],
}
