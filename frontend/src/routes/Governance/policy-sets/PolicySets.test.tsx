/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, within } from '@testing-library/react'
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
  test('Should render empty PolicySet page correctly', async () => {
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

  test('Should render PolicySet page correctly', async () => {
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

    screen
      .getByRole('button', {
        name: /options menu/i,
      })
      .click()

    // filter title and a selection
    expect(screen.getAllByText('Violations')).toHaveLength(2)
    expect(screen.getAllByText('No violations')).toBeTruthy()
    expect(screen.getAllByText('No status')).toBeTruthy()

    screen.getAllByText('Violations')[0].click()
    expect(within(screen.getAllByText('Violations')[1]).getByText('0')).toBeInTheDocument()
    expect(within(screen.getAllByText('No violations')[0]).getByText('2')).toBeInTheDocument()
    expect(within(screen.getAllByText('No status')[0]).getByText('1')).toBeInTheDocument()
  })

  test('Should filter no-violation correctly', async () => {
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

    // filter title and a selection
    expect(screen.queryByText('Violations')).not.toBeInTheDocument()
    expect(screen.getAllByText('No violations')).toBeTruthy()
    expect(screen.queryByText('No status')).not.toBeInTheDocument()
  })
})
