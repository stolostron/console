/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    policiesState,
    namespacesState,
    placementsState,
    placementRulesState,
    managedClustersState,
} from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicy } from './CreatePolicy'
import { mockPolicy } from '../governance.sharedMocks'
import { ManagedCluster, Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources'
import userEvent from '@testing-library/user-event'

const namespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'test',
    },
}

const mockLocalCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'Amazon',
            name: 'local-cluster',
            openshiftVersion: '4.9.7',
            vendor: 'OpenShift',
        },
        name: 'local-cluster',
    },
}

const mockManagedClusters: ManagedCluster[] = [mockLocalCluster]

function TestCreatePolicyPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(placementsState, [])
                snapshot.set(placementRulesState, [])
                snapshot.set(policiesState, mockPolicy)
                snapshot.set(namespacesState, [namespace])
                snapshot.set(managedClustersState, mockManagedClusters)
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

        // // step 3 -- placement

        await waitForText('How do you want to select clusters?')
        screen.getByRole('button', { name: 'New placement' }).click()
        screen.getByRole('button', { name: /action/i }).click()
        screen.getByText(/select the label/i).click()
        screen.getByRole('option', { name: /cloud/i }).click()
        screen.getByText(/select the values/i).click()
        screen.getByRole('checkbox', { name: /amazon/i }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // // // step 4 -- Policy annotations

        screen.getByRole('button', { name: 'Next' }).click()

        // // // step 5 -- Review and Submit

        expect(screen.getByRole('heading', { name: /details/i })).toBeInTheDocument()

        // const createNock = [nockCreate(mockPolicy[2])]
        // screen.getByRole('button', { name: 'Submit' }).click()
        // await waitForNocks(createNock)
    })

    test('can cancel create policy', async () => {
        render(<TestCreatePolicyPage />)
        await waitForText('Create policy')
        await clickByText('Cancel')
        await waitForNotText('Cancel')
    })
})
