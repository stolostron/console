// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getAppSetResourceStatuses } from './resourceStatusesAppSet'
import { waitFor } from '@testing-library/react'
import { nockSearch } from '../../../../../lib/nock-util'
import {
  AppSetApplicationData,
  AppSetApplicationModel,
  ApplicationSet,
  SearchQuery,
  ResourceStatusData,
} from '../types'

describe('getAppSetResourceStatuses', () => {
  it('getAppSetResourceStatuses returns resourceStatuses', async () => {
    const search = nockSearch(mockSearchQuery, mockSearchResponse)
    await waitFor(() => expect(search.isDone()).toBeTruthy())
    let result = await getAppSetResourceStatuses(application, appData)
    expect(result).toStrictEqual({ resourceStatuses: mockSearchResponse })
  })
})

interface TestAppSetApplicationData extends AppSetApplicationData {
  subscription: null
  argoAppsLabelNames?: string[]
}

const appData: TestAppSetApplicationData = {
  subscription: null,
  relatedKinds: ['applicationset', 'placement', 'cluster', 'consolelink'],
  targetNamespaces: ['cluster-configs-rhacm'],
  argoAppsLabelNames: [
    'app.kubernetes.io/instance=mock-app-local-cluster',
    'app.kubernetes.io/instance=mock-app-dyna1203',
  ],
}

