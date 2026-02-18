/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState } from '../../../atoms'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'
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
import { defaultContext, PluginDataContext } from '../../../lib/PluginDataContext'

describe('Overview Page', () => {
  beforeEach(async () => nockIgnoreApiPaths())
  test('Should render empty Overview page with create policy button correctly', async () => {
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryAllByText } = await render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockEmptyPolicy)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    expect(queryAllByText('Create policy').length).toBe(1)
  })

  test('Should render empty Overview page with manage policies button correctly', async () => {
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryAllByText } = await render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, [mockPolicyNoStatus])
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )
    expect(queryAllByText('Manage policies').length).toBe(2)
  })

  test('Should render Overview page correctly', async () => {
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockPolicy)
            snapshot.set(managedClustersState, mockManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    expect(screen.getByText(/[1-9]+ with no violations/i)).toBeTruthy()
  })

  test('Should render Overview page correctly with pending policies', async () => {
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockPendingPolicy)
            snapshot.set(managedClustersState, mockManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    expect(screen.getByText(/[1-9]+ pending/i)).toBeTruthy()
  })

  test('Should render Overview page with lots of clusters', async () => {
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryByText } = render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockMultiPolicy)
            snapshot.set(managedClustersState, mockMultiManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    userEvent.click(screen.getByText(/show 2 more/i))

    expect(queryByText(/show 2 more/i)).not.toBeInTheDocument()
    userEvent.click(screen.getByText(/show 4 more/i))
    expect(queryByText(/show 4 more/i)).not.toBeInTheDocument()
    userEvent.click(screen.getByText(/show 85 more/i))
    expect(queryByText(/show 85 more/i)).not.toBeInTheDocument()
  })
})
