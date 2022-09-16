/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
// import { waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicySet } from './EditPolicySet'
// import { EditPolicy } from './EditPolicy'
import { mockEmptyPolicySets } from './PolicySet.sharedMocks'

// editPolicy = '/multicloud/governance/policies/edit/:namespace/:name

describe('Edit Policy Set Page', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockEmptyPolicySets)
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.editPolicySet}`]}>
                    <Route path={NavigationPath.editPolicySet}>
                        <EditPolicySet />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('should render edit policy page', async () => {
        render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- name and namespace
        // await waitForText('policy0')
    })
})
