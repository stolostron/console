/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import PolicySetsPage from './PolicySets'
import { mockEmptyPolicySet, mockPolicySets } from '../governance.sharedMocks'

describe('PolicySets Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('shows empty page when no policy sets', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policySetsState, mockEmptyPolicySet)
        }}
      >
        <MemoryRouter>
          <PolicySetsPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText("You don't have any policy sets yet")
  })

  test('renders page with filters and policy sets', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policySetsState, mockPolicySets)
        }}
      >
        <MemoryRouter>
          <PolicySetsPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // should show all items initially
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(3)

    screen
      .getByRole('combobox', {
        name: 'Select filter options',
      })
      .click()

    // check filter dropdown options
    expect(screen.getByText('Violations')).toBeInTheDocument()
    expect(screen.getByText('Violations (0)')).toBeInTheDocument()
    expect(screen.getByText('No violations (2)')).toBeInTheDocument()
    expect(screen.getByText('No status (1)')).toBeInTheDocument()

    // filter by no status
    screen.getAllByText('No status (1)')[0].click()
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(1)
  })

  test('filters by no violations from url params', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policySetsState, mockPolicySets)
        }}
      >
        <MemoryRouter initialEntries={['/multicloud/governance/policy-sets?violations=no-violation']}>
          <PolicySetsPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // should only show no violations filter
    expect(screen.queryByText('Violations')).not.toBeInTheDocument()
    expect(screen.getAllByText('No violations')).toBeTruthy()
    expect(screen.queryByText('No status')).not.toBeInTheDocument()
  })
})
