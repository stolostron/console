/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { configMapsState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { nockIgnoreRBAC, nockAnsibleTower, nockCreate, nockIgnoreApiPaths } from '../../../lib/nock-util'
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
  mockAnsibleCredentialWorkflow,
  mockTemplateWorkflowList,
} from '../governance.sharedMocks'
import { ConfigMap, SubscriptionOperator } from '../../../resources'
import { mockOpenShiftConsoleConfigMap } from '../../../lib/test-metadata'

function CreatePolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[]; configMaps?: ConfigMap[] }) {
  const actualPath = NavigationPath.createPolicyAutomation
    .replace(':namespace', mockPolicy[0].metadata.namespace as string)
    .replace(':name', mockPolicy[0].metadata.name as string)
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, [mockSecret])
        snapshot.set(configMapsState, props.configMaps || [])
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
    nockIgnoreApiPaths()
  })

  test('can create policy automation', async () => {
    render(<CreatePolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)

    // template information
    nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
    nockAnsibleTower(mockAnsibleCredentialWorkflow, mockTemplateWorkflowList)
    waitForNotText('The Ansible Automation Platform Operator is required to use automation templates.')
    await waitForText('Create policy automation', true)

    // select ansible credential
    screen.getByRole('button', { name: /options menu/i }).click()
    await clickByText(mockSecret.metadata.name!)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // select ansible job
    screen.getByText('Select the ansible job').click()
    screen.getByRole('option', { name: 'test-job-pre-install' }).click()
    screen.getByText('Once').click()
    screen.getByRole('option', { name: 'Disabled' }).click()
    screen
      .getByRole('checkbox', {
        name: /manual run: set this automation to run once\. after the automation runs, it is set to disabled\./i,
      })
      .click()
    screen.getByText('Disabled').click()
    screen.getByRole('option', { name: 'Once' }).click()
    screen.getByRole('button', { name: 'Next' }).click()

    // review
    const policyAutomationNocks = [
      nockCreate(mockPolicyAutomation, undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPolicyAutomation),
    ]
    screen.getByRole('button', { name: 'Submit' }).click()
    await waitForNocks(policyAutomationNocks)
  })

  test('render warning when Ansible operator is not installed', async () => {
    render(<CreatePolicyAutomationTest configMaps={[mockOpenShiftConsoleConfigMap]} />)
    waitForText('The Ansible Automation Platform Operator is required to use automation templates.')
    screen
      .getByRole('button', {
        name: /Install the operator/i,
      })
      .click()
  })

  test('can cancel policy automation creation', () => {
    render(<CreatePolicyAutomationTest />)
    screen.getByRole('button', { name: 'Cancel' }).click()
  })
})
