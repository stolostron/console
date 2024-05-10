/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  applicationSetsState,
  applicationsState,
  argoApplicationsState,
  channelsState,
  managedClusterInfosState,
  managedClustersState,
  namespacesState,
  placementDecisionsState,
  placementRulesState,
  subscriptionsState,
} from '../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest, nockSearch } from '../../lib/nock-util'
import { PluginContext } from '../../lib/PluginContext'
import { PluginDataContext } from '../../lib/PluginDataContext'
import { ocpApi, waitForText } from '../../lib/test-util'
import { ApplicationKind, ApplicationSetKind, SubscriptionKind } from '../../resources'
import {
  acmExtension,
  mockApplication0,
  mockApplications,
  mockApplicationSet0,
  mockApplicationSet1,
  mockApplicationSets,
  mockArgoApplication1,
  mockArgoApplications,
  mockChannels,
  mockFluxApplication0,
  mockManagedClusterInfos,
  mockManagedClusters,
  mockNamespaces,
  mockOCPApplication0,
  mockPlacementrules,
  mockPlacementsDecisions,
  mockSearchQueryArgoApps,
  mockSearchQueryArgoAppsCount,
  mockSearchQueryOCPApplications,
  mockSearchQueryOCPApplicationsCount,
  mockSearchQueryOCPApplicationsFiltered,
  mockSearchQueryOCPApplicationsFilteredCount,
  mockSearchResponseArgoApps,
  mockSearchResponseArgoAppsCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
  mockSubscriptions,
} from './Application.sharedmocks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Overview from './Overview'

const queryClient = new QueryClient()

describe('Applications Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockPostRequest('/metrics?application', {})
    nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(applicationsState, mockApplications)
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(channelsState, mockChannels)
          snapshot.set(placementDecisionsState, mockPlacementsDecisions)
          snapshot.set(placementRulesState, mockPlacementrules)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(applicationSetsState, mockApplicationSets)
          snapshot.set(argoApplicationsState, mockArgoApplications)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(namespacesState, mockNamespaces)
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <PluginContext.Provider
              value={{
                acmExtensions: acmExtension,
                dataContext: PluginDataContext,
                ocpApi,
              }}
            >
              <Routes>
                <Route path="*" element={<Overview />} />
              </Routes>
            </PluginContext.Provider>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  test('should display info', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()
    expect(screen.getAllByText('Git')).toBeTruthy()
    expect(screen.getByText('a few seconds ago')).toBeTruthy()

    // appset
    expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    expect(screen.getByText(mockApplicationSet1.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    // argo app
    expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
    expect(screen.getByText('feng-remote-argo8')).toBeTruthy()
    expect(screen.getAllByText('Discovered')).toHaveLength(2)

    // ocp app
    expect(screen.getByText(mockOCPApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()

    // flux
    expect(screen.getByText(mockFluxApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()
  })

  test('should filter', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // subscription

    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /subscription/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /subscription/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /subscription/i })).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()

    // clear subscription filter
    userEvent.click(screen.getByRole('button', { name: /close subscription/i }))

    // argo apps
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /argo cd/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /argo cd/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /argo cd/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.getAllByText('Discovered')).toBeTruthy()

    // clear argo filter
    userEvent.click(screen.getByRole('button', { name: /close argo cd/i }))

    // appset
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /application set/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /application set/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /application set/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText('Application set')).toBeTruthy()

    // clear appset filter
    userEvent.click(screen.getByRole('button', { name: /close application set/i }))

    nockSearch(mockSearchQueryOCPApplicationsFiltered, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsFilteredCount, mockSearchResponseOCPApplicationsCount)

    // OCP
    // Openshift filter possibly 2 (Openshift, Default Openshift)
    userEvent.click(screen.getByText('Filter'))
    await waitForText('OpenShift', true)
    expect(screen.getAllByText(/openshift/i)).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /openshift/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /openshift/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()

    // clear openshift filter
    userEvent.click(screen.getByRole('button', { name: /close openshift/i }))
  })
})
