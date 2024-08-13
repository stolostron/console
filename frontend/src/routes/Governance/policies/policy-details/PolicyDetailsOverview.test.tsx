/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  placementBindingsState,
  placementDecisionsState,
  placementsState,
  policiesState,
  policySetsState,
} from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import PolicyDetailsOverview from './PolicyDetailsOverview'

import {
  mockPolicy,
  mockPlacementBindings,
  mockPlacementDecision,
  mockPlacements,
  mockPolicySets,
  mockPendingPolicy,
  policy2,
  policy3,
} from '../../governance.sharedMocks'
import { REMEDIATION_ACTION } from '../../../../resources'
import { PolicyDetailsContext } from './PolicyDetailsPage'

describe('Policy Details Results', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(policiesState, [mockPolicy[1]])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // verify decsription card items
    await waitForText('test')
    await waitForText('Enabled')
    await waitForText('inform')

    // verify placement table
    await waitForText('policy-set-with-1-placement')
    await waitForText('No violations:')
  })

  test.each([
    [[policy2, policy2], REMEDIATION_ACTION.ENFORCE_OVERRIDDEN],
    [[policy2, policy3], REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN],
    [[policy3, policy2], REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN],
    [[policy3, policy3], REMEDIATION_ACTION.INFORM],
  ])(
    'Should render Policy Details Results Page correctly for policy override',
    async (propagatedPolicies, expected) => {
      const context: PolicyDetailsContext = { policy: mockPolicy[0] }
      render(
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(placementsState, mockPlacements)
            snapshot.set(policySetsState, [mockPolicySets[0]])
            snapshot.set(placementBindingsState, mockPlacementBindings)
            snapshot.set(placementDecisionsState, mockPlacementDecision)
            snapshot.set(policiesState, propagatedPolicies)
          }}
        >
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<PolicyDetailsOverview />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </RecoilRoot>
      )

      // wait page load
      await waitForText(expected)
    }
  )

  test('Should render Policy Details Results Page correctly for policy with description', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[2] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy1')

    // verify decsription card items
    await waitForText('Test policy description')
  })

  test('Should render Policy Details Page content correctly for pending policy', async () => {
    const context: PolicyDetailsContext = { policy: mockPendingPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    await waitForText('Pending:')
  })
})
