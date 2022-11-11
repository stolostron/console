/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClustersState, namespacesState, policiesState, policySetsState } from '../../../atoms'
import { nockIgnoreRBAC, nockCreate, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicySet } from './CreatePolicySet'
import {
    mockPolicySets,
    mockPolicy,
    mockNamespaces,
    mockPlacementRules,
    mockManagedClusters,
    mockPlacementBindings,
} from '../governance.sharedMocks'
import userEvent from '@testing-library/user-event'

function TestCreatePolicySet() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policySetsState, mockPolicySets)
                snapshot.set(namespacesState, [mockNamespaces[0]])
                snapshot.set(managedClustersState, mockManagedClusters)
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

describe('Create Policy Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
    })

    test('can create policy set', async () => {
        // create form
        render(<TestCreatePolicySet />)

        // step 1 -- name and namespace
        userEvent.type(screen.getByRole('textbox', { name: 'Name' }), mockPolicySets[1].metadata.name)
        screen.getByText('Select the namespace').click()
        userEvent.type(screen.getByRole('searchbox'), 'test')
        screen.getByRole('option', { name: 'test' }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 2 -- select policies
        screen.getByRole('checkbox', { name: /select row 0/i }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 3 -- placement

        await waitForText('How do you want to select clusters?')
        screen.getByRole('button', { name: 'New placement' }).click()
        screen.getByRole('button', { name: /action/i }).click()
        screen.getByText(/select the label/i).click()
        screen.getByRole('option', { name: /cloud/i }).click()
        screen.getByText(/select the values/i).click()
        screen.getByRole('checkbox', { name: /amazon/i }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 4 -- Review
        const policySetNock = [
            nockCreate(mockPolicySets[2], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPolicySets[2]),
        ]

        const placementRuleNock = [
            nockCreate(mockPlacementRules[1], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPlacementRules[1]),
        ]

        const placementBindingNock = [
            nockCreate(mockPlacementBindings[2], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPlacementBindings[2]),
        ]

        screen.getByRole('button', { name: 'Submit' }).click()
        await waitForNocks(policySetNock)
        await waitForNocks(placementRuleNock)
        await waitForNocks(placementBindingNock)
    })
})
