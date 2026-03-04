/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import PolicySetsPage from './PolicySets'
import { mockEmptyPolicySet, mockPolicySets } from '../governance.sharedMocks'
import { PolicySet } from '../../../resources'

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

  test('renders multiple policy set cards with distinct names and each has action menu (ACM-30324)', async () => {
    Element.prototype.scrollIntoView = jest.fn()
    const twoPolicySetsWithDistinctNames: PolicySet[] = [
      {
        apiVersion: 'policy.open-cluster-management.io/v1beta1',
        kind: 'PolicySet',
        metadata: { name: 'policy-set-a', namespace: 'test' },
        spec: { description: 'First', policies: [] },
        status: { compliant: 'Compliant', placement: [] },
      },
      {
        apiVersion: 'policy.open-cluster-management.io/v1beta1',
        kind: 'PolicySet',
        metadata: { name: 'policy-set-b', namespace: 'test' },
        spec: { description: 'Second', policies: [] },
        status: { compliant: 'Compliant', placement: [] },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policySetsState, twoPolicySetsWithDistinctNames)
        }}
      >
        <MemoryRouter>
          <PolicySetsPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-a')
    await waitForText('policy-set-b')
    const cardA = document.getElementById('policyset-test-policy-set-a')
    const cardB = document.getElementById('policyset-test-policy-set-b')
    expect(cardA).toBeInTheDocument()
    expect(cardB).toBeInTheDocument()

    const getActionsTrigger = (card: HTMLElement) => {
      const buttons = card.querySelectorAll('button')
      const kebab = Array.from(buttons).find((b) => !b.textContent?.trim()) ?? buttons[buttons.length - 1]
      return kebab
    }

    const triggerA = getActionsTrigger(cardA!)
    const triggerB = getActionsTrigger(cardB!)

    fireEvent.click(triggerA)
    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()

    fireEvent.click(triggerB)
    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()

    fireEvent.click(triggerB)
    expect(screen.queryByRole('menuitem', { name: 'View details' })).not.toBeInTheDocument()
  })
})
