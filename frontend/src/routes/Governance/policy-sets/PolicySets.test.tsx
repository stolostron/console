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

    await waitForText("You don't have any policy sets")
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

    // make sure basic stuff is there
    expect(screen.getByRole('combobox', { name: 'Select filter options' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Type to filter' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create policy set' })).toBeInTheDocument()

    // open the filter dropdown
    screen.getByRole('combobox', { name: 'Select filter options' }).click()

    // check filter options show up with counts
    expect(screen.getByText('Violations')).toBeInTheDocument() // group header
    expect(screen.getByText('Violations (0)')).toBeInTheDocument()
    expect(screen.getByText('No violations (2)')).toBeInTheDocument()
    expect(screen.getByText('Pending (0)')).toBeInTheDocument()
    expect(screen.getByText('No status (1)')).toBeInTheDocument()

    // all policy sets should be shown
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(3)
  })

  test('filters by no status', async () => {
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

    // starts with all policy sets showing
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(3)

    // click the no status filter
    screen.getByRole('combobox', { name: 'Select filter options' }).click()
    screen.getAllByText('No status (1)')[0].click()

    // now only the one without status shows up
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(1)
  })

  test('filters by no violations', async () => {
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

    // pick the no violations filter
    screen.getByRole('combobox', { name: 'Select filter options' }).click()
    screen.getAllByText('No violations (2)')[0].click()

    // should see 2 policy sets (compliant ones)
    expect(screen.getAllByText('policy-set-with-1-placement')).toHaveLength(2)
  })

  test('works with url filter presets', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policySetsState, mockPolicySets)
        }}
      >
        <MemoryRouter initialEntries={['/multicloud/governance/policy-sets?violation=no-violations']}>
          <PolicySetsPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // should load fine and show some policy sets
    expect(screen.getByRole('combobox', { name: 'Select filter options' })).toBeInTheDocument()
    expect(screen.getAllByText('policy-set-with-1-placement').length).toBeGreaterThanOrEqual(1)
  })

  test('shows empty message when filter has no matches', async () => {
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

    // filter by violations (should get nothing back)
    screen.getByRole('combobox', { name: 'Select filter options' }).click()
    screen.getAllByText('Violations (0)')[0].click()

    // empty message should show up
    expect(screen.getByText('No resources match the current filter')).toBeInTheDocument()
  })
})