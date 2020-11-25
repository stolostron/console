import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import CreateClusterPage from './CreateCluster'

test('Create Cluster Page', async () => {
    const { getByText } = render(
        <MemoryRouter>
            <CreateClusterPage />
        </MemoryRouter>
    )
    await waitFor(() => expect(getByText('managed.createCluster')).toBeInTheDocument())
})
