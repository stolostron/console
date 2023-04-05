/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { namespacesState, subscriptionsState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import {
  IResource,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  PlacementDecision,
  PlacementDecisionApiVersion,
  PlacementDecisionKind,
  PlacementKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../resources'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { clickByTestId, waitForText } from '../../lib/test-util'
import {
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from './Application.sharedmocks'
import AdvancedConfiguration, { getPlacementDecisionClusterCount } from './AdvancedConfiguration'
import { PlacementApiVersion } from '../../wizards/common/resources/IPlacement'
import { ClusterCount } from './helpers/resource-helper'

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

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

const mockSubscriptions = [mockSubscription1, mockSubscription2]

function TestAdvancedConfigurationPage() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionsState, mockSubscriptions)
        snapshot.set(namespacesState, mockNamespaces)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.advancedConfiguration]}>
        <AdvancedConfiguration />
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

  test('should render the table with subscriptions', async () => {
    render(<TestAdvancedConfigurationPage />)
    await waitForText(mockSubscription1.metadata!.name!)
  })

  test('should click channel option', async () => {
    render(<TestAdvancedConfigurationPage />)
    await clickByTestId('channels')
  })

  test('should click placement option', async () => {
    render(<TestAdvancedConfigurationPage />)
    await clickByTestId('placements')
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
    const result = getPlacementDecisionClusterCount(resource, clusterCount, placementDecisions)
    expect(result).toEqual(expectedClusterCount)
  })

  it('should return the input clusterCount if no decisions found', () => {
    const clusterCount: ClusterCount = {
      localPlacement: false,
      remoteCount: 0,
    }
    const result = getPlacementDecisionClusterCount({} as IResource, clusterCount, [])
    expect(result).toEqual(clusterCount)
  })
})
