/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { placementBindingsState, placementDecisionsState, placementsState, policySetsState } from '../../../../atoms'
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
} from '../../governance.sharedMocks'

describe('Policy Details Results', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly', async () => {
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
          <PolicyDetailsOverview policy={mockPolicy[0]} />
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
    await waitForText('Without violations:')
  })

  test('Should render Policy Details Results Page correctly for policy with description', async () => {
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
          <PolicyDetailsOverview policy={mockPolicy[2]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy1')

    // verify decsription card items
    await waitForText('Test policy description')
  })

  test('Should render Policy Details Page content correctly for pending policy', async () => {
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
          <PolicyDetailsOverview policy={mockPendingPolicy[0]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    await waitForText('Pending:')
  })
})
