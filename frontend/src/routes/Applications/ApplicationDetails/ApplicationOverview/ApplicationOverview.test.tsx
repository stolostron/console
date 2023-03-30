/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import {
  argoApplicationsState,
  channelsState,
  managedClustersState,
  namespacesState,
  placementRulesState,
  subscriptionsState,
} from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { clickByRole, clickByText, waitForText } from '../../../../lib/test-util'

import {
  ApplicationApiVersion,
  ApplicationKind,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  Channel,
  ChannelApiVersion,
  ChannelKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  PlacementRule,
  PlacementRuleApiVersion,
  PlacementRuleKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../../../resources'
import { ApplicationDataType } from '../ApplicationDetails'
import { ApplicationOverviewPageContent } from './ApplicationOverview'

//////////////// Mock Data /////////////////

const mockSubscription1: Subscription = {
  kind: SubscriptionKind,
  apiVersion: SubscriptionApiVersion,
  metadata: {
    name: 'helloworld-simple-subscription-1',
    namespace: 'helloworld-simple-ns',
    uid: 'fd3dfc08-5d41-4449-b450-527bebc2509d',
  },
  spec: {
    channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    placement: {
      placementRef: {
        kind: PlacementRuleKind,
        name: 'helloworld-simple-placement-1',
      },
    },
  },
}
const mockSubscription2: Subscription = {
  kind: SubscriptionKind,
  apiVersion: SubscriptionApiVersion,
  metadata: {
    name: 'helloworld-simple-subscription-2',
    namespace: 'helloworld-simple-ns',
    uid: 'fd3dfc08-5d41-4449-b450-527bebc2509d',
  },
  spec: {
    channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    placement: {
      placementRef: {
        kind: PlacementRuleKind,
        name: 'helloworld-simple-placement-2',
      },
    },
  },
}

const mockChannel0: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    name: 'channel-0',
    namespace: 'ch-namespace-0',
  },
  spec: {
    pathname: 'https://test.com/test.git',
    type: 'Git',
  },
}

const mockPlacementrule0: PlacementRule = {
  apiVersion: PlacementRuleApiVersion,
  kind: PlacementRuleKind,
  metadata: {
    name: 'placementrule-0',
    namespace: 'namespace-0',
    labels: {
      app: 'application-0-app',
    },
  },
  spec: {
    clusterReplicas: 1,
    clusterSelector: {
      matchLabels: {
        name: 'local-cluster',
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
}

const mockManagedCluster0: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'local-cluster',
    labels: {
      cloud: 'Nozama',
      vendor: 'OpenShift',
    },
  },
  spec: {
    hubAcceptsClient: true,
    managedClusterClientConfigs: [
      {
        url: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
      },
    ],
  },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}

const mockArgoApplication0: ArgoApplication = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
  metadata: {
    name: 'applicationset-0-local-cluster',
    namespace: 'openshift-gitops',
    ownerReferences: [
      {
        apiVersion: ApplicationSetApiVersion,
        kind: ApplicationSetKind,
        name: 'applicationset-0',
      },
    ],
  },
  spec: {
    destination: {
      namespace: 'applicationset-0-ns',
      server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
    },
    project: 'default',
    source: {
      path: 'foo',
      repoURL: 'https://test.com/test.git',
      targetRevision: 'HEAD',
    },
    syncPolicy: {},
  },
  status: {},
}

const mockArgoApplication1: ArgoApplication = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
  metadata: {
    name: 'argoapplication-1',
    namespace: 'openshift-gitops',
  },
  spec: {
    destination: {
      namespace: 'argoapplication-1-ns',
      server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
    },
    project: 'default',
    source: {
      path: 'foo',
      repoURL: 'https://test.com/test.git',
      targetRevision: 'HEAD',
    },
    syncPolicy: {},
  },
  status: {},
}

