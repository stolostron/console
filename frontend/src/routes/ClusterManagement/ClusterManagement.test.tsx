import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { nockGet, mockNotFoundStatus } from '../../lib/nock-util'
import { FeatureGate } from '../../resources/feature-gate'
import ClusterManagementPage from './ClusterManagement'

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: {
        name: 'open-cluster-management-discovery',
    },
    spec: {
        featureSet: 'DiscoveryEnabled',
    },
}

describe('Cluster Management', () => {
    const Component = () => {
        return (
            <MemoryRouter>
                <ClusterManagementPage />
            </MemoryRouter>
        )
    }

    test('Discovery Feature Flag Enabled', async () => {
        sessionStorage.clear()
        const { getByText } = render(<Component />)
        nockGet(mockFeatureGate)
        await waitFor(() => expect(getByText('cluster:clusters')).toBeInTheDocument())
        await waitFor(() => expect(getByText('Provider Connections')).toBeInTheDocument())
        await waitFor(() => expect(getByText('Discovered Clusters')).toBeInTheDocument())
    })

    test('No Discovery Feature Flag', async () => {
        sessionStorage.clear()
        const nockScope = nockGet(mockFeatureGate, mockNotFoundStatus)
        const { getByText, queryByText } = render(<Component />)
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('cluster:clusters')).toBeInTheDocument())
        await waitFor(() => expect(getByText('Provider Connections')).toBeInTheDocument())
        await waitFor(() => expect(queryByText('Discovered Clusters')).toBeNull())
    })
})
