/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { namespacesState, subscriptionsState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import {
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../resources'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { clickByTestId, waitForText } from '../../lib/test-util'
import ApplicationsPage from './ApplicationsPage'
import {
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from './Application.sharedmocks'

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
        <ApplicationsPage />
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
