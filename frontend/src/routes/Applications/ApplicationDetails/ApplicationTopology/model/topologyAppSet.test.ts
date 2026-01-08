/* Copyright Contributors to the Open Cluster Management project */

import { nockSearch } from '../../../../../lib/nock-util'
import { getAppSetTopology, openArgoCDEditor } from './topologyAppSet'
import i18next, { TFunction } from 'i18next'
import type { ApplicationModel, AppSetTopologyResult } from '../types'
import { ToolbarControl } from '../topology/components/TopologyToolbar'
import { waitFor } from '@testing-library/react'

const t: TFunction = i18next.t.bind(i18next)

const mockToolbarControl: ToolbarControl = {
  allClusters: undefined,
  activeClusters: undefined,
  setActiveClusters: jest.fn(),
  setAllClusters: jest.fn(),
  allApplications: undefined,
  activeApplications: undefined,
  setAllApplications: jest.fn(),
  setActiveApplications: jest.fn(),
  allTypes: undefined,
  activeTypes: undefined,
  setAllTypes: jest.fn(),
  setActiveTypes: jest.fn(),
}

const mockAppSetSearchQuery = {
  operationName: 'searchResultItemsAndRelatedItems',
  variables: {
    input: [
      {
        keywords: [],
        filters: [
          { property: 'name', values: ['feng-appset-hello-local-cluster'] },
          { property: 'namespace', values: ['openshift-gitops'] },
          { property: 'cluster', values: ['local-cluster'] },
          { property: 'apigroup', values: ['argoproj.io'] },
        ],
        relatedKinds: [],
      },
    ],
  },
  query:
    'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
}

const mockAppSetSearchResponse = {
  data: {
    searchResult: [
      {
        items: [
          {
            name: 'feng-appset-hello-local-cluster',
            namespace: 'openshift-gitops',
            cluster: 'local-cluster',
            _uid: 'local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d',
          },
        ],
        related: [
          {
            kind: 'Service',
            items: [
              {
                name: 'helloworld-app-svc',
                namespace: 'feng-appset-hello',
                cluster: 'local-cluster',
                kind: 'Service',
                apiversion: 'v1',
                _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
              },
            ],
          },
          {
            kind: 'Deployment',
            items: [
              {
                name: 'helloworld-app-deploy',
                namespace: 'feng-appset-hello',
                cluster: 'local-cluster',
                kind: 'Deployment',
                apigroup: 'apps',
                apiversion: 'v1',
                _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
              },
            ],
          },
          {
            kind: 'Route',
            items: [
              {
                name: 'helloworld-app-route',
                namespace: 'feng-appset-hello',
                cluster: 'local-cluster',
                kind: 'Route',
                apigroup: 'route.openshift.io',
                apiversion: 'v1',
                _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
              },
            ],
          },
        ],
        __typename: 'SearchResult',
      },
    ],
  },
}

describe('openArgoCDEditor remote cluster', () => {
  const mockSearchQuery = {
    operationName: 'searchResultItemsAndRelatedItems',
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['route'] },
            { property: 'namespace', values: ['app1-ns'] },
            { property: 'cluster', values: ['cluster1'] },
            { property: 'label', values: ['app.kubernetes.io/part-of=argocd'] },
          ],
          relatedKinds: [],
        },
      ],
    },
    query:
      'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
  }
  beforeEach(async () => {
    nockSearch(mockSearchQuery, { data: {} })
  })
  it('can open link on remote cluster', () => {
    expect(openArgoCDEditor('cluster1', 'app1-ns', 'app1', () => {}, t, 'local-cluster')).toEqual(undefined)
  })
})

