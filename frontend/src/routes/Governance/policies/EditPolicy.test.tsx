/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, namespacesState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch } from '../../../lib/nock-util'
import { clickByText, waitForNotText, waitForText, waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { mockNamespaces, mockPolicy } from '../governance.sharedMocks'
import { EditPolicy } from './EditPolicy'

function TestEditPolicyPage() {
    const actualPath = NavigationPath.editPolicy
        .replace(':namespace', mockPolicy[0].metadata.namespace as string)
        .replace(':name', mockPolicy[0].metadata.name as string)
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policiesState, [mockPolicy[0]])
                snapshot.set(namespacesState, mockNamespaces)
            }}
        >
            <MemoryRouter initialEntries={[actualPath]}>
                <Switch>
                    <Route path={NavigationPath.editPolicy} render={() => <EditPolicy />} />
                </Switch>
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit Policy Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
    })

    test('can render Edit Policy Page', async () => {
        window.scrollBy = () => {}
        render(<TestEditPolicyPage />)
        await waitForText('Edit policy')

        // step 1 -- name and namespace
        screen.getByRole('button', { name: 'Next' }).click()

        // step 2 -- policy templates
        screen
            .getByRole('button', {
                name: /remove item/i,
            })
            .click()
        screen.getByRole('button', { name: 'Next' }).click()

        // step 3 -- placement
        screen.getByRole('button', { name: 'Next' }).click()

        // step 4 -- Policy annotations
        screen.getByRole('button', { name: 'Next' }).click()

        // step 5 -- Review and Submit

        const mockPolicyUpdate = [
            nockPatch(mockPolicy[0], [{ op: 'remove', path: '/spec/policy-templates/0' }], undefined, 204, {
                dryRun: 'All',
            }),
            nockPatch(mockPolicy[0], [{ op: 'remove', path: '/spec/policy-templates/0' }]),
        ]
        // const mockPolicyUpdate = nockPatch(mockPolicy[0], policyPatch)
        screen.getByRole('button', { name: 'Submit' }).click()
        await waitForNocks(mockPolicyUpdate)
    })

    test('can cancel edit policy', async () => {
        render(<TestEditPolicyPage />)
        await waitForText('Edit policy')
        await clickByText('Cancel')
        await waitForNotText('Cancel')
    })
})
