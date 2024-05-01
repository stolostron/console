/* Copyright Contributors to the Open Cluster Management project */
import { Provider } from '../../ui-components'
import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { discoveryConfigState, secretsState } from '../../atoms'
import { mockBadRequestStatus, nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC, nockRBAC } from '../../lib/nock-util'
import {
  clickBulkAction,
  clickByLabel,
  clickByText,
  selectTableRow,
  waitForNock,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import {
  DiscoveryConfig,
  DiscoveryConfigApiVersion,
  DiscoveryConfigKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  ResourceAttributes,
  Secret,
} from '../../resources'
import CredentialsPage from './CredentialsPage'

const mockProviderConnection1: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'provider-connection-1',
    namespace: 'provider-connection-namespace',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  type: 'Opaque',
}

const mockProviderConnection2: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'provider-connection-2',
    namespace: 'provider-connection-namespace',
    labels: {
      'cluster.open-cluster-management.io/type': '',
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  type: 'Opaque',
}

const cloudRedHatProviderConnection: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'ocm-api-token',
    namespace: 'ocm',
    labels: {
      'cluster.open-cluster-management.io/type': Provider.redhatcloud,
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  type: 'Opaque',
}

const discoveryConfig: DiscoveryConfig = {
  apiVersion: DiscoveryConfigApiVersion,
  kind: DiscoveryConfigKind,
  metadata: {
    name: 'discovery',
    namespace: 'ocm',
  },
  spec: {
    filters: {
      lastActive: 7,
      openShiftVersions: ['4.6'],
    },
    credential: 'ocm-api-token',
  },
}

const mockProviderConnections = [mockProviderConnection1, mockProviderConnection2]

function getPatchSecretResourceAttributes(name: string, namespace: string) {
  return {
    name,
    namespace,
    resource: 'secrets',
    verb: 'patch',
    group: '',
  } as ResourceAttributes
}

function getDeleteSecretResourceAttributes(name: string, namespace: string) {
  return {
    name,
    namespace,
    resource: 'secrets',
    verb: 'delete',
    group: '',
  } as ResourceAttributes
}

function TestProviderConnectionsPage(props: {
  providerConnections: ProviderConnection[]
  discoveryConfigs?: DiscoveryConfig[]
}) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, props.providerConnections as Secret[])
        snapshot.set(discoveryConfigState, props.discoveryConfigs || [])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.credentials]}>
        <Routes>
          <Route path={NavigationPath.credentials} element={<CredentialsPage />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('provider connections page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render the table with provider connections', async () => {
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
  })

  test('should goto the edit connection page', async () => {
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await clickByLabel('Actions', 0) // Click the action button on the first table row
    await clickByText('Edit credential')
    // Verify the information shows up
    await waitForText('Red Hat Ansible Automation Platform')
    await waitForText(mockProviderConnection1.metadata!.name!)
    await waitForText(mockProviderConnection1.metadata!.namespace!, true)
  })

  test('should be able to delete a provider connection', async () => {
    const deleteNock = nockDelete(mockProviderConnection1)
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await clickByLabel('Actions', 0) // Click the action button on the first table row
    await clickByText('Delete credential')
    await clickByText('Delete')
    await waitForNock(deleteNock)
  })

  test('should show error if delete a provider connection fails', async () => {
    const badRequestStatus = nockDelete(mockProviderConnection1, mockBadRequestStatus)
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await clickByLabel('Actions', 0) // Click the action button on the first table row
    await clickByText('Delete credential')
    await clickByText('Delete')
    await waitForNock(badRequestStatus)
    await waitForText(`Could not process request because of invalid data.`)
  })

  test('should be able to cancel delete a provider connection', async () => {
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await clickByLabel('Actions', 0) // Click the action button on the first table row
    await clickByText('Delete credential')
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })

  test('should be able to bulk delete provider connections', async () => {
    const deleteNock = nockDelete(mockProviderConnection1)
    render(<TestProviderConnectionsPage providerConnections={[mockProviderConnection1]} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await selectTableRow(1)
    await clickBulkAction('Delete credentials')
    await clickByText('Delete')
    await waitForNock(deleteNock)
  })

  test('should be able to cancel bulk delete provider connections', async () => {
    render(<TestProviderConnectionsPage providerConnections={[mockProviderConnection1]} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await selectTableRow(1)
    await clickBulkAction('Delete credentials')
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })

  test('If console.redhat.com credential and no discoveryconfig configured, show action available', async () => {
    render(<TestProviderConnectionsPage providerConnections={[cloudRedHatProviderConnection]} />)
    await waitForText(cloudRedHatProviderConnection.metadata!.name!)
    await waitForText('Create cluster discovery')
  })

  test('If console.redhat.com providerconnection and discoveryconfig configured, do not show action available', async () => {
    render(
      <TestProviderConnectionsPage
        providerConnections={[cloudRedHatProviderConnection]}
        discoveryConfigs={[discoveryConfig]}
      />
    )
    await waitForText(cloudRedHatProviderConnection.metadata!.name!)
    await waitForText('Configure cluster discovery')
  })
})

describe('provider connections page RBAC', () => {
  test('should check rbac on row action menu', async () => {
    const rbacNocks: Scope[] = [
      nockRBAC(getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')),
      nockRBAC(getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')),
    ]
    render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
    await waitForText(mockProviderConnection1.metadata!.name!)
    await clickByLabel('Actions', 0) // Click the action button on the first table row
    await waitForNocks(rbacNocks)
  })
})
