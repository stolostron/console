/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState } from '../../../atoms'
import { nockIgnoreApiPaths, nockPostRequest } from '../../../lib/nock-util'
import { waitForNock } from '../../../lib/test-util'
import {
  mockEmptyPolicy,
  mockManagedClusters,
  mockMultiManagedClusters,
  mockMultiPolicy,
  mockPendingPolicy,
  mockPolicy,
  mockPolicyNoStatus,
} from '../governance.sharedMocks'
import GovernanceOverview from './Overview'
import userEvent from '@testing-library/user-event'
import { LoadStatusContext } from '../../../components/LoadStatusProvider'

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
          <LoadStatusContext.Provider
            value={{
              loadStarted: true,
              loadCompleted: true,
            }}
          >
            <GovernanceOverview />
          </LoadStatusContext.Provider>
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
          <LoadStatusContext.Provider
            value={{
              loadStarted: true,
              loadCompleted: true,
            }}
          >
            <GovernanceOverview />
          </LoadStatusContext.Provider>
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
          snapshot.set(managedClustersState, mockManagedClusters)
        }}
      >
        <MemoryRouter>
          <LoadStatusContext.Provider
            value={{
              loadStarted: true,
              loadCompleted: true,
            }}
          >
            <GovernanceOverview />
          </LoadStatusContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ with no violations/i)).toBeTruthy()
  })

  test('Should render Overview page correctly with pending policies', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
          snapshot.set(managedClustersState, mockManagedClusters)
        }}
      >
        <MemoryRouter>
          <LoadStatusContext.Provider
            value={{
              loadStarted: true,
              loadCompleted: true,
            }}
          >
            <GovernanceOverview />
          </LoadStatusContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ pending/i)).toBeTruthy()
  })

  test('Should render Overview page with lots of clusters', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const { queryByText } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockMultiPolicy)
          snapshot.set(managedClustersState, mockMultiManagedClusters)
        }}
      >
        <MemoryRouter>
          <LoadStatusContext.Provider
            value={{
              loadStarted: true,
              loadCompleted: true,
            }}
          >
            <GovernanceOverview />
          </LoadStatusContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNock(metricNock)
    userEvent.click(
      screen.getByRole('button', {
        name: /show 2 more/i,
      })
    )
    expect(queryByText(/show 2 more/i)).not.toBeInTheDocument()
    userEvent.click(
      screen.getByRole('button', {
        name: /show 4 more/i,
      })
    )
    expect(queryByText(/show 4 more/i)).not.toBeInTheDocument()
    userEvent.click(
      screen.getByRole('button', {
        name: /show 85 more/i,
      })
    )
    expect(queryByText(/show 85 more/i)).not.toBeInTheDocument()
  })
})