const mockApplicationDataSubscription: ApplicationDataType = {
  refreshTime: 1646925212170,
  appData: {
    isArgoApp: false,
    relatedKinds: [
      'application',
      'subscription',
      'placements',
      'cluster',
      'service',
      'deployment',
      'replicaset',
      'configmap',
      'pod',
    ],
    subscription: 'demo-etherpad',
  },
  application: {
    activeChannel: 'demo-etherpad/demo-etherpad//demo-etherpad-repos/github-redhat-sa-brazil-demo-summitgov-cy20',
    allChannels: [
      {
        apiVersion: ChannelApiVersion,
        kind: ChannelKind,
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/cluster-admin': 'true',
            'apps.open-cluster-management.io/hosting-subscription':
              'magchen-sibling-ns/magchen-sibling-subscription-1-local',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
          },
          creationTimestamp: '2022-03-01T21:30:02Z',
          generation: 1,
          labels: {
            app: 'magchen-sibling',
            'app.kubernetes.io/part-of': 'magchen-sibling',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'github-redhat-sa-brazil-demo-summitgov-cy20',
          namespace: 'demo-etherpad-repos',
          resourceVersion: '74226330',
          uid: '4f8848b4-c5b3-4b3d-b636-7e9377b9f127',
        },
        spec: { pathname: 'https://github.com/redhat-sa-brazil/demo-summitgov-cy20.git', type: 'GitHub' },
      },
    ],
    allClusters: [],
    allSubscriptions: [
      {
        apiVersion: SubscriptionApiVersion,
        kind: SubscriptionKind,
        channels: [
          {
            apiVersion: ChannelApiVersion,
            kind: ChannelKind,
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/cluster-admin': 'true',
                'apps.open-cluster-management.io/hosting-subscription':
                  'magchen-sibling-ns/magchen-sibling-subscription-1-local',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
              },
              creationTimestamp: '2022-03-01T21:30:02Z',
              generation: 1,
              labels: {
                app: 'magchen-sibling',
                'app.kubernetes.io/part-of': 'magchen-sibling',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'github-redhat-sa-brazil-demo-summitgov-cy20',
              namespace: 'demo-etherpad-repos',
            },
            spec: {
              pathname: 'https://github.com/redhat-sa-brazil/demo-summitgov-cy20.git',
              type: 'GitHub',
            },
          },
        ],
        metadata: {
          creationTimestamp: '2022-03-01T21:30:03Z',
          generation: 476,
          name: 'demo-etherpad',
          namespace: 'demo-etherpad',
          resourceVersion: '83124008',
        },
        spec: {},
      },
    ],
    app: {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: {
        creationTimestamp: '2022-03-01T21:30:03Z',
        generation: 1,
        name: 'demo-etherpad',
        namespace: 'demo-etherpad',
        resourceVersion: '74226379',
      },
    },
    metadata: {
      name: 'demo-etherpad',
      namespace: 'demo-etherpad',
      creationTimestamp: '2022-03-01T21:30:03Z',
    },
    isAppSet: false,
    isArgoApp: false,
  },
  topology: {
    links: [],
    nodes: [],
  },
}

const mockApplicationDataSubscriptionTimewindow: ApplicationDataType = {
  refreshTime: 1646925212170,
  appData: {
    isArgoApp: false,
    relatedKinds: [
      'application',
      'subscription',
      'placements',
      'cluster',
      'service',
      'deployment',
      'replicaset',
      'configmap',
      'pod',
    ],
    subscription: 'demo-etherpad',
  },
  application: {
    activeChannel: 'demo-etherpad/demo-etherpad//demo-etherpad-repos/github-redhat-sa-brazil-demo-summitgov-cy20',
    allChannels: [
      {
        apiVersion: ChannelApiVersion,
        kind: ChannelKind,
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/cluster-admin': 'true',
            'apps.open-cluster-management.io/hosting-subscription':
              'magchen-sibling-ns/magchen-sibling-subscription-1-local',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
          },
          creationTimestamp: '2022-03-01T21:30:02Z',
          generation: 1,
          labels: {
            app: 'magchen-sibling',
            'app.kubernetes.io/part-of': 'magchen-sibling',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'github-redhat-sa-brazil-demo-summitgov-cy20',
          namespace: 'demo-etherpad-repos',
          resourceVersion: '74226330',
          uid: '4f8848b4-c5b3-4b3d-b636-7e9377b9f127',
        },
        spec: { pathname: 'https://github.com/redhat-sa-brazil/demo-summitgov-cy20.git', type: 'GitHub' },
      },
    ],
    allClusters: [],
    allSubscriptions: [
      {
        apiVersion: SubscriptionApiVersion,
        kind: SubscriptionKind,
        channels: [
          {
            apiVersion: ChannelApiVersion,
            kind: ChannelKind,
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/cluster-admin': 'true',
                'apps.open-cluster-management.io/hosting-subscription':
                  'magchen-sibling-ns/magchen-sibling-subscription-1-local',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
              },
              creationTimestamp: '2022-03-01T21:30:02Z',
              generation: 1,
              labels: {
                app: 'magchen-sibling',
                'app.kubernetes.io/part-of': 'magchen-sibling',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'github-redhat-sa-brazil-demo-summitgov-cy20',
              namespace: 'demo-etherpad-repos',
            },
            spec: {
              pathname: 'https://github.com/redhat-sa-brazil/demo-summitgov-cy20.git',
              type: 'GitHub',
            },
          },
        ],
        metadata: {
          creationTimestamp: '2022-03-01T21:30:03Z',
          generation: 476,
          name: 'demo-etherpad',
          namespace: 'demo-etherpad',
          resourceVersion: '83124008',
        },
        spec: {
          timewindow: {
            daysofweek: ['Sunday', 'Saturday'],
            hours: [],
            location: 'America/Toronto',
            windowtype: 'blocked',
          },
        },
      },
    ],
    app: {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: {
        creationTimestamp: '2022-03-01T21:30:03Z',
        generation: 1,
        name: 'demo-etherpad',
        namespace: 'demo-etherpad',
        resourceVersion: '74226379',
      },
    },
    metadata: {
      name: 'demo-etherpad',
      namespace: 'demo-etherpad',
      creationTimestamp: '2022-03-01T21:30:03Z',
    },
    isAppSet: false,
    isArgoApp: false,
  },
  topology: {
    links: [],
    nodes: [],
  },
}

