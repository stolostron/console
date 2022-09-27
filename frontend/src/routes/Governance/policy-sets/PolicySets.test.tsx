/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import PolicySetsPage from './PolicySets'
import { mockEmptyPolicySet, mockPolicySet } from '../governance.sharedMocks'

describe('PolicySets Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })
    test('Should render empty PolicySet page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockEmptyPolicySet)
                }}
            >
                <MemoryRouter>
                    <PolicySetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText("You don't have any policy sets")
    })

    test('Should render PolicySet page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockPolicySet)
                }}
            >
                <MemoryRouter>
                    <PolicySetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText(mockPolicySet[0].metadata.name!)
    })
})
