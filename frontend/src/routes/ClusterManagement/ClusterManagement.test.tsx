/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AppContext } from '../../components/AppContext'
import { waitForNotText, waitForText } from '../../lib/test-util'
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
        await waitForText('cluster:clusters')
        await waitForText('cluster:clusters.discovered')
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
        await waitForText('cluster:clusters')
        await waitForNotText('cluster:clusters.discovered')
    })
})
