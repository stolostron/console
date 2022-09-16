/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { nockIgnoreRBAC, nockGet } from '../../../lib/nock-util'
import { clickByText, typeByTestId, waitForNocks, waitForSelector, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
// import { Policy } from '../../../resources'
import { CreatePolicy } from './CreatePolicy'
import { policyName, policyNamespace, mockEmptyPolicy, mockPolicy } from './Policy.sharedMocks'

describe('Create Policy Page', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createPolicy}`]}>
                    <Route path={NavigationPath.createPolicy}>
                        <CreatePolicy />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockGet(mockPolicy[0])]

        // create form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // wait for nocks
        await waitForNocks(initialNocks)

        // step 1 -- name and namespace
        await typeByTestId('name', policyName!)
        await typeByTestId('namespace', policyNamespace!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item:first-of-type')?.click()
        await clickByText('Next')

        // step 2 -- policy templates
        await waitForText('Templates')
        // await waitForText('Add policy template')
        await clickByText('Add policy template')
        await waitForText('Certificate management expiration')
        container.querySelector<HTMLButtonElement>('.pf-c-dropdown__menu-item:first-of-type')?.click()
        await waitForText('policy-certificate')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()
        // await clickByText('Next')

        // // step 3 -- placement
        await waitForText('How do you want to select clusters?')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()

        // // step 4 -- Policy annotations
        // await clickByText('Next')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()

        // // step 5 -- Review
        await waitForSelector(container, 'pf-c-description-list #details')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()
    })
})
