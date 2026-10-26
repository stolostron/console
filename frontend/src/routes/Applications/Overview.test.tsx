/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { managedClustersState, placementDecisionsState, subscriptionsState } from '../../atoms'
import { nockAggegateRequest, nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../lib/PluginContext'
import { getCSVDownloadLink, getCSVExportSpies, waitForText, clickElement } from '~/lib/test-util'
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

function LocationDisplay() {
  const location = useLocation()
  return <div id="location-display">{location.pathname + location.search}</div>
}

async function openRowAction(appName: string, actionName: string) {
  const row = screen.getByText(appName).closest('tr')!
  await clickElement(within(row).getByRole('button', { name: /actions/i }))
  await clickElement(screen.getByText(actionName))
}

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
    localStorage.removeItem('acm-table-filter.applicationTable')
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(subscriptionsState, mockSubscriptions)
          store.set(placementDecisionsState, mockPlacementsDecisions)
          store.set(managedClustersState, mockClusters)
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
              <LocationDisplay />
              <Overview />
            </PluginContext.Provider>
          </MemoryRouter>
        </AcmToastProvider>
      </StateProvider>
    )
  })

  test('should display info', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')
    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()

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

    // labels column header and OCP/Flux apps show label count (e.g. "1 label", "2 labels")
    expect(screen.getByText('Labels')).toBeTruthy()
    expect(screen.getByText('1 label')).toBeTruthy()
    expect(screen.getByText('2 labels')).toBeTruthy()
  })

  test('should show Label filter in filter panel', async () => {
    await waitForText('feng-remote-argo8')

    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('button', { name: /^Label$/i })).toBeInTheDocument()
    await clickElement(screen.getByText('Filter'))
  })

  test('should filter', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // subscription

    // Open filter
    await clickElement(screen.getByText('Filter'))

    expect(screen.getByRole('checkbox', { name: /subscription/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /subscription/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /subscription/i })).toBeNull())
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()

    // clear subscription filter
    await clickElement(screen.getByRole('button', { name: /close subscription/i }))

    // argo apps
    // Open filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /argo cd/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /argo cd/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull())
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.getAllByText('Argo CD')).toBeTruthy()

    // clear argo filter
    await clickElement(screen.getByRole('button', { name: /close argo cd/i }))

    // appset
    // Open filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /application set/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /application set/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull())
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText('Application set')).toBeTruthy()

    // clear appset filter
    await clickElement(screen.getByRole('button', { name: /close application set/i }))

    nockSearch(mockSearchQueryOCPApplicationsFiltered, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsFilteredCount, mockSearchResponseOCPApplicationsCount)

    // OCP
    // Openshift filter possibly 2 (Openshift, Default Openshift)
    await clickElement(screen.getByText('Filter'))
    await waitForText('OpenShift', true)
    expect(screen.getAllByText(/openshift/i)).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /openshift/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()

    // clear openshift filter
    await clickElement(screen.getByRole('button', { name: /close openshift/i }))
  })

  test('should delete application', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // click delete
    await clickElement(screen.getAllByRole('button', { name: /actions/i })[1])
    await clickElement(screen.getByText(/delete application/i))
    expect(screen.getByText(/permanently delete applicationset applicationset-0\?/i)).toBeTruthy()
  })

  test('row action navigates to view for subscription application', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('application-0', 'View application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/details/namespace-0/application-0/details?apiVersion=application.app.k8s.io'
    )
  })

  test('row action navigates to edit for subscription application', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('application-0', 'Edit application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/edit/subscription/namespace-0/application-0?context=applications'
    )
  })

  test('row action navigates to search for subscription application', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('application-0', 'Search application')
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/search')
  })

  test('row action navigates to view for application set', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('applicationset-0', 'View application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/details/openshift-gitops/applicationset-0/details?apiVersion=applicationset.argoproj.io'
    )
  })

  test('row action navigates to edit for application set', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('applicationset-0', 'Edit application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/edit/argo/openshift-gitops/applicationset-0?context=applicationsets'
    )
  })

  test('row action navigates to view for discovered argo application', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('argoapplication-1', 'View application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/details/openshift-gitops/argoapplication-1/details?apiVersion=application.argoproj.io'
    )
  })

  test('row action navigates to view for OCP application', async () => {
    await waitForText('feng-remote-argo8')
    await openRowAction('authentication-operator', 'View application')
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/multicloud/applications/details/authentication-operator-ns/authentication-operator/details?apiVersion=ocp&cluster=test-cluster'
    )
  })

  test('create dropdown navigates to argo pull model', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(screen.getByText('Argo CD ApplicationSet - Pull model'))
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/argopullmodel')
  })

  test('create dropdown navigates to argo push model', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(screen.getByText('Argo CD ApplicationSet - Push model'))
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/argo')
  })

  test('create dropdown navigates to subscription', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(within(screen.getByRole('menu')).getByText('Subscription'))
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/subscription')
  })

  test('export button should produce a file for download', async () => {
    nockAggegateRequest('applications', fetchAggregate.req, fetchAggregate.res)

    await waitForText('feng-remote-argo8')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickElement(screen.getByTestId('export-search-result'))
    await clickElement(screen.getByText('Export all to CSV'))

    await waitFor(() => {
      const toastElement = screen.getByText(/Export successful/i)
      expect(toastElement).toBeInTheDocument()
    })

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Type,Namespace,Clusters,Labels,Health Status,Sync Status,Pod Status,Created\n' +
          `"application-0","Subscription","namespace-0","Local",-,"-","-","-","${getISOStringTimestamp(applicationAggregate.res.items[0].metadata?.creationTimestamp || '')}"\n` +
          '"applicationset-0","Application set","openshift-gitops","None",-,"-","-","-",-\n' +
          '"applicationset-1","Application set","openshift-gitops","None",-,"-","-","-",-\n' +
          '"argoapplication-1","Argo CD","argoapplication-1-ns","None",-,"-","-","-",-\n' +
          '"feng-remote-argo8","Argo CD","argoapplication-1-ns","None",-,"-","-","-",-\n' +
          '"authentication-operator","OpenShift","authentication-operator-ns","None","app=authentication-operator","-","-","-",-\n' +
          '"authentication-operatorf","Flux","authentication-operator-ns","None","kustomize.toolkit.fluxcd.io/name=test-app,kustomize.toolkit.fluxcd.io/namespace=test-app-ns","-","-","-",-',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^applicationsoverview-[\d]+\.csv$/)
  })
})
describe('Create application dropdown', () => {
  test('Create application button should be disabled when unauthorized', async () => {
    ;(useIsAnyNamespaceAuthorized as jest.Mock).mockImplementation(() => false)
    localStorage.removeItem('acm-table-filter.applicationTable')
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(subscriptionsState, mockSubscriptions)
          store.set(placementDecisionsState, mockPlacementsDecisions)
          store.set(managedClustersState, mockClusters)
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
      </StateProvider>
    )

    await waitForText('feng-remote-argo8')
    const createButton = screen.getByRole('button', { name: /create application/i })
    expect(createButton).toBeDisabled()
  })
})
