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
import { nockIgnoreRBAC, nockAnsibleTower } from '../../../lib/nock-util'
import { waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicyAutomation } from './CreatePolicyAutomation'
import {
    mockSecret,
    mockPolicy,
    mockClusterCurator,
    mockAnsibleCredential,
    mockTemplateList,
    mockSubscriptionOperator,
    mockPolicyAutomation,
} from '../governance.sharedMocks'
import { SubscriptionOperator } from '../../../resources'

function CreatePolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[] }) {
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
            <MemoryRouter initialEntries={[`${NavigationPath.createPolicyAutomation}`]}>
                <Route component={(props: any) => <CreatePolicyAutomation {...props} />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Create Policy Automation Wizard', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy automation', async () => {
        nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
        render(<CreatePolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
        waitForNotText('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')
        // step 1 -- name and namespace
        await waitForText('Create policy automation')
        screen.getByRole('button', { name: /options menu/i }).click()
        screen.getByRole('option', { name: /ansible-test-secret/i }).click()
        await new Promise((resolve) => setTimeout(resolve, 10000))
        // screen
        //     .getByRole('button', {
        //         name: /next/i,
        //     })
        //     .click()
        screen.logTestingPlaygroundURL()
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
