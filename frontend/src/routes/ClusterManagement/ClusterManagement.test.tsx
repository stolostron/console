import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { FeatureGate } from '../../resources/feature-gate'
import ClusterManagementPage from './ClusterManagement'
import { AppContext } from '../../components/AppContext'

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
    test('Discovery Feature Flag Enabled', async () => {
        render(
            <AppContext.Provider
                value={{
                    featureGates: { 'open-cluster-management-discovery': mockFeatureGate },
                    clusterManagementAddons: [],
                }}
            >
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </AppContext.Provider>
        )
        await waitFor(() => expect(screen.getByText('cluster:clusters')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('connection:connections')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('cluster:clusters.discovered')).toBeInTheDocument())
    })

    test('No Discovery Feature Flag', async () => {
        render(
            <AppContext.Provider
                value={{
                    featureGates: {},
                    clusterManagementAddons: [],
                }}
            >
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </AppContext.Provider>
        )
        await waitFor(() => expect(screen.getByText('cluster:clusters')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('connection:connections')).toBeInTheDocument())
        await waitFor(() => expect(screen.queryByText('cluster:clusters.discovered')).toBeNull())
    })
})