const mockApplicationDataArgo: ApplicationDataType = {
  refreshTime: 1648135176039,
  appData: {
    relatedKinds: ['applicationset', 'placement', 'cluster', 'service', 'deployment', 'replicaset', 'pod', 'route'],
    subscription: null,
  },
  application: {
    app: {
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: {
        creationTimestamp: '2022-03-14T17:19:03Z',
        generation: 1,
        name: 'appset-helm',
        namespace: 'openshift-gitops',
        resourceVersion: '85929954',
      },
      status: {
        reconciledAt: '2022-03-14T17:19:03Z',
      },

      spec: {
        generators: [],
        template: {
          metadata: {
            name: 'appset-helm-{{name}}',
          },
          spec: {
            destination: { namespace: 'helm-appset', server: '{{server}}' },
            project: 'default',
            source: {
              chart: 'helloworld-helm',
              repoURL: 'https://raw.githubusercontent.com/fxiang1/app-samples/main',
              targetRevision: '0.2.0',
            },
          },
        },
      },
    },
    appSetApps: [
      {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: {
          creationTimestamp: '2022-03-14T17:19:03Z',
          finalizers: ['resources-finalizer.argocd.argoproj.io'],
          generation: 1623,
          name: 'appset-helm-local-cluster',
          namespace: 'openshift-gitops',
        },
      },
    ],
    name: 'appset-helm',
    namespace: 'openshift-gitops',
    metadata: {
      creationTimestamp: '2022-03-14T17:19:03Z',
      generation: 1,
      name: 'appset-helm',
      namespace: 'openshift-gitops',
      resourceVersion: '85929954',
    },
    appSetClusters: [
      {
        created: undefined,
        name: 'local-cluster',
        namespace: 'local-cluster',
        status: 'ok',
        url: 'https://mockdata.com:6443',
      },
    ],

    isAppSet: true,
    isArgoApp: false,
  },
  topology: {
    links: [],
    nodes: [],
  },
}

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

const mockSubscriptions = [mockSubscription1, mockSubscription2]
const mockChannels: Channel[] = [mockChannel0]

const mockPlacementrules: PlacementRule[] = [mockPlacementrule0]

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster0]

const mockArgoApplications: ArgoApplication[] = [mockArgoApplication0, mockArgoApplication1]

//////////////// Test /////////////////

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useParams: () => ({
    namespace: 'demo-etherpad',
    name: 'demo-etherpad',
  }),
}))

describe('Overview Tab', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('should display subscription app info without time window', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(channelsState, mockChannels)
          snapshot.set(placementRulesState, mockPlacementrules)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(argoApplicationsState, mockArgoApplications)
          snapshot.set(namespacesState, mockNamespaces)
        }}
      >
        <MemoryRouter>
          <ApplicationOverviewPageContent applicationData={mockApplicationDataSubscription} />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Name')
    // cluster
    await waitForText('Clusters')
    await waitForText('None')
    // created
    await waitForText('Mar 1 2022, 9:30 pm')

    // click show subscription details
    await clickByRole('button', {}, 1)

    await waitForText('Set time window')
  })

  test('should display subscription app info with time window', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(channelsState, mockChannels)
          snapshot.set(placementRulesState, mockPlacementrules)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(argoApplicationsState, mockArgoApplications)
          snapshot.set(namespacesState, mockNamespaces)
        }}
      >
        <MemoryRouter>
          <ApplicationOverviewPageContent applicationData={mockApplicationDataSubscriptionTimewindow} />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Name')
    // cluster
    await waitForText('Clusters')
    await waitForText('None')
    // created
    await waitForText('Mar 1 2022, 9:30 pm')

    // click show subscription details
    await clickByRole('button', {}, 1)
    await clickByText('blocked')
    await waitForText('Edit time window')
  })

  test('should display AppSet app info', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(channelsState, mockChannels)
          snapshot.set(placementRulesState, mockPlacementrules)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(argoApplicationsState, mockArgoApplications)
        }}
      >
        <MemoryRouter>
          <ApplicationOverviewPageContent applicationData={mockApplicationDataArgo} />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Name')
    // cluster
    await waitForText('Clusters')
    await waitForText('None')
    // created
    await waitForText(mockApplicationDataArgo.application.name, true)
  })
})
