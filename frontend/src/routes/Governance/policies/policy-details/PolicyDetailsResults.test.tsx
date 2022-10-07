/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../../atoms'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import PolicyDetailsResults from './PolicyDetailsResults'
import { mockPolicy } from '../../governance.sharedMocks'

describe('Policy Details Results', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })
    test('Should render Policy Details Results Page content correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <PolicyDetailsResults policy={mockPolicy[0]} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // wait page load
        await waitForText('Clusters')

        // wait for table cells to load correctly
        await waitForText('local-cluster')
        await waitForText('Without violations')
        await waitForText('policy-set-with-1-placement-policy-1', true)
        await waitForText(
            'notification - namespaces [test] found as specified, therefore this Object template is compliant'
        )
    })
})
