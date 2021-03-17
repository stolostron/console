/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { waitForNotText, waitForText } from '../../lib/test-util'
import ClusterManagementPage from './ClusterManagement'
import { mockDiscoveryFeatureGate } from '../../lib/test-metadata'
import { featureGatesState } from '../../atoms'

describe('Cluster Management', () => {
    test('Discovery Feature Flag Enabled', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(featureGatesState, [mockDiscoveryFeatureGate])
                }}
            >
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('cluster:clusters')
        await waitForText('cluster:clusters.discovered')
    })

    test('No Discovery Feature Flag', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(featureGatesState, [])
                }}
            >
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('cluster:clusters')
        await waitForNotText('cluster:clusters.discovered')
    })
})
