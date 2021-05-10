/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { waitForText } from '../../lib/test-util'
import ClusterManagementPage from './ClusterManagement'

describe('Cluster Management', () => {
    test('Discovery Feature Flag Enabled', async () => {
        render(
            <RecoilRoot>
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('cluster:clusters')
        await waitForText('cluster:clusters.discovered')
    })
})
