/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { placementBindingsState, placementRulesState, policiesState, namespacesState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch } from '../../../lib/nock-util'
import { clickByText, waitForNotText, waitForText, waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { mockNamespaces, mockPlacementBindings, mockPlacementRules, mockPolicy } from '../governance.sharedMocks'
import { EditPolicy } from './EditPolicy'
import { PlacementBinding, PlacementRule, Policy } from '../../../resources'

const mockPolicyCopy = JSON.parse(JSON.stringify(mockPolicy[2])) as Policy
mockPolicyCopy.metadata.uid = '20761783-5b48-4f9c-b12c-d5a6b2fac4b5'
const mockPlacementRuleCopy = JSON.parse(JSON.stringify(mockPlacementRules[0])) as PlacementRule
mockPlacementRuleCopy.metadata.uid = '35661783-5b48-4f9c-b12c-d5a6b2fac4c2'
const mockPlacementBindingCopy = JSON.parse(JSON.stringify(mockPlacementBindings[0])) as PlacementBinding
mockPlacementBindingCopy.metadata.uid = '49661783-5b48-4f9c-b12c-d5a6b2fac434'

function TestEditPolicyPage() {
  const actualPath = NavigationPath.editPolicy
    .replace(':namespace', mockPolicyCopy.metadata.namespace as string)
    .replace(':name', mockPolicyCopy.metadata.name as string)
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policiesState, [mockPolicyCopy])
        snapshot.set(placementRulesState, [mockPlacementRuleCopy])
        snapshot.set(placementBindingsState, [mockPlacementBindingCopy])
        snapshot.set(namespacesState, mockNamespaces)
      }}
    >
      <MemoryRouter initialEntries={[actualPath]}>
        <Switch>
          <Route path={NavigationPath.editPolicy} render={() => <EditPolicy />} />
        </Switch>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Edit Policy Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can render Edit Policy Page', async () => {
    window.scrollBy = () => {}
    render(<TestEditPolicyPage />)
    await waitForText('Edit policy')

    // step 1 -- name and namespace
    screen.getByRole('button', { name: 'Next' }).click()

    // step 2 -- policy templates
    screen
      .getByRole('button', {
        name: /remove item/i,
      })
      .click()
    screen.getByRole('button', { name: 'Next' }).click()

    // step 3 -- placement
    screen.getByText(
      /placementrule is deprecated and will not receive updates or fixes\. best practice: use placement\./i
    )
    screen.getByRole('button', { name: 'Next' }).click()

    // step 4 -- Policy annotations
    screen.getByRole('button', { name: 'Next' }).click()

    // step 5 -- Review and Submit

    const mockPolicyUpdate = [
      nockPatch(mockPolicyCopy, [{ op: 'remove', path: '/spec/policy-templates/0' }], undefined, 204, {
        dryRun: 'All',
      }),
      nockPatch(mockPolicyCopy, [{ op: 'remove', path: '/spec/policy-templates/0' }]),
    ]
    screen.getByRole('button', { name: 'Submit' }).click()
    await waitForNocks(mockPolicyUpdate)
  })

  test('can cancel edit policy', async () => {
    render(<TestEditPolicyPage />)
    await waitForText('Edit policy')
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })
})
