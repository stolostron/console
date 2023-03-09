/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  Secret,
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../../resources'
import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { mockBadRequestStatus, nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
  clickBulkAction,
  clickByLabel,
  clickByText,
  selectTableRow,
  waitForNock,
  waitForNotText,
  waitForText,
} from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import AnsibleAutomationsPage from './AnsibleAutomations'

const mockAnsibleConnection1: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'ansible-connection-1',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
    },
  },
  type: 'Opaque',
}

const mockAnsibleConnection2: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'ansible-connection-3',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
    },
  },
  type: 'Opaque',
}

const mockAnsibleConnection3: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'ansible-connection-3',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
    },
  },
  type: 'Opaque',
}

const clusterCurator1: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator1',
    namespace: 'default',
  },
  spec: {
    install: {
      towerAuthSecret: 'ansible-credential-i',
      prehook: [
        {
          name: 'test-job-i',
        },
      ],
    },
  },
}

const clusterCurator2: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator2',
    namespace: 'default',
  },
  spec: {
    install: {
      prehook: [
        {
          name: 'test-job-i',
        },
      ],
    },
  },
}

const subscriptionOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'ansible-automation-platform-operator',
    namespace: 'ansible-automation-platform-operator',
  },
  status: {
    conditions: [
      {
        reason: 'AllCatalogSourcesHealthy',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'False',
      },
    ],
  },
  spec: {},
}

const clusterCurators = [clusterCurator1, clusterCurator2]
const mockProviderConnections = [mockAnsibleConnection1, mockAnsibleConnection2, mockAnsibleConnection3]
const mockSubscription = [subscriptionOperator]
let testLocation: Location

function TestIntegrationPage(props: {
  providerConnections: ProviderConnection[]
  clusterCurators?: ClusterCurator[]
  subscriptions?: SubscriptionOperator[]
}) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, props.providerConnections as Secret[])
        snapshot.set(clusterCuratorsState, props.clusterCurators || [])
        snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.ansibleAutomations]}>
        <Route
          path={NavigationPath.ansibleAutomations}
          render={(props: any) => {
            testLocation = props.location
            return <AnsibleAutomationsPage />
          }}
        />
      </MemoryRouter>
    </RecoilRoot>
  )
}

function EmptyStateAutomationPage(props: { providerConnections: ProviderConnection[] }) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, props.providerConnections as Secret[])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.ansibleAutomations]}>
        <Route
          path={NavigationPath.ansibleAutomations}
          render={(props: any) => {
            testLocation = props.location
            return <AnsibleAutomationsPage />
          }}
        />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('automation page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render emptyState', async () => {
    render(<EmptyStateAutomationPage providerConnections={mockProviderConnections} />)
    await waitForText("You don't have any automation templates")
    await screen.getByRole('link', { name: /create automation template/i })
  })

  test('should render the table with templates', async () => {
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator1.metadata!.name!)
    await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.ansibleAutomations))
  })

  test('should be able to delete a template', async () => {
    const deleteNock = nockDelete(clusterCurator2)
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator2.metadata!.name!)
    await clickByLabel('Actions', 1) // Click the action button on the first table row
    await clickByText('Delete')
    await clickByText('Delete')
    await waitForNock(deleteNock)
  })

  test('should show error if delete a template fails', async () => {
    const badRequestStatus = nockDelete(clusterCurator2, mockBadRequestStatus)
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator2.metadata!.name!)
    await clickByLabel('Actions', 1) // Click the action button on the first table row
    await clickByText('Delete')
    await clickByText('Delete')
    await waitForNock(badRequestStatus)
    await waitForText(`Could not process request because of invalid data.`)
  })

  test('should be able to cancel delete a template', async () => {
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator2.metadata!.name!)
    await clickByLabel('Actions', 1) // Click the action button on the first table row
    await clickByText('Delete')
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })

  test('should be able to bulk delete templates', async () => {
    const deleteNock1 = nockDelete(clusterCurator2)
    const deleteNock2 = nockDelete(clusterCurator1)
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator1.metadata!.name!)
    await selectTableRow(1)
    await clickBulkAction('Delete templates')
    await waitForText(
      'This action will delete automation templates and will unlink any associated Ansible credential. Are you sure that you want to continue?'
    )
    await clickByText('Delete')
    await waitForNock(deleteNock1)
    await waitForNock(deleteNock2)
  })

  test('should be able to cancel bulk delete templates', async () => {
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator1.metadata!.name!)
    await selectTableRow(1)
    await clickBulkAction('Delete templates')
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })

  test('should render hint when ansible operator is not installed', async () => {
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator1.metadata!.name!)
    await waitForText('Install the operator')
  })

  test('should not render hint when ansible operator is installed', async () => {
    render(
      <TestIntegrationPage
        providerConnections={mockProviderConnections}
        clusterCurators={clusterCurators}
        subscriptions={mockSubscription}
      />
    )
    await waitForText(clusterCurator1.metadata!.name!)
    await waitForNotText('Install the operator')
  })
})
