/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import ClusterManagementPage from './Clusters'

describe('Cluster Management', () => {
    test('Discovery Feature Flag Enabled', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot>
                <MemoryRouter>
                    <ClusterManagementPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('Managed clusters')
        await waitForText('Discovered clusters')
    })
})
