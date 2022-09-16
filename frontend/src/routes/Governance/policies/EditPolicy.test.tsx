/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { placementsState, policiesState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
// import { waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
// import { EditPolicy } from './EditPolicy'
import { mockPolicy } from './Policy.sharedMocks'

// editPolicy = '/multicloud/governance/policies/edit/:namespace/:name

describe('Edit Policy Page', () => {
    beforeEach(() => nockIgnoreRBAC())
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, [mockPolicy[1]])
                    snapshot.set(placementsState, [])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.editPolicy]}>
                    <Route
                        path={NavigationPath.editPolicy}
                        // component={(props: any) => {
                        //     const newProps = { ...props }
                        //     newProps.match = props.match || { params: {} }
                        //     newProps.match.params.name = policyName
                        //     newProps.match.params.namespace = policyNamespace
                        //     return <EditPolicy {...newProps} />
                        // }}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('should render edit policy page', async () => {
        render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- name and namespace
        // await waitForText('policy0')
    })
})
