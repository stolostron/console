/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, namespacesState } from '../../../../atoms'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText, clickByLabel, clickByText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { mockNamespaces, mockPolicy } from '../../governance.sharedMocks'
import { PolicyDetailsPage } from './PolicyDetailsPage'

describe('Policy Details Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('Should render Policy Details Page content correctly', async () => {
        window.scrollBy = () => {}
        const rootPolicy = mockPolicy[0]
        const actualPath = NavigationPath.policyDetails
            .replace(':namespace', rootPolicy.metadata.namespace as string)
            .replace(':name', rootPolicy.metadata.name as string)
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, [rootPolicy])
                    snapshot.set(namespacesState, mockNamespaces)
                }}
            >
                <MemoryRouter initialEntries={[actualPath]}>
                    <Switch>
                        <Route path={NavigationPath.policyDetails} render={() => <PolicyDetailsPage />} />
                    </Switch>
                </MemoryRouter>
            </RecoilRoot>
        )
        // wait page load
        await waitForText('policy-set-with-1-placement-policy', true)
        await waitForText('Policy details')
        await waitForText('Results')
        await clickByText('Results')
        await clickByLabel('Actions')
        await waitForText('Add to policy set')
        await waitForText('Enable')
        await waitForText('Disable')
        await waitForText('Inform')
        await waitForText('Enforce')
        await waitForText('Edit')
        await waitForText('Delete')
    })

    test('Should render Policy Details Page content has the known External Managers correctly', async () => {
        window.scrollBy = () => {}
        const rootPolicy = mockPolicy[0]
        const rootPolicyExternal = JSON.parse(JSON.stringify(rootPolicy))
        rootPolicyExternal.metadata.managedFields = []
        rootPolicyExternal.metadata.managedFields[0] = { manager: 'argocd-application-controller' }
        const actualPathExternal = NavigationPath.policyDetails
            .replace(':namespace', rootPolicyExternal.metadata.namespace as string)
            .replace(':name', rootPolicyExternal.metadata.name as string)
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, [rootPolicyExternal])
                    snapshot.set(namespacesState, mockNamespaces)
                }}
            >
                <MemoryRouter initialEntries={[actualPathExternal]}>
                    <Switch>
                        <Route path={NavigationPath.policyDetails} render={() => <PolicyDetailsPage />} />
                    </Switch>
                </MemoryRouter>
            </RecoilRoot>
        )
        // wait page load
        await waitForText('policy-set-with-1-placement-policy', true)
        await waitForText('Managed externally')
        await waitForText('Policy details')
        await waitForText('Results')
        await clickByText('Results')
        await clickByLabel('Actions')
        await waitForText('Add to policy set')
        await waitForText('Enable')
        await waitForText('Disable')
        await waitForText('Inform')
        await waitForText('Enforce')
        await waitForText('Edit')
        await waitForText('Delete')
    })
})
