/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, policySetsState } from '../../../atoms'
import { nockIgnoreRBAC, nockGet } from '../../../lib/nock-util'
import { clickByText, typeByTestId, waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicySet } from './CreatePolicySet'
import { mockPolicySets, mockPolicy } from '../governance.sharedMocks'

describe('Create Policy Page', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockPolicySets)
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createPolicySet}`]}>
                    <Route path={NavigationPath.createPolicySet}>
                        <CreatePolicySet />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy set', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockGet(mockPolicySets[0])]

        // create form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // wait for nocks
        await waitForNocks(initialNocks)

        // step 1 -- name and namespace
        await typeByTestId('name', mockPolicySets[0].metadata.name)
        await typeByTestId('namespace', mockPolicySets[0].metadata.namespace)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item:first-of-type')?.click()
        await clickByText('Next')

        // step 2 -- select policies
    })
})
