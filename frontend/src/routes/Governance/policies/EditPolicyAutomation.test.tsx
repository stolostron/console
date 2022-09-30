/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    clusterCuratorsState,
    policiesState,
    policyAutomationState,
    secretsState,
    subscriptionOperatorsState,
} from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicyAutomation } from './EditPolicyAutomation'
import {
    mockPolicy,
    mockPolicyAutomation,
    mockSecret,
    mockClusterCurator,
    mockSubscriptionOperator,
} from '../governance.sharedMocks'
import { SubscriptionOperator } from '../../../resources'

function EditPolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[] }) {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policiesState, mockPolicy)
                snapshot.set(policyAutomationState, [mockPolicyAutomation])
                snapshot.set(secretsState, [mockSecret])
                snapshot.set(clusterCuratorsState, [mockClusterCurator])
                snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
            }}
        >
            <MemoryRouter initialEntries={[`${NavigationPath.editPolicyAutomation}`]}>
                <Route component={(props: any) => <EditPolicyAutomation {...props} />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit Policy Automation', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('render table with link to automation drawer', async () => {
        render(<EditPolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
        await new Promise((resolve) => setTimeout(resolve, 500))
        expect(
            screen.getByRole('button', {
                name: mockPolicyAutomation.metadata!.name,
            })
        ).toBeInTheDocument()
    })
})
