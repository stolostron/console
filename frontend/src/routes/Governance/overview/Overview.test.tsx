/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import GovernanceOverview from './Overview'
import { mockEmptyPolicy, mockPolicyNoStatus, mockPolicy, mockPendingPolicy } from '../governance.sharedMocks'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'

describe('Overview Page', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('Should render empty Overview page with create policy button correctly', async () => {
    const { queryAllByText } = await render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockEmptyPolicy)
        }}
      >
        <MemoryRouter>
          <GovernanceOverview />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(queryAllByText('Create policy').length).toBe(2)
  })

  test('Should render empty Overview page with manage policies button correctly', async () => {
    const { queryAllByText } = await render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockPolicyNoStatus])
        }}
      >
        <MemoryRouter>
          <GovernanceOverview />
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(queryAllByText('Manage policies').length).toBe(2)
  })

  test('Should render Overview page correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter>
          <GovernanceOverview />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(screen.getByText(/[1-9]+ without violations/i)).toBeTruthy()
  })

  test('Should render Overview page correctly with pending policies', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
        }}
      >
        <MemoryRouter>
          <GovernanceOverview />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(screen.getByText(/[1-9]+ pending/i)).toBeTruthy()
  })
})
