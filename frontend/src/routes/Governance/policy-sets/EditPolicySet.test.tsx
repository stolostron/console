/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { namespacesState, policySetsState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicySet } from './EditPolicySet'
import { mockPolicySets, mockPolicy, mockNamespaces } from '../governance.sharedMocks'

function EditPolicySetTest() {
    const actualPath = NavigationPath.editPolicySet
        .replace(':namespace', mockPolicy[0].metadata.namespace as string)
        .replace(':name', mockPolicy[0].metadata.name as string)
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policySetsState, [mockPolicySets[0]])
                snapshot.set(namespacesState, mockNamespaces)
            }}
        >
            <MemoryRouter initialEntries={[actualPath]}>
                <Switch>
                    <Route path={NavigationPath.editPolicySet} render={() => <EditPolicySet />} />
                </Switch>
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit Policy Set Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('should render edit policy page', async () => {
        render(<EditPolicySetTest />)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        screen.logTestingPlaygroundURL()
    })
})
