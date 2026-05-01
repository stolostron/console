/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { configMapsState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import {
  nockIgnoreRBAC,
  nockAnsibleTower,
  nockCreate,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockIgnoreClusterVersion,
} from '../../../lib/nock-util'
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
  const actualPath = generatePath(NavigationPath.createPolicyAutomation, {
    namespace: mockPolicy[0].metadata.namespace!,
    name: mockPolicy[0].metadata.name!,
  })
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, [mockSecret])
        snapshot.set(configMapsState, props.configMaps || [])
        snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
      }}
    >
      <MemoryRouter initialEntries={[actualPath]}>
        <Routes>
          <Route path={NavigationPath.createPolicyAutomation} element={<CreatePolicyAutomation />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Create Policy Automation Wizard', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck(true)
    nockIgnoreClusterVersion()
  })

  test(
    'can create policy automation',
    async () => {
      nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
      nockAnsibleTower(mockAnsibleCredentialWorkflow, mockTemplateWorkflowList)
      render(<CreatePolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)

      await waitForNotText('The Ansible Automation Platform Operator is required to use policy automations.')
      await waitForText('Create policy automation', true)

      // select ansible credential
      screen.getByPlaceholderText('Select the Ansible credential').click()
      await clickByText(mockSecret.metadata.name!)

      // select ansible job (options load asynchronously after credential selection)
      const jobDropdown = await screen.findByPlaceholderText('Select the ansible job')
      jobDropdown.click()
      const jobOption = await screen.findByRole('option', { name: 'test-job-pre-install' })
      jobOption.click()
      screen.getByPlaceholderText(/select the schedule/i).click()
      screen.getByRole('option', { name: 'Disabled' }).click()
      screen
        .getByRole('checkbox', {
          name: /manual run: set this automation to run once\. after the automation runs, it is set to disabled\./i,
        })
        .click()
      screen.getByPlaceholderText(/select the schedule/i).click()
      screen.getByRole('option', { name: 'Once' }).click()
      screen.getByRole('button', { name: 'Next' }).click()

      // review
      const policyAutomationNocks = [
        nockCreate(mockPolicyAutomation, undefined, 201, { dryRun: 'All' }), // DRY RUN
        nockCreate(mockPolicyAutomation),
      ]
      screen.getByRole('button', { name: 'Submit' }).click()
      await waitForNocks(policyAutomationNocks)
    },
    480 * 1000
  )

  test('render warning when Ansible operator is not installed', async () => {
    render(<CreatePolicyAutomationTest configMaps={[mockOpenShiftConsoleConfigMap]} />)
    await waitForText('The Ansible Automation Platform Operator is required to use policy automations.')
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
