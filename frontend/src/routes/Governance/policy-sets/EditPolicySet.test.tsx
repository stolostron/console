/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router'
import { RecoilRoot } from 'recoil'
import {
  managedClusterSetBindingsState,
  managedClusterSetsState,
  namespacesState,
  placementBindingsState,
  placementsState,
  policiesState,
  policySetsState,
} from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnorePlacementDebug, nockIgnoreRBAC, nockPatch } from '../../../lib/nock-util'
import { clickElement, clearElement } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { EditPolicySet } from './EditPolicySet'
import {
  mockPolicySets,
  mockNamespaces,
  mockPlacementBindings,
  mockPlacements,
  mockClusterSet,
  mockClusterSetBinding,
  mockPolicy,
} from '../governance.sharedMocks'
import { waitForNocks, typeElement } from '~/lib/test-util'

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

describe('Edit Policy Set Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnorePlacementDebug()
  })

  test('should render edit policy page', async () => {
    render(<EditPolicySetTest />)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const descriptionChange = screen.getByRole('textbox', { name: /description/i })
    await clearElement(descriptionChange)
    await typeElement(descriptionChange, 'updated text')

    await clickElement(screen.getByRole('button', { name: 'Next' }))
    await clickElement(screen.getByRole('button', { name: 'Next' }))
    await clickElement(screen.getByRole('button', { name: 'Next' }))

    const mockPolicySetUpdate = [
      nockPatch(mockPolicySets[0], policySetPatch, undefined, 204, { dryRun: 'All' }),
      nockPatch(mockPolicySets[0], policySetPatch),
    ]

    await clickElement(screen.getByRole('button', { name: 'Submit' }))

    await waitForNocks(mockPolicySetUpdate)
  })
})
