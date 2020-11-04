import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockDelete, nockList } from '../../../lib/nock-util'
import { ProviderConnection, providerConnections } from '../../../lib/ProviderConnection'
import { ProviderConnectionsPage } from './ProviderConnections'

const mockProviderConnection: ProviderConnection = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: { name: 'provider-connection-name', namespace: 'provider-connection-namespace' },
}

const mockProviderConnections = [mockProviderConnection]

test('provider connections page renders table with provider connections', async () => {
    nockList(providerConnections, mockProviderConnections, ['cluster.open-cluster-management.io/cloudconnection='])
    const { getByText } = render(
        <MemoryRouter>
            <ProviderConnectionsPage />
        </MemoryRouter>
    )
    await waitFor(() => expect(getByText(mockProviderConnection.metadata!.name!)).toBeInTheDocument())
    expect(getByText(mockProviderConnection.metadata!.namespace!)).toBeInTheDocument()
})

test('provider connections page delete provider connection', async () => {
    nockList(providerConnections, mockProviderConnections, ['cluster.open-cluster-management.io/cloudconnection='])
    const deleteNock = nockDelete(providerConnections, mockProviderConnection)
    const { getByText, getAllByLabelText } = render(
        <MemoryRouter>
            <ProviderConnectionsPage />
        </MemoryRouter>
    )
    await waitFor(() => expect(getByText(mockProviderConnection.metadata!.name!)).toBeInTheDocument())
    userEvent.click(getAllByLabelText('Actions')[0])
    userEvent.click(getByText('delete'))
    userEvent.click(getByText('Confirm'))
    await waitFor(() => expect(deleteNock.isDone()).toBeTruthy())
})