const application: ApplicationModel = {
  name: 'feng-appset-hello',
  namespace: 'openshift-gitops',
  app: {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      creationTimestamp: '2023-01-23T16:50:12Z',
      name: 'feng-appset-hello',
      namespace: 'openshift-gitops',
      resourceVersion: '1166741',
      uid: 'b77de6bd-8a45-4069-a3d0-2119fa0e7f36',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: {
                'cluster.open-cluster-management.io/placement': 'feng-appset-hello-placement',
              },
            },
            requeueAfterSeconds: 180,
          },
        },
      ],
      template: {
        metadata: {
          labels: {
            'velero.io/exclude-from-backup': 'true',
          },
          name: 'feng-appset-hello-{{name}}',
        },
        spec: {
          destination: {
            namespace: 'feng-appset-hello',
            server: '{{server}}',
          },
          project: 'default',
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'main',
          },
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
            syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
          },
        },
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: '2023-01-23T16:50:12Z',
          message: 'Successfully generated parameters for all Applications',
          reason: 'ApplicationSetUpToDate',
          status: 'False',
          type: 'ErrorOccurred',
        },
        {
          lastTransitionTime: '2023-01-23T16:50:12Z',
          message: 'Successfully generated parameters for all Applications',
          reason: 'ParametersGenerated',
          status: 'True',
          type: 'ParametersGenerated',
        },
        {
          lastTransitionTime: '2023-01-23T16:50:12Z',
          message: 'ApplicationSet up to date',
          reason: 'ApplicationSetUpToDate',
          status: 'True',
          type: 'ResourcesUpToDate',
        },
      ],
    },
  },
  metadata: {
    creationTimestamp: '2023-01-23T16:50:12Z',
    generation: 1,
    name: 'feng-appset-hello',
    namespace: 'openshift-gitops',
    resourceVersion: '1166741',
    uid: 'b77de6bd-8a45-4069-a3d0-2119fa0e7f36',
  },
  placement: {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'Placement',
    metadata: {
      creationTimestamp: '2023-01-23T16:50:12Z',
      name: 'feng-appset-hello-placement',
      namespace: 'openshift-gitops',
      resourceVersion: '1166737',
      uid: '62fdd3f9-a906-4735-80fd-814cb5db22e5',
    },
    spec: {
      clusterSets: ['default'],
    },
    status: {
      conditions: [
        {
          lastTransitionTime: '2023-01-23T16:50:12Z',
          message: 'Placement configurations check pass',
          reason: 'Succeedconfigured',
          status: 'False',
          type: 'PlacementMisconfigured',
        },
        {
          lastTransitionTime: '2023-01-23T16:50:12Z',
          message: 'All cluster decisions scheduled',
          reason: 'AllDecisionsScheduled',
          status: 'True',
          type: 'PlacementSatisfied',
        },
      ],
      numberOfSelectedClusters: 1,
    },
  },
  isArgoApp: false,
  isAppSet: true,
  isOCPApp: false,
  isFluxApp: false,
  appSetApps: [
    {
      metadata: {
        generation: 14,
        labels: {
          'velero.io/exclude-from-backup': 'true',
        },
        name: 'feng-appset-hello-local-cluster',
        namespace: 'openshift-gitops',
      },
      spec: {
        destination: {
          namespace: 'feng-appset-hello',
          server: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
        },
        project: 'default',
        source: {
          path: 'helloworld',
          repoURL: 'https://github.com/fxiang1/app-samples',
          targetRevision: 'main',
        },
      },
      status: {
        health: {
          status: 'Healthy',
        },
        resources: [
          {
            health: {
              status: 'Healthy',
            },
            kind: 'Service',
            name: 'helloworld-app-svc',
            namespace: 'feng-appset-hello',
            status: 'Synced',
            version: 'v1',
          },
          {
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'helloworld-app-deploy',
            namespace: 'feng-appset-hello',
            status: 'Synced',
            version: 'v1',
          },
          {
            group: 'route.openshift.io',
            health: {
              message: 'Route is healthy',
              status: 'Healthy',
            },
            kind: 'Route',
            name: 'helloworld-app-route',
            namespace: 'feng-appset-hello',
            status: 'Synced',
            version: 'v1',
          },
        ],
        sync: {
          status: 'Synced',
        },
      },
    },
  ],
  appSetClusters: [
    {
      name: 'local-cluster',
      namespace: 'local-cluster',
      url: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
      status: 'ok',
      created: '2023-01-19T20:00:18Z',
    },
  ],
  isAppSetPullModel: false,
}
const result: AppSetTopologyResult = {
  links: [
    {
      from: {
        uid: 'application--feng-appset-hello',
      },
      specs: {
        isDesign: true,
      },
      to: {
        uid: 'member--placements--openshift-gitops--feng-appset-hello',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--placements--openshift-gitops--feng-appset-hello',
      },
      specs: {
        isDesign: true,
      },
      to: {
        uid: 'member--clusters--',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----service--feng-appset-hello--helloworld-app-svc',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----route--feng-appset-hello--helloworld-app-route',
      },
      type: '',
    },
  ],
  nodes: [
    {
      id: 'application--feng-appset-hello',
      isArgoCDPullModelTargetLocalCluster: false,
      isPlacementFound: true,
      name: 'feng-appset-hello',
      namespace: 'openshift-gitops',
      specs: {
        allClusters: {
          isLocal: true,
          remoteCount: 0,
        },
        appSetApps: [
          {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'Application',
            metadata: {
              creationTimestamp: '2023-01-23T16:50:12Z',
              finalizers: ['resources-finalizer.argocd.argoproj.io'],
              generation: 14,
              labels: {
                'velero.io/exclude-from-backup': 'true',
              },
              name: 'feng-appset-hello-local-cluster',
              namespace: 'openshift-gitops',
              ownerReferences: [
                {
                  apiVersion: 'argoproj.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ApplicationSet',
                  name: 'feng-appset-hello',
                  uid: 'b77de6bd-8a45-4069-a3d0-2119fa0e7f36',
                },
              ],
              resourceVersion: '1175771',
              uid: '142e2afb-5359-4b1a-b10b-ccab726b689d',
            },
            spec: {
              destination: {
                namespace: 'feng-appset-hello',
                server: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
              },
              project: 'default',
              source: {
                path: 'helloworld',
                repoURL: 'https://github.com/fxiang1/app-samples',
                targetRevision: 'main',
              },
              syncPolicy: {
                automated: {
                  prune: true,
                  selfHeal: true,
                },
                syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
              },
            },
            status: {
              health: {
                status: 'Healthy',
              },
              history: [
                {
                  deployStartedAt: '2023-01-23T16:50:13Z',
                  deployedAt: '2023-01-23T16:50:19Z',
                  id: 0,
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'main',
                  },
                },
              ],
              operationState: {
                finishedAt: '2023-01-23T16:50:19Z',
                message: 'successfully synced (all tasks run)',
                operation: {
                  initiatedBy: {
                    automated: true,
                  },
                  retry: {
                    limit: 5,
                  },
                  sync: {
                    prune: true,
                    revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                    syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
                  },
                },
                phase: 'Succeeded',
                startedAt: '2023-01-23T16:50:13Z',
                syncResult: {
                  resources: [
                    {
                      group: '',
                      hookPhase: 'Succeeded',
                      kind: 'Namespace',
                      message: 'namespace/feng-appset-hello created',
                      name: 'feng-appset-hello',
                      namespace: '',
                      status: 'Synced',
                      syncPhase: 'PreSync',
                      version: 'v1',
                    },
                    {
                      group: '',
                      hookPhase: 'Running',
                      kind: 'Service',
                      message: 'service/helloworld-app-svc created',
                      name: 'helloworld-app-svc',
                      namespace: 'feng-appset-hello',
                      status: 'Synced',
                      syncPhase: 'Sync',
                      version: 'v1',
                    },
                    {
                      group: 'apps',
                      hookPhase: 'Running',
                      kind: 'Deployment',
                      message: 'deployment.apps/helloworld-app-deploy created',
                      name: 'helloworld-app-deploy',
                      namespace: 'feng-appset-hello',
                      status: 'Synced',
                      syncPhase: 'Sync',
                      version: 'v1',
                    },
                    {
                      group: 'route.openshift.io',
                      hookPhase: 'Running',
                      kind: 'Route',
                      message: 'route.route.openshift.io/helloworld-app-route created',
                      name: 'helloworld-app-route',
                      namespace: 'feng-appset-hello',
                      status: 'Synced',
                      syncPhase: 'Sync',
                      version: 'v1',
                    },
                  ],
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'main',
                  },
                },
              },
              reconciledAt: '2023-01-23T16:57:05Z',
              resources: [
                {
                  health: {
                    status: 'Healthy',
                  },
                  kind: 'Service',
                  name: 'helloworld-app-svc',
                  namespace: 'feng-appset-hello',
                  status: 'Synced',
                  version: 'v1',
                },
                {
                  group: 'apps',
                  health: {
                    status: 'Healthy',
                  },
                  kind: 'Deployment',
                  name: 'helloworld-app-deploy',
                  namespace: 'feng-appset-hello',
                  status: 'Synced',
                  version: 'v1',
                },
                {
                  group: 'route.openshift.io',
                  health: {
                    message: 'Route is healthy',
                    status: 'Healthy',
                  },
                  kind: 'Route',
                  name: 'helloworld-app-route',
                  namespace: 'feng-appset-hello',
                  status: 'Synced',
                  version: 'v1',
                },
              ],
              sourceType: 'Directory',
              summary: {
                images: ['quay.io/fxiang1/helloworld:0.0.1'],
              },
              sync: {
                status: 'Synced',
              },
            },
          },
        ],
        appSetClusters: [
          {
            created: '2023-01-19T20:00:18Z',
            name: 'local-cluster',
            namespace: 'local-cluster',
            status: 'ok',
            url: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
          },
        ],
        appStatusByNameMap: {},
        clusterNames: ['local-cluster'],
        isDesign: true,
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: {
            creationTimestamp: '2023-01-23T16:50:12Z',
            name: 'feng-appset-hello',
            namespace: 'openshift-gitops',
            resourceVersion: '1166741',
            uid: 'b77de6bd-8a45-4069-a3d0-2119fa0e7f36',
          },
          spec: {
            generators: [
              {
                clusterDecisionResource: {
                  configMapRef: 'acm-placement',
                  labelSelector: {
                    matchLabels: {
                      'cluster.open-cluster-management.io/placement': 'feng-appset-hello-placement',
                    },
                  },
                  requeueAfterSeconds: 180,
                },
              },
            ],
            template: {
              metadata: {
                labels: {
                  'velero.io/exclude-from-backup': 'true',
                },
                name: 'feng-appset-hello-{{name}}',
              },
              spec: {
                destination: {
                  namespace: 'feng-appset-hello',
                  server: '{{server}}',
                },
                project: 'default',
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'main',
                },
                syncPolicy: {
                  automated: {
                    prune: true,
                    selfHeal: true,
                  },
                  syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
                },
              },
            },
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2023-01-23T16:50:12Z',
                message: 'Successfully generated parameters for all Applications',
                reason: 'ApplicationSetUpToDate',
                status: 'False',
                type: 'ErrorOccurred',
              },
              {
                lastTransitionTime: '2023-01-23T16:50:12Z',
                message: 'Successfully generated parameters for all Applications',
                reason: 'ParametersGenerated',
                status: 'True',
                type: 'ParametersGenerated',
              },
              {
                lastTransitionTime: '2023-01-23T16:50:12Z',
                message: 'ApplicationSet up to date',
                reason: 'ApplicationSetUpToDate',
                status: 'True',
                type: 'ResourcesUpToDate',
              },
            ],
          },
        },
      },
      type: 'applicationset',
      uid: 'application--feng-appset-hello',
    },
    {
      id: 'member--placements--openshift-gitops--feng-appset-hello',
      name: 'feng-appset-hello-placement',
      namespace: 'openshift-gitops',
      placement: undefined,
      specs: {
        isDesign: true,
        raw: {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: {
            creationTimestamp: '2023-01-23T16:50:12Z',
            name: 'feng-appset-hello-placement',
            namespace: 'openshift-gitops',
            resourceVersion: '1166737',
            uid: '62fdd3f9-a906-4735-80fd-814cb5db22e5',
          },
          spec: {
            clusterSets: ['default'],
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2023-01-23T16:50:12Z',
                message: 'Placement configurations check pass',
                reason: 'Succeedconfigured',
                status: 'False',
                type: 'PlacementMisconfigured',
              },
              {
                lastTransitionTime: '2023-01-23T16:50:12Z',
                message: 'All cluster decisions scheduled',
                reason: 'AllDecisionsScheduled',
                status: 'True',
                type: 'PlacementSatisfied',
              },
            ],
            numberOfSelectedClusters: 1,
          },
        },
      },
      type: 'placement',
      uid: 'member--placements--openshift-gitops--feng-appset-hello',
    },
    {
      id: 'member--clusters--',
      name: 'local-cluster',
      namespace: '',
      specs: {
        appClusters: undefined,
        clusters: [
          {
            created: '2023-01-19T20:00:18Z',
            name: 'local-cluster',
            namespace: 'local-cluster',
            status: 'ok',
            url: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
          },
        ],
        clustersNames: ['local-cluster'],
        resourceCount: 1,
        sortedClusterNames: ['local-cluster'],
        subscription: undefined,
        targetNamespaces: undefined,
        title: 'helloworld',
      },
      type: 'cluster',
      uid: 'member--clusters--',
    },
    {
      id: 'member--member--deployable--member--clusters----service--feng-appset-hello--helloworld-app-svc',
      name: 'helloworld-app-svc',
      namespace: 'feng-appset-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
          apiversion: 'v1',
          cluster: 'local-cluster',
          kind: 'Service',
          metadata: {
            name: 'helloworld-app-svc',
            namespace: 'feng-appset-hello',
          },
          name: 'helloworld-app-svc',
          namespace: 'feng-appset-hello',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'service',
      uid: 'member--member--deployable--member--clusters----service--feng-appset-hello--helloworld-app-svc',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-appset-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
          apigroup: 'apps',
          apiversion: 'v1',
          cluster: 'local-cluster',
          kind: 'Deployment',
          metadata: {
            name: 'helloworld-app-deploy',
            namespace: 'feng-appset-hello',
          },
          name: 'helloworld-app-deploy',
          namespace: 'feng-appset-hello',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'deployment',
      uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-appset-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: undefined,
          parentType: 'deployment',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'replicaset',
      uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-appset-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: undefined,
          parentType: 'replicaset',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--member--deployable--member--clusters----deployment--feng-appset-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----route--feng-appset-hello--helloworld-app-route',
      name: 'helloworld-app-route',
      namespace: 'feng-appset-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          _relatedUids: ['local-cluster/142e2afb-5359-4b1a-b10b-ccab726b689d'],
          apigroup: 'route.openshift.io',
          apiversion: 'v1',
          cluster: 'local-cluster',
          kind: 'Route',
          metadata: {
            name: 'helloworld-app-route',
            namespace: 'feng-appset-hello',
          },
          name: 'helloworld-app-route',
          namespace: 'feng-appset-hello',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'route',
      uid: 'member--member--deployable--member--clusters----route--feng-appset-hello--helloworld-app-route',
    },
  ],
}
