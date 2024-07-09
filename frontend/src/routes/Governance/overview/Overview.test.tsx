/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { nockIgnoreApiPaths, nockPostRequest } from '../../../lib/nock-util'
import { waitForNock } from '../../../lib/test-util'
import { mockEmptyPolicy, mockPendingPolicy, mockPolicy, mockPolicyNoStatus } from '../governance.sharedMocks'
import GovernanceOverview from './Overview'

describe('Overview Page', () => {
  beforeEach(async () => nockIgnoreApiPaths())
  test('Should render empty Overview page with create policy button correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
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

    await waitForNock(metricNock)
    expect(queryAllByText('Create policy').length).toBe(2)
  })

  test('Should render empty Overview page with manage policies button correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
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
    await waitForNock(metricNock)
    expect(queryAllByText('Manage policies').length).toBe(2)
  })

  test('Should render Overview page correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
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

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ without violations/i)).toBeTruthy()
  })

  test('Should render Overview page correctly with pending policies', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
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

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ pending/i)).toBeTruthy()
  })
})
