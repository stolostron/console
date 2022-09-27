/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, secretsState } from '../../../atoms'
import { nockIgnoreRBAC, nockGet } from '../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicyAutomation } from './CreatePolicyAutomation'
import { mockEmptyPolicy, mockPolicy, mockSecret } from '../governance.sharedMocks'

describe('Create Policy Automation Wizard', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                    snapshot.set(secretsState, [mockSecret])
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createPolicyAutomation}`]}>
                    <Route path={NavigationPath.createPolicyAutomation}>
                        <CreatePolicyAutomation />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy automation', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockGet(mockPolicy[0])]

        // create form
        render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // wait for nocks
        await waitForNocks(initialNocks)

        // step 1 -- name and namespace
        await waitForText('Create policy automation')
    })
})
