/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policyAutomationState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { nockAnsibleTower, nockIgnoreRBAC /*nockPatch*/ } from '../../../lib/nock-util'
// import { waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicyAutomation } from './EditPolicyAutomation'
import {
    mockAnsibleCredential,
    mockPolicy,
    mockPolicyAutomation,
    mockSecret,
    mockSubscriptionOperator,
    mockTemplateList,
} from '../governance.sharedMocks'
import { SubscriptionOperator } from '../../../resources'

function EditPolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[] }) {
    const actualPath = NavigationPath.editPolicyAutomation
        .replace(':namespace', mockPolicy[0].metadata.namespace as string)
        .replace(':name', mockPolicy[0].metadata.name as string)
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policyAutomationState, [mockPolicyAutomation])
                snapshot.set(secretsState, [mockSecret])
                snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
            }}
        >
            <MemoryRouter initialEntries={[actualPath]}>
                <Route
                    path={NavigationPath.editPolicyAutomation}
                    component={(props: any) => <EditPolicyAutomation {...props} />}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

// const policyAutomationPatch = {
//     spec: {
//         automationDef: {
//             name: 'test-job-post-install',
//         },
//         mode: 'disabled',
//     },
// }

describe('Edit Policy Automation', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can edit policy automation', async () => {
        render(<EditPolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
        nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        expect(screen.getByRole('heading', { name: 'Edit policy automation' })).toBeInTheDocument()
        expect(screen.getByText('ansible-test-secret')).toBeInTheDocument()
        expect(screen.getByText('test-job-pre-install')).toBeInTheDocument()

        // modify ansible job and schedule
        screen.getByText('test-job-pre-install').click()
        screen.getByRole('option', { name: 'test-job-post-install' }).click()
        screen.getByText('Once').click()
        screen.getByRole('option', { name: 'Disabled' }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        //  review

        // const mockPolicyAutomationUpdate = nockPatch(mockPolicyAutomation, policyAutomationPatch)
        // screen.getByRole('button', { name: 'Submit' }).click()
        // await waitForNocks([mockPolicyAutomationUpdate])
    })

    test('can cancel editing policy automation', async () => {
        render(<EditPolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
        screen.getByRole('button', { name: 'Cancel' }).click()
    })
})
