/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  managedClusterSetBindingsState,
  managedClusterSetsState,
  namespacesState,
  placementBindingsState,
  placementRulesState,
  placementsState,
  policiesState,
  policySetsState,
} from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicySet } from './EditPolicySet'
import {
  mockPolicySets,
  mockNamespaces,
  mockPlacementRules,
  mockPlacementBindings,
  mockPlacements,
  mockClusterSet,
  mockClusterSetBinding,
  mockPolicy,
} from '../governance.sharedMocks'
import { waitForNocks } from '../../../lib/test-util'
import userEvent from '@testing-library/user-event'

function EditPolicySetTest() {
  const actualPath = generatePath(NavigationPath.editPolicySet, {
    namespace: mockPolicySets[0].metadata.namespace!,
    name: mockPolicySets[0].metadata.name!,
  })
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policySetsState, [mockPolicySets[0]])
        snapshot.set(policiesState, [mockPolicy[0]])
        snapshot.set(namespacesState, mockNamespaces)
        snapshot.set(placementsState, mockPlacements)
        snapshot.set(placementRulesState, mockPlacementRules)
        snapshot.set(placementBindingsState, mockPlacementBindings)
        snapshot.set(managedClusterSetsState, [mockClusterSet])
        snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding])
      }}
    >
      <MemoryRouter initialEntries={[actualPath]}>
        <Routes>
          <Route path={NavigationPath.editPolicySet} element={<EditPolicySet />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

const policySetPatch = [{ op: 'replace', path: '/spec/description', value: 'updated text' }]

const placementRulePatch = [
  { op: 'remove', path: '/spec' },
  { op: 'replace', path: '/kind', value: 'PlacementBinding' },
  { op: 'replace', path: '/apiVersion', value: 'policy.open-cluster-management.io/v1' },
  {
    op: 'add',
    path: '/placementRef',
    value: {
      apiGroup: 'apps.open-cluster-management.io',
      kind: 'PlacementRule',
      name: 'policy-set-with-1-placement-placement',
    },
  },
  {
    op: 'add',
    path: '/subjects',
    value: [
      {
        apiGroup: 'policy.open-cluster-management.io',
        kind: 'PolicySet',
        name: 'policy-set-with-1-placement',
      },
    ],
  },
]

describe('Edit Policy Set Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render edit policy page', async () => {
    render(<EditPolicySetTest />)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const descriptionChange = screen.getByRole('textbox', { name: /description/i })
    userEvent.type(descriptionChange, '{selectall}updated text')

    screen.getByRole('button', { name: 'Next' }).click()
    screen.getByRole('button', { name: 'Next' }).click()
    screen.getByRole('button', { name: 'Next' }).click()

    const mockPolicySetUpdate = [
      nockPatch(mockPolicySets[0], policySetPatch, undefined, 204, { dryRun: 'All' }),
      nockPatch(mockPolicySets[0], policySetPatch),
    ]
    const mockPlacementRulesUpdate = [
      nockPatch(mockPlacementRules[1], placementRulePatch, undefined, 204, { dryRun: 'All' }),
      nockPatch(mockPlacementRules[1], placementRulePatch),
    ]

    screen.getByRole('button', { name: 'Submit' }).click()

    await waitForNocks(mockPolicySetUpdate)
    await waitForNocks(mockPlacementRulesUpdate)
  })
})
