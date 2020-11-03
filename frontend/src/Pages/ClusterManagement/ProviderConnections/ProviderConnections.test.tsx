import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockList } from '../../../lib/nock-util'
import { ProviderConnection, providerConnections } from '../../../lib/ProviderConnection'
import { ProviderConnectionsPage } from './ProviderConnections'

test('provider connections page', async () => {
    const providerConnectionsMock: ProviderConnection[] = [
        {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: { name: 'provider-connection-name' },
        },
    ]

    nockList(providerConnections.apiPath, providerConnections.plural, providerConnectionsMock, [
        'cluster.open-cluster-management.io/cloudconnection=',
    ])

    const { getByText } = render(
        <MemoryRouter>
            <ProviderConnectionsPage />
        </MemoryRouter>
    )

    await waitFor(() => expect(getByText(providerConnectionsMock[0].metadata!.name!)).toBeInTheDocument())

    expect(getByText(providerConnectionsMock[0].metadata!.name!)).toBeInTheDocument()
})
