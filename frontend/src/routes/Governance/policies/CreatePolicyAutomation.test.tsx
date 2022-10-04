/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { secretsState, subscriptionOperatorsState } from '../../../atoms'
import { nockIgnoreRBAC, nockAnsibleTower, nockCreate } from '../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicyAutomation } from './CreatePolicyAutomation'
import {
    mockSecret,
    mockPolicy,
    mockAnsibleCredential,
    mockTemplateList,
    mockSubscriptionOperator,
    mockPolicyAutomation,
} from '../governance.sharedMocks'
import { SubscriptionOperator } from '../../../resources'

function CreatePolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[] }) {
    const actualPath = NavigationPath.createPolicyAutomation
        .replace(':namespace', mockPolicy[0].metadata.namespace as string)
        .replace(':name', mockPolicy[0].metadata.name as string)
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(secretsState, [mockSecret])
                snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
            }}
        >
            <MemoryRouter initialEntries={[actualPath]}>
                <Route
                    path={NavigationPath.createPolicyAutomation}
                    component={(props: any) => <CreatePolicyAutomation {...props} />}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Create Policy Automation Wizard', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy automation', async () => {
        render(<CreatePolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)

        // template information
        nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
        waitForNotText('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')
        await waitForText('Create policy automation')

        // select ansible credential
        screen.getByRole('button', { name: /options menu/i }).click()
        await clickByText(mockSecret.metadata.name!)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // select ansible job
        screen.getByText('Select the ansible job').click()
        screen.getByRole('option', { name: 'test-job-pre-install' }).click()
        screen.getByRole('button', { name: 'Next' }).click()

        // review
        const policyAutomationNocks = [
            nockCreate(mockPolicyAutomation, undefined, 201, true), //dry run
            nockCreate(mockPolicyAutomation),
        ]
        screen.getByRole('button', { name: 'Submit' }).click()
        await waitForNocks(policyAutomationNocks)
    })

    test('render warning when Ansible operator is not installed', async () => {
        render(<CreatePolicyAutomationTest />)
        waitForText('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')
    })

    test('can cancel policy automation creation', () => {
        render(<CreatePolicyAutomationTest />)
        screen.getByRole('button', { name: 'Cancel' }).click()
    })
})
