/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { providerConnectionsState } from '../../../atoms'
import { mockBadRequestStatus, nockRBAC, nockDelete, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
    clickByLabel,
    clickByRole,
    clickByText,
    waitForNock,
    waitForNocks,
    waitForNotText,
    waitForText,
} from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import { ResourceAttributes } from '../../../resources/self-subject-access-review'
import ProviderConnectionsPage from './ProviderConnections'

const mockProviderConnection1: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: { name: 'provider-connection-1', namespace: 'provider-connection-namespace' },
}

const mockProviderConnection2: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: { name: 'provider-connection-2', namespace: 'provider-connection-namespace' },
}

const mockProviderConnections = [mockProviderConnection1, mockProviderConnection2]
let testLocation: Location

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

function TestProviderConnectionsPage(props: { providerConnections: ProviderConnection[] }) {
    return (
        <RecoilRoot initializeState={(snapshot) => snapshot.set(providerConnectionsState, props.providerConnections)}>
            <MemoryRouter initialEntries={[NavigationPath.providerConnections]}>
                <Route
                    path={NavigationPath.providerConnections}
                    render={(props: any) => {
                        testLocation = props.location
                        return <ProviderConnectionsPage {...props} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('provider connections page', () => {
    beforeEach(nockIgnoreRBAC)

    test('should render the table with provider connections', async () => {
        render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))
    })

    test('should goto the edit connection page', async () => {
        render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))
        await clickByText('edit')
        await waitFor(() =>
            expect(testLocation.pathname).toEqual(
                NavigationPath.editConnection
                    .replace(':namespace', mockProviderConnection1.metadata.namespace!)
                    .replace(':name', mockProviderConnection1.metadata.name!)
            )
        )
    })

    test('should be able to delete a provider connection', async () => {
        const deleteNock = nockDelete(mockProviderConnection1)
        render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await clickByText('delete')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
    })

    test('should show error if delete a provider connection fails', async () => {
        const badRequestStatus = nockDelete(mockProviderConnection1, mockBadRequestStatus)
        render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await clickByText('delete')
        await clickByText('common:delete')
        await waitForNock(badRequestStatus)
        await waitForText(`Could not process request because of invalid data.`)
    })

    test('should be able to cancel delete a provider connection', async () => {
        render(<TestProviderConnectionsPage providerConnections={mockProviderConnections} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await clickByText('delete')
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
    })

    test('should be able to bulk delete provider connections', async () => {
        const deleteNock = nockDelete(mockProviderConnection1)
        render(<TestProviderConnectionsPage providerConnections={[mockProviderConnection1]} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByRole('checkbox', 1) // Select first item
        await clickByText('delete.batch')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
    })

    test('should be able to cancel bulk delete provider connections', async () => {
        render(<TestProviderConnectionsPage providerConnections={[mockProviderConnection1]} />)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByRole('checkbox', 1) // Select all
        await clickByText('delete.batch')
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
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
