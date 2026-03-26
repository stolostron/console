/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  applicationsState,
  channelsState,
  managedClustersState,
  namespacesState,
  placementDecisionsState,
  placementRulesState,
  settingsState,
  subscriptionsState,
} from '../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import {
  clickByLabel,
  clickByTestId,
  clickByText,
  getCSVDownloadLink,
  getCSVExportSpies,
  waitForText,
} from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import {
  Application,
  ApplicationApiVersion,
  ApplicationKind,
  Channel,
  ChannelApiVersion,
  ChannelKind,
  IResource,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  PlacementDecision,
  PlacementDecisionApiVersion,
  PlacementDecisionKind,
  PlacementKind,
  PlacementRule,
  PlacementRuleKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../resources'
import { PlacementApiVersion } from '../../wizards/common/resources/IPlacement'
import AdvancedConfiguration, { getPlacementDecisionClusterCount } from './AdvancedConfiguration'
import {
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from './Application.sharedmocks'
import { ApplicationToggleOptions } from './components/ToggleSelector'
import { ClusterCount } from './helpers/resource-helper'

const mockSubscription1: Subscription = {
  kind: SubscriptionKind,
  apiVersion: SubscriptionApiVersion,
  metadata: {
    name: 'helloworld-simple-subscription-1',
    namespace: 'helloworld-simple-ns',
    uid: 'fd3dfc08-5d41-4449-b450-527bebc2509d',
    creationTimestamp: '2026-07-30T03:18:48Z',
  },
  spec: {
    channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    placement: {
      placementRef: {
        kind: 'PlacementRule',
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
    creationTimestamp: '2026-07-30T03:18:48Z',
  },
  spec: {
    channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    placement: {
      placementRef: {
        kind: 'PlacementRule',
        name: 'helloworld-simple-placement-2',
      },
    },
  },
}

const mockSubscription3: Subscription = {
  kind: SubscriptionKind,
  apiVersion: SubscriptionApiVersion,
  metadata: {
    name: 'helloworld-simple-subscription-3',
    namespace: 'helloworld-simple-ns',
    uid: 'fd3dfc08-5d41-4449-b450-527bebc2509k',
    creationTimestamp: '2026-07-30T03:18:48Z',
  },
  spec: {
    channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    placement: {
      placementRef: {
        kind: 'Placement',
        name: 'helloworld-simple-placement-3',
      },
    },
    timewindow: {
      windowtype: 'active',
      daysofweek: [],
      location: '',
      hours: [],
    },
  },
}

const mockChannel: Channel = {
  kind: ChannelKind,
  apiVersion: ChannelApiVersion,
  metadata: {
    name: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
    namespace: 'default',
    creationTimestamp: '2024-06-28T03:18:48Z',
  },
  spec: {
    pathname: 'https://www.github.com/randy424',
    type: 'Git',
  },
}

const mockPlacementDecision: PlacementDecision = {
  apiVersion: PlacementDecisionApiVersion,
  kind: PlacementDecisionKind,
  metadata: {
    labels: {
      'cluster.open-cluster-management.io/placement': 'helloworld-simple-placement-3',
    },
    creationTimestamp: '2024-06-28T03:18:48Z',
    ownerReferences: [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        blockOwnerDeletion: true,
        controller: true,
        kind: 'Placement',
        name: 'helloworld-simple-placement-3',
        uid: 'c813a683-baff-4897-abe7-491d84d6189a',
      },
    ],
  },
  status: {
    decisions: [
      {
        clusterName: 'local-cluster',
        reason: '',
      },
      {
        clusterName: 'remote-cluster-2',
        reason: '',
      },
    ],
  },
}

const mockApplication: Application = {
  kind: ApplicationKind,
  apiVersion: ApplicationApiVersion,
  metadata: {
    name: 'helloworld-application-3',
    namespace: 'helloworld-simple-ns',
    annotations: {
      'apps.open-cluster-management.io/subscriptions': 'helloworld-simple-ns/helloworld-simple-subscription-3',
    },
    creationTimestamp: '2024-06-28T03:18:48Z',
  },
  spec: {
    componentKinds: [
      {
        group: '',
        kind: '',
      },
    ],
  },
}

const placementRule: PlacementRule = {
  kind: PlacementRuleKind,
  apiVersion: 'apps.open-cluster-management.io/v1',
  metadata: {
    name: 'test-placementRule',
    namespace: 'default',
    labels: {
      app: 'helloworld-application-3',
    },
    creationTimestamp: '2024-06-28T03:18:48Z',
  },
  spec: {
    clusterSelector: {
      matchLabels: {
        environment: 'Dev',
      },
    },
    clusterReplicas: 1,
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

const hubCluster: ManagedCluster = {
  kind: ManagedClusterKind,
  apiVersion: ManagedClusterApiVersion,
  metadata: {
    name: 'local-cluster',
    namespace: 'local-cluster',
    labels: {
      'local-cluster': 'true',
    },
  },
}

const placementDecisions: PlacementDecision[] = [mockPlacementDecision]
const placementRules: PlacementRule[] = [placementRule]

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

const mockSubscriptions = [mockSubscription1, mockSubscription2, mockSubscription3]
const mockChannels = [mockChannel]
const mockApplications = [mockApplication]
const mockClusters = [hubCluster]

function TestAdvancedConfigurationPage(props: { defaultToggleOption?: ApplicationToggleOptions }) {
  const defaultToggle = props.defaultToggleOption
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionsState, mockSubscriptions)
        snapshot.set(namespacesState, mockNamespaces)
        snapshot.set(channelsState, mockChannels)
        snapshot.set(placementDecisionsState, placementDecisions)
        snapshot.set(applicationsState, mockApplications)
        snapshot.set(placementRulesState, placementRules)
        snapshot.set(managedClustersState, mockClusters)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.advancedConfiguration]}>
        <AdvancedConfiguration defaultToggleOption={defaultToggle} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('advanced configuration page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
    nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  })

  test('should render deprecation Alert', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, {
            enhancedPlacement: 'enabled',
          })
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.advancedConfiguration]}>
          <AdvancedConfiguration />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText(
      'This page will be removed in a future release. Placements will move to a central location under Infrastructure > Clusters > Placements. You can also view placement details directly within individual applications or policies.'
    )
  })

  test('should render the table with subscriptions', async () => {
    render(<TestAdvancedConfigurationPage />)
    await waitForText(mockSubscription1.metadata!.name!)
  })

  test('should click channel option', async () => {
    render(<TestAdvancedConfigurationPage />)
    await clickByTestId('channels')
  })

  test('should click placement rule option', async () => {
    render(<TestAdvancedConfigurationPage />)
    await clickByTestId('placementrules')
  })
})

