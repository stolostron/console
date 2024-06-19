/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policyAutomationState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { nockAnsibleTower, nockIgnoreApiPaths, nockIgnoreRBAC /*nockPatch*/, nockPatch } from '../../../lib/nock-util'
// import { waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicyAutomation } from './EditPolicyAutomation'
import {
  mockAnsibleCredential,
  mockAnsibleCredentialWorkflow,
  mockPolicy,
  mockPolicyAutomation,
  mockSecret,
  mockSubscriptionOperator,
  mockTemplateList,
  mockTemplateWorkflowList,
} from '../governance.sharedMocks'
import { SubscriptionOperator } from '../../../resources'
import { waitForNocks } from '../../../lib/test-util'

function EditPolicyAutomationTest(props: { subscriptions?: SubscriptionOperator[] }) {
  const actualPath = generatePath(NavigationPath.editPolicyAutomation, {
    namespace: mockPolicy[0].metadata.namespace!,
    name: mockPolicy[0].metadata.name!,
  })
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policyAutomationState, [mockPolicyAutomation])
        snapshot.set(secretsState, [mockSecret])
        snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
      }}
    >
      <MemoryRouter initialEntries={[actualPath]}>
        <Routes>
          <Route path={NavigationPath.editPolicyAutomation} element={<EditPolicyAutomation />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Edit Policy Automation', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can edit policy automation', async () => {
    render(<EditPolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
    nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
    nockAnsibleTower(mockAnsibleCredentialWorkflow, mockTemplateWorkflowList)
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

    const mockPolicyAutomationUpdate = [
      nockPatch(
        mockPolicyAutomation,
        [
          { op: 'replace', path: '/spec/automationDef/name', value: 'test-job-post-install' },
          { op: 'replace', path: '/spec/mode', value: 'disabled' },
        ],
        undefined,
        204,
        { dryRun: 'All' }
      ), //dry run
      nockPatch(mockPolicyAutomation, [
        { op: 'replace', path: '/spec/automationDef/name', value: 'test-job-post-install' },
        { op: 'replace', path: '/spec/mode', value: 'disabled' },
      ]),
    ]
    screen.getByRole('button', { name: 'Submit' }).click()
    await waitForNocks(mockPolicyAutomationUpdate)
  })

  test('can cancel editing policy automation', async () => {
    render(<EditPolicyAutomationTest subscriptions={[mockSubscriptionOperator]} />)
    screen.getByRole('button', { name: 'Cancel' }).click()
  })
})
