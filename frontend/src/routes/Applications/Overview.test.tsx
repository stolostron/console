/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClustersState, placementDecisionsState, subscriptionsState } from '../../atoms'
import { nockAggegateRequest, nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../lib/PluginContext'
import { getCSVDownloadLink, getCSVExportSpies, waitForText, getFragmentedTextMatcher } from '../../lib/test-util'
import {
  ApplicationKind,
  ApplicationSetKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  SubscriptionKind,
} from '../../resources'
import { getISOStringTimestamp } from '../../resources/utils'
import { AcmToastGroup, AcmToastProvider } from '../../ui-components'
import {
  acmExtension,
  mockApplication0,
  mockApplicationSet0,
  mockApplicationSet1,
  mockArgoApplication1,
  mockArgoApplication2,
  mockFluxApplication0,
  mockOCPApplication0,
  mockPlacementsDecisions,
  mockSearchQueryOCPApplicationsFiltered,
  mockSearchQueryOCPApplicationsFilteredCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
  mockSubscriptions,
} from './Application.sharedmocks'
import Overview from './Overview'
import { useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'

jest.mock('../../lib/rbac-util')
;(useIsAnyNamespaceAuthorized as jest.Mock).mockImplementation(() => true)

const applicationAggregate = {
  req: { page: 1, perPage: 10, search: '', filters: {}, sortBy: { index: 0, direction: 'asc' } },
  res: {
    page: 1,
    items: [
      mockApplication0,
      mockApplicationSet0,
      mockApplicationSet1,
      mockArgoApplication1,
      mockArgoApplication2,
      mockOCPApplication0,
      mockFluxApplication0,
    ],
    emptyResult: false,
    isPreProcessed: false,
  },
}
const fetchAggregate = {
  req: { page: 1, perPage: -1 },
  res: {
    page: 1,
    items: [
      mockApplication0,
      mockApplicationSet0,
      mockApplicationSet1,
      mockArgoApplication1,
      mockArgoApplication2,
      mockOCPApplication0,
      mockFluxApplication0,
    ],
    emptyResult: false,
    isPreProcessed: false,
  },
}
const statusAggregate = {
  req: {},
  res: {
    itemCount: 42,
    filterCounts: undefined,
    systemAppNSPrefixes: [],
  },
}

const hubCluster: ManagedCluster = {
  kind: ManagedClusterKind,
  apiVersion: ManagedClusterApiVersion,
  metadata: {
    name: 'local-cluster',
    namespace: 'local-cluster',
    labels: {
      'local-cluster': 'true',
    },
  },
}

const mockClusters = [hubCluster]

describe('Applications Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(placementDecisionsState, mockPlacementsDecisions)
          snapshot.set(managedClustersState, mockClusters)
        }}
      >
        <AcmToastProvider>
          <AcmToastGroup />
          <MemoryRouter>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <Routes>
                <Route path="*" element={<Overview />} />
              </Routes>
            </PluginContext.Provider>
          </MemoryRouter>
        </AcmToastProvider>
      </RecoilRoot>
    )
  })

  test('should display info', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')
    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()
    expect(screen.getAllByText(getFragmentedTextMatcher('Feb 20, 2024, 3:30 PM'))[0]).toBeInTheDocument()

    // appset
    expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    expect(screen.getByText(mockApplicationSet1.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    // argo app
    expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
    expect(screen.getByText('feng-remote-argo8')).toBeTruthy()
    expect(screen.getAllByText('Argo CD')).toHaveLength(2)

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
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.getAllByText('Argo CD')).toBeTruthy()

    // clear argo filter
    userEvent.click(screen.getByRole('button', { name: /close argo cd/i }))

    // appset
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /application set/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /application set/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox')).toBeNull()
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
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()

    // clear openshift filter
    userEvent.click(screen.getByRole('button', { name: /close openshift/i }))
  })

  test('should delete application', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // click delete
    userEvent.click(screen.getAllByRole('button', { name: /actions/i })[1])
    userEvent.click(screen.getByText(/delete application/i))
    expect(screen.getByText(/permanently delete applicationset applicationset-0\?/i)).toBeTruthy()
  })

  test('export button should produce a file for download', async () => {
    nockAggegateRequest('applications', fetchAggregate.req, fetchAggregate.res)

    await waitForText('feng-remote-argo8')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    userEvent.click(screen.getByTestId('export-search-result'))
    userEvent.click(screen.getByText('Export all to CSV'))

    await waitFor(() => {
      const toastElement = screen.getByText(/Export successful/i)
      expect(toastElement).toBeInTheDocument()
    })

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Type,Namespace,Clusters,Health Status,Sync Status,Pod Status,Created\n' +
          `"application-0","Subscription","namespace-0","Local","-","-","-","${getISOStringTimestamp(applicationAggregate.res.items[0].metadata?.creationTimestamp || '')}"\n` +
          '"applicationset-0","Application set","openshift-gitops","None","-","-","-",-\n' +
          '"applicationset-1","Application set","openshift-gitops","None","-","-","-",-\n' +
          '"argoapplication-1","Argo CD","argoapplication-1-ns","None","-","-","-",-\n' +
          '"feng-remote-argo8","Argo CD","argoapplication-1-ns","None","-","-","-",-\n' +
          '"authentication-operator","OpenShift","authentication-operator-ns","None","-","-","-",-\n' +
          '"authentication-operatorf","Flux","authentication-operator-ns","None","-","-","-",-',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^applicationsoverview-[\d]+\.csv$/)
  })
})
describe('Create application dropdown', () => {
  test('Create application button should be disabled when unauthorized', async () => {
    ;(useIsAnyNamespaceAuthorized as jest.Mock).mockImplementation(() => false)
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(placementDecisionsState, mockPlacementsDecisions)
          snapshot.set(managedClustersState, mockClusters)
        }}
      >
        <AcmToastProvider>
          <AcmToastGroup />
          <MemoryRouter>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <Routes>
                <Route path="*" element={<Overview />} />
              </Routes>
            </PluginContext.Provider>
          </MemoryRouter>
        </AcmToastProvider>
      </RecoilRoot>
    )

    await waitForText('feng-remote-argo8')
    const createButton = screen.getByRole('button', { name: /create application/i })
    expect(createButton).toBeDisabled()
  })
})
