/* Copyright Contributors to the Open Cluster Management project */

import { getArgoTopology } from './topologyArgo'
import type { ArgoApplicationTopologyData, ArgoTopologyData, ManagedCluster, ArgoTopologyResult } from '../types'
import type { ToolbarControl } from '../topology/components/TopologyToolbar'

const mockToolbarControl: ToolbarControl = {
  allClusters: undefined,
  activeClusters: undefined,
  setActiveClusters: () => {},
  setAllClusters: () => {},
  allApplications: undefined,
  activeApplications: undefined,
  setAllApplications: () => {},
  setActiveApplications: () => {},
  allTypes: undefined,
  activeTypes: undefined,
  setAllTypes: () => {},
  setActiveTypes: () => {},
}

it('getArgoTopology success scenario', () => {
  expect(getArgoTopology(mockToolbarControl, application, argoData, managedClusters, 'local-cluster', [])).toEqual(
    result1
  )
})

it('getArgoTopology success scenario', () => {
  expect(getArgoTopology(mockToolbarControl, application2, argoData2, managedClusters, 'local-cluster', [])).toEqual(
    result2
  )
})

const result1: ArgoTopologyResult = {
  links: [
    {
      from: {
        uid: 'application--feng-argo-hello',
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
        uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
      },
      type: '',
    },
  ],
  nodes: [
    {
      id: 'application--feng-argo-hello',
      name: 'feng-argo-hello',
      namespace: 'openshift-gitops',
      specs: {
        activeChannel: undefined,
        allChannels: [],
        allClusters: {
          isLocal: true,
          remoteCount: 0,
        },
        allSubscriptions: [],
        channels: undefined,
        clusterNames: ['local-cluster'],
        isDesign: true,
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            creationTimestamp: '2023-01-23T15:34:03Z',
            generation: 20,
            name: 'feng-argo-hello',
            namespace: 'openshift-gitops',
            resourceVersion: '1100922',
            uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
          },
          spec: {
            destination: {
              name: 'local-cluster',
              namespace: 'feng-argo-hello',
            },
            project: 'default',
            source: {
              path: 'helloworld',
              repoURL: 'https://github.com/fxiang1/app-samples',
              targetRevision: 'HEAD',
            },
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
              syncOptions: ['CreateNamespace=true'],
            },
          },
          status: {
            health: {
              status: 'Healthy',
            },
            history: [
              {
                deployStartedAt: '2023-01-23T15:34:03Z',
                deployedAt: '2023-01-23T15:34:09Z',
                id: 0,
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
            ],
            operationState: {
              finishedAt: '2023-01-23T15:34:09Z',
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
                  syncOptions: ['CreateNamespace=true'],
                },
              },
              phase: 'Succeeded',
              startedAt: '2023-01-23T15:34:03Z',
              syncResult: {
                resources: [
                  {
                    group: '',
                    hookPhase: 'Succeeded',
                    kind: 'Namespace',
                    message: 'namespace/feng-argo-hello created',
                    name: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
                    status: 'Synced',
                    syncPhase: 'Sync',
                    version: 'v1',
                  },
                ],
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
            },
            reconciledAt: '2023-01-23T16:00:05Z',
            resources: [
              {
                health: {
                  status: 'Healthy',
                },
                kind: 'Service',
                name: 'helloworld-app-svc',
                namespace: 'feng-argo-hello',
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
                namespace: 'feng-argo-hello',
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
                namespace: 'feng-argo-hello',
                status: 'Synced',
                version: 'v1',
              },
            ],
            sourceType: 'Directory',
            summary: {
              images: ['quay.io/fxiang1/helloworld:0.0.1'],
            },
            sync: {
              comparedTo: {
                destination: {
                  name: 'local-cluster',
                  namespace: 'feng-argo-hello',
                },
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
              revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
              status: 'Synced',
            },
          },
        },
        relatedApps: [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/2a86cc10-0a18-43f6-8b66-63fd6393ee49',
            apigroup: 'argoproj.io',
            apiversion: 'v1alpha1',
            applicationSet: '',
            chart: '',
            cluster: 'local-cluster',
            created: '2023-01-23T15:34:03Z',
            destinationCluster: 'local-cluster',
            destinationName: 'local-cluster',
            destinationNamespace: 'feng-argo-hello',
            destinationServer: '',
            healthStatus: 'Healthy',
            kind: 'Application',
            kind_plural: 'applications',
            name: 'feng-argo-hello',
            namespace: 'openshift-gitops',
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            syncStatus: 'Synced',
            targetRevision: 'HEAD',
          },
        ],
        resourceCount: 0,
      },
      type: 'application',
      uid: 'application--feng-argo-hello',
    },
    {
      id: 'member--clusters--',
      name: 'local-cluster',
      namespace: '',
      specs: {
        appClusters: undefined,
        clusters: [
          {
            destination: {
              name: 'local-cluster',
              namespace: 'feng-argo-hello',
            },
            metadata: {
              name: 'local-cluster',
              namespace: 'local-cluster',
            },
            status: 'ok',
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
      id: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
      name: 'helloworld-app-svc',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'v1',
          health: {
            status: 'Healthy',
          },
          kind: 'Service',
          metadata: {
            name: 'helloworld-app-svc',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-svc',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'service',
      uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'apps/v1',
          group: 'apps',
          health: {
            status: 'Healthy',
          },
          kind: 'Deployment',
          metadata: {
            name: 'helloworld-app-deploy',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-deploy',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'deployment',
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
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
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
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
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
      name: 'helloworld-app-route',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'route.openshift.io/v1',
          group: 'route.openshift.io',
          health: {
            message: 'Route is healthy',
            status: 'Healthy',
          },
          kind: 'Route',
          metadata: {
            name: 'helloworld-app-route',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-route',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'route',
      uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
    },
  ],
}
const result2: ArgoTopologyResult = {
  links: [
    {
      from: {
        uid: 'application--feng-argo-hello',
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
        uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      },
      type: '',
    },
    {
      from: {
        uid: 'member--clusters--',
      },
      to: {
        uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
      },
      type: '',
    },
  ],
  nodes: [
    {
      id: 'application--feng-argo-hello',
      name: 'feng-argo-hello',
      namespace: 'openshift-gitops',
      specs: {
        activeChannel: undefined,
        allChannels: [],
        allClusters: {
          isLocal: false,
          remoteCount: 1,
        },
        allSubscriptions: [],
        channels: undefined,
        clusterNames: ['feng-hs-import'],
        isDesign: true,
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            creationTimestamp: '2023-01-23T15:34:03Z',
            generation: 20,
            name: 'feng-argo-hello',
            namespace: 'openshift-gitops',
            resourceVersion: '1100922',
            uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
          },
          spec: {
            destination: {
              name: '',
              namespace: 'feng-argo-hello',
              server: 'https://kubernetes.default.svc',
            },
            project: 'default',
            source: {
              path: 'helloworld',
              repoURL: 'https://github.com/fxiang1/app-samples',
              targetRevision: 'HEAD',
            },
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
              syncOptions: ['CreateNamespace=true'],
            },
          },
          status: {
            health: {
              status: 'Healthy',
            },
            history: [
              {
                deployStartedAt: '2023-01-23T15:34:03Z',
                deployedAt: '2023-01-23T15:34:09Z',
                id: 0,
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
            ],
            operationState: {
              finishedAt: '2023-01-23T15:34:09Z',
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
                  syncOptions: ['CreateNamespace=true'],
                },
              },
              phase: 'Succeeded',
              startedAt: '2023-01-23T15:34:03Z',
              syncResult: {
                resources: [
                  {
                    group: '',
                    hookPhase: 'Succeeded',
                    kind: 'Namespace',
                    message: 'namespace/feng-argo-hello created',
                    name: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
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
                    namespace: 'feng-argo-hello',
                    status: 'Synced',
                    syncPhase: 'Sync',
                    version: 'v1',
                  },
                ],
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
            },
            reconciledAt: '2023-01-23T16:00:05Z',
            resources: [
              {
                health: {
                  status: 'Healthy',
                },
                kind: 'Service',
                name: 'helloworld-app-svc',
                namespace: 'feng-argo-hello',
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
                namespace: 'feng-argo-hello',
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
                namespace: 'feng-argo-hello',
                status: 'Synced',
                version: 'v1',
              },
            ],
            sourceType: 'Directory',
            summary: {
              images: ['quay.io/fxiang1/helloworld:0.0.1'],
            },
            sync: {
              comparedTo: {
                destination: {
                  name: 'local-cluster',
                  namespace: 'feng-argo-hello',
                },
                source: {
                  path: 'helloworld',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  targetRevision: 'HEAD',
                },
              },
              revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
              status: 'Synced',
            },
          },
        },
        relatedApps: [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/2a86cc10-0a18-43f6-8b66-63fd6393ee49',
            apigroup: 'argoproj.io',
            apiversion: 'v1alpha1',
            applicationSet: '',
            chart: '',
            cluster: 'local-cluster',
            created: '2023-01-23T15:34:03Z',
            destinationCluster: 'local-cluster',
            destinationName: 'local-cluster',
            destinationNamespace: 'feng-argo-hello',
            destinationServer: '',
            healthStatus: 'Healthy',
            kind: 'Application',
            kind_plural: 'applications',
            name: 'feng-argo-hello',
            namespace: 'openshift-gitops',
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            syncStatus: 'Synced',
            targetRevision: 'HEAD',
          },
        ],
        resourceCount: 0,
      },
      type: 'application',
      uid: 'application--feng-argo-hello',
    },
    {
      id: 'member--clusters--',
      name: 'feng-hs-import',
      namespace: '',
      specs: {
        appClusters: undefined,
        clusters: [
          {
            metadata: {
              name: 'feng-hs-import',
              namespace: 'feng-hs-import',
            },
            remoteClusterDestination: '',
            name: 'feng-hs-import',
            status: 'ok',
          },
        ],
        clustersNames: ['feng-hs-import'],
        resourceCount: 1,
        sortedClusterNames: ['feng-hs-import'],
        subscription: undefined,
        targetNamespaces: undefined,
        title: 'helloworld',
      },
      type: 'cluster',
      uid: 'member--clusters--',
    },
    {
      id: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
      name: 'helloworld-app-svc',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['feng-hs-import'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'v1',
          health: {
            status: 'Healthy',
          },
          kind: 'Service',
          metadata: {
            name: 'helloworld-app-svc',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-svc',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'service',
      uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['feng-hs-import'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'apps/v1',
          group: 'apps',
          health: {
            status: 'Healthy',
          },
          kind: 'Deployment',
          metadata: {
            name: 'helloworld-app-deploy',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-deploy',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'deployment',
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['feng-hs-import'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
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
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['feng-hs-import'],
        isDesign: false,
        parent: {
          parentId:
            'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
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
      uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
    },
    {
      id: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
      name: 'helloworld-app-route',
      namespace: 'feng-argo-hello',
      specs: {
        clustersNames: ['feng-hs-import'],
        isDesign: false,
        parent: {
          clusterId: 'member--clusters--',
        },
        raw: {
          apiVersion: 'route.openshift.io/v1',
          group: 'route.openshift.io',
          health: {
            message: 'Route is healthy',
            status: 'Healthy',
          },
          kind: 'Route',
          metadata: {
            name: 'helloworld-app-route',
            namespace: 'feng-argo-hello',
          },
          name: 'helloworld-app-route',
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
        resourceCount: 1,
        resources: undefined,
      },
      type: 'route',
      uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
    },
  ],
}

const application: ArgoApplicationTopologyData = {
  name: 'feng-argo-hello',
  namespace: 'openshift-gitops',
  app: {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      creationTimestamp: '2023-01-23T15:34:03Z',
      generation: 20,
      name: 'feng-argo-hello',
      namespace: 'openshift-gitops',
      resourceVersion: '1100922',
      uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
    },
    spec: {
      destination: {
        name: 'local-cluster',
        namespace: 'feng-argo-hello',
      },
      project: 'default',
      source: {
        path: 'helloworld',
        repoURL: 'https://github.com/fxiang1/app-samples',
        targetRevision: 'HEAD',
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true,
        },
        syncOptions: ['CreateNamespace=true'],
      },
    },
    status: {
      health: {
        status: 'Healthy',
      },
      history: [
        {
          deployStartedAt: '2023-01-23T15:34:03Z',
          deployedAt: '2023-01-23T15:34:09Z',
          id: 0,
          revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
      ],
      operationState: {
        finishedAt: '2023-01-23T15:34:09Z',
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
            syncOptions: ['CreateNamespace=true'],
          },
        },
        phase: 'Succeeded',
        startedAt: '2023-01-23T15:34:03Z',
        syncResult: {
          resources: [
            {
              group: '',
              hookPhase: 'Succeeded',
              kind: 'Namespace',
              message: 'namespace/feng-argo-hello created',
              name: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
              status: 'Synced',
              syncPhase: 'Sync',
              version: 'v1',
            },
          ],
          revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
      },
      reconciledAt: '2023-01-23T16:00:05Z',
      resources: [
        {
          health: {
            status: 'Healthy',
          },
          kind: 'Service',
          name: 'helloworld-app-svc',
          namespace: 'feng-argo-hello',
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
          namespace: 'feng-argo-hello',
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
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
      ],
      sourceType: 'Directory',
      summary: {
        images: ['quay.io/fxiang1/helloworld:0.0.1'],
      },
      sync: {
        comparedTo: {
          destination: {
            name: 'local-cluster',
            namespace: 'feng-argo-hello',
          },
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
        revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
        status: 'Synced',
      },
    },
  },
}

const argoData: ArgoTopologyData = {
  topology: {
    nodes: [
      {
        name: 'feng-argo-hello',
        namespace: 'openshift-gitops',
        type: 'application',
        id: 'application--feng-argo-hello',
        uid: 'application--feng-argo-hello',
        specs: {
          isDesign: true,
          resourceCount: 0,
          raw: {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'Application',
            metadata: {
              creationTimestamp: '2023-01-23T15:34:03Z',
              generation: 20,
              name: 'feng-argo-hello',
              namespace: 'openshift-gitops',
              resourceVersion: '1100922',
              uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
            },
            spec: {
              destination: {
                name: 'local-cluster',
                namespace: 'feng-argo-hello',
              },
              project: 'default',
              source: {
                path: 'helloworld',
                repoURL: 'https://github.com/fxiang1/app-samples',
                targetRevision: 'HEAD',
              },
              syncPolicy: {
                automated: {
                  prune: true,
                  selfHeal: true,
                },
                syncOptions: ['CreateNamespace=true'],
              },
            },
            status: {
              health: {
                status: 'Healthy',
              },
              history: [
                {
                  deployStartedAt: '2023-01-23T15:34:03Z',
                  deployedAt: '2023-01-23T15:34:09Z',
                  id: 0,
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
              ],
              operationState: {
                finishedAt: '2023-01-23T15:34:09Z',
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
                    syncOptions: ['CreateNamespace=true'],
                  },
                },
                phase: 'Succeeded',
                startedAt: '2023-01-23T15:34:03Z',
                syncResult: {
                  resources: [
                    {
                      group: '',
                      hookPhase: 'Succeeded',
                      kind: 'Namespace',
                      message: 'namespace/feng-argo-hello created',
                      name: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
                      status: 'Synced',
                      syncPhase: 'Sync',
                      version: 'v1',
                    },
                  ],
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
              },
              reconciledAt: '2023-01-23T16:00:05Z',
              resources: [
                {
                  health: {
                    status: 'Healthy',
                  },
                  kind: 'Service',
                  name: 'helloworld-app-svc',
                  namespace: 'feng-argo-hello',
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
                  namespace: 'feng-argo-hello',
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
                  namespace: 'feng-argo-hello',
                  status: 'Synced',
                  version: 'v1',
                },
              ],
              sourceType: 'Directory',
              summary: {
                images: ['quay.io/fxiang1/helloworld:0.0.1'],
              },
              sync: {
                comparedTo: {
                  destination: {
                    name: 'local-cluster',
                    namespace: 'feng-argo-hello',
                  },
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                status: 'Synced',
              },
            },
          },
          allSubscriptions: [],
          allChannels: [],
          allClusters: {
            isLocal: true,
            remoteCount: 0,
          },
          clusterNames: ['local-cluster'],
          relatedApps: [
            {
              _clusterNamespace: '',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/2a86cc10-0a18-43f6-8b66-63fd6393ee49',
              apigroup: 'argoproj.io',
              apiversion: 'v1alpha1',
              applicationSet: '',
              chart: '',
              cluster: 'local-cluster',
              created: '2023-01-23T15:34:03Z',
              destinationName: 'local-cluster',
              destinationNamespace: 'feng-argo-hello',
              destinationServer: '',
              healthStatus: 'Healthy',
              kind: 'Application',
              kind_plural: 'applications',
              name: 'feng-argo-hello',
              namespace: 'openshift-gitops',
              path: 'helloworld',
              repoURL: 'https://github.com/fxiang1/app-samples',
              syncStatus: 'Synced',
              targetRevision: 'HEAD',
              destinationCluster: 'local-cluster',
            },
          ],
        },
      },
      {
        name: 'local-cluster',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters--',
        uid: 'member--clusters--',
        specs: {
          title: 'helloworld',
          subscription: null,
          resourceCount: 1,
          clustersNames: ['local-cluster'],
          clusters: [
            {
              name: 'local-cluster',
            },
          ],
          sortedClusterNames: ['local-cluster'],
          appClusters: ['local-cluster'],
          targetNamespaces: {
            'local-cluster': ['feng-argo-hello'],
          },
        },
      },
      {
        name: 'helloworld-app-svc',
        namespace: 'feng-argo-hello',
        type: 'service',
        id: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-svc',
              namespace: 'feng-argo-hello',
            },
            health: {
              status: 'Healthy',
            },
            kind: 'Service',
            name: 'helloworld-app-svc',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'deployment',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-deploy',
              namespace: 'feng-argo-hello',
            },
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'helloworld-app-deploy',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'apps/v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'replicaset',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: null,
          clustersNames: ['local-cluster'],
          replicaCount: 1,
          parent: {
            parentId:
              'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
            parentName: 'helloworld-app-deploy',
            parentType: 'deployment',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'pod',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: null,
          clustersNames: ['local-cluster'],
          replicaCount: 1,
          parent: {
            parentId:
              'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
            parentName: 'helloworld-app-deploy',
            parentType: 'replicaset',
          },
        },
      },
      {
        name: 'helloworld-app-route',
        namespace: 'feng-argo-hello',
        type: 'route',
        id: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-route',
              namespace: 'feng-argo-hello',
            },
            group: 'route.openshift.io',
            health: {
              message: 'Route is healthy',
              status: 'Healthy',
            },
            kind: 'Route',
            name: 'helloworld-app-route',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'route.openshift.io/v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
    ],
    links: [
      {
        from: {
          uid: 'application--feng-argo-hello',
        },
        to: {
          uid: 'member--clusters--',
        },
        type: '',
        specs: {
          isDesign: true,
        },
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        },
        type: '',
      },
    ],
  },
}

const managedClusters: ManagedCluster[] = [
  {
    name: 'local-cluster',
    displayName: 'local-cluster',
    namespace: 'local-cluster',
    uid: '211518cc-eb1e-4230-97e7-63908e0f6f55',
    status: 'ready',
    provider: 'aws',
    distribution: {
      k8sVersion: 'v1.24.0+9546431',
      ocp: {
        availableUpdates: [
          '4.11.1',
          '4.11.12',
          '4.11.13',
          '4.11.17',
          '4.11.18',
          '4.11.20',
          '4.11.21',
          '4.11.22',
          '4.11.3',
          '4.11.4',
          '4.11.5',
        ],
        channel: 'stable-4.11',
        desired: {
          channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
          image:
            'quay.io/openshift-release-dev/ocp-release@sha256:300bce8246cf880e792e106607925de0a404484637627edf5f517375517d54a4',
          url: 'https://access.redhat.com/errata/RHSA-2022:5069',
          version: '4.11.0',
        },
        desiredVersion: '4.11.0',
        managedClusterClientConfig: {
          caBundle:
            'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJT0FXU0lidHVaUXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpNd01URTVNVFUxTkRFeVdoY05Nek13TVRFMk1UVTFOREV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTktPMEV6eVlVakg5R1dyZHFaaVZqUEpQcXlkTkd2bgpkTjRqckFOOU9JVXVwdW9jc1RudmFUY3lQT3I2YnJaLzc1L0dPWkhzdTJwL29kaE95SlZUSXF6Q1RDMGcrTFJlCmNGY2VMQUJtQWx0c1JUcXBBc0YycnNqUTJLbTFEbTVydm1KcjJ2SmJ4WW44ME5WUUl3RjlnU2ZHeEFuUjVqVWMKek1IRldxdGN5NnZpSkVVOElCOUpCTTlEeVo1Vk9OcllyL1RTcmRWTVJTMlNWbVMvbFVVTjBBeHQ3ZjFvQkxzMgpTcjFkMlFZNG1nQmtyRVhhVjIxbG9PY0xoS05PVUtzNExDOTVYaG80clJKN0V0RUVlS2NpSmg3UGF1cGhpaXVlCk9qMmZNajZ6SldTbU9YeFN0cmRTOFFpMTZXWTZkM3IrVVpWb0RYWWhyblkwSGliek5BRGxzeThDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkJ6aAovWk1KL1FGcU15YmdYT0M2c2Z3VFYvSW9NQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJCZk12RWJ0RzZRdmZGCm1iY0NjZTZwZlhTV2Mwa2h4bTYzaGRwWWZaSGs1NHlwNXVjUEQ2dFJNRm5LTlBDRFREZE9TY0NuTndXaDZxdm4KbUljNjZYUlBQSHVlb29aV2xpaG82eU1sS0hWR1lOUGY1SmIvRk5yUld3UmJQZkpnZmFQbDBmSTdSQ1cvOU4yWQpTSXFJQVc4cGRsSUUzZE1wNXhYRmV0a3VQZEFIZHl5Q0VsNk5zakFnV1BOYmxrczFEQmZhMXVrZ2YweklhekpDCkpTQjVxd3VlWkxmcEtQem4zOC92Qk9Ob0gvQTdqenVXbTFZdm5pMUlpOGZlNCtFYTRodTZxZEZFVmdFMmdPM00KMWNwVTlVZUdrVU56a0QwekdDRFgrVkc4VlFXeUNOM2pIU09QUGE2djA4STJPSHBhNDU4MXc2Vjh5V2pYalJ4ZAp5dDZXVkpRbQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSUptOURZY1hkcllNd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJek1ERXhPVEUxTlRReE1sb1hEVE16TURFeE5qRTFOVFF4TWxvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFyNGFZUzdySlNIeTYKcWdzVlJuZGxpL1FGTlRENnllZWl5cUk4TFJOOXFVOXlTQ3puRVFVNFFmTnppZWpLMUxHME5Pb09TRnJlbEkzMwpJWGwvTU1zTDZpaEF1RDJTQm1HM0RRY0ZudnpSUGZlcit4WHA3WWczckZFWVNBaC81OHR2UjRmK1c3UG1XUHZ4CjhzSXhiNUpGNEtoNmJVbVdGT1drdHpwZzBNR0VFdk9QUUVHcllFZXdUSFZ4K0NseUxFQU4rbjhJdGRFZTcyaXkKdjNLWWJJdGFqRi9DUnhXQ0ppT29kWXdPRVExajNxMkJLVmVXWDR6UmdpdmxjeFNtazF2NWUzNE9SQWd3K3ZCLworKzBXTW5GVDlvak9QSzE0MlhuSEM5ckZSU0JDTGxnRG96cDc2MnRJR1hsTElqeU9CeDhyZjF2a2NkeXpLNUVYCkpjaG1WT2ovMVFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVUdNbENWdnZxL0E1WGpMNTRGSC9kQnZza3poSXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUZEejdsdnpPem9uUXF3SXhDQzJYWUxzUVQ2UXlJQm9PUSs5dXZhNGtFbDMydWswUG1nQjNJc3dhaFMvClBCYjM5Uk4wR3l2a2NXQnJjR2ZvTnNCekhEN0l3S0xJcCtXaVgvamQrWjcyNklJejI0REJPSTZHeUpjNFBHZWYKeDh2VE1EMEFJTFhUTWZvRzdpK3pqMGtmSFphTXRnVTRYNkh4NHRSekhDaXRsOWVKRXY3SURoeG1OVkZDb0tMWQppZzc2T2t5U1dEalpSMTJnTFpIdnVNU2xZY2dleE52VnJucUxUL2JNNkRFa0MzOW9ER3dNQlZTWlFzenBKd2dhCmJJaE53WE8xYko3QzNHMlpuOVRVZVFMMEFwY0JMYkVBWURhZnRMVkdkQW1Ma1dSWkRYTDRqOHZzWkFlTE9vbVEKMVF4Y05yOXRpU0Nkc1NkTHNrbGRxYUZ6U2dzPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWRpMCszR0ZGNXR3d0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl6TURFeE9URTFOVFF4TWxvWERUTXpNREV4TmpFMU5UUXhNbG93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXMrZDVId0dHWC9nekE5T0RnUFh1eDJqd0dSWGlONStTZlFxTGxqeGhiOWJ1QlRMMFV0cUpiNnFWN1dPZgpRLzN0S2JiZUVkZGxTZ3ZCYThUYWVBdSttcGVpTDJra0dOcUhocGNhbjlDNEh3bDhLZThjUnJOc0x6YkY2ek5UCjA4ZGI0NVcrekRLR1NPRDZrS3dVRW9La3pVNFBsb3dqMVFxVlpPckQvT1Vhc2hTa2dnZlhleWJQSDZVYURkNWsKa01qbmlka0tQbEVEbWo2aVBQUTJzZTVnTXlHd3Rvc001WmtzM3pCenNjWllPSmVxMnRTMWJQcDgvbXc2Z2VnTwpvMU9sS2ZGNlYzZk4vSEV5SFJXeEMxOWdqOUU0TmF5NituSUUzYnVRTk0xZEFZYTl3YStjNko0cGZhRWwvaGFUCm1wTjlEM1BjaHpUT3o5ODZkV0FXeldiR2xRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0WkVpRHVCVDJNNVFPeldwb244alhmb29TdHN3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFFeWNoNnRjUlhJcHNGTjAvWTl1akVQVVN5YnBkY0k4MzUzNm1zR29CNFVvCnRWcGdvRGt4d3pPN0szb0FIYS84Y0ZPOXRkZFNEUitzeXhNNEI2cWpXZkY5ZGhXYVJ3NWNNV3JiMVRqM0hlbGsKMEdwOXo0c2pEZjJjdjJRNk92dUQxSmI3dnNid0FUSXA5dWJSSjlucjVwbkZ3S3hhVTZKYUtmT2puc2pDNlpSZQp3N202MVVnd0NOaUtqYjRSekJlajJOT3hrcEsrMDJZSHJlK2gyaHBKV09HR1VRbU1vYXRzNld1TU5lQ0k1N0hxCmJ5ZmFOalBrdjdIdFJPTWVBQmpWOWRFZDRnRk1kOFNZNjZaYmUrSGh0dzVuc0ZidWlRUjgzUU81UUlVT3FFUzgKT3FjRG8wV1QrUGk2OXVFWDJld0MycFpBMWRxdnpIdU1uT0ZRaW9WOUpwST0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlRU1hFUzd0d2VCVXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpjME1UUTBNamN5TUI0WERUSXpNREV4T1RFMk1EUXoKTVZvWERUTXpNREV4TmpFMk1EUXpNbG93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOamMwTVRRME1qY3lNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQWxzOGkKQytPN21ObmNGaVJRSkxEL096NWN5NW44N094UEJ3NVpCcURWbFM5cW1CbGQwTzNHcDcwcFVONlRHcDFjQm1hNgpSYitCSW5DeWFZRXFiWHNOUGYyQjRWTVZxTGQ5N2s4bXRIbURUQmVyOHZvRXhoeWthOGVOcUREQWZjOFlaTEMzCk1Ea2t5U0RLZ04xSVFiQ0tBZEM4eDRZdFQwZTN4eTNDbEJ5ZnFYQ2c5S29hYW01bGw5OFJYdVBHYTY3NWc4ekkKODh0N09jY1ZNa1E2YzZ1VmliMzJTRU1VSjF0Rjcxa2toMGNydWNWUWN3N21vcjJtdXhRNUtzdCsxb25nQkRMZApRWEFRaWdHT2JUWHRwSm1aZE1yTjQvOWgzeUFjbkJ0eEFPYk5GVXRualljMjl0c2EvY2svbzkyQVdWbDNKLzF1CjdZRzAyUTRsejg4NXBkQzYxUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVMGt3enc3T2JaV0xOaGR2SVBrS1NTWkZSTnkwd0h3WURWUjBqQkJndwpGb0FVMGt3enc3T2JaV0xOaGR2SVBrS1NTWkZSTnkwd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFEbGhROER1ClY0czRwcUprWlRoUS9HK1hMRyt2MzgwK010Y0tPTkJGWFBEY0JGSmRxclk2amk1MVJvMUpybytyMHVqcEZzczMKVXZDdlNGa0duYkVlZGZUV3JFWkVTYjNhcG1oamR5ZTZPQ1hNSStMb2tpSjFjWG1zNW9vVVhIc0tFQnNzYkt6VwpjZGlmbHF6L0wxbTlWc2w2QVQ0NXVOdC9NTHkrRnJyaGFyRXpOa1J1NTdtb3BZMWtlQVRueXBYQ0NFdjlYTUNVClFLcnFocXFVWWYvcXVHcFJ4dDhmUE5FTTkvOTNuNkJhUS80YTRVSUNlSlMyVlk3TllXUk5GN1JRNlVhMjRSZWsKUk82aHVEbGRGU0h5UUJxYUd0S0x2NTdKcHhpSG5uOExQK3dNeDRzVURyRS9aVFlVZTdPU3dXWWRmdU92TFlVRgpSRDdJdTdIc3NVSW9HU3c9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURxVENDQXBHZ0F3SUJBZ0lJTEZsWFVYL0J0Z3N3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qYzBNVFEwTXpVd01CNFhEVEl6TURFeE9URTJNRFUxTUZvWApEVEkxTURFeE9ERTJNRFUxTVZvd1JERkNNRUFHQTFVRUF3dzVLaTVoY0hCekxtRndjQzFoZDNNdE5ERXhaMkV0CmFIVmlMV0ozY25GeExtUmxkakEyTG5KbFpDMWphR1Z6ZEdWeVptbGxiR1F1WTI5dE1JSUJJakFOQmdrcWhraUcKOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVaY1lWNU15a2QyQ2t0bFRVc2YreHRoRXg2QTNRVVVtc2ZSNAp6TXcvQVFpUFkyMjFjK3QyTy9tM09rWWlZV2M4SjlQNlliMlVjS3l6UkpZczZmbUZud0ZueEkzSUZTVytCLzM2CkkyOFg2WHpxUHQwZEhCZjBsSFEvVXkwNlFrK2g2cnI3K29ZczcyZlRXQ2xMSlNPQUs3ZnFjMGttRVJpM1hFdVUKdXVCUkhhVDg5a0FGMnBRNUxrWFVkNm94NE1CZFQrbGNKWlEvV2FXMmVtUEtOUW55Zy9POU81bzF6Q2VEeS9NWAoycHlhMVoxdllJQkVUQzd0bXZhQ0hHbG5hWGhPQjR0aGFYSXlyeVVMWXNTMUxrT1NtcElUemtSckJoVjFveG5FCllVM0p5MHo4akYrWVhaa3lYMVRGTWxrSjBBaDFiODVpSncweDFVMENTK0I0R24xdVlRSURBUUFCbzRHOE1JRzUKTUE0R0ExVWREd0VCL3dRRUF3SUZvREFUQmdOVkhTVUVEREFLQmdnckJnRUZCUWNEQVRBTUJnTlZIUk1CQWY4RQpBakFBTUIwR0ExVWREZ1FXQkJSU2NKczlkblV5Z0NkdzNmS25UbDd5TWJ6R0N6QWZCZ05WSFNNRUdEQVdnQlN4ClY1eWQybk8zRFhSeTVCeVdlcEVtbHE1WGZ6QkVCZ05WSFJFRVBUQTdnamtxTG1Gd2NITXVZWEJ3TFdGM2N5MDAKTVRGbllTMW9kV0l0WW5keWNYRXVaR1YyTURZdWNtVmtMV05vWlhOMFpYSm1hV1ZzWkM1amIyMHdEUVlKS29aSQpodmNOQVFFTEJRQURnZ0VCQUtHelY5TGkrRG8xV3B0a2srVFNwN1R0Nmlaa0NKM2FBdFQ1bytOeUVBT0FpQjZLCjFQY2k4NE93Yi9FRWkrNU9lMmpxa29vZXN1R0JlN1ZFK2FUQ21DV29LS0NxT0Fua05QT3g3TS9NaXdURlN3MGgKNFEwNm9YSkFGMzcyS09KemhTVkJuU1JvR0I0YjJhNEJLbmd3cS9XTmYyc20ybTZTdFdhK2RHNjhPNVFzMGJ4TgpLdEh4QkRoeElIcnZDWlJObW1JS2w0UmNuOFF3dVgrbC85eFFod2pScU9BODZMYTRlUGFGSmdIRDNLK3plYmJGClJLc29KUzZLcEwrc3BkN00xb2NMNXJ5cmQyei9PQ3QrbDlkRTlzNFhCcHJOSW54V09IM3IrQ0FXQjZMcWo4ZFQKdGZ1WjMxRnlSSDh5NCtaU1FqdER2Tm8rN3pwTHhCbmZ5K2lxVHZjPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUyTnpReE5EUXpOVEF3SGhjTk1qTXdNVEU1TVRZd05UUTVXaGNOTWpVd01URTQKTVRZd05UVXdXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFMk56UXhORFF6TlRBdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFDdTNIVDBVY2ZaWTErNkVYdU1kbG1ICkVjaWp2ZzdHa001eXhOb1NPUWJWbFFlSUt4ZDh3eHBkaGdBWXN3Nm5nQm1yODN3Ymp0R3J6ZGJSL3RpMm5rOFYKRVgvaitLelQxWHY3YmhtSnRKcXRCbnduRFFlejZQTk0vSnpTMXBNYUovNERBYmZYNW5nWFR4VjlhWU9DQlJQegpuc25wYnJnNHNzQWJkWE9LdWRkOUdtVTBvS01uVXZUU1U0eHhVRjAvMUc5M1hDUXNJZ21OQzNXRTd6QzM5a2FvCllZcEFSV0wrQ0ViQjBxQjh3UFhEUmhqcUlkalg2NkFyYmF0OTZIK21JTjY1ZXp5RlcxTStHV24vZkJkdzJCSm0KSTU2cVNTV3JNQjl2MW1rZmtZUjFxQkM5Mkx4NUpVOVAzbDRoNm5CUGlzVGp5SldJTVRyQ0NEZTVtb21NMGtoagpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJTeFY1eWQybk8zRFhSeTVCeVdlcEVtbHE1WGZ6QU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKcXNnTlBZZXhTR3BNQ3VUb2hmaU84cGorYWNZT1d4QTB4aE9zWm4ycTArdlRHRkpqYnErN0RwMWZidkdoNjBKeQpLM3hnbnFYSmE3Q2d6ZnFMMGt0SlAzT2N4cHZ1bkw4Tk9Sa1MvTTl6RjRBQXgxcUVXa0NSbFpKQ1Jycm5JRmVjCjNtSHZKb3FMQi9GNzVRWWRTOUxEdzJlQ2F6VnJyWHEvUjM1MkhWZk1oQk5Hck50YVRZbDR5NEl2RUFMWkdXSXEKQzVMSDhWWnY2S2tOVzFueVd1eEMxL0RZc3N6NEh0eWl5OTZvMytkVzgwMmpKakJXSXZmY2IrM3k2QTI0RGJ4MwpZUDFwMTdmTC92RUFwZGF6RzA0NjlyeTZYRndJWTdPQ01nQXM4cm4xWk5MdllLeTcvQXNBQjFmNVFVejhhR2YwCitIOFU2QVMyL3BRMUYyc0c0UjUzSFE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
          url: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
        },
        version: '4.11.0',
        versionAvailableUpdates: [
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:97410a5db655a9d3017b735c2c0747c849d09ff551765e49d5272b80c024a844',
            url: 'https://access.redhat.com/errata/RHSA-2022:6103',
            version: '4.11.1',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:0ca14e0f692391970fc23f88188f2a21f35a5ba24fe2f3cb908fd79fa46458e6',
            url: 'https://access.redhat.com/errata/RHSA-2022:7201',
            version: '4.11.12',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:9ffb17b909a4fdef5324ba45ec6dd282985dd49d25b933ea401873183ef20bf8',
            url: 'https://access.redhat.com/errata/RHBA-2022:7290',
            version: '4.11.13',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:a4e3391f3ff6e33211a91ccd446f2dc57075301e3b974023172b8b8f6aac5461',
            url: 'https://access.redhat.com/errata/RHBA-2022:8627',
            version: '4.11.17',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:22e149142517dfccb47be828f012659b1ccf71d26620e6f62468c264a7ce7863',
            url: 'https://access.redhat.com/errata/RHBA-2022:8698',
            version: '4.11.18',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:e86e058f7f66a687e273792f2e4ec70f3cc43ec9d2894bebee5caf5c4d4851a3',
            url: 'https://access.redhat.com/errata/RHSA-2022:8893',
            version: '4.11.20',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:860cc37824074671c4cf76e02d224d243e670d2298e6dab8923ee391fbd0ae1c',
            url: 'https://access.redhat.com/errata/RHSA-2022:9107',
            version: '4.11.21',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:6e16fe4b05385d8422529c0120aff73f55a55eff57581a0714443d92a87f1ce9',
            url: 'https://access.redhat.com/errata/RHBA-2023:0027',
            version: '4.11.22',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:1ce5676839bca4f389cdc1c3ddc1a78ab033d4c554453ca7ef61a23e34da0803',
            url: 'https://access.redhat.com/errata/RHSA-2022:6287',
            version: '4.11.3',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:e04ee7eea9e6a6764df218bcce3ee64e1816445158a0763954b599e0fc96580b',
            url: 'https://access.redhat.com/errata/RHBA-2022:6376',
            version: '4.11.4',
          },
          {
            channels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:fe4d499ac9fc7d12fcfccf3d6ae8a916c31e282d18adbebb0456c0fd6aef02c9',
            url: 'https://access.redhat.com/errata/RHSA-2022:6536',
            version: '4.11.5',
          },
        ],
        versionHistory: [
          {
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:300bce8246cf880e792e106607925de0a404484637627edf5f517375517d54a4',
            state: 'Completed',
            verified: false,
            version: '4.11.0',
          },
        ],
      },
      displayVersion: 'OpenShift 4.11.0',
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
        currentVersion: '4.11.0',
        desiredVersion: '4.11.0',
        isReadySelectChannels: true,
        isSelectingChannel: false,
        isUpgradeCuration: false,
        currentChannel: 'stable-4.11',
        desiredChannel: 'stable-4.11',
        availableUpdates: [
          '4.11.1',
          '4.11.12',
          '4.11.13',
          '4.11.17',
          '4.11.18',
          '4.11.20',
          '4.11.21',
          '4.11.22',
          '4.11.3',
          '4.11.4',
          '4.11.5',
        ],
        availableChannels: ['candidate-4.11', 'candidate-4.12', 'fast-4.11', 'fast-4.12', 'stable-4.11'],
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
    labels: {
      cloud: 'Amazon',
      'cluster.open-cluster-management.io/clusterset': 'default',
      clusterID: 'e3ecf1d1-c597-4ee4-9b67-443ff16a723e',
      'feature.open-cluster-management.io/addon-application-manager': 'available',
      'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
      'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
      'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
      'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
      'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
      'feature.open-cluster-management.io/addon-work-manager': 'available',
      'local-cluster': 'true',
      name: 'local-cluster',
      openshiftVersion: '4.11.0',
      'openshiftVersion-major': '4',
      'openshiftVersion-major-minor': '4.11',
      'velero.io/exclude-from-backup': 'true',
      vendor: 'OpenShift',
    },
    nodes: {
      nodeList: [
        {
          capacity: {
            cpu: '8',
            memory: '32555512Ki',
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
          name: 'ip-10-0-139-9.ec2.internal',
        },
        {
          capacity: {
            cpu: '8',
            memory: '32555512Ki',
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
          name: 'ip-10-0-145-50.ec2.internal',
        },
        {
          capacity: {
            cpu: '8',
            memory: '32555512Ki',
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
          name: 'ip-10-0-167-46.ec2.internal',
        },
      ],
      ready: 3,
      unhealthy: 0,
      unknown: 0,
    },
    kubeApiServer: 'https://api.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com:6443',
    consoleURL: 'https://console-openshift-console.apps.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com',
    isHive: false,
    isHypershift: false,
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
    creationTimestamp: '2023-01-19T20:00:18Z',
  },
  {
    name: 'feng-hs-import',
    displayName: 'feng-hs-import',
    namespace: 'clusters',
    uid: '70114a05-8031-4517-99f8-ed565623d176',
    status: 'pendingimport',
    provider: 'aws',
    acmDistribution: {},
    nodes: {
      nodeList: [],
      ready: 0,
      unhealthy: 0,
      unknown: 0,
    },
    consoleURL: 'https://console-openshift-console.apps.feng-hs-import.dev06.red-chesterfield.com',
    isHive: false,
    isHypershift: true,
    isManaged: false,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    hive: {
      isHibernatable: false,
      secrets: {},
    },
    owner: {},
    kubeconfig: 'feng-hs-import-admin-kubeconfig',
    kubeadmin: 'feng-hs-import-kubeadmin-password',
    hypershift: {
      agent: false,
      nodePools: [
        {
          apiVersion: 'hypershift.openshift.io/v1alpha1',
          kind: 'NodePool',
          metadata: {
            annotations: {
              'hypershift.openshift.io/nodePoolCurrentConfig': '915e887e',
              'hypershift.openshift.io/nodePoolCurrentConfigVersion': '7cda6e14',
            },
            creationTimestamp: '2023-01-20T19:57:48Z',
            finalizers: ['hypershift.openshift.io/finalizer'],
            generation: 1,
            labels: {
              'hypershift.openshift.io/auto-created-for-infra': 'feng-hs-import-dqxq4',
            },
            name: 'feng-hs-import-us-west-2a',
            namespace: 'clusters',
            ownerReferences: [
              {
                apiVersion: 'hypershift.openshift.io/v1beta1',
                kind: 'HostedCluster',
                name: 'feng-hs-import',
                uid: '70114a05-8031-4517-99f8-ed565623d176',
              },
            ],
            resourceVersion: '734442',
            uid: '437e060c-14fb-4cb7-a455-1a5f56add6e6',
          },
          spec: {
            clusterName: 'feng-hs-import',
            management: {
              autoRepair: false,
              replace: {
                rollingUpdate: {
                  maxSurge: 1,
                  maxUnavailable: 0,
                },
                strategy: 'RollingUpdate',
              },
              upgradeType: 'Replace',
            },
            platform: {
              aws: {
                instanceProfile: 'feng-hs-import-dqxq4-worker',
                instanceType: 'm5.large',
                rootVolume: {
                  size: 120,
                  type: 'gp3',
                },
                securityGroups: [
                  {
                    id: 'sg-0fef7da74b5f49e71',
                  },
                ],
                subnet: {
                  id: 'subnet-08a463dc35899a11e',
                },
              },
              type: 'AWS',
            },
            release: {
              image: 'quay.io/openshift-release-dev/ocp-release:4.11.17-x86_64',
            },
            replicas: 1,
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2023-01-20T19:57:48Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'False',
                type: 'AutoscalingEnabled',
              },
              {
                lastTransitionTime: '2023-01-20T19:57:48Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'UpdateManagementEnabled',
              },
              {
                lastTransitionTime: '2023-01-20T19:58:26Z',
                message: 'Using release image: quay.io/openshift-release-dev/ocp-release:4.11.17-x86_64',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidReleaseImage',
              },
              {
                lastTransitionTime: '2023-01-20T19:58:26Z',
                message: 'Bootstrap AMI is "ami-04e1ca274c50f2acb"',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidPlatformImage',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:49Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidMachineConfig',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:50Z',
                message: 'Unable to get status data from token secret',
                observedGeneration: 1,
                status: 'Unknown',
                type: 'ValidGeneratedPayload',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:49Z',
                observedGeneration: 1,
                reason: 'ignitionNotReached',
                status: 'False',
                type: 'ReachedIgnitionEndpoint',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:49Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidTuningConfig',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:49Z',
                message: 'Reconciliation active on resource',
                observedGeneration: 1,
                reason: 'ReconciliationActive',
                status: 'True',
                type: 'ReconciliationActive',
              },
              {
                lastTransitionTime: '2023-01-20T20:00:10Z',
                message: 'All is well',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'AllMachinesReady',
              },
              {
                lastTransitionTime: '2023-01-20T20:04:46Z',
                message: 'All is well',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'AllNodesHealthy',
              },
              {
                lastTransitionTime: '2023-01-20T19:59:50Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'False',
                type: 'AutorepairEnabled',
              },
              {
                lastTransitionTime: '2023-01-20T20:04:46Z',
                observedGeneration: 1,
                reason: 'AsExpected',
                status: 'True',
                type: 'Ready',
              },
            ],
            replicas: 1,
            version: '4.11.17',
          },
        },
      ],
      secretNames: ['feng-hs-import-ssh-key', 'feng-hs-import-pull-secret'],
      hostingNamespace: 'clusters',
    },
  },
]

const application2: ArgoApplicationTopologyData = {
  name: 'feng-argo-hello',
  namespace: 'openshift-gitops',
  app: {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      creationTimestamp: '2023-01-23T15:34:03Z',
      generation: 20,
      name: 'feng-argo-hello',
      namespace: 'openshift-gitops',
      resourceVersion: '1100922',
      uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
    },
    spec: {
      destination: {
        name: '',
        namespace: 'feng-argo-hello',
        server: 'https://kubernetes.default.svc',
      },
      project: 'default',
      source: {
        path: 'helloworld',
        repoURL: 'https://github.com/fxiang1/app-samples',
        targetRevision: 'HEAD',
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true,
        },
        syncOptions: ['CreateNamespace=true'],
      },
    },
    status: {
      health: {
        status: 'Healthy',
      },
      history: [
        {
          deployStartedAt: '2023-01-23T15:34:03Z',
          deployedAt: '2023-01-23T15:34:09Z',
          id: 0,
          revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
      ],
      operationState: {
        finishedAt: '2023-01-23T15:34:09Z',
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
            syncOptions: ['CreateNamespace=true'],
          },
        },
        phase: 'Succeeded',
        startedAt: '2023-01-23T15:34:03Z',
        syncResult: {
          resources: [
            {
              group: '',
              hookPhase: 'Succeeded',
              kind: 'Namespace',
              message: 'namespace/feng-argo-hello created',
              name: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
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
              namespace: 'feng-argo-hello',
              status: 'Synced',
              syncPhase: 'Sync',
              version: 'v1',
            },
          ],
          revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
      },
      reconciledAt: '2023-01-23T16:00:05Z',
      resources: [
        {
          health: {
            status: 'Healthy',
          },
          kind: 'Service',
          name: 'helloworld-app-svc',
          namespace: 'feng-argo-hello',
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
          namespace: 'feng-argo-hello',
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
          namespace: 'feng-argo-hello',
          status: 'Synced',
          version: 'v1',
        },
      ],
      sourceType: 'Directory',
      summary: {
        images: ['quay.io/fxiang1/helloworld:0.0.1'],
      },
      sync: {
        comparedTo: {
          destination: {
            name: 'local-cluster',
            namespace: 'feng-argo-hello',
          },
          source: {
            path: 'helloworld',
            repoURL: 'https://github.com/fxiang1/app-samples',
            targetRevision: 'HEAD',
          },
        },
        revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
        status: 'Synced',
      },
    },
  },
}

const argoData2: ArgoTopologyData = {
  topology: {
    nodes: [
      {
        name: 'feng-argo-hello',
        namespace: 'openshift-gitops',
        type: 'application',
        id: 'application--feng-argo-hello',
        uid: 'application--feng-argo-hello',
        specs: {
          isDesign: true,
          resourceCount: 0,
          raw: {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'Application',
            metadata: {
              creationTimestamp: '2023-01-23T15:34:03Z',
              generation: 20,
              name: 'feng-argo-hello',
              namespace: 'openshift-gitops',
              resourceVersion: '1100922',
              uid: '2a86cc10-0a18-43f6-8b66-63fd6393ee49',
            },
            spec: {
              destination: {
                name: '',
                namespace: 'feng-argo-hello',
                server: 'https://kubernetes.default.svc',
              },
              project: 'default',
              source: {
                path: 'helloworld',
                repoURL: 'https://github.com/fxiang1/app-samples',
                targetRevision: 'HEAD',
              },
              syncPolicy: {
                automated: {
                  prune: true,
                  selfHeal: true,
                },
                syncOptions: ['CreateNamespace=true'],
              },
            },
            status: {
              health: {
                status: 'Healthy',
              },
              history: [
                {
                  deployStartedAt: '2023-01-23T15:34:03Z',
                  deployedAt: '2023-01-23T15:34:09Z',
                  id: 0,
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
              ],
              operationState: {
                finishedAt: '2023-01-23T15:34:09Z',
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
                    syncOptions: ['CreateNamespace=true'],
                  },
                },
                phase: 'Succeeded',
                startedAt: '2023-01-23T15:34:03Z',
                syncResult: {
                  resources: [
                    {
                      group: '',
                      hookPhase: 'Succeeded',
                      kind: 'Namespace',
                      message: 'namespace/feng-argo-hello created',
                      name: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
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
                      namespace: 'feng-argo-hello',
                      status: 'Synced',
                      syncPhase: 'Sync',
                      version: 'v1',
                    },
                  ],
                  revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
              },
              reconciledAt: '2023-01-23T16:00:05Z',
              resources: [
                {
                  health: {
                    status: 'Healthy',
                  },
                  kind: 'Service',
                  name: 'helloworld-app-svc',
                  namespace: 'feng-argo-hello',
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
                  namespace: 'feng-argo-hello',
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
                  namespace: 'feng-argo-hello',
                  status: 'Synced',
                  version: 'v1',
                },
              ],
              sourceType: 'Directory',
              summary: {
                images: ['quay.io/fxiang1/helloworld:0.0.1'],
              },
              sync: {
                comparedTo: {
                  destination: {
                    name: 'local-cluster',
                    namespace: 'feng-argo-hello',
                  },
                  source: {
                    path: 'helloworld',
                    repoURL: 'https://github.com/fxiang1/app-samples',
                    targetRevision: 'HEAD',
                  },
                },
                revision: 'b8fee607fd58e3477e74d674c0b7f8b9250a63be',
                status: 'Synced',
              },
            },
          },
          allSubscriptions: [],
          allChannels: [],
          allClusters: {
            isLocal: true,
            remoteCount: 0,
          },
          clusterNames: ['local-cluster'],
          relatedApps: [
            {
              _clusterNamespace: '',
              _hubClusterResource: 'true',
              _uid: 'local-cluster/2a86cc10-0a18-43f6-8b66-63fd6393ee49',
              apigroup: 'argoproj.io',
              apiversion: 'v1alpha1',
              applicationSet: '',
              chart: '',
              cluster: 'local-cluster',
              created: '2023-01-23T15:34:03Z',
              destinationName: 'local-cluster',
              destinationNamespace: 'feng-argo-hello',
              destinationServer: '',
              healthStatus: 'Healthy',
              kind: 'Application',
              kind_plural: 'applications',
              name: 'feng-argo-hello',
              namespace: 'openshift-gitops',
              path: 'helloworld',
              repoURL: 'https://github.com/fxiang1/app-samples',
              syncStatus: 'Synced',
              targetRevision: 'HEAD',
              destinationCluster: 'local-cluster',
            },
          ],
        },
      },
      {
        name: 'local-cluster',
        namespace: '',
        type: 'cluster',
        id: 'member--clusters--',
        uid: 'member--clusters--',
        specs: {
          title: 'helloworld',
          subscription: null,
          resourceCount: 1,
          clustersNames: ['local-cluster'],
          clusters: [
            {
              name: 'local-cluster',
            },
          ],
          sortedClusterNames: ['local-cluster'],
          appClusters: ['local-cluster'],
          targetNamespaces: {
            'local-cluster': ['feng-argo-hello'],
          },
        },
      },
      {
        name: 'helloworld-app-svc',
        namespace: 'feng-argo-hello',
        type: 'service',
        id: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-svc',
              namespace: 'feng-argo-hello',
            },
            health: {
              status: 'Healthy',
            },
            kind: 'Service',
            name: 'helloworld-app-svc',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'deployment',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-deploy',
              namespace: 'feng-argo-hello',
            },
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'helloworld-app-deploy',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'apps/v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'replicaset',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: null,
          clustersNames: ['local-cluster'],
          replicaCount: 1,
          parent: {
            parentId:
              'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
            parentName: 'helloworld-app-deploy',
            parentType: 'deployment',
          },
        },
      },
      {
        name: 'helloworld-app-deploy',
        namespace: 'feng-argo-hello',
        type: 'pod',
        id: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        specs: {
          isDesign: false,
          resourceCount: null,
          clustersNames: ['local-cluster'],
          replicaCount: 1,
          parent: {
            parentId:
              'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
            parentName: 'helloworld-app-deploy',
            parentType: 'replicaset',
          },
        },
      },
      {
        name: 'helloworld-app-route',
        namespace: 'feng-argo-hello',
        type: 'route',
        id: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        specs: {
          isDesign: false,
          raw: {
            metadata: {
              name: 'helloworld-app-route',
              namespace: 'feng-argo-hello',
            },
            group: 'route.openshift.io',
            health: {
              message: 'Route is healthy',
              status: 'Healthy',
            },
            kind: 'Route',
            name: 'helloworld-app-route',
            namespace: 'feng-argo-hello',
            status: 'Synced',
            version: 'v1',
            apiVersion: 'route.openshift.io/v1',
          },
          clustersNames: ['local-cluster'],
          parent: {
            clusterId: 'member--clusters--',
          },
        },
      },
    ],
    links: [
      {
        from: {
          uid: 'application--feng-argo-hello',
        },
        to: {
          uid: 'member--clusters--',
        },
        type: '',
        specs: {
          isDesign: true,
        },
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----service--feng-argo-hello--helloworld-app-svc',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----deployment--feng-argo-hello--helloworld-app-deploy--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----route--feng-argo-hello--helloworld-app-route',
        },
        type: '',
      },
    ],
  },
  cluster: 'feng-hs-import',
}