describe('getPlacementDecisionClusterCount', () => {
  const resource: IResource = {
    kind: PlacementKind,
    apiVersion: PlacementApiVersion,
    metadata: {
      name: 'test-placement',
    },
    status: {
      decisions: [
        {
          clusterName: 'local-cluster',
          clusterNamespace: 'local-cluster',
        },
        {
          clusterName: 'remote-cluster-1',
          clusterNamespace: 'default',
        },
      ],
    },
  }

  const placementDecisions: PlacementDecision[] = [
    {
      apiVersion: PlacementDecisionApiVersion,
      kind: PlacementDecisionKind,
      metadata: {
        labels: {
          'cluster.open-cluster-management.io/placement': 'test-placement',
        },
      },
      status: {
        decisions: [
          {
            clusterName: 'local-cluster',
            reason: '',
          },
          {
            clusterName: 'remote-cluster-2',
            reason: '',
          },
        ],
      },
    },
  ]

  it('should count local and remote placement correctly', () => {
    const clusterCount: ClusterCount = {
      localPlacement: false,
      remoteCount: 0,
    }
    const expectedClusterCount: ClusterCount = {
      localPlacement: true,
      remoteCount: 1,
    }
    const result = getPlacementDecisionClusterCount(resource, clusterCount, placementDecisions, 'local-cluster')
    expect(result).toEqual(expectedClusterCount)
  })

  it('should return the input clusterCount if no decisions found', () => {
    const clusterCount: ClusterCount = {
      localPlacement: false,
      remoteCount: 0,
    }
    const result = getPlacementDecisionClusterCount({} as IResource, clusterCount, [], 'local-cluster')
    expect(result).toEqual(clusterCount)
  })
})

describe('Export from application tables', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
    nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()
  })

  test('export button should produce a file for download for subscriptions', async () => {
    render(<TestAdvancedConfigurationPage defaultToggleOption="subscriptions" />)
    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    // download for subscriptions
    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Namespace,Channel,Applications,Clusters,Time window,Created\n' +
          '"helloworld-simple-subscription-1","helloworld-simple-ns","ggithubcom-app-samples",-,"None",-,"2026-07-30T03:18:48.000Z"\n' +
          '"helloworld-simple-subscription-2","helloworld-simple-ns","ggithubcom-app-samples",-,"None",-,"2026-07-30T03:18:48.000Z"\n' +
          '"helloworld-simple-subscription-3","helloworld-simple-ns","ggithubcom-app-samples","1","1 Remote, 1 Local","Active","2026-07-30T03:18:48.000Z"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(
      /^applicationadvancedconfiguration-subscriptions-[\d]+\.csv$/
    )
  })

  test('export button should produce a file for download for channels', async () => {
    render(<TestAdvancedConfigurationPage defaultToggleOption="channels" />)
    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    //download for channels
    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Namespace,Type,Subscriptions,Clusters,Created\n' +
          '"ggithubcom-app-samples-ns/ggithubcom-app-samples","default","Git",-,"None","2024-06-28T03:18:48.000Z"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(
      /^applicationadvancedconfiguration-channels-[\d]+\.csv$/
    )
  })

  test('export button should produce a file for download for placement rules', async () => {
    render(<TestAdvancedConfigurationPage defaultToggleOption="placementrules" />)
    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    //download for placementrules
    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Namespace,Clusters,Replicas,Created\n"test-placementRule","default","Local","1","2024-06-28T03:18:48.000Z"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(
      /^applicationadvancedconfiguration-placementrules-[\d]+\.csv$/
    )
  })
})
