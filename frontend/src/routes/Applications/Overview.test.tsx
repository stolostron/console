/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { waitForText } from '../../lib/test-util'
import { ApplicationKind, ApplicationSetKind, SubscriptionKind } from '../../resources'
import { PluginContext } from '../../lib/PluginContext'
import { NavigationPath } from '../../NavigationPath'
import ApplicationsPage from './ApplicationsPage'
import {
  mockSearchQueryArgoApps,
  mockSearchResponseArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseOCPApplications,
  mockApplications,
  mockSubscriptions,
  mockChannels,
  mockPlacementrules,
  mockManagedClusters,
  mockApplicationSets,
  mockArgoApplications,
  mockManagedClusterInfos,
  mockNamespaces,
  acmExtension,
  mockApplication0,
  mockApplicationSet0,
  mockArgoApplication1,
  mockOCPApplication0,
  mockFluxApplication0,
  mockPlacementsDecisions,
} from './Application.sharedmocks'
import { PluginDataContext } from '../../lib/PluginDataContext'

describe('Applications Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
    nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
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
        <MemoryRouter initialEntries={[NavigationPath.applications]}>
          <PluginContext.Provider value={{ acmExtensions: acmExtension, dataContext: PluginDataContext }}>
            <ApplicationsPage />
          </PluginContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // wait for page to load
    await waitForText('feng-remote-argo8')
  })

  test('should display info', async () => {
    // app
    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()
    expect(screen.getAllByText('Git')).toBeTruthy()
    expect(screen.getByText('a few seconds ago')).toBeTruthy()

    // appset
    expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
    expect(screen.getByText('Application set')).toBeTruthy()

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

    // OCP
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /openshift/i })).toBeTruthy()
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
