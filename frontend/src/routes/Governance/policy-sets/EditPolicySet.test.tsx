/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath, useLocation } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
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

function LocationDisplay() {
  const location = useLocation()
  return <div id="location-display">{`${location.pathname}${location.search}`}</div>
}

function EditPolicySetTest(props: { nonexistent?: boolean }) {
  const { nonexistent } = props
  const actualPath = generatePath(NavigationPath.editPolicySet, {
    namespace: mockPolicySets[0].metadata.namespace!,
    name: nonexistent ? 'does-not-exist' : mockPolicySets[0].metadata.name!,
  })
  return (
    <StateProvider
      initializeStore={(store) => {
        store.set(policySetsState, [mockPolicySets[0]])
        store.set(policiesState, [mockPolicy[0]])
        store.set(namespacesState, mockNamespaces)
        store.set(placementsState, mockPlacements)
        store.set(placementBindingsState, mockPlacementBindings)
        store.set(managedClusterSetsState, [mockClusterSet])
        store.set(managedClusterSetBindingsState, [mockClusterSetBinding])
      }}
    >
      <MemoryRouter initialEntries={[actualPath]}>
        <LocationDisplay />
        <Routes>
          <Route path={NavigationPath.editPolicySet} element={<EditPolicySet />} />
        </Routes>
      </MemoryRouter>
    </StateProvider>
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
    const descriptionChange = await screen.findByRole('textbox', { name: /description/i })
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

    await waitFor(() => expect(screen.getByTestId('location-display').textContent).toBe(NavigationPath.policySets))
  })

  test('navigates to policy sets list when the policy set cannot be found', async () => {
    render(<EditPolicySetTest nonexistent={true} />)
    await waitFor(() => expect(screen.getByTestId('location-display').textContent).toBe(NavigationPath.policySets))
  })

  test('navigates to policy sets list on cancel', async () => {
    render(<EditPolicySetTest />)
    await clickElement(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.getByTestId('location-display').textContent).toBe(NavigationPath.policySets))
  })
})