const application: AppSetApplicationModel = {
  name: 'mock-app',
  namespace: 'mock-ns',
  app: {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      creationTimestamp: '2022-12-07T16:04:20Z',
      generation: 1,
      name: 'mock-app',
      namespace: 'mock-ns',
      resourceVersion: '11864536',
      uid: 'b12d45a2-b9c3-4e04-8f73-c9d78c22ca82',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: {
                'cluster.open-cluster-management.io/placement': 'mock-app-placement',
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
          name: 'mock-app-{{name}}',
        },
        spec: {
          destination: {
            namespace: 'cluster-configs-rhacm',
            server: '{{server}}',
          },
          project: 'default',
          source: {
            path: 'cluster/console',
            repoURL: 'https://github.com/mock/mock',
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
          lastTransitionTime: '2022-12-07T16:04:20Z',
          message: 'Successfully generated parameters for all Applications',
          reason: 'ApplicationSetUpToDate',
          status: 'False',
          type: 'ErrorOccurred',
        },
        {
          lastTransitionTime: '2022-12-07T16:04:20Z',
          message: 'Successfully generated parameters for all Applications',
          reason: 'ParametersGenerated',
          status: 'True',
          type: 'ParametersGenerated',
        },
        {
          lastTransitionTime: '2022-12-07T16:04:20Z',
          message: 'ApplicationSet up to date',
          reason: 'ApplicationSetUpToDate',
          status: 'True',
          type: 'ResourcesUpToDate',
        },
      ],
    },
  } as ApplicationSet,
  appSetApps: [
    {
      metadata: {
        annotations: {
          'argocd.argoproj.io/sync-wave': '0',
        },
        creationTimestamp: '2022-12-07T16:04:20Z',
        finalizers: ['resources-finalizer.argocd.argoproj.io'],
        generation: 1,
        labels: {
          'app.kubernetes.io/instance': 'mock-app-local-cluster',
          'argocd.argoproj.io/instance': 'mock-app-local-cluster',
        },
        name: 'mock-app-local-cluster',
        namespace: 'mock-ns',
        ownerReferences: [
          {
            apiVersion: 'argoproj.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ApplicationSet',
            name: 'mock-app',
            uid: 'b12d45a2-b9c3-4e04-8f73-c9d78c22ca82',
          },
        ],
        resourceVersion: '11864538',
        uid: '8e0b8b8b-b9c3-4e04-8f73-c9d78c22ca82',
      },
      spec: {
        destination: {
          namespace: 'cluster-configs-rhacm',
          server: 'https://kubernetes.default.svc',
        },
        project: 'default',
        source: {
          path: 'cluster/console',
          repoURL: 'https://github.com/mock/mock',
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
        sync: {
          status: 'Synced',
        },
        resources: [
          {
            group: '',
            version: 'v1',
            kind: 'ConsoleLink',
            namespace: '',
            name: 'application-menu-rh-developer-blog',
            status: 'Synced',
            health: {
              status: 'Healthy',
            },
          },
          {
            group: '',
            version: 'v1',
            kind: 'ConsoleLink',
            namespace: '',
            name: 'ocp100',
            status: 'Synced',
            health: {
              status: 'Healthy',
            },
          },
        ],
      },
    },
    {
      metadata: {
        annotations: {
          'argocd.argoproj.io/sync-wave': '0',
        },
        creationTimestamp: '2022-12-07T16:04:20Z',
        finalizers: ['resources-finalizer.argocd.argoproj.io'],
        generation: 1,
        labels: {
          'app.kubernetes.io/instance': 'mock-app-dyna1203',
          'argocd.argoproj.io/instance': 'mock-app-dyna1203',
        },
        name: 'mock-app-dyna1203',
        namespace: 'mock-ns',
        ownerReferences: [
          {
            apiVersion: 'argoproj.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ApplicationSet',
            name: 'mock-app',
            uid: 'b12d45a2-b9c3-4e04-8f73-c9d78c22ca82',
          },
        ],
        resourceVersion: '11864539',
        uid: '9e0b8b8b-b9c3-4e04-8f73-c9d78c22ca82',
      },
      spec: {
        destination: {
          namespace: 'cluster-configs-rhacm',
          server: 'https://api.dyna1203.mock.com:6443',
        },
        project: 'default',
        source: {
          path: 'cluster/console',
          repoURL: 'https://github.com/mock/mock',
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
        sync: {
          status: 'Synced',
        },
        resources: [
          {
            group: '',
            version: 'v1',
            kind: 'ConsoleLink',
            namespace: '',
            name: 'application-menu-rh-developer-blog',
            status: 'Synced',
            health: {
              status: 'Healthy',
            },
          },
          {
            group: '',
            version: 'v1',
            kind: 'ConsoleLink',
            namespace: '',
            name: 'ocp100',
            status: 'Synced',
            health: {
              status: 'Healthy',
            },
          },
        ],
      },
    },
  ],
  appSetClusters: [
    {
      name: 'local-cluster',
      namespace: 'local-cluster',
      status: 'ok',
      created: '2022-12-03T16:54:05Z',
    },
    {
      name: 'dyna1203',
      namespace: 'dyna1203',
      status: 'ok',
      created: '2022-12-03T16:54:05Z',
    },
  ],
}

interface MockSearchQuery {
  operationName: string
  variables: {
    input: SearchQuery[]
  }
  query: string
}

const mockSearchQuery: MockSearchQuery = {
  operationName: 'searchResultItemsAndRelatedItems',
  variables: {
    input: [
      {
        keywords: [],
        filters: [
          {
            property: 'kind',
            values: ['applicationset', 'placement', 'cluster'],
          },
          {
            property: 'namespace',
            values: ['cluster-configs-rhacm'],
          },
          {
            property: 'cluster',
            values: ['local-cluster', 'dyna1203'],
          },
        ],
        relatedKinds: ['cluster', 'pod', 'replicaset', 'replicationcontroller'],
      },
      {
        keywords: [],
        filters: [
          {
            property: 'kind',
            values: ['consolelink'],
          },
          {
            property: 'name',
            values: ['application-menu-rh-developer-blog'],
          },
        ],
        relatedKinds: [],
      },
      {
        keywords: [],
        filters: [
          {
            property: 'kind',
            values: ['consolelink'],
          },
          {
            property: 'name',
            values: ['ocp100'],
          },
        ],
        relatedKinds: [],
      },
    ],
  },
  query:
    'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
}

const mockSearchResponse: ResourceStatusData = {
  data: {
    searchResult: [
      {
        __typename: 'SearchResult',
        items: [],
        related: null,
      },
      {
        __typename: 'SearchResult',
        items: [
          {
            ClusterCertificateRotated: 'True',
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _uid: 'cluster__dyna1203',
            apigroup: 'internal.open-cluster-management.io',
            cluster: '',
            consoleURL: 'https://console-mock.com',
            cpu: '24',
            created: '2022-12-03T16:54:05Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.24.6+5658434',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=auto-gitops-cluster-set; clusterID=d894c4e2-eb80-41a2-b0ba-0cf54cc9d40f; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=dyna1203; openshiftVersion=4.11.17; openshiftVersion-major=4; openshiftVersion-major-minor=4.11; region=us-east-2; vendor=OpenShift',
            memory: '96260328Ki',
            name: 'dyna1203',
            nodes: '6',
          },
          {
            ClusterCertificateRotated: 'True',
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _uid: 'cluster__iks419',
            apigroup: 'internal.open-cluster-management.io',
            cluster: '',
            consoleURL: 'https://console-mock.com',
            cpu: '8',
            created: '2022-12-03T16:54:05Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.24.6+5658434',
            label:
              'cloud=IBM; cluster.open-cluster-management.io/clusterset=auto-gitops-cluster-set; clusterID=d894c4e2-eb80-41a2-b0ba-0cf54cc9d40f; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=iks419; openshiftVersion=4.11.17; openshiftVersion-major=4; openshiftVersion-major-minor=4.11; region=us-east-2; vendor=OpenShift',
            memory: '32260328Ki',
            name: 'iks419',
            nodes: '3',
          },
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
            consoleURL: 'https://console-mock.com',
            cpu: '16',
            created: '2022-12-03T16:54:05Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.24.6+5658434',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=d894c4e2-eb80-41a2-b0ba-0cf54cc9d40f; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=local-cluster; openshiftVersion=4.11.17; openshiftVersion-major=4; openshiftVersion-major-minor=4.11; region=us-east-2; vendor=OpenShift',
            memory: '64260328Ki',
            name: 'local-cluster',
            nodes: '4',
          },
        ],
        related: [
          {
            __typename: 'SearchRelatedResult',
            kind: 'Pod',
            items: [
              {
                _hubClusterResource: 'false',
                _uid: 'dyna1203/cluster-configs-rhacm/application-menu-rh-developer-blog-pod-1',
                apiversion: 'v1',
                cluster: 'dyna1203',
                container: 'nginx',
                created: '2022-12-07T16:04:20Z',
                hostIP: '10.0.1.1',
                kind: 'Pod',
                label: 'app=application-menu-rh-developer-blog',
                name: 'application-menu-rh-developer-blog-pod-1',
                namespace: 'cluster-configs-rhacm',
                podIP: '10.244.1.1',
                restarts: '0',
                startedAt: '2022-12-07T16:04:20Z',
                status: 'Running',
              },
              {
                _hubClusterResource: 'false',
                _uid: 'local-cluster/cluster-configs-rhacm/application-menu-rh-developer-blog-pod-2',
                apiversion: 'v1',
                cluster: 'local-cluster',
                container: 'nginx',
                created: '2022-12-07T16:04:20Z',
                hostIP: '10.0.1.2',
                kind: 'Pod',
                label: 'app=application-menu-rh-developer-blog',
                name: 'application-menu-rh-developer-blog-pod-2',
                namespace: 'cluster-configs-rhacm',
                podIP: '10.244.1.2',
                restarts: '0',
                startedAt: '2022-12-07T16:04:20Z',
                status: 'Running',
              },
            ],
          },
          {
            __typename: 'SearchRelatedResult',
            kind: 'ReplicaSet',
            items: [
              {
                _hubClusterResource: 'false',
                _uid: 'dyna1203/cluster-configs-rhacm/application-menu-rh-developer-blog-rs-1',
                apiversion: 'apps/v1',
                cluster: 'dyna1203',
                created: '2022-12-07T16:04:20Z',
                current: '1',
                desired: '1',
                kind: 'ReplicaSet',
                label: 'app=application-menu-rh-developer-blog',
                name: 'application-menu-rh-developer-blog-rs-1',
                namespace: 'cluster-configs-rhacm',
              },
              {
                _hubClusterResource: 'false',
                _uid: 'local-cluster/cluster-configs-rhacm/application-menu-rh-developer-blog-rs-2',
                apiversion: 'apps/v1',
                cluster: 'local-cluster',
                created: '2022-12-07T16:04:20Z',
                current: '1',
                desired: '1',
                kind: 'ReplicaSet',
                label: 'app=application-menu-rh-developer-blog',
                name: 'application-menu-rh-developer-blog-rs-2',
                namespace: 'cluster-configs-rhacm',
              },
            ],
          },
        ],
      },
      {
        __typename: 'SearchResult',
        items: [
          {
            _hubClusterResource: 'false',
            _uid: 'local-cluster/application-menu-rh-developer-blog',
            apiversion: 'console.openshift.io/v1',
            cluster: 'local-cluster',
            created: '2022-12-07T16:04:20Z',
            href: 'https://developers.redhat.com/blog',
            kind: 'ConsoleLink',
            location: 'ApplicationMenu',
            name: 'application-menu-rh-developer-blog',
            text: 'Red Hat Developer Blog',
          },
        ],
        related: null,
      },
      {
        __typename: 'SearchResult',
        items: [
          {
            _hubClusterResource: 'false',
            _uid: 'local-cluster/ocp100',
            apiversion: 'console.openshift.io/v1',
            cluster: 'local-cluster',
            created: '2022-12-07T16:04:20Z',
            href: 'https://www.redhat.com/en/services/training/rh124-red-hat-system-administration-i',
            kind: 'ConsoleLink',
            location: 'ApplicationMenu',
            name: 'ocp100',
            text: 'OpenShift Container Platform Training',
          },
        ],
        related: null,
      },
    ],
  },
}
