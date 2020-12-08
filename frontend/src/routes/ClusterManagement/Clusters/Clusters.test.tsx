import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList } from '../../../lib/nock-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources/managed-cluster'
import ClustersPage from './Clusters'

const mockManagedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-namespace' },
    spec: { hubAcceptsClient: true },
}

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster]

test.skip('Clusters Page', async () => {
    nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, mockManagedClusters)
    const { getByText } = render(
        <MemoryRouter>
            <ClustersPage />
        </MemoryRouter>
    )
    await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
})
