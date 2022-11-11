/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    policiesState,
    namespacesState,
    managedClustersState,
    placementsState,
    placementRulesState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
} from '../../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicy } from './CreatePolicy'
import {
    mockClusterSet,
    mockClusterSetBinding,
    mockManagedClusters,
    mockNamespaces,
    mockPlacementBindings,
    mockPlacementRules,
    mockPlacements,
    mockPolicy,
} from '../governance.sharedMocks'
import userEvent from '@testing-library/user-event'

function TestCreatePolicyPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policiesState, mockPolicy)
                snapshot.set(namespacesState, mockNamespaces)
                snapshot.set(managedClustersState, mockManagedClusters)
                snapshot.set(placementsState, mockPlacements)
                snapshot.set(placementRulesState, mockPlacementRules)
                snapshot.set(managedClusterSetsState, [mockClusterSet])
                snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding])
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

describe('Create Policy Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
    })

    test('can create policy', async () => {
        // create form
        const { container } = render(<TestCreatePolicyPage />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- name and namespace
        userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'policy1')
        screen.getByText('Select namespace').click()
        userEvent.type(screen.getByRole('searchbox'), 'test')
        screen.getByRole('option', { name: 'test' }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 2 -- policy templates

        await waitForText('Templates')
        screen.getByRole('button', { name: 'Add policy template' }).click()
        screen.getByText('Namespace must exist').click()
        const configNameInput = screen.getByRole('textbox', { name: /name name/i })
        userEvent.type(configNameInput, '{selectall}test-policy-namespace')
        screen.getByRole('radio', { name: 'Delete If Created' }).click()
        userEvent.type(container.querySelector('#objectdefinition-spec-object-templates input')!, 'test')
        screen.getByRole('button', { name: 'Next' }).click()

        // step 3 -- placement

        await waitForText('How do you want to select clusters?')
        // check existing placements
        screen.getByRole('button', { name: 'Existing placement' }).click()
        screen.getByRole('button', { name: /options menu/i }).click()

        // new placement
        screen.getByRole('button', { name: 'New placement' }).click()
        screen.getByRole('button', { name: /action/i }).click()
        screen.getByText(/select the label/i).click()
        screen.getByRole('option', { name: /cloud/i }).click()
        screen.getByText(/select the values/i).click()
        screen.getByRole('checkbox', { name: /amazon/i }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 4 -- Policy annotations

        screen.getByRole('button', { name: 'Next' }).click()

        // step 5 -- Review and Submit

        expect(screen.getByRole('heading', { name: /details/i })).toBeInTheDocument()

        const policyNock = [
            nockCreate(mockPolicy[2], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPolicy[2]),
        ]

        const placementRuleNock = [
            nockCreate(mockPlacementRules[0], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPlacementRules[0]),
        ]

        const placementBindingNock = [
            nockCreate(mockPlacementBindings[0], undefined, 201, { dryRun: 'All' }), // DRY RUN
            nockCreate(mockPlacementBindings[0]),
        ]

        screen.getByRole('button', { name: 'Submit' }).click()
        await waitForNocks(policyNock)
        await waitForNocks(placementRuleNock)
        await waitForNocks(placementBindingNock)
    })

    test('can cancel create policy', async () => {
        render(<TestCreatePolicyPage />)
        await waitForText('Create policy')
        await clickByText('Cancel')
        await waitForNotText('Cancel')
    })
})
